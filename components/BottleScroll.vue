<template>
  <section
    ref="root"
    class="bs"
    :class="{ 'bs--static': fixed, 'bs--copy': !!$slots.default, 'bs--stacked': stacked }"
    :style="{ '--bs-scroll': scroll }"
  >
    <!-- La zone porte la hauteur de défilement ; la scène y reste collée. -->
    <div ref="zone" class="bs__zone">
    <div class="bs__stage">
      <!-- Jamais lue : sa position dans le temps suit le scroll. Le fond de la vidéo est
           celui du site (cuit à la fabrication, cf. scripts/bottle-video.py) : elle n'a
           ni cadre, ni carte, ni ombre portée. -->
      <video
        ref="video"
        class="bs__video"
        :poster="POSTER"
        muted
        playsinline
        preload="none"
        disablepictureinpicture
        aria-hidden="true"
      />

      <!-- Le texte, s'il y en a un, est épinglé avec la bouteille : il reçoit l'avancement
           (0 → 1) pour se caler sur la rotation. -->
      <div v-if="$slots.default && !stacked" class="bs__copy">
        <slot :progress="progress" :stacked="false" />
      </div>
    </div>
    </div>

    <!-- Téléphone : pas la place de montrer bouteille et texte ensemble. La bouteille a
         l'écran pour elle pendant sa rotation, le texte vient juste après, dans le flux
         normal (l'appelant sait par `stacked` qu'il ne suit plus la rotation). -->
    <div v-if="$slots.default && stacked" class="bs__after">
      <slot :progress="progress" :stacked="true" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// ---------------------------------------------------------------------------
// Une bouteille qu'on fait tourner avec le scroll. La vidéo (une orbite de dix
// secondes, générée avec MiniMax H3) n'est pas lue : le défilement de la zone
// épinglée fixe l'instant affiché, du bouchon vu d'en haut jusqu'au verre.
//
// Composant à propriété : src/poster viennent de l'appelant (la page
// d'accueil pour Comète, /fabrication pour les deux autres bouteilles).
// Rien ici ne connaît le nom d'un parfum en particulier.
//
// Comme HeroVideo, la zone est haute et son contenu collant. Trois astuces,
// reprises du moteur scroll-world, rendent le « scrub » fluide :
//   - la vidéo est préparée avec des images clés toutes les 4 images
//     (scripts/bottle-video.py) : afficher n'importe quel instant, dans les deux
//     sens, ne demande jamais de décoder plus de 3 images ;
//   - elle est chargée en mémoire (Blob) avant d'être utilisée : se déplacer dedans
//     ne dépend plus du serveur (requêtes par plages, latence) ;
//   - le saut vers l'instant voulu n'est jamais redemandé tant que le précédent n'est
//     pas terminé : on ne fait pas la queue devant le décodeur. Le temps affiché
//     rattrape l'instant visé par un lissage, pour éviter les à-coups de molette.
// Rien ne charge tant que la section n'approche pas.
// ---------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    src: string
    poster: string
    /** Hauteurs d'écran de défilement pendant lesquelles la bouteille tourne
     *  (en plus de l'écran de scène lui-même). Plus haut = rotation plus lente. */
    scroll?: number
  }>(),
  { scroll: 3 }
)
const SRC = props.src
const POSTER = props.poster
const { scroll } = props

/**
 * Constante de temps du lissage, en ms : en ce temps, la vidéo a parcouru 63 % de l'écart
 * qui la sépare du scroll. Une durée, et non un coefficient « par image » : avec un
 * coefficient fixe (0,22 à chaque image), l'écran 120 Hz rattraperait le scroll deux fois
 * plus vite que l'écran 60 Hz. Ici le rendu est le même à toutes les fréquences.
 * 67 ms reproduit exactement l'ancien réglage à 60 Hz.
 */
const TAU = 67

const { $reduceMotion } = useNuxtApp()

const root = ref<HTMLElement | null>(null)
const zone = ref<HTMLElement | null>(null)
const video = ref<HTMLVideoElement | null>(null)

/** Téléphone : le texte passe après la bouteille au lieu d'être posé dessus. */
const stacked = ref(false)
let narrow: MediaQueryList | null = null
const onNarrow = () => {
  stacked.value = !!narrow?.matches
  // Le texte change de place, donc la page change de hauteur.
  nextTick(() => ScrollTrigger.refresh())
}

/** Avancement de la rotation, 0 → 1 : le texte de l'emplacement s'y cale. */
const progress = ref(0)

/** Mouvement réduit : pas de zone collante ni de vidéo, une image fixe. */
const fixed = ref(false)

let trigger: ScrollTrigger | null = null
let observer: IntersectionObserver | null = null
let raf = 0
let objectUrl = ''

