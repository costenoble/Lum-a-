<template>
  <section ref="root" class="bs" :class="{ 'bs--static': fixed, 'bs--copy': !!$slots.default }">
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
      <div v-if="$slots.default" class="bs__copy">
        <slot :progress="progress" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import videoSrc from '~/components/minimaxH3/bottle/web/comete.mp4'
import posterSrc from '~/components/minimaxH3/bottle/web/comete-poster.jpg'

// ---------------------------------------------------------------------------
// Une bouteille qu'on fait tourner avec le scroll. La vidéo (une orbite de dix
// secondes, générée avec MiniMax H3) n'est pas lue : le défilement de la zone
// épinglée fixe l'instant affiché, du bouchon vu d'en haut jusqu'au verre.
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

const SRC = videoSrc
const POSTER = posterSrc

/** Vitesse à laquelle la vidéo rattrape le scroll : 0 = jamais, 1 = instantané. */
const FOLLOW = 0.22

const { $reduceMotion } = useNuxtApp()

const root = ref<HTMLElement | null>(null)
const video = ref<HTMLVideoElement | null>(null)

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
  if (!v || !root.value) return

  if ($reduceMotion) {
    fixed.value = true
    progress.value = 1 // tout le texte est lisible, tout de suite
    return
  }

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
  const tick = () => {
    raf = requestAnimationFrame(tick)
    if (!loaded || !Number.isFinite(v.duration)) return
    const goal = target * (v.duration - 0.03) // jamais tout au bout : la dernière image ne se décode pas
    shown += (goal - shown) * FOLLOW
    if (Math.abs(goal - shown) < 0.004) shown = goal
    // Une demi-image d'écart suffit à demander un saut, mais jamais pendant un saut.
    if (!v.seeking && Math.abs(v.currentTime - shown) > 0.02) v.currentTime = shown
  }

  trigger = ScrollTrigger.create({
    trigger: root.value,
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
        if (!raf) tick()
      } else {
        cancelAnimationFrame(raf)
        raf = 0
      }
    },
    { rootMargin: '150% 0px' }
  )
  observer.observe(root.value)
})

onUnmounted(() => {
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

/* Téléphone : pas la place de mettre le texte à côté. Il se pose en bas, sur un voile de
   la couleur du fond, et la vidéo remonte pour que la bouteille reste au-dessus. */
@media (max-width: 899px) {
  .bs--copy .bs__video {
    translate: 0 -17svh;
  }
  .bs__copy {
    top: auto;
    align-items: flex-end;
    padding: 9rem 0 1.75rem;
    background: linear-gradient(to top, var(--paper) 68%, rgba(243, 242, 239, 0));
  }
}

/* --- mouvement réduit : une image fixe, sans zone collante ---------------------- */
.bs--static {
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
