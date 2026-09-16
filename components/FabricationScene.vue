<template>
  <div class="fab" ref="wrap" :style="{ '--fab-scroll': `${scrollVh}vh` }">
    <div class="fab__sticky">
      <BananaStage class="fab__stage" :progress="progress" />
      <slot :progress="progress" />
    </div>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'

// ---------------------------------------------------------------------------
// Vol de caméra autour de la banane, en 3D temps réel, piloté par le scroll.
//
// Le composant ne connaît que deux choses : la hauteur de défilement du bloc,
// et la valeur d'avancement qu'il en tire. Tout le reste — la trajectoire en
// spline, le champ de vision, la cible — est déclaré dans BananaStage, qui
// dérive tout de `progress`. Le fruit lui-même ne bouge jamais.
// ---------------------------------------------------------------------------

withDefaults(
  defineProps<{
    /** Hauteur de défilement du bloc, en vh. Plus haut = plus lent. */
    scrollVh?: number
  }>(),
  { scrollVh: 420 }
)

const emit = defineEmits<{ progress: [number] }>()

const wrap = ref<HTMLElement | null>(null)
const progress = ref(0)

const { $reduceMotion } = useNuxtApp()

onMounted(() => {
  const host = wrap.value
  if (!host) return

  if ($reduceMotion) {
    // Pas de scrub : le cadrage final, tout de suite.
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
