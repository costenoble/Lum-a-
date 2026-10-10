<template>
  <section
    ref="root"
    class="mc"
    :class="{ 'is-ready': ready }"
    aria-label="Carte du Monde Luméa"
    @pointermove="onPointer"
    @pointerleave="onPointerLeave"
  >
    <!-- Défileur : sur téléphone, la carte remplit la hauteur et se parcourt au doigt. -->
    <div ref="scroller" class="mc__scroller" data-lenis-prevent-horizontal>
      <div ref="map" class="mc__map" @click="onMapClick">
        <img
          class="mc__img"
          src="/monde/carte-2600.webp"
          srcset="/monde/carte-1600.webp 1600w, /monde/carte-2600.webp 2600w, /monde/carte-4096.webp 4096w"
          sizes="(max-aspect-ratio: 1/1) 160vh, min(100vw, 160vh)"
          alt="Le Monde Luméa : un monde d'îles flottantes autour d'un grand cristal violet, avec un château, des cascades, une île des glaces, un gâteau géant et l'île des mascottes."
          draggable="false"
          decoding="async"
          @load="imageLoaded = true"
        />

        <!-- Le cristal de la Source « respire » : une lueur lente, jamais un clignotement. -->
        <span class="mc__glow" aria-hidden="true" :style="{ left: `${CRYSTAL.x}%`, top: `${CRYSTAL.y}%` }" />

        <!-- Les lieux. Une zone invisible sur l'illustration, un repère qui pulse doucement
             (pour qu'on devine qu'on peut cliquer), et le nom du lieu au survol. -->
        <!-- De simples <a href> et non des NuxtLink : NuxtLink navigue dès le clic, avant
             notre gestionnaire, ce qui empêchait le zoom (ordinateur) et le « premier
             toucher = nommer le lieu » (tactile). La navigation passe par navigateTo. -->
        <component
          :is="spot.to ? 'a' : 'button'"
          v-for="spot in spots"
          :key="spot.id"
          :href="spot.to"
          :type="spot.to ? undefined : 'button'"
          class="mc__spot"
          :class="{ 'is-active': active === spot.id, 'is-soon': !spot.to, 'label-below': spot.labelBelow }"
          :style="{
            left: `${spot.x}%`,
            top: `${spot.y}%`,
            width: `${spot.w}%`,
            height: `${spot.h}%`
          }"
          :aria-label="spot.to ? `${spot.name} — ${spot.sub}` : `${spot.name} — bientôt`"
          :tabindex="ready ? 0 : -1"
          @click="onSpot($event, spot)"
          @mouseenter="hoverCapable && (active = spot.id)"
          @mouseleave="hoverCapable && active === spot.id && (active = null)"
          @focus="onFocus($event, spot)"
          @blur="active === spot.id && (active = null)"
        >
          <span class="mc__halo" aria-hidden="true" />
          <span class="mc__beacon" aria-hidden="true" />
          <span class="mc__label" aria-hidden="true">
            <strong>{{ spot.name }}</strong>
            <small>{{ spot.to ? spot.sub : 'Bientôt' }}</small>
            <em v-if="spot.to && !hoverCapable">Entrer →</em>
          </span>
        </component>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'

// ---------------------------------------------------------------------------
// La carte du Monde Luméa, navigable : chaque lieu mène à une page du site.
//
// L'illustration (components/minimaxH3/monde/carte.jpg, agrandie par
// scripts/monde-carte.sh) est posée telle quelle ; les lieux sont des zones
// positionnées en % de l'image, donc justes à toutes les tailles.
//
// Sur ordinateur : la carte tient à l'écran, survol = le lieu s'illumine et se
// nomme, clic = la carte zoome vers lui, puis le rideau habituel mène à la page.
// Sur écran tactile : la carte remplit la hauteur et se fait glisser ; un premier
// toucher nomme le lieu (avec « Entrer »), un second y va — on n'ouvre pas une page
// par accident en faisant glisser la carte.
//
// La page parente lance l'apparition (reveal) : la carte part zoomée sur le cristal,
// là où se termine la vidéo du hero, et recule jusqu'à montrer tout le monde.
// ---------------------------------------------------------------------------

