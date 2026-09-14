<template>
  <NuxtLink :to="`/boissons/${drink.slug}`" class="project-card" data-cursor="Voir" v-reveal>
    <div class="project-card__media reveal-mask">
      <BottleShot
        :label="drink.name"
        :src="drink.render"
        :color="drink.color"
        :color2="drink.color2"
        :ratio="ratio"
      />
    </div>

    <div class="project-card__meta">
      <h3 class="project-card__title">
        {{ drink.name }}
        <span class="fruit">— {{ drink.fruit }}</span>
      </h3>
      <p class="project-card__tags">{{ drink.range }} · {{ drink.year }}</p>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Drink } from '~/composables/useSite'

withDefaults(
  defineProps<{
    drink: Drink
    ratio?: '4x5' | '3x2' | '16x9' | '1x1'
  }>(),
  { ratio: '4x5' }
)
</script>

<style scoped>
.fruit {
  font-family: var(--font-body);
  font-weight: 400;
  font-size: 0.95rem;
  letter-spacing: 0;
  color: var(--ink-soft);
  white-space: nowrap;
}
.night .fruit {
  color: var(--on-night-soft);
}
</style>
