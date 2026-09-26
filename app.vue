<template>
  <div :class="{ 'nav-open': navOpen }">
    <IntroLoader v-if="showIntro" @done="showIntro = false" />

    <TheHeader />
    <NavOverlay />
    <CartDrawer />
    <CustomCursor />

    <div class="transition-overlay" ref="overlayEl" aria-hidden="true">
      <span /><span /><span />
    </div>

    <main>
      <NuxtPage :transition="pageTransition" />
    </main>

    <TheFooter />
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// ---------------------------------------------------------------------------
// Transition de page en rideau : onLeave couvre l'écran avec trois bandes, la
// page suivante se monte pendant que c'est couvert (on en profite pour
// remettre le scroll à zéro, jamais visible), puis onEnter découvre.
// ---------------------------------------------------------------------------

const navOpen = useNavOpen()
const { $lenis, $reduceMotion } = useNuxtApp()
const overlayEl = ref<HTMLElement | null>(null)

// Le rideau d'accueil ne joue qu'au tout premier chargement, et seulement sur
// la home : revenir dessus en navigation interne ne le rejoue pas (la valeur
// est figée au setup de l'app, qui ne tourne qu'une fois).
const showIntro = ref(useRoute().path === '/')

// Sans loader (page interne, ou retour sur la home en navigation client), rien
// ne viendrait débloquer les révélations : elles attendraient le garde-fou de
// 4 s. On libère donc tout de suite.
if (import.meta.client && !showIntro.value) markIntroDone()

function resetScroll() {
  if ($lenis) ($lenis as any).scrollTo(0, { immediate: true })
  else window.scrollTo(0, 0)
  // Les positions des ScrollTrigger de la page sortante ne valent plus rien.
  ScrollTrigger.refresh()
}

const pageTransition = {
  name: 'curtain',
  mode: 'out-in' as const,
  css: false,
  onLeave(_el: Element, done: () => void) {
    if ($reduceMotion || !overlayEl.value) {
      resetScroll()
      done()
      return
    }
    // ≈ 1,4 s aller-retour. Pas plus court, et pas en power4.in : les bandes y
    // restaient presque invisibles jusqu'au dernier instant, puis repartaient aussitôt
    // — on ne voyait plus qu'un éclair noir, plus une transition.
    // `overwrite` : un second clic pendant la transition reprend les bandes où elles
    // sont, au lieu de faire tourner deux tweens l'un contre l'autre.
    gsap.to(overlayEl.value.querySelectorAll('span'), {
      scaleY: 1,
      transformOrigin: 'bottom',
      duration: 0.5,
      ease: 'power3.inOut',
      stagger: 0.06,
      overwrite: true,
      onComplete: () => {
        resetScroll()
        done()
      }
    })
  },
  onEnter(_el: Element, done: () => void) {
    if ($reduceMotion || !overlayEl.value) {
      done()
      return
    }
    gsap.to(overlayEl.value.querySelectorAll('span'), {
      scaleY: 0,
      transformOrigin: 'top',
      duration: 0.6,
      ease: 'power3.inOut',
      stagger: 0.06,
      // Un temps d'arrêt sur l'écran couvert : c'est lui qui fait lire le rideau.
      delay: 0.1,
      overwrite: true,
      onComplete: () => {
        ScrollTrigger.refresh()
        done()
      }
    })
  }
}
</script>
