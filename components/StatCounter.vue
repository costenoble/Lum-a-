<template>
  <div class="stat" ref="root">
    <p class="stat__num">{{ shown }}{{ suffix }}</p>
    <p class="stat__label">{{ label }}</p>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const props = withDefaults(defineProps<{ value: number; label: string; suffix?: string }>(), {
  suffix: ''
})

const root = ref<HTMLElement | null>(null)
const shown = ref(props.value)
const { $reduceMotion } = useNuxtApp()

// La valeur finale est rendue dès le SSR (lisible sans JS) ; on ne repart de
// zéro que côté client, une fois la section atteinte.
onMounted(() => {
  if ($reduceMotion || !root.value) return
  shown.value = 0
  const counter = { n: 0 }
  const tween = gsap.to(counter, {
    n: props.value,
    duration: 1.6,
    ease: 'power2.out',
    scrollTrigger: { trigger: root.value, start: 'top 88%', toggleActions: 'play none none none' },
    onUpdate: () => {
      shown.value = Math.round(counter.n)
    }
  })
  onUnmounted(() => {
    tween.scrollTrigger?.kill()
    tween.kill()
    ScrollTrigger.refresh()
  })
})
</script>
