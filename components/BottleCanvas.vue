<template>
  <div class="bottle3d">
    <BottleStage
      class="bottle3d__stage"
      :color="color"
      :color2="color2"
      :name="label"
      :progress="1"
      :distance="8.4"
    />
    <p v-if="note" class="bottle3d__note">modèle procédural · glb à venir</p>
  </div>
</template>

<script setup lang="ts">
// ---------------------------------------------------------------------------
// Bouteille du hero : le même décor et le même modèle que la page fabrication,
// figés sur une bouteille finie. Le module @tresjs/nuxt se charge de ne monter
// le canvas que côté client, il n'y a donc rien à envelopper à la main.
// ---------------------------------------------------------------------------

withDefaults(
  defineProps<{
    label?: string
    color?: string
    color2?: string
    /** Affiche la mention « modèle procédural » tant qu'aucun glb n'est fourni. */
    note?: boolean
  }>(),
  { label: 'Luméa', color: '#ff8a3d', color2: '#ffd166', note: false }
)
</script>

<style scoped>
.bottle3d {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
}
.bottle3d__stage {
  width: 100%;
  height: 100%;
}
.bottle3d__note {
  position: absolute;
  left: 0;
  bottom: 0;
  font-family: var(--font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-soft);
  opacity: 0.55;
}
</style>
