<template>
  <div class="err">
    <div class="container">
      <p class="eyebrow">Erreur {{ error?.statusCode }}</p>
      <h1 class="err__title">
        {{ error?.statusCode === 404 ? 'Bouteille introuvable' : 'Quelque chose a débordé' }}
      </h1>
      <p class="lead" style="margin-top: 1.5rem">
        {{
          error?.statusCode === 404
            ? 'Cette page n’existe pas (ou plus). La gamme complète est juste là.'
            : 'Une erreur inattendue s’est produite. Réessayez dans un instant.'
        }}
      </p>
      <button class="btn" style="margin-top: 2.5rem" @click="handleError">
        <span>Retour à l’accueil</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{ error: NuxtError }>()

// clearError remet l'app dans un état sain et navigue : préférable à un
// simple <NuxtLink>, qui laisserait l'erreur en place.
const handleError = () => clearError({ redirect: '/' })
</script>

<style scoped>
.err {
  min-height: 100svh;
  display: grid;
  align-content: center;
  background: var(--night);
  color: var(--on-night);
}
.err .eyebrow {
  color: var(--on-night-soft);
}
.err__title {
  font-size: var(--fs-giant);
  text-transform: uppercase;
  margin-top: 1.5rem;
}
.err .lead {
  color: var(--on-night-soft);
}
</style>
