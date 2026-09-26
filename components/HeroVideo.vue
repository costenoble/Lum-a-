<template>
  <section ref="root" class="hv" :class="{ 'hv--static': fixed }" aria-hidden="true">
    <div ref="stage" class="hv__stage">
      <!-- Gabarit invisible : la colonne du site. C'est lui qui donne la place exacte
           de la carte finale, à toutes les largeurs, sans recalculer les marges ici. -->
      <div class="container hv__probe"><div ref="slot" class="hv__slot" /></div>

      <!-- Le cadre : plein écran au départ, carte arrondie à l'arrivée. Il porte la
           vidéo et le titre, qui se rétrécissent ensemble. -->
      <div ref="frame" class="hv__frame">
        <video
          ref="video"
          class="hv__video"
          :src="SRC"
          :poster="POSTER"
          muted
          loop
          playsinline
          preload="auto"
          disablepictureinpicture
        />
        <div class="hv__overlay">
          <p class="hv__title" v-lines="0.1">
            <span class="line-mask"><span>Boissons</span></span>
            <span class="line-mask"><span><em>revigorantes</em></span></span>
            <span class="line-mask"><span>pour les petits</span></span>
          </p>
          <span class="hv__hint" v-reveal="0.6">Faites défiler <i /></span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import heroSrc from '~/components/minimaxH3/hero/hero.web.mp4'
import heroPoster from '~/components/minimaxH3/hero/hero-poster.jpg'

// ---------------------------------------------------------------------------
// Hero d'accueil en vidéo. Le rideau se lève sur la vidéo plein écran ; en
// défilant, elle rétrécit en une carte arrondie, calée sur la colonne du site,
// et le hero d'origine arrive juste dessous.
//
// La zone est haute (1 + SCROLL écrans) et son contenu collant : pendant que
// la page défile, la scène reste en place et un avancement `p` (0 → 1) pilote
// la taille du cadre. À p = 1 la zone se termine, la scène se libère et remonte
// avec le reste de la page. Rien n'est animé « à la main » : tout se recalcule
// depuis `p`.
//
// La vidéo brute est préparée par scripts/hero-video.sh (recompression + image
// d'attente). Elle est muette, condition pour que les navigateurs autorisent la
// lecture automatique.
// ---------------------------------------------------------------------------

const SRC = heroSrc
const POSTER = heroPoster

/** Format de la vidéo, pour la carte d'arrivée sur grand écran. */
const RATIO = 2262 / 960
/** Sur téléphone la carte est plus haute que large : un plan de cinéma y serait minuscule. */
const NARROW = 700
const NARROW_RATIO = 4 / 5
const RADIUS = 28

const { $reduceMotion } = useNuxtApp()

const root = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const slot = ref<HTMLElement | null>(null)
const frame = ref<HTMLElement | null>(null)
const video = ref<HTMLVideoElement | null>(null)

/** Mouvement réduit : pas de zone collante, la carte est simplement posée. */
const fixed = ref(false)

// --- géométrie -----------------------------------------------------------------

interface Geometry {
  vw: number
  vh: number
  left: number
  top: number
  w: number
  h: number
}
let geo: Geometry | null = null

