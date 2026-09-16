<template>
  <div>
    <ul class="xp-list" @mouseleave="hide">
      <li
        v-for="(xp, i) in expertises"
        :key="xp.idx"
        class="xp-row"
        @mouseenter="show(i)"
        @mousemove="move"
      >
        <span class="xp-row__idx">{{ xp.idx }}</span>
        <h3 class="xp-row__title">{{ xp.title }}</h3>
        <p class="xp-row__desc">{{ xp.desc }}</p>
      </li>
    </ul>

    <!-- Vignette qui suit le curseur : une photo par expertise, teintée par
         sa couleur signature. -->
    <div class="xp-cursor" ref="cursor" aria-hidden="true">
      <img :src="activeXp.image" alt="" class="xp-cursor__img" />
      <div class="xp-cursor__fill" :style="fillStyle" />
    </div>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'

const cursor = ref<HTMLElement | null>(null)
const active = ref(0)
const { $reduceMotion } = useNuxtApp()

const activeXp = computed(() => expertises[active.value]!)

// Lavis de couleur au-dessus de la photo plutôt qu'un dégradé plein : on
// garde l'identité "teintée par l'expertise" sans cacher l'image dessous.
const fillStyle = computed(() => {
  const xp = activeXp.value
  return {
    background: `radial-gradient(120% 100% at 50% 110%, ${xp.color} 0%, transparent 65%), linear-gradient(200deg, color-mix(in oklab, ${xp.color} 55%, transparent) 0%, transparent 70%)`
  }
})

let xTo: ((v: number) => void) | null = null
let yTo: ((v: number) => void) | null = null

onMounted(() => {
  if ($reduceMotion || !cursor.value) return
  // gsap prend la main sur le transform : on réinstalle le centrage ici,
  // sinon x/y placerait le coin haut-gauche sous le curseur.
  gsap.set(cursor.value, { xPercent: -50, yPercent: -50, scale: 0.85, autoAlpha: 0 })
  xTo = gsap.quickTo(cursor.value, 'x', { duration: 0.5, ease: 'power3' })
  yTo = gsap.quickTo(cursor.value, 'y', { duration: 0.5, ease: 'power3' })
})

function show(i: number) {
  active.value = i
  if ($reduceMotion || !cursor.value) return
  gsap.to(cursor.value, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'power3.out' })
}

function hide() {
  if ($reduceMotion || !cursor.value) return
  gsap.to(cursor.value, { autoAlpha: 0, scale: 0.85, duration: 0.35, ease: 'power3.out' })
}

function move(e: MouseEvent) {
  // La vignette est en position: fixed, donc les coordonnées viewport suffisent.
  xTo?.(e.clientX)
  yTo?.(e.clientY)
}
</script>

<style scoped>
.xp-cursor__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.xp-cursor__fill {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  mix-blend-mode: multiply;
}
</style>
