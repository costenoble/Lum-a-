<template>
  <div class="marquee" ref="root">
    <!-- Deux pistes identiques : la seconde prend le relais quand la première
         sort, ce qui donne la boucle sans saut. -->
    <div class="marquee__track" v-for="n in 2" :key="n" :aria-hidden="n === 2">
      <span v-for="(word, i) in items" :key="i" class="marquee__item">{{ word }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'

const props = withDefaults(defineProps<{ items: string[]; speed?: number }>(), { speed: 28 })

const root = ref<HTMLElement | null>(null)
const { $reduceMotion } = useNuxtApp()

onMounted(() => {
  if ($reduceMotion || !root.value) return
  const tracks = root.value.querySelectorAll('.marquee__track')
  const tween = gsap.to(tracks, {
    xPercent: -100,
    repeat: -1,
    duration: props.speed,
    ease: 'none'
  })
  onUnmounted(() => tween.kill())
})
</script>
