<template>
  <div>
    <section class="container page-head">
      <p class="eyebrow" v-reveal>{{ drinks.length }} parfums</p>
      <h1 v-lines="0.05" style="font-size: var(--fs-hero); margin-top: 1.5rem">
        <span class="line-mask"><span>La gamme</span></span>
      </h1>
      <p class="lead" v-reveal="0.3" style="margin-top: 2rem">
        Quatre familles, six recettes, une seule règle : aucun sucre ajouté, jamais.
      </p>
    </section>

    <section class="container" style="padding-bottom: var(--sp-6)">
      <div class="filters" v-reveal style="margin-bottom: var(--sp-4)">
        <button :aria-pressed="active === null" @click="active = null">
          Tout <sup>{{ drinks.length }}</sup>
        </button>
        <button
          v-for="range in ranges"
          :key="range"
          :aria-pressed="active === range"
          @click="active = active === range ? null : range"
        >
          {{ range }} <sup>{{ countFor(range) }}</sup>
        </button>
      </div>

      <!-- La clé sur le filtre force le remount des cartes : la révélation
           v-reveal rejoue sur la nouvelle sélection. -->
      <div class="projects-grid" :key="active ?? 'all'">
        <DrinkCard v-for="drink in filtered" :key="drink.slug" :drink="drink" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'La gamme — Luméa' })

const active = ref<string | null>(null)

const filtered = computed(() =>
  active.value ? drinks.filter((d) => d.range === active.value) : drinks
)

function countFor(range: string) {
  return drinks.filter((d) => d.range === range).length
}
</script>

<style scoped>
.page-head {
  padding-block: calc(var(--header-h) + 6rem) var(--sp-5);
}
</style>