interface Spot {
  id: string
  name: string
  sub: string
  /** Page de destination ; absente = « Bientôt ». */
  to?: string
  /** Zone, en % de l'illustration : coin haut gauche, largeur, hauteur. */
  x: number
  y: number
  w: number
  h: number
  /** Nom sous la zone plutôt qu'au-dessus (lieux collés au haut de la carte). */
  labelBelow?: boolean
}

const spots: Spot[] = [
  { id: 'source', name: 'La Source Luméa', sub: 'Notre histoire', to: '/studio', x: 46.7, y: 44.7, w: 10, h: 17.2 },
  { id: 'mascottes', name: 'L’île des mascottes', sub: 'Les boissons', to: '/boissons', x: 42.5, y: 75.4, w: 16.1, h: 13.4 },
  { id: 'fleurs', name: 'L’île aux fleurs', sub: 'Comète · fraise & framboise', to: '/boissons/comete', x: 64.7, y: 61.9, w: 9.6, h: 13.5 },
  { id: 'carrousel', name: 'Le Carrousel', sub: 'Composer un coffret', to: '/coffret', x: 64.3, y: 79, w: 7.3, h: 11.7 },
  { id: 'chateau', name: 'Le Château', sub: 'La boutique', to: '/boutique', x: 9.6, y: 4.3, w: 22.2, h: 37.4, labelBelow: true },
  { id: 'gateau', name: 'Le Gâteau géant', sub: '', x: 75.8, y: 66.8, w: 18.4, h: 22 },
  { id: 'gourmande', name: 'L’île gourmande', sub: '', x: 7.3, y: 56.4, w: 29.1, h: 33.1 }
]

/** Le cristal, centre de l'apparition et de la lueur (en % de l'illustration). */
const CRYSTAL = { x: 51.5, y: 53.9 }

const { $reduceMotion } = useNuxtApp()

const root = ref<HTMLElement | null>(null)
const scroller = ref<HTMLElement | null>(null)
const map = ref<HTMLElement | null>(null)
const active = ref<string | null>(null)
const ready = ref(false)
const imageLoaded = ref(false)
const hoverCapable = ref(true)

let parallaxX: ((v: number) => void) | null = null
let parallaxY: ((v: number) => void) | null = null

onMounted(() => {
  hoverCapable.value = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  centerOnCrystal()
  if (!$reduceMotion && hoverCapable.value && map.value) {
    parallaxX = gsap.quickTo(map.value, 'xPercent', { duration: 1.2, ease: 'power3.out' })
    parallaxY = gsap.quickTo(map.value, 'yPercent', { duration: 1.2, ease: 'power3.out' })
  }
})

/** Téléphone : le défileur s'ouvre centré sur le cristal, pas sur le bord gauche. */
function centerOnCrystal() {
  const sc = scroller.value
  const m = map.value
  if (!sc || !m || sc.scrollWidth <= sc.clientWidth) return
  sc.scrollLeft = (m.offsetWidth * CRYSTAL.x) / 100 - sc.clientWidth / 2
}

/** Légère profondeur au curseur (ordinateur) : la carte glisse un peu à l'opposé. */
function onPointer(e: PointerEvent) {
  if (!ready.value || !parallaxX || !parallaxY || !root.value) return
  const r = root.value.getBoundingClientRect()
  parallaxX(-((e.clientX - r.left) / r.width - 0.5) * 1.6)
  parallaxY(-((e.clientY - r.top) / r.height - 0.5) * 1.6)
}
function onPointerLeave() {
  parallaxX?.(0)
  parallaxY?.(0)
}

