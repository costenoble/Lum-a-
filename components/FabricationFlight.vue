<template>
  <div>
    <!-- Deux bouteilles, deux blocs BottleScroll indépendants, l'un après l'autre dans
         le flux normal de la page : dès que le premier relâche son épinglage, le second
         prend la main sans rien entre les deux — même mécanique que la bouteille Comète
         de l'accueil, ici enchaînée deux fois. -->
    <BottleScroll :src="bananaVideo" :poster="bananaPoster">
      <div class="container fab-copy" v-reveal>
        <p class="eyebrow">01 · Pressage à froid</p>
        <h2>Le fruit passe sous la presse, jamais sous la flamme.</h2>
        <p class="fab-copy__body">
          Rien n’est chauffé, rien n’est ajouté. Chaque fruit vient d’un rayon de 200 km et
          file en bouteille dans les 48 heures.
        </p>
        <ul class="fab-copy__tags">
          <li>Pressage à froid</li>
          <li>200 km</li>
          <li>Sans additif</li>
        </ul>
      </div>
    </BottleScroll>

    <BottleScroll :src="watermelonVideo" :poster="watermelonPoster">
      <div class="container fab-copy" v-reveal>
        <p class="eyebrow">02 · Verre et bouchon</p>
        <h2>Un bouchon de liège, un verre qu’on reprend.</h2>
        <p class="fab-copy__body">
          L’étiquette est monomatière, le verre consigné. La bouteille se garde six
          semaines au frais — un choix, pas une contrainte subie.
        </p>
        <ul class="fab-copy__tags">
          <li>Verre consigné</li>
          <li>Monomatière</li>
          <li>6 semaines</li>
        </ul>
        <NuxtLink to="/savoir-faire" class="btn btn--ghost fab-copy__cta" v-magnetic>
          <span>Voir le savoir-faire</span>
        </NuxtLink>
      </div>
    </BottleScroll>
  </div>
</template>

<script setup lang="ts">
// ---------------------------------------------------------------------------
// Deux orbites de bouteille (générées avec MiniMax H3, fournies par le client
// dans components/minimaxH3/bottle/lumea-scroll/), préparées par
// scripts/bottle-video.py comme la bouteille Comète de l'accueil — même
// composant (BottleScroll, devenu un composant à propriété pour l'occasion),
// texte à gauche et bouteille à droite, exactement le même principe.
//
// Essayé puis abandonné : un moteur plein écran emprunté (« scroll-world »,
// texte en surimpression sur une vidéo bord à bord, navigation à points,
// fondu enchaîné vidéo entre les deux bouteilles). Le rendu ne convainquait
// pas à l'usage et rendait la coupure entre les deux vidéos peu lisible —
// retiré du projet (voir l'historique Git), retour à BottleScroll.
//
// Les deux flacons (banane, pastèque) sont des essais MiniMax, pas des
// parfums du catalogue (Solaire, Comète, Prairie, Lagon, Nuage, Aurore) :
// le texte reste volontairement centré sur le geste de fabrication (pressage,
// mise en bouteille), jamais sur le nom du fruit, pour ne pas laisser croire
// que ce sont des parfums en vente.
// ---------------------------------------------------------------------------

import bananaVideo from '~/components/minimaxH3/bottle/web/fabrication-banana.mp4'
import bananaPoster from '~/components/minimaxH3/bottle/web/fabrication-banana-poster.jpg'
import watermelonVideo from '~/components/minimaxH3/bottle/web/fabrication-watermelon.mp4'
import watermelonPoster from '~/components/minimaxH3/bottle/web/fabrication-watermelon-poster.jpg'
</script>

<style scoped>
.fab-copy {
  display: grid;
  gap: var(--sp-3);
  justify-items: start;
  max-width: 34ch;
}
.fab-copy h2 {
  font-size: var(--fs-h2);
  line-height: 1.1;
}
.fab-copy__body {
  color: var(--ink-soft);
  font-size: 1.05rem;
  line-height: 1.5;
}
.fab-copy__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
.fab-copy__tags li {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  background: var(--paper-2);
  color: var(--ink-soft);
}
.fab-copy__cta {
  pointer-events: auto;
}
</style>
