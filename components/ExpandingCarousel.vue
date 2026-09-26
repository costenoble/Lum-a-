<template>
  <div ref="container" class="xc" :style="{ '--xc-gap': `${GAP_PX}px` }">
    <article
      v-for="(item, index) in items"
      :key="item.id"
      class="xc__slide"
      :class="{ 'is-active': index === active }"
      :style="slideStyle(index)"
      @pointerenter="onHover(index)"
    >
      <div class="xc__media">
        <BottleShot
          :label="item.title"
          :src="item.render ?? ''"
          :color="item.color"
          :color2="item.color2"
          ratio="4x5"
          :alt="item.alt ?? item.title"
          :filter="item.filter"
          sizes="(max-width: 900px) 85vw, 60vw"
        />
      </div>

      <!-- Slide réduite : le nom passe à la verticale, seule chose qui tient
           dans 64 px de large. Le bouton couvre toute la slide pour l'activer. -->
      <button
        v-if="index !== active"
        type="button"
        class="xc__pick"
        :aria-label="`Afficher : ${item.title}`"
        @click="go(index)"
      >
        <span class="xc__vertical">{{ item.title }}</span>
      </button>

      <div v-else class="xc__caption">
        <h3 class="xc__title">{{ item.title }}</h3>
        <p v-if="item.subtitle" class="xc__subtitle">{{ item.subtitle }}</p>
        <NuxtLink v-if="item.to" :to="item.to" class="xc__link link-under" data-cursor="Voir">
          Voir le parfum ↗
        </NuxtLink>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'

// ---------------------------------------------------------------------------
// Carrousel « accordéon » : la slide active occupe tout l'espace restant, les
// autres se réduisent en escalier selon leur distance à l'active.
//
// Portage Vue du composant React fourni (ExpandingCarousel.tsx, effet repéré
// sur elevenlabs.io). Même mécanique : les largeurs sont calculées en JS à
// partir de la largeur réelle du conteneur (ResizeObserver) et posées en
// style inline, la transition CSS sur `width` fait le reste — pas de
// container queries, pas de librairie.
// ---------------------------------------------------------------------------

export interface CarouselItem {
  id: string
  title: string
  subtitle?: string
  alt?: string
  /** Render Blender ; vide = dégradé signature du parfum. */
  render?: string
  /** Filtre CSS optionnel appliqué au render (cf. Drink.renderFilter). */
  filter?: string
  color: string
  color2: string
  /** Destination du lien affiché sur la slide active. */
  to?: string
}

const props = defineProps<{ items: CarouselItem[] }>()

// Doit rester synchronisé avec --xc-gap (gap de la piste).
const GAP_PX = 12

// Largeur des slides inactives selon leur distance à l'active :
// voisine immédiate 220 px, puis 96, puis 64 pour toutes les suivantes.
const NARROW_WIDTHS = [220, 96, 64]

const container = ref<HTMLElement | null>(null)
const containerWidth = ref(0)
const active = ref(0)

const { $reduceMotion } = useNuxtApp()

onMounted(() => {
  const el = container.value
  if (!el) return

  const ro = new ResizeObserver(([entry]) => {
    containerWidth.value = entry?.contentRect.width ?? 0
  })
  ro.observe(el)

  // Entrée en cascade : les slides montent du bas, une par une, quand la
  // section arrive à l'écran. On anime `y` (et pas la largeur) pour ne pas
  // entrer en conflit avec la transition width de l'accordéon.
  const slides = el.querySelectorAll('.xc__slide')
  let reveal: gsap.core.Tween | null = null

  if (!$reduceMotion && slides.length) {
    gsap.set(slides, { y: 90, autoAlpha: 0 })
    introReady.then(() => {
      if (!el.isConnected) return
      reveal = gsap.to(slides, {
        y: 0,
        autoAlpha: 1,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.09,
        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' }
      })
    })
  }

  onUnmounted(() => {
    ro.disconnect()
    reveal?.scrollTrigger?.kill()
    reveal?.kill()
  })
})

function narrowWidthAt(distance: number) {
  return NARROW_WIDTHS[Math.min(distance - 1, NARROW_WIDTHS.length - 1)]!
}

function slideStyle(index: number) {
  // Avant la première mesure, aucune largeur inline : les slides se répartissent
  // en flex, ce qui évite un saut de mise en page à l'hydratation.
  if (!containerWidth.value) return undefined
  const distance = Math.abs(index - active.value)
  const count = props.items.length

  if (distance > 0) return { width: `${narrowWidthAt(distance)}px`, flex: '0 0 auto' }

  let narrowTotal = 0
  for (let i = 1; i < count; i++) narrowTotal += narrowWidthAt(i)
  const width = Math.max(containerWidth.value - narrowTotal - GAP_PX * (count - 1), 0)
  return { width: `${width}px`, flex: '0 0 auto' }
}

function go(index: number) {
  const count = props.items.length
  active.value = ((index % count) + count) % count
}

// Au survol, la slide s'ouvre sans clic — mais seulement avec un vrai pointeur
// (au doigt, `pointerenter` se déclenche au toucher et volerait le clic).
function onHover(index: number) {
  if ($reduceMotion) return
  if (!window.matchMedia('(pointer: fine)').matches) return
  go(index)
}
</script>

<style scoped>
.xc {
  display: flex;
  gap: var(--xc-gap);
  height: clamp(22rem, 44vw, 34rem);
}
.xc__slide {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 14px;
  flex: 1 1 0;
  transition: width 0.55s var(--ease-soft);
}
.xc__media,
.xc__media :deep(.media) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: 0;
  /* BottleShot impose un ratio (4/5 ici) : dans l'accordéon c'est la slide
     qui commande la boîte, sinon le visuel ne remplit pas la slide active et
     laisse un vide à droite. */
  aspect-ratio: auto;
}
.xc__pick {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 1.6rem;
}
.xc__pick:focus-visible {
  outline: 2px solid #fff;
  outline-offset: -6px;
}
.xc__vertical {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
}
.xc__caption {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  z-index: 1;
  padding: clamp(1.2rem, 3vw, 2.2rem);
  color: #fff;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.68), transparent);
}
.xc__title {
  font-size: clamp(1.4rem, 2.6vw, 2.2rem);
}
.xc__subtitle {
  margin-top: 0.3rem;
  font-size: 0.95rem;
  opacity: 0.82;
}
.xc__link {
  display: inline-block;
  margin-top: 1rem;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

/* Sous 900 px, l'accordéon n'a plus de place : on repasse en carrousel
   swipeable classique, toutes les slides à la même largeur. */
@media (max-width: 900px) {
  .xc {
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    height: clamp(20rem, 90vw, 28rem);
  }
  .xc::-webkit-scrollbar {
    display: none;
  }
  .xc__slide {
    width: min(85%, 30rem) !important;
    flex: 0 0 auto !important;
    scroll-snap-align: start;
  }
}
</style>
