<template>
  <div>
    <section class="container page-head">
      <p class="eyebrow" v-reveal>Fabrication</p>
      <h1 v-lines="0.05" style="font-size: var(--fs-hero); margin-top: 1.5rem">
        <span class="line-mask"><span>Du verger</span></span>
        <span class="line-mask"><span>au <em>verre</em></span></span>
        <span class="line-mask"><span>en 48 h</span></span>
      </h1>
      <p class="lead" v-reveal="0.4" style="margin-top: 2rem">
        Pas d’usine, pas d’entrepôt : un seul bâtiment quai Rambaud, et un chrono qui démarre
        quand le fruit arrive. Faites défiler, on vous montre.
      </p>
    </section>

    <!-- Les six étapes en frise horizontale, compteur d'heures en tête. -->
    <FabricationChrono />

    <MarqueeBand :items="['Cueillir', 'Presser', 'Remplir', 'Sceller', 'Reposer', 'Livrer']" :speed="26" />

    <!-- Ce qui n'entre jamais dans l'atelier, barré au scroll. -->
    <FabricationRefus />

    <!-- La bouteille finie, qui tourne au scroll (même composant que Comète sur l'accueil). -->
    <BottleScroll :src="bottleVideo" :poster="bottlePoster">
      <div class="container fab-copy" v-reveal>
        <p class="eyebrow">Le contenant</p>
        <h2>Un verre qu’on reprend, une étiquette qui part au lavage.</h2>
        <p class="fab-copy__body">
          Rapportée en point de vente, la bouteille revient à l’atelier : relavée, contrôlée,
          remplie à nouveau. L’étiquette monomatière se détache sans laisser de colle.
        </p>
        <ul class="fab-copy__tags">
          <li>Verre consigné</li>
          <li>Monomatière</li>
          <li>6 semaines au frais</li>
        </ul>
        <NuxtLink to="/savoir-faire" class="btn btn--ghost fab-copy__cta" v-magnetic>
          <span>Voir le savoir-faire</span>
        </NuxtLink>
      </div>
    </BottleScroll>

    <!-- Fiche technique et suite du parcours. -->
    <section class="section container fab-end">
      <div class="fab-end__cta">
        <p class="eyebrow" v-reveal>Et maintenant</p>
        <h2 v-reveal="0.05">Goûter le résultat</h2>
        <NuxtLink to="/coffret" class="btn" v-magnetic v-reveal="0.1">
          <span>Composer un coffret</span>
        </NuxtLink>
      </div>
      <div>
        <h2 class="eyebrow" v-reveal>Sur une bouteille</h2>
        <ul class="specs" v-reveal="0.05">
          <li v-for="spec in specs" :key="spec.label">
            <span>{{ spec.label }}</span>
            <span class="specs__value">{{ spec.value }}</span>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// ---------------------------------------------------------------------------
// /fabrication, en quatre temps : le chrono des 48 heures (FabricationChrono), ce
// qui n'entre jamais dans l'atelier (FabricationRefus), la bouteille finie qui
// tourne au scroll (BottleScroll), puis la fiche technique.
//
// La vidéo est une orbite MiniMax préparée par scripts/bottle-video.py (fond cuit à
// la couleur du site). Le flacon n'est pas un parfum du catalogue : le texte parle
// du contenant, jamais d'un fruit, pour ne pas laisser croire qu'il est en vente.
// ---------------------------------------------------------------------------

import bottleVideo from '~/components/minimaxH3/bottle/web/fabrication-watermelon.mp4'
import bottlePoster from '~/components/minimaxH3/bottle/web/fabrication-watermelon-poster.jpg'

useHead({ title: 'Fabrication — Luméa' })

const specs = [
  { label: 'Du fruit au carton', value: '48 h' },
  { label: 'Rayon d’approvisionnement', value: '200 km' },
  { label: 'Température de remplissage', value: '4 °C' },
  { label: 'Conservation', value: '6 semaines' },
  { label: 'Verre', value: '100 % consigné' },
  { label: 'Étiquette', value: 'Monomatière' }
]
</script>

<style scoped>
.page-head {
  padding-block: calc(var(--header-h) + 6rem) var(--sp-4);
}
.page-head em {
  font-style: normal;
  color: var(--accent);
}

/* --- la bouteille ------------------------------------------------------------- */
/* La largeur de lecture est sur les enfants, pas sur .fab-copy : c'est un .container,
   qui se centrerait s'il était rétréci, et le texte passerait sur la bouteille. */
.fab-copy {
  display: grid;
  gap: var(--sp-3);
  justify-items: start;
}
.fab-copy > * {
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

/* --- fin de page ---------------------------------------------------------------- */
.fab-end {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(2rem, 6vw, 6rem);
  align-items: start;
}
.fab-end__cta {
  display: grid;
  justify-items: start;
  gap: var(--sp-3);
}
.fab-end__cta h2 {
  font-size: var(--fs-h1);
}
.specs {
  margin-top: 1.5rem;
  font-family: var(--font-mono);
  font-size: 0.85rem;
}
.specs li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-block: 0.85rem;
  border-bottom: 1px solid var(--line);
  color: var(--ink-soft);
}
.specs__value {
  color: var(--ink);
}
@media (max-width: 800px) {
  .fab-end {
    grid-template-columns: 1fr;
  }
}
</style>
