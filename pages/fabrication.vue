<template>
  <div>
    <section class="container page-head">
      <p class="eyebrow" v-reveal>Fabrication</p>
      <h1 v-lines="0.05" style="font-size: var(--fs-hero); margin-top: 1.5rem">
        <span class="line-mask"><span>Trois vues,</span></span>
        <span class="line-mask"><span>un seul <em>geste</em></span></span>
      </h1>
      <p class="lead" v-reveal="0.4" style="margin-top: 2rem">
        Faites défiler : la bouteille tourne sur elle-même, du bouchon à la base. Deux étapes
        de sa fabrication, vues sous tous les angles.
      </p>
    </section>

    <!-- Vol scrollé à travers deux orbites de bouteille — voir FabricationFlight.vue. -->
    <FabricationFlight />

    <!-- Le détail, une fois la démonstration faite. -->
    <section class="section container">
      <div class="case-body">
        <div class="col-7">
          <p v-for="(para, i) in copy" :key="i" class="story" v-reveal>{{ para }}</p>
        </div>
        <div class="col-5">
          <h2 class="eyebrow" v-reveal>Sur une bouteille</h2>
          <ul class="specs" v-reveal="0.05">
            <li v-for="spec in specs" :key="spec.label">
              <span>{{ spec.label }}</span>
              <span class="specs__value">{{ spec.value }}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <MarqueeBand :items="['Presser', 'Remplir', 'Étiqueter', 'Sceller']" :speed="26" />

    <section class="section container cta-block">
      <h2 v-reveal style="font-size: var(--fs-h1)">Goûter le résultat</h2>
      <NuxtLink to="/coffret" class="btn" v-magnetic v-reveal="0.05">
        <span>Composer un coffret</span>
      </NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Fabrication — Luméa' })

const copy = [
  'Tout tient dans un bâtiment unique du quai Rambaud : le pressoir, la table à dessin, la salle de rendu. Une bouteille passe des fruits au carton en moins de deux jours.',
  'On a renoncé à la pasteurisation haute température, qui aurait allongé la conservation mais aplati le goût. Nos bouteilles se gardent six semaines au frais — c’est un choix, pas une contrainte subie.'
]

const specs = [
  { label: 'Verre', value: '100 % consigné' },
  { label: 'Étiquette', value: 'Monomatière' },
  { label: 'Du fruit au carton', value: '48 h' },
  { label: 'Conservation', value: '6 semaines' },
  { label: 'Rayon d’approvisionnement', value: '200 km' }
]
</script>

<style scoped>
.page-head {
  padding-block: calc(var(--header-h) + 6rem) var(--sp-5);
}
.page-head em {
  font-style: normal;
  color: var(--accent);
}

/* --- suite de page -------------------------------------------------------- */
.story {
  font-size: var(--fs-lead);
  line-height: 1.45;
  letter-spacing: -0.01em;
}
.story + .story {
  margin-top: 1.5rem;
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
.cta-block {
  display: grid;
  justify-items: start;
  gap: var(--sp-3);
}
</style>
