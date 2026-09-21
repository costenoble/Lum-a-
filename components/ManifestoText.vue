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

const props = defineProps<{
  text: string
  /**
   * Avancement de l'encrage, de 0 à 1, imposé par le parent. Sans lui, le texte
   * s'encre tout seul pendant qu'il traverse l'écran ; avec lui, c'est le parent qui
   * décide (le texte est alors épinglé : il ne bouge plus, son propre suivi de scroll
   * ne verrait rien avancer).
   */
  progress?: number
}>()
const words = computed(() => props.text.split(' '))

const root = ref<HTMLElement | null>(null)
const { $reduceMotion } = useNuxtApp()

/** Encre les N premiers mots, N étant tiré de l'avancement p (0 → 1). */
function ink(p: number) {
  const spans = root.value?.querySelectorAll('.w')
  if (!spans) return
  const cut = Math.round(Math.min(1, Math.max(0, p)) * spans.length)
  spans.forEach((s, i) => s.classList.toggle('on', i < cut))
}

// Piloté de l'extérieur : on suit la valeur reçue.
watch(
  () => props.progress,
  (p) => {
    if (p !== undefined && !$reduceMotion) ink(p)
  }
)

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
  if (props.progress !== undefined) {
    ink(props.progress)
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