onMounted(() => {
  const v = video.value
  if (!v || !zone.value) return

  if ($reduceMotion) {
    fixed.value = true
    progress.value = 1 // tout le texte est lisible, tout de suite
    return
  }

  narrow = window.matchMedia('(max-width: 899px)')
  stacked.value = narrow.matches
  narrow.addEventListener('change', onNarrow)

  // --- chargement ---
  let started = false
  let loaded = false
  const load = async () => {
    if (started) return
    started = true
    try {
      const blob = await (await fetch(SRC)).blob()
      objectUrl = URL.createObjectURL(blob)
      v.src = objectUrl
    } catch {
      v.src = SRC // hors ligne, ou fetch refusé : la vidéo se charge à l'ancienne
    }
    v.addEventListener('loadeddata', () => (loaded = true), { once: true })
    v.load()
  }

  // --- suivi du scroll ---
  let target = 0 // avancement visé, 0 → 1
  let shown = 0 // instant affiché, en secondes
  let last = 0 // horodatage de l'image précédente
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick)
    // Durée réelle écoulée, plafonnée : un onglet resté en arrière-plan ne doit pas
    // provoquer un saut au retour.
    const dt = last ? Math.min(100, now - last) : 1000 / 60
    last = now
    if (!loaded || !Number.isFinite(v.duration)) return
    const goal = target * (v.duration - 0.03) // jamais tout au bout : la dernière image ne se décode pas
    shown += (goal - shown) * (1 - Math.exp(-dt / TAU))
    if (Math.abs(goal - shown) < 0.004) shown = goal
    // Une demi-image d'écart suffit à demander un saut, mais jamais pendant un saut.
    if (!v.seeking && Math.abs(v.currentTime - shown) > 0.02) v.currentTime = shown
  }

  trigger = ScrollTrigger.create({
    trigger: zone.value,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      target = self.progress
      progress.value = self.progress
    }
  })

  // La boucle et le chargement ne tournent que près de l'écran.
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) {
        load()
        if (!raf) {
          last = 0
          raf = requestAnimationFrame(tick)
        }
      } else {
        cancelAnimationFrame(raf)
        raf = 0
      }
    },
    { rootMargin: '150% 0px' }
  )
  observer.observe(zone.value)
})

onUnmounted(() => {
  narrow?.removeEventListener('change', onNarrow)
  cancelAnimationFrame(raf)
  observer?.disconnect()
  trigger?.kill()
  if (objectUrl) URL.revokeObjectURL(objectUrl)
})
</script>

<style scoped>
/* Trois écrans de défilement pendant lesquels la bouteille tourne, plus l'écran de
   scène lui-même. */
.bs {
  --bs-scroll: 3;
  position: relative;
}
.bs__zone {
  position: relative;
  height: calc(100svh * (1 + var(--bs-scroll)));
}
.bs__stage {
  position: sticky;
  top: 0;
  height: 100svh;
  overflow: hidden;
  /* Le fond de la vidéo est celui du site : si elle tarde à charger, on ne voit rien
     d'autre que la page. */
  background: var(--paper);
}

/* Les règles globales donnent aux vidéos un rayon et une largeur maximale : la vidéo
   n'a ici ni l'un ni l'autre, elle remplit la scène, bord à bord, sans carte. */
.bs__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  border-radius: 0;
}

/* --- avec du texte : à gauche le texte, à droite la bouteille ------------------------
   Le texte est noir ; un gros plan de la bouteille est un mur rouge sombre. Sur grand
   écran, on décale donc la vidéo vers la droite pour que la bouteille ne passe jamais
   derrière le texte (le vide laissé à gauche est du fond, identique à celui du site). */
.bs__copy {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  padding-top: var(--header-h);
  /* Les liens du texte restent cliquables, mais le reste laisse passer la molette. */
  pointer-events: none;
}
.bs__copy > * {
  width: 100%;
}
@media (min-width: 900px) {
  .bs--copy .bs__video {
    translate: 20vw 0;
  }
}

/* --- téléphone : la bouteille seule, puis le texte -------------------------------------
   En plein écran portrait, une vidéo paysage en `cover` n'en montrait qu'un gros tiers :
   la bouteille sortait du cadre et les gros plans devenaient un mur rouge. Ici la vidéo
   garde son format (16:9), à ~2/3 de la hauteur d'écran, centrée sous le header ; elle
   déborde sur les côtés, ce qui ne se voit pas puisque son fond est celui du site. La
   rotation est un peu plus courte, le texte arrive juste après (.bs__after). */
.bs--stacked .bs__zone {
  height: calc(100svh * (1 + var(--bs-scroll) * 0.7));
}
.bs--stacked .bs__video {
  inset: auto;
  top: calc(50% + var(--header-h) / 2);
  left: 50%;
  width: auto;
  height: min(66svh, 150vw);
  aspect-ratio: 16 / 9;
  translate: -50% -50%;
  /* Les gros plans touchent le haut et le bas de l'image : sans fondu, le bord du cadre
     se lit comme une bande nette sur le fond de la page. */
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 14%, #000 86%, transparent);
  mask-image: linear-gradient(to bottom, transparent, #000 14%, #000 86%, transparent);
}
.bs__after {
  padding-block: var(--sp-3) var(--sp-5);
}

/* --- mouvement réduit : une image fixe, sans zone collante ---------------------- */
.bs--static .bs__zone {
  height: auto;
}
.bs--static .bs__stage {
  position: relative;
  height: auto;
  overflow: visible;
}
.bs--static .bs__video {
  position: relative;
  inset: auto;
  height: auto;
  aspect-ratio: 1706 / 960;
  max-height: 60svh;
  translate: none;
}
.bs--static .bs__copy {
  position: static;
  padding-block: 2rem 3rem;
  background: none;
}
</style>
