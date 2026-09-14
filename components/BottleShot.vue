<template>
  <figure class="media" :class="`ratio-${ratio}`">
    <img v-if="src" :src="src" :alt="alt" loading="lazy" />

    <!-- Emplacement render : dégradé signature du parfum + halo + initiale.
         Dès que le PNG Blender existe, on passe `src` et la boîte ne bouge pas. -->
    <div v-else class="ph" :style="phStyle" role="img" :aria-label="alt">
      <span class="ph__letter">{{ label.slice(0, 1) }}</span>
      <span class="ph__tag">render&nbsp;3D</span>
    </div>
  </figure>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** Chemin du render Blender, ex. /renders/lumea-solaire.png. Vide = placeholder. */
    src?: string
    label: string
    alt?: string
    color?: string
    color2?: string
    ratio?: '4x5' | '3x2' | '16x9' | '1x1'
  }>(),
  {
    src: '',
    alt: '',
    color: '#ff5b1f',
    color2: '#ffd166',
    ratio: '4x5'
  }
)

const alt = computed(() => props.alt || `Bouteille Luméa ${props.label}`)

const phStyle = computed(() => ({
  '--c1': props.color,
  '--c2': props.color2
}))
</script>

<style scoped>
.ph {
  position: relative;
  display: grid;
  place-items: center;
  background:
    radial-gradient(120% 90% at 50% 115%, var(--c2) 0%, transparent 62%),
    linear-gradient(200deg, var(--c1) 0%, color-mix(in oklab, var(--c1) 45%, #0b0b0b) 100%);
  isolation: isolate;
}
/* Grain léger : évite l'effet « dégradé CSS plat » sur les grandes surfaces. */
.ph::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.22;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E");
}
.ph__letter {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(5rem, 18cqw, 14rem);
  line-height: 1;
  letter-spacing: -0.06em;
  color: rgba(255, 255, 255, 0.9);
  mix-blend-mode: soft-light;
}
.ph__tag {
  position: absolute;
  left: 1rem;
  bottom: 1rem;
  font-family: var(--font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
}
</style>
