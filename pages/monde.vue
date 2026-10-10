<template>
  <div class="monde">
    <div class="monde__stage">
      <!-- La carte, sous la vidéo : elle est déjà là quand la vidéo s'efface. -->
      <MondeCarte ref="carte" />

      <!-- L'intro : la vidéo du hero, en plein écran. Elle se termine sur le cristal,
           et la carte prend le relais zoomée sur ce même cristal. -->
      <div v-if="phase !== 'map'" ref="intro" class="monde__intro">
        <video
          ref="video"
          class="monde__video"
          :src="heroSrc"
          :poster="heroPoster"
          muted
          playsinline
          preload="auto"
          disablepictureinpicture
          aria-hidden="true"
          @ended="toMap"
        />
        <div ref="title" class="monde__title container">
          <p class="eyebrow">Prototype</p>
          <h1>Bienvenue dans<br />le <em>Monde Luméa</em></h1>
        </div>
        <button v-if="blocked" class="btn monde__enter" type="button" @click="start">
          <span>Entrer dans le monde</span>
        </button>
        <button class="monde__skip" type="button" @click="toMap">Passer l’intro</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import heroSrc from '~/components/minimaxH3/hero/hero.web.mp4'
import heroPoster from '~/components/minimaxH3/hero/hero-poster.jpg'

// ---------------------------------------------------------------------------
// Prototype /monde : la vidéo du hero, puis la carte du Monde Luméa, navigable.
// Page à part (hors menu, noindex) : elle remplacera peut-être l'accueil.
//
// L'intro se termine d'elle-même (fin de la vidéo), ou plus tôt si l'on clique sur
// « Passer », ou si l'on fait défiler / appuie sur une touche. Elle ne se rejoue pas
// au retour d'une page pendant la même visite : la carte s'affiche directement.
// ---------------------------------------------------------------------------

useHead({
  title: 'Monde Luméa — prototype',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
})

const SEEN_KEY = 'lumea-monde-intro'

const { $reduceMotion, $lenis } = useNuxtApp()
const carte = ref<{ reveal: (o?: object) => gsap.core.Timeline | undefined } | null>(null)
const intro = ref<HTMLElement | null>(null)
const video = ref<HTMLVideoElement | null>(null)
const title = ref<HTMLElement | null>(null)

/** intro → transition → map */
const phase = ref<'intro' | 'transition' | 'map'>('intro')
/** Lecture automatique refusée : on propose d'entrer. */
const blocked = ref(false)

const lock = (on: boolean) => {
  document.body.classList.toggle('nav-locked', on)
  if ($lenis) on ? ($lenis as any).stop() : ($lenis as any).start()
}

const SKIP_EVENTS = ['wheel', 'touchmove', 'keydown'] as const
const onSkip = () => toMap()

function seen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

function start() {
  blocked.value = false
  video.value?.play().catch(() => (blocked.value = true))
}

function toMap() {
  if (phase.value !== 'intro') return
  phase.value = 'transition'
  SKIP_EVENTS.forEach((e) => window.removeEventListener(e, onSkip))
  try {
    sessionStorage.setItem(SEEN_KEY, '1')
  } catch {}

  const reveal = carte.value?.reveal()
  const fade = gsap.timeline({
    onComplete: () => {
      phase.value = 'map'
      lock(false)
    }
  })
  // La vidéo et son titre s'effacent pendant que la carte recule depuis le cristal.
  if (title.value) fade.to(title.value, { autoAlpha: 0, duration: 0.6, ease: 'power2.out' }, 0)
  if (intro.value) fade.to(intro.value, { autoAlpha: 0, duration: 1.4, ease: 'power2.inOut' }, 0)
  if (reveal) fade.add(reveal, 0)
}

onMounted(() => {
  // Retour pendant la même visite, ou mouvement réduit : directement la carte.
  if ($reduceMotion || seen()) {
    phase.value = 'map'
    nextTick(() => carte.value?.reveal({ instant: true }))
    return
  }

  lock(true)
  // On laisse le temps d'arriver avant d'écouter le défilement comme « passer ».
  window.setTimeout(() => {
    if (phase.value === 'intro') SKIP_EVENTS.forEach((e) => window.addEventListener(e, onSkip, { passive: true }))
  }, 1200)
  start()
})

onUnmounted(() => {
  SKIP_EVENTS.forEach((e) => window.removeEventListener(e, onSkip))
  lock(false)
})
</script>

<style scoped>
.monde__stage {
  position: relative;
  height: 100svh;
  overflow: hidden;
}
.monde__intro {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: #120d1c;
}
.monde__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  border-radius: 0;
}
.monde__title {
  position: absolute;
  inset: auto 0 0 0;
  padding-bottom: clamp(2rem, 8vh, 5rem);
  color: #fff;
  background: linear-gradient(to top, rgba(12, 6, 24, 0.55), rgba(12, 6, 24, 0));
  padding-top: 6rem;
}
.monde__title .eyebrow {
  color: rgba(255, 255, 255, 0.75);
}
.monde__title h1 {
  margin-top: 1rem;
  font-size: var(--fs-giant);
  line-height: 0.92;
}
.monde__title em {
  font-style: normal;
  color: #f0dcff;
}
.monde__enter {
  position: absolute;
  left: 50%;
  top: 50%;
  translate: -50% -50%;
  z-index: 1;
}
.monde__skip {
  position: absolute;
  right: var(--pad-inline);
  bottom: clamp(1.5rem, 5vh, 3rem);
  z-index: 1;
  padding: 0.7rem 1.1rem;
  border-radius: 999px;
  /* Fond sombre translucide : lisible sur le ciel clair comme sur l'herbe. */
  background: rgba(24, 12, 44, 0.38);
  backdrop-filter: blur(8px);
  color: #fff;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.monde__skip:hover {
  background: rgba(24, 12, 44, 0.55);
}
/* Téléphone : en bas, le bouton tombait sur le titre ; il passe sous le header. */
@media (max-width: 700px) {
  .monde__skip {
    bottom: auto;
    top: calc(var(--header-h) + 0.5rem);
  }
}
</style>