/** Toucher la carte hors d'un lieu referme l'étiquette ouverte. */
function onMapClick(e: MouseEvent) {
  if (!(e.target as HTMLElement).closest('.mc__spot')) active.value = null
}

/**
 * Le nom s'affiche au focus clavier seulement. Un toucher donne aussi le focus au lien,
 * juste avant le clic : le compter comme une sélection ferait partir dès le premier
 * toucher, sans montrer le nom.
 */
function onFocus(e: FocusEvent, spot: Spot) {
  if ((e.target as HTMLElement).matches(':focus-visible')) active.value = spot.id
}

function onSpot(e: MouseEvent, spot: Spot) {
  if (!ready.value) {
    e.preventDefault()
    return
  }
  // Toucher : le premier choisit le lieu, le second y va.
  if (!hoverCapable.value && active.value !== spot.id) {
    e.preventDefault()
    active.value = spot.id
    return
  }
  if (!spot.to) return // « Bientôt » : le nom suffit.
  // Ctrl/Cmd/Maj + clic : nouvel onglet, comme un lien ordinaire.
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
  e.preventDefault()
  const to = spot.to
  if ($reduceMotion || !map.value) {
    navigateTo(to)
    return
  }
  // On se rapproche du lieu avant de partir.
  gsap.to(map.value, {
    scale: 1.7,
    transformOrigin: `${spot.x + spot.w / 2}% ${spot.y + spot.h / 2}%`,
    duration: 0.8,
    ease: 'power2.in',
    onComplete: () => {
      navigateTo(to)
    }
  })
}

/**
 * Apparition depuis la fin de la vidéo : la carte part zoomée sur le cristal, placé là
 * où la vidéo le montrait (`from`, en px dans la fenêtre), puis recule. `onDone` quand
 * la carte est entière et cliquable.
 */
function reveal(opts: { from?: { x: number; y: number }; scale?: number; instant?: boolean } = {}) {
  const m = map.value
  if (!m) return
  if (opts.instant || $reduceMotion) {
    gsap.set(m, { clearProps: 'transform' })
    ready.value = true
    return gsap.timeline()
  }
  const s = opts.scale ?? 4
  const r = m.getBoundingClientRect()
  const cx = (r.width * CRYSTAL.x) / 100
  const cy = (r.height * CRYSTAL.y) / 100
  const from = opts.from ?? { x: window.innerWidth / 2, y: window.innerHeight * 0.34 }
  // Origine en haut à gauche : à l'échelle s, le cristal tombe sur `from`.
  gsap.set(m, {
    transformOrigin: '0 0',
    scale: s,
    x: from.x - r.left - s * cx,
    y: from.y - r.top - s * cy
  })
  return gsap
    .timeline({
      onComplete: () => {
        gsap.set(m, { clearProps: 'transform,transformOrigin' })
        ready.value = true
      }
    })
    .to(m, { scale: 1, x: 0, y: 0, duration: 3, ease: 'power2.inOut' })
}

defineExpose({ reveal, imageLoaded })
</script>

<style scoped>
.mc {
  position: relative;
  height: 100svh;
  overflow: hidden;
  /* Le cadre de la carte est un parchemin : le fond de la section le prolonge. */
  background: #f3e4c7;
}
.mc__scroller {
  height: 100%;
  display: grid;
  place-items: center;
  overflow: hidden;
}
.mc__map {
  position: relative;
  aspect-ratio: 1306 / 816;
  /* Ordinateur : la carte entière, la plus grande possible. */
  height: min(100svh, 100vw / 1.6005);
  will-change: transform;
}
.mc__img {
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
  border-radius: 0;
  user-select: none;
  -webkit-user-drag: none;
}

/* Téléphone / écran plus haut que large : la carte prend toute la hauteur et se
   fait glisser horizontalement. */
