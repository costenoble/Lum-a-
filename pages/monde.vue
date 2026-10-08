<template>
  <div class="monde">
    <!-- 1. L'entrée : le portail s'éveille, on traverse le tunnel, flash blanc. -->
    <MondeIntro />

    <!-- 2. La carte du Monde Luméa, dévoilée depuis le blanc du flash. En attendant
         l'illustration (components/minimaxH3/monde/), un emplacement. -->
    <section ref="arrival" class="monde__arrival">
      <div ref="veil" class="monde__veil" aria-hidden="true" />
      <div class="container monde__placeholder">
        <p class="eyebrow">Le Monde Luméa</p>
        <h2>La carte arrive ici</h2>
        <p class="muted">
          La Source, le Parc, le verger, le jardin, la prairie des nuages, le lagon et le
          village des gâteaux — avec les mascottes posées dans leur univers.
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'

// ---------------------------------------------------------------------------
// Prototype : l'entrée dans le Monde Luméa. Page à part, hors du menu et non
// indexée, pour essayer sans toucher au site.
// ---------------------------------------------------------------------------

useHead({
  title: 'Monde Luméa — prototype',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
})

const { $reduceMotion } = useNuxtApp()
const arrival = ref<HTMLElement | null>(null)
const veil = ref<HTMLElement | null>(null)

// L'intro finit sur un écran blanc : la section suivante part de ce même blanc et le
// laisse se dissiper à mesure qu'elle monte, sans coupure.
let tween: gsap.core.Tween | null = null
onMounted(() => {
  if (!arrival.value || !veil.value) return
  if ($reduceMotion) {
    veil.value.style.opacity = '0'
    return
  }
  tween = gsap.fromTo(
    veil.value,
    { opacity: 1 },
    {
      opacity: 0,
      ease: 'none',
      scrollTrigger: { trigger: arrival.value, start: 'top bottom', end: 'top 15%', scrub: true }
    }
  )
})
onUnmounted(() => {
  tween?.scrollTrigger?.kill()
  tween?.kill()
})
</script>

<style scoped>
.monde__arrival {
  position: relative;
  min-height: 100svh;
  display: grid;
  align-items: center;
  background: linear-gradient(180deg, #f6e6f6 0%, #f3dcef 45%, #fbe9e1 100%);
  overflow: hidden;
}
.monde__veil {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: #fdfaff;
  pointer-events: none;
}
.monde__placeholder {
  display: grid;
  gap: var(--sp-3);
  justify-items: start;
}
.monde__placeholder h2 {
  font-size: var(--fs-h1);
}
.monde__placeholder .muted {
  max-width: 46ch;
}
</style>
