<template>
  <div class="fab" ref="wrap" :style="{ '--fab-scroll': `${scrollVh}vh` }">
    <div class="fab__sticky">
      <BottleStage
        class="fab__stage"
        :color="color"
        :color2="color2"
        :name="name"
        :progress="progress"
      />
      <slot :progress="progress" />
    </div>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'

// ---------------------------------------------------------------------------
// Fabrication de la bouteille, en 3D temps réel, pilotée par le scroll.
//
// Le composant ne connaît que deux choses : la hauteur de défilement du bloc,
// et la valeur d'avancement qu'il en tire. Tout le reste — niveau du liquide,
// enroulement de l'étiquette, descente de la capsule — est déclaré dans
// BottleModel, qui dérive tout de `progress`.
// ---------------------------------------------------------------------------

withDefaults(
  defineProps<{
    color?: string
    color2?: string
    name?: string
    /** Hauteur de défilement du bloc, en vh. Plus haut = plus lent. */
    scrollVh?: number
  }>(),
  { color: '#ff8a3d', color2: '#ffd166', name: 'Luméa', scrollVh: 420 }
)

const emit = defineEmits<{ progress: [number] }>()

const wrap = ref<HTMLElement | null>(null)
const progress = ref(0)

const { $reduceMotion } = useNuxtApp()

onMounted(() => {
  const host = wrap.value
  if (!host) return

  if ($reduceMotion) {
    // Pas de scrub : la bouteille finie, tout de suite.
    progress.value = 1
    emit('progress', 1)
    return
  }

  const state = { p: 0 }
  const tween = gsap.to(state, {
    p: 1,
    ease: 'none',
    scrollTrigger: { trigger: host, start: 'top top', end: 'bottom bottom', scrub: 0.35 },
    onUpdate: () => {
      progress.value = state.p
      emit('progress', state.p)
    }
  })

  onUnmounted(() => {
    tween.scrollTrigger?.kill()
    tween.kill()
  })
})
</script>

<style scoped>
.fab {
  position: relative;
  height: var(--fab-scroll);
}
.fab__sticky {
  position: sticky;
  top: 0;
  height: 100svh;
  overflow: hidden;
}
/* Le canvas suit son conteneur : c'est ce bloc collant qui donne la taille,
   jamais le bloc de défilement, qui fait plusieurs écrans de haut. */
.fab__stage {
  width: 100%;
  height: 100svh;
}
</style>