@media (max-aspect-ratio: 1/1) {
  .mc__scroller {
    display: block;
    /* Sans ce retour à la normale, le centrage hérité de l'ordinateur s'applique aussi en
       mode bloc : la carte, plus large que l'écran, déborderait pour moitié à gauche, là
       où le défilement ne va pas. */
    place-items: normal;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }
  .mc__scroller::-webkit-scrollbar {
    display: none;
  }
  .mc__map {
    height: 100%;
  }
}

/* --- le cristal qui respire ------------------------------------------------ */
.mc__glow {
  position: absolute;
  width: 16%;
  aspect-ratio: 1;
  translate: -50% -55%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 245, 255, 0.85) 0%, rgba(196, 150, 255, 0.45) 35%, rgba(196, 150, 255, 0) 70%);
  mix-blend-mode: screen;
  pointer-events: none;
  animation: mc-breathe 5s ease-in-out infinite;
}
@keyframes mc-breathe {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.9);
  }
  50% {
    opacity: 0.75;
    transform: scale(1.08);
  }
}

/* --- les lieux --------------------------------------------------------------- */
.mc__spot {
  position: absolute;
  display: block;
  padding: 0;
  border-radius: 50%;
  background: none;
  border: 0;
  cursor: pointer;
  /* On ne peut rien cliquer pendant l'apparition. */
  pointer-events: none;
  -webkit-tap-highlight-color: transparent;
}
.mc.is-ready .mc__spot {
  pointer-events: auto;
}
.mc__spot:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 4px;
}
/* Halo : le lieu s'illumine doucement au survol. */
.mc__halo {
  position: absolute;
  inset: -8%;
  border-radius: 50%;
  /* Discret : à 0,55 le lieu était délavé, presque blanc. */
  background: radial-gradient(closest-side, rgba(255, 246, 232, 0.26), rgba(255, 246, 232, 0) 100%);
  mix-blend-mode: screen;
  opacity: 0;
  transition: opacity 0.5s var(--ease-soft);
}
.mc__spot.is-active .mc__halo {
  opacity: 1;
}
/* Repère : un point lumineux qui pulse lentement au centre du lieu. */
.mc__beacon {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 14px;
  height: 14px;
  translate: -50% -50%;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.35), 0 2px 10px rgba(80, 40, 120, 0.35);
  opacity: 0;
  transition: opacity 0.6s var(--ease-soft);
}
.mc__beacon::after {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.7);
  animation: mc-ping 2.8s ease-out infinite;
}
.mc.is-ready .mc__beacon {
  opacity: 0.95;
}
.mc__spot.is-active .mc__beacon {
  opacity: 0;
}
@keyframes mc-ping {
  0% {
    transform: scale(0.6);
    opacity: 0.9;
  }
  100% {
    transform: scale(2.2);
    opacity: 0;
  }
}
/* Nom du lieu : une étiquette arrondie, au-dessus de la zone (ou dessous). */
.mc__label {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 6px);
  translate: -50% 8px;
  display: grid;
  justify-items: center;
  gap: 0.15rem;
  padding: 0.65rem 1rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 10px 30px rgba(70, 30, 110, 0.18);
  color: var(--ink);
  white-space: nowrap;
  text-align: center;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.35s var(--ease-soft),
    translate 0.35s var(--ease-soft);
}
.mc__spot.label-below .mc__label {
  bottom: auto;
  top: calc(100% + 6px);
  translate: -50% -8px;
}
.mc__spot.is-active .mc__label {
  opacity: 1;
  translate: -50% 0;
  /* Tactile : l'étiquette ouverte se touche pour entrer (elle fait partie du lien). */
  pointer-events: auto;
}
.mc__label strong {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 600;
}
.mc__label small {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
.mc__label em {
  font-style: normal;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--accent);
}
.mc__spot.is-soon .mc__label small {
  color: #b06bd6;
}

/* --- mouvement réduit : pas de respiration ni de pulsation ------------------- */
@media (prefers-reduced-motion: reduce) {
  .mc__glow,
  .mc__beacon::after {
    animation: none;
  }
}
</style>
