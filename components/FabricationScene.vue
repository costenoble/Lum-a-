<template>
  <div class="fab" ref="wrap" :style="{ '--fab-scroll': `${scrollVh}vh` }">
    <div class="fab__sticky">
      <UniverseScene class="fab__stage" :progress="progress" />
      <slot :progress="progress" />
    </div>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'

// ---------------------------------------------------------------------------
// Vol au-dessus de l'univers de la Source, en SVG, piloté par le scroll.
//
// Le composant ne connaît que deux choses : la hauteur de défilement du bloc,
// et la valeur d'avancement qu'il en tire. Tout le reste — les couches du
// décor, les personnages, le cristal — est déclaré dans UniverseScene, qui
// dérive tout de `progress`.
// ---------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    /** Hauteur de défilement du bloc, en vh. Plus haut = plus lent. */
    scrollVh?: number
    /** Avancement affiché sans animation (prefers-reduced-motion). */
    restProgress?: number
  }>(),
  { scrollVh: 420, restProgress: 1 }
)

const emit = defineEmits<{ progress: [number] }>()

const wrap = ref<HTMLElement | null>(null)
const progress = ref(0)

const { $reduceMotion } = useNuxtApp()

onMounted(() => {
  const host = wrap.value
  if (!host) return

  if ($reduceMotion) {
    // Pas de scrub : un cadrage fixe, tout de suite.
    progress.value = props.restProgress
    emit('progress', props.restProgress)
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
/* Le dessin suit son conteneur : c'est ce bloc collant qui donne la taille,
   jamais le bloc de défilement, qui fait plusieurs écrans de haut. */
.fab__stage {
  width: 100%;
  height: 100svh;
}
</style>
