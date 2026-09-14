<template>
  <div class="manifesto" ref="root">
    <p>
      <!-- L'espace doit rester en dehors du span, et surtout rester sécable :
           avec un &nbsp; collé à chaque mot, le navigateur n'a plus aucun point
           de coupure et le paragraphe déborde en une seule ligne. -->
      <template v-for="(word, i) in words" :key="i"><span class="w">{{ word }}</span>{{ ' ' }}</template>
    </p>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'

const props = defineProps<{ text: string }>()
const words = computed(() => props.text.split(' '))

const root = ref<HTMLElement | null>(null)
const { $reduceMotion } = useNuxtApp()

// Le texte s'encre mot à mot pendant que la section traverse l'écran :
// scrub sur la position de scroll plutôt qu'une durée fixe.
onMounted(() => {
  const el = root.value
  if (!el) return
  const spans = el.querySelectorAll('.w')
  if ($reduceMotion) {
    spans.forEach((s) => s.classList.add('on'))
    return
  }
  // gsap ne sait pas tweener une classe : on anime une valeur témoin et on
  // pose la classe sur les N premiers mots à chaque frame.
  const state = { p: 0 }
  const tween = gsap.to(state, {
    p: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: el,
      start: 'top 78%',
      end: 'bottom 45%',
      scrub: 0.5
    },
    onUpdate: () => {
      const cut = Math.round(state.p * spans.length)
      spans.forEach((s, i) => s.classList.toggle('on', i < cut))
    }
  })
  onUnmounted(() => {
    tween.scrollTrigger?.kill()
    tween.kill()
  })
})
</script>
