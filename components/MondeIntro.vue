<template>
  <section ref="root" class="mi" :class="{ 'mi--static': fixed }">
    <div class="mi__stage">
      <!-- Les deux vidéos ne sont jamais lues : leur instant suit le scroll. La seconde
           prend la place de la première au sommet du premier flash blanc. -->
      <video
        ref="portal"
        class="mi__video"
        :poster="portalPoster"
        muted
        playsinline
        preload="none"
        disablepictureinpicture
        aria-hidden="true"
      />
      <video
        ref="tunnel"
        class="mi__video mi__video--tunnel"
        :poster="tunnelPoster"
        muted
        playsinline
        preload="none"
        disablepictureinpicture
        aria-hidden="true"
      />

      <!-- Le flash : blanc à peine teinté du violet de la Source. -->
      <div ref="flash" class="mi__flash" aria-hidden="true" />

      <div ref="copy" class="mi__copy container">
        <p class="eyebrow mi__eyebrow">Prototype</p>
        <h1 class="mi__title">
          Bienvenue dans<br />
          le <em>Monde Luméa</em>
        </h1>
        <span class="mi__hint">Faites défiler pour entrer <i /></span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import portalSrc from '~/components/minimaxH3/monde/web/awakening.mp4'
import portalPoster from '~/components/minimaxH3/monde/web/awakening-poster.jpg'
import tunnelSrc from '~/components/minimaxH3/monde/web/tunnel.mp4'
import tunnelPoster from '~/components/minimaxH3/monde/web/tunnel-poster.jpg'

// ---------------------------------------------------------------------------
// Prototype /monde — l'entrée dans le Monde Luméa. Une zone haute à scène collante
// (comme HeroVideo et BottleScroll) ; l'avancement p (0 → 1) pilote tout :
//
//   0    → 0.46  le portail s'éveille (awakening.mp4, scrubée de bout en bout)
//   0.40 → 0.56  premier flash blanc ; au sommet (0.48), le tunnel remplace le portail
//   0.50 → 0.94  la traversée (tunnel.mp4, scrubée)
//   0.86 → 1     second flash, jusqu'au blanc complet : la carte (MondeCarte) prend
//                le relais, elle-même dévoilée depuis le blanc.
//
// Les vidéos (scripts/monde-video.sh) ont une image clé toutes les 4 images et sont
// chargées en mémoire avant usage, comme dans BottleScroll : n'importe quel instant
// s'affiche vite, dans les deux sens.
// ---------------------------------------------------------------------------

/** Constante de temps du lissage vidéo → scroll, en ms (même valeur que BottleScroll). */
const TAU = 67

const { $reduceMotion } = useNuxtApp()

const root = ref<HTMLElement | null>(null)
const portal = ref<HTMLVideoElement | null>(null)
const tunnel = ref<HTMLVideoElement | null>(null)
const flash = ref<HTMLElement | null>(null)
const copy = ref<HTMLElement | null>(null)

/** Mouvement réduit : pas de zone collante, l'image fixe du portail et le titre. */
const fixed = ref(false)

/** Une vidéo dont l'instant affiché rattrape en douceur l'instant visé (0 → 1). */
function scrubber(v: HTMLVideoElement, src: string) {
  let started = false
  let loaded = false
  let url = ''
  let shown = 0
  return {
    target: 0,
    async load() {
      if (started) return
      started = true
      try {
        url = URL.createObjectURL(await (await fetch(src)).blob())
        v.src = url
      } catch {
        v.src = src
      }
      v.addEventListener('loadeddata', () => (loaded = true), { once: true })
      v.load()
    },
    step(dt: number) {
      if (!loaded || !Number.isFinite(v.duration)) return
      const goal = this.target * (v.duration - 0.03)
      shown += (goal - shown) * (1 - Math.exp(-dt / TAU))
      if (Math.abs(goal - shown) < 0.004) shown = goal
      if (!v.seeking && Math.abs(v.currentTime - shown) > 0.02) v.currentTime = shown
    },
    dispose() {
      if (url) URL.revokeObjectURL(url)
    }
  }
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
/** Avancement local de p entre a et b, borné à 0 → 1. */
const span = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))

