<template>
  <header class="header">
    <div class="container header__inner">
      <NuxtLink to="/" class="header__brand" @click="navOpen = false">Luméa</NuxtLink>

      <div class="header__right">
        <button class="header__cart link-under" @click="cartOpen = true">
          Panier<sup v-if="count">{{ count }}</sup>
        </button>
      </div>
    </div>
  </header>

  <!-- Bouton menu « pilule ». Il vit hors du <header> : celui-ci est un groupe
       de fusion (mix-blend-mode) qui inverserait le noir et l'accent orange. -->
  <button
    ref="burgerEl"
    class="burger"
    :class="{ 'is-open': navOpen }"
    :aria-expanded="navOpen"
    aria-controls="nav-overlay"
    @click="navOpen = !navOpen"
    @pointermove="trackCircle"
    @pointerleave="releaseCircle"
  >
    <!-- Deux calques : le wrap est déplacé par le curseur (GSAP, canal x/y),
         le rond garde sa transformation CSS pour l'état ouvert/fermé. Les
         mélanger sur un seul élément ferait s'écraser les deux transforms. -->
    <span ref="circleWrap" class="burger__circleWrap" aria-hidden="true">
      <span class="burger__circle" />
    </span>
    <span class="burger__label">{{ navOpen ? 'Fermer' : 'Menu' }}</span>
    <span class="burger__icon" aria-hidden="true">
      <i class="burger__line" />
      <i class="burger__line" />
      <svg class="burger__close" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M2 2 12 12M12 2 2 12" stroke="currentColor" stroke-width="1.6" />
      </svg>
    </span>
  </button>
</template>

<script setup lang="ts">
import gsap from 'gsap'

const navOpen = useNavOpen()
const { count, open: cartOpen } = useCart()

const burgerEl = ref<HTMLElement | null>(null)
const circleWrap = ref<HTMLElement | null>(null)
const { $reduceMotion } = useNuxtApp()

let xTo: ((v: number) => void) | null = null
let yTo: ((v: number) => void) | null = null

onMounted(() => {
  if ($reduceMotion || !circleWrap.value) return
  if (!window.matchMedia('(pointer: fine)').matches) return
  xTo = gsap.quickTo(circleWrap.value, 'x', { duration: 0.5, ease: 'power3' })
  yTo = gsap.quickTo(circleWrap.value, 'y', { duration: 0.5, ease: 'power3' })
})

// Le rond dérive vers le curseur, à vitesse réduite et borné à la pilule :
// il doit suivre la souris sans jamais sortir du bouton.
function trackCircle(e: PointerEvent) {
  if (!xTo || !yTo || navOpen.value) return
  const r = burgerEl.value?.getBoundingClientRect()
  if (!r) return
  const dx = (e.clientX - r.left - r.width / 2) * 0.55
  const dy = (e.clientY - r.top - r.height / 2) * 0.55
  xTo(clamp(dx, r.width / 2))
  yTo(clamp(dy, r.height / 2))
}

function releaseCircle() {
  xTo?.(0)
  yTo?.(0)
}

function clamp(value: number, max: number) {
  return Math.max(-max, Math.min(max, value))
}

// À l'ouverture, le rond doit remplir la pilule bien centré : on annule le
// décalage laissé par le survol.
watch(navOpen, (open) => {
  if (open) releaseCircle()
})
</script>

<style scoped>
.header__right {
  display: flex;
  align-items: center;
  gap: 1.4rem;
  /* place réservée à la pilule menu, qui est en position fixe hors du flux */
  padding-right: 9.5rem;
}
.header__cart {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.header__cart sup {
  margin-left: 0.35rem;
}

/* --- pilule menu --------------------------------------------------------- */
.burger {
  position: fixed;
  /* centrée sur la hauteur du header, pas sur celle du viewport */
  top: calc(var(--header-h) / 2);
  right: var(--pad-inline);
  translate: 0 -50%;
  z-index: 61;
  display: inline-flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.7rem 1.1rem;
  border-radius: 999px;
  background: var(--ink);
  color: var(--paper);
  overflow: hidden;
  isolation: isolate;
}
.burger__circleWrap {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.burger__circle {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 120%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--accent);
  transform: scale(0.2) translateX(120%);
  transition: transform 0.55s var(--ease-soft);
}
/* Au survol le point grossit un peu : la dérive vers le curseur se lit mieux. */
.burger:hover .burger__circle {
  transform: scale(0.3) translateX(120%);
}
.burger.is-open .burger__circle,
.burger.is-open:hover .burger__circle {
  transform: scale(1) translateX(0);
}
.burger__label,
.burger__icon {
  position: relative;
  z-index: 1;
}
.burger__label {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.burger__icon {
  position: relative;
  width: 18px;
  height: 14px;
  display: grid;
  align-content: center;
  gap: 4px;
}
.burger__line {
  display: block;
  height: 2px;
  background: currentColor;
  transform-origin: right;
  transition: transform 0.4s var(--ease-soft), opacity 0.3s linear;
}
.burger__line:last-child {
  width: 70%;
  justify-self: end;
}
.burger:hover .burger__line:last-child {
  width: 100%;
}
.burger.is-open .burger__line {
  opacity: 0;
  transform: scaleX(0);
}
.burger__close {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 14px;
  height: 14px;
  opacity: 0;
  transform: rotate(-45deg);
  transition: opacity 0.35s linear 0.1s, transform 0.45s var(--ease-soft) 0.1s;
}
.burger.is-open .burger__close {
  opacity: 1;
  transform: rotate(0);
}
</style>
