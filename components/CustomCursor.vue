<template>
  <div class="cursor" ref="root" aria-hidden="true">
    <div class="cursor__dot" ref="dot">
      <span class="cursor__label" ref="labelEl">{{ label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'

// ---------------------------------------------------------------------------
// Curseur maison : un point qui suit la souris et se transforme en pastille
// libellée au survol de tout élément portant `data-cursor="Voir"`.
// Le curseur natif reste actif sur mobile et en mouvement réduit.
// ---------------------------------------------------------------------------

const root = ref<HTMLElement | null>(null)
const dot = ref<HTMLElement | null>(null)
const label = ref('')

const { $reduceMotion } = useNuxtApp()

let xTo: ((v: number) => void) | null = null
let yTo: ((v: number) => void) | null = null

onMounted(() => {
  // Pas de curseur custom sans vrai pointeur (tactile) ni en reduced-motion.
  if ($reduceMotion || !window.matchMedia('(pointer: fine)').matches) return
  const el = root.value
  const d = dot.value
  if (!el || !d) return

  el.classList.add('is-on')
  document.documentElement.classList.add('custom-cursor-on')
  gsap.set(el, { xPercent: -50, yPercent: -50 })
  xTo = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3' })
  yTo = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3' })

  const onMove = (e: MouseEvent) => {
    xTo?.(e.clientX)
    yTo?.(e.clientY)

    // Un seul écouteur au niveau document plutôt qu'un par carte : la cible
    // remonte l'arbre jusqu'au premier ancêtre qui déclare un libellé.
    const hit = (e.target as HTMLElement | null)?.closest?.('[data-cursor]') as HTMLElement | null
    const next = hit?.dataset.cursor ?? ''
    if (next === label.value) return
    label.value = next
    gsap.to(d, {
      width: next ? 96 : 12,
      height: next ? 96 : 12,
      duration: 0.45,
      ease: 'power3.out'
    })
  }

  const onLeave = () => gsap.to(el, { autoAlpha: 0, duration: 0.25 })
  const onEnter = () => gsap.to(el, { autoAlpha: 1, duration: 0.25 })

  window.addEventListener('mousemove', onMove)
  document.addEventListener('mouseleave', onLeave)
  document.addEventListener('mouseenter', onEnter)

  onUnmounted(() => {
    window.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseleave', onLeave)
    document.removeEventListener('mouseenter', onEnter)
    document.documentElement.classList.remove('custom-cursor-on')
  })
})
</script>

<style scoped>
.cursor {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 95;
  pointer-events: none;
  display: none;
}
.cursor.is-on {
  display: block;
}
.cursor__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  display: grid;
  place-items: center;
}
.cursor__label {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #fff;
  white-space: nowrap;
}
</style>