let trigger: ScrollTrigger | null = null
let observer: IntersectionObserver | null = null
let raf = 0
let scrubs: ReturnType<typeof scrubber>[] = []

onMounted(() => {
  const el = root.value
  const a = portal.value
  const b = tunnel.value
  if (!el || !a || !b) return

  if ($reduceMotion) {
    fixed.value = true
    return
  }

  const sa = scrubber(a, portalSrc)
  const sb = scrubber(b, tunnelSrc)
  scrubs = [sa, sb]

  const apply = (p: number) => {
    sa.target = span(p, 0, 0.46)
    sb.target = span(p, 0.5, 0.94)
    // Le tunnel n'existe qu'une fois passé le sommet du premier flash.
    b.style.opacity = p >= 0.48 ? '1' : '0'
    const first = p < 0.48 ? span(p, 0.4, 0.48) : 1 - span(p, 0.48, 0.56)
    const last = span(p, 0.86, 1)
    if (flash.value) flash.value.style.opacity = String(Math.max(first, last))
    if (copy.value) {
      const out = span(p, 0.03, 0.14)
      copy.value.style.opacity = String(1 - out)
      copy.value.style.transform = `translateY(${-40 * out}px) scale(${1 + 0.06 * out})`
    }
  }
  apply(0)

  trigger = ScrollTrigger.create({
    trigger: el,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => apply(self.progress)
  })

  let last = 0
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick)
    const dt = last ? Math.min(100, now - last) : 1000 / 60
    last = now
    sa.step(dt)
    sb.step(dt)
  }

  // Chargement et boucle seulement quand la zone est à l'écran (ou presque).
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) {
        sa.load()
        sb.load()
        if (!raf) {
          last = 0
          raf = requestAnimationFrame(tick)
        }
      } else {
        cancelAnimationFrame(raf)
        raf = 0
      }
    },
    { rootMargin: '100% 0px' }
  )
  observer.observe(el)
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
  observer?.disconnect()
  trigger?.kill()
  scrubs.forEach((s) => s.dispose())
})
</script>

<style scoped>
/* Cinq écrans de défilement pour tout le voyage, plus l'écran de scène. */
.mi {
  position: relative;
  height: calc(100svh * 6);
}
.mi__stage {
  position: sticky;
  top: 0;
  height: 100svh;
  overflow: hidden;
  background: #05040f;
}
.mi__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  border-radius: 0;
  /* Les vidéos sont d'un bleu électrique ; on les tire vers le violet du cristal de la
     Source, plus proche du pastel de la carte. Réglage à affiner à l'œil. */
  filter: hue-rotate(38deg) saturate(0.9);
}
.mi__video--tunnel {
  opacity: 0;
}
.mi__flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, #fff 0%, #fbf6ff 55%, #f4ecff 100%);
  opacity: 0;
  pointer-events: none;
}
.mi__copy {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 1.25rem;
  padding-top: var(--header-h);
  padding-bottom: clamp(2rem, 8vh, 5rem);
  color: #fff;
  will-change: transform, opacity;
}
.mi__eyebrow {
  color: rgba(255, 255, 255, 0.7);
}
.mi__title {
  font-size: var(--fs-giant);
  line-height: 0.92;
  text-shadow: 0 6px 40px rgba(20, 0, 60, 0.45);
}
.mi__title em {
  font-style: normal;
  color: #e7d2ff;
}
.mi__hint {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.8);
}

/* --- mouvement réduit : une image, le titre, pas de zone collante ------------- */
.mi--static {
  height: auto;
}
.mi--static .mi__stage {
  position: relative;
  height: 100svh;
}
.mi--static .mi__video {
  /* l'image d'attente du portail suffit */
  opacity: 1;
}
.mi--static .mi__video--tunnel {
  display: none;
}
</style>