/** Où tombe la carte : sa largeur et sa position viennent de la colonne du site. */
function measure() {
  const st = stage.value
  const sl = slot.value
  if (!st || !sl) return
  const vw = st.clientWidth
  const vh = st.clientHeight
  const column = sl.getBoundingClientRect()
  const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 84

  const w = column.width
  const wanted = vw < NARROW ? w / NARROW_RATIO : w / RATIO
  // Sur un écran bas, la carte ne doit pas déborder sous le header.
  const h = Math.min(wanted, vh - headerH - 32)
  geo = { vw, vh, left: column.left, top: Math.max(headerH + 16, (vh - h) / 2), w, h }
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

/** Écrit la taille du cadre pour l'avancement `p`. */
function apply(p: number) {
  const el = frame.value
  if (!geo || !el) return
  const e = ease(Math.min(1, Math.max(0, p)))
  const { vw, vh, left, top, w, h } = geo
  const s = el.style
  s.left = `${left * e}px`
  s.top = `${top * e}px`
  s.width = `${vw + (w - vw) * e}px`
  s.height = `${vh + (h - vh) * e}px`
  s.borderRadius = `${RADIUS * e}px`
  // L'ombre n'apparaît qu'une fois la carte détachée des bords de l'écran.
  s.boxShadow = e > 0.05 ? `0 ${30 * e}px ${80 * e}px rgba(58, 20, 102, ${0.22 * e})` : 'none'
  // Le titre s'efface dès que le cadre commence à rétrécir : le hero d'origine reprend la main.
  const overlay = el.querySelector<HTMLElement>('.hv__overlay')
  if (overlay) overlay.style.opacity = String(Math.max(0, 1 - p / 0.25))
}

// --- vie de la vidéo -----------------------------------------------------------

let tween: gsap.core.Tween | null = null
let observer: IntersectionObserver | null = null
let cleanup: (() => void) | null = null

onMounted(() => {
  const v = video.value
  if (!v || !root.value) return

  // Le loader attend que la vidéo puisse jouer (cf. useIntro) ; on ne bloque jamais
  // sur une erreur.
  const ready = () => markHeroReady()
  if (v.readyState >= 3) ready()
  else {
    v.addEventListener('canplay', ready, { once: true })
    v.addEventListener('error', ready, { once: true })
  }

  if ($reduceMotion) {
    fixed.value = true
    v.pause()
    ready()
    return
  }

  // Départ : la vidéo attend, à l'arrêt sur sa première image, que le rideau se
  // lève ; elle démarre alors depuis le début, et on voit tout le plan. Sans rideau
  // (page interne), le signal est déjà donné.
  let started = false
  const start = () => {
    v.play().then(disarm).catch(arm)
  }

  // Amorçage. Les navigateurs ne chargent pas de façon fiable une vidéo qu'on n'a
  // pas encore lancée (preload="auto" est un souhait, pas un ordre : dans Chrome,
  // rien n'arrive avant play(), et Safari ne charge que les métadonnées). Sans
  // cela, le loader attendrait ses 3,5 s pour rien, puis la lecture partirait sur
  // une vidéo vide. On la lance donc tout de suite, muette, sous le rideau, et on la
  // remet sur sa première image dès qu'elle joue ; le vrai départ vient après.
  // Si la lecture est refusée, inutile de faire attendre le loader.
  v.muted = true
  v.play()
    .then(() => {
      if (started) return
      v.pause()
      v.currentTime = 0
    })
    .catch(ready)

  // Certains navigateurs refusent la lecture automatique même muette (économie
  // d'énergie, réglages du site, aperçu intégré à un éditeur) : au premier geste de
  // l'utilisateur, on relance. Un simple défilement à la molette n'est pas un geste
  // pour eux ; un toucher, un clic ou une touche, si.
  const GESTURES = ['pointerdown', 'touchend', 'keydown', 'click'] as const
  const kick = () => {
    if (started) start()
  }
  const arm = () => GESTURES.forEach((g) => window.addEventListener(g, kick, { passive: true }))
  const disarm = () => GESTURES.forEach((g) => window.removeEventListener(g, kick))

  curtainUp.then(() => {
    started = true
    v.currentTime = 0
    start()
  })

  // Un onglet masqué au moment du départ ne joue pas : on relance à son retour.
  const onVisible = () => {
    if (started && !document.hidden && v.paused && inView) start()
  }
  document.addEventListener('visibilitychange', onVisible)

  // Hors de vue, la vidéo ne tourne pas pour rien (et pas avant le départ).
  let inView = true
  observer = new IntersectionObserver(([entry]) => {
    inView = entry?.isIntersecting ?? false
    if (!started) return
    if (inView) start()
    else v.pause()
  })
  observer.observe(root.value)

  measure()
  apply(0)
  const state = { p: 0 }
  tween = gsap.to(state, {
    p: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: root.value,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.25,
      // Un redimensionnement change la colonne du site : on remesure la carte.
      invalidateOnRefresh: true,
      onRefresh: () => {
        measure()
        apply(state.p)
      }
    },
    onUpdate: () => apply(state.p)
  })

  cleanup = () => {
    v.removeEventListener('canplay', ready)
    v.removeEventListener('error', ready)
    document.removeEventListener('visibilitychange', onVisible)
    disarm()
  }
})

onUnmounted(() => {
  cleanup?.()
  observer?.disconnect()
  tween?.scrollTrigger?.kill()
  tween?.kill()
})
</script>

<style scoped>
/* Hauteur de la zone : un écran de scène, plus la distance de défilement pendant
   laquelle la vidéo rétrécit (1,2 écran). */
.hv {
  --hv-scroll: 1.2;
  position: relative;
  height: calc(100svh * (1 + var(--hv-scroll)));
}
.hv__stage {
  position: sticky;
  top: 0;
  height: 100svh;
  overflow: hidden;
}

/* Le gabarit ne s'affiche jamais : il ne sert qu'à mesurer. */
.hv__probe {
  position: absolute;
  inset-inline: 0;
  top: 0;
  height: 0;
  visibility: hidden;
  pointer-events: none;
}
.hv__slot {
  width: 100%;
  height: 0;
}

.hv__frame {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #120d1c;
  will-change: left, top, width, height;
}
/* Les règles globales donnent aux vidéos un rayon et une largeur maximale : le
   rayon est celui du cadre, et la vidéo doit toujours le remplir. */
.hv__video {
  position: absolute;
  /* Un pixel de débord de chaque côté : le cadre a une taille fractionnaire pendant
     la transition, et sans cela son fond sombre transparaît en liséré au bord. */
  inset: -1px;
  width: calc(100% + 2px);
  height: calc(100% + 2px);
  max-width: none;
  object-fit: cover;
  border-radius: 0;
}

/* --- titre superposé, au départ ------------------------------------------- */
.hv__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 1.4rem;
  padding: var(--header-h) var(--pad-inline) clamp(1.5rem, 5vh, 3rem);
  color: #fff;
  /* Un dégradé bas : le texte blanc reste lisible quelle que soit l'image. */
  background: linear-gradient(to top, rgba(12, 6, 24, 0.62), rgba(12, 6, 24, 0) 55%);
  pointer-events: none;
}
.hv__title {
  font-family: var(--font-display);
  font-size: clamp(2.3rem, 8.4vw, 7.2rem);
  font-weight: 700;
  line-height: 0.88;
  letter-spacing: -0.05em;
  text-transform: uppercase;
}
.hv__title em {
  font-style: normal;
  color: var(--accent);
}
.hv__hint {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.85);
}

/* --- mouvement réduit : la carte, posée, sans zone collante ------------------ */
.hv--static {
  height: auto;
}
.hv--static .hv__stage {
  position: relative;
  height: auto;
  overflow: visible;
  max-width: var(--container);
  margin-inline: auto;
  padding: calc(var(--header-h) + 1rem) var(--pad-inline) 0;
}
.hv--static .hv__frame {
  position: relative;
  left: auto;
  top: auto;
  width: 100%;
  height: auto;
  aspect-ratio: 2262 / 960;
  border-radius: 28px;
}
.hv--static .hv__overlay {
  display: none;
}
@media (max-width: 700px) {
  .hv--static .hv__frame {
    aspect-ratio: 4 / 5;
  }
}
</style>
