<template>
  <div>
    <section class="container page-head">
      <p class="eyebrow" v-reveal>Savoir-faire</p>
      <h1 v-lines="0.05" style="font-size: var(--fs-hero); margin-top: 1.5rem">
        <span class="line-mask"><span>Que du</span></span>
        <span class="line-mask"><span><em>fruit</em></span></span>
      </h1>
      <p class="lead" v-reveal="0.4" style="margin-top: 2rem">
        Pas de sucre ajouté, pas d’arôme, pas de colorant : une bouteille Luméa, c’est un fruit
        pressé qu’on a mis au frais. Voilà ce que ça change.
      </p>
    </section>

    <section class="night section">
      <div class="container">
        <ExpertiseList />
      </div>
    </section>

    <section class="section container">
      <div class="method">
        <article v-for="(step, i) in method" :key="step.title" class="method__step" v-reveal>
          <span class="method__idx">0{{ i + 1 }}</span>
          <h3>{{ step.title }}</h3>
          <p class="muted">{{ step.desc }}</p>
        </article>
      </div>
    </section>

    <MarqueeBand :items="['Que du fruit', 'Pressé à froid', 'Zéro sucre ajouté', 'Bien frais']" :speed="24" />

    <section class="section container">
      <div class="section-head">
        <h2 style="font-size: var(--fs-h1)">Six fruits, six bouteilles</h2>
        <p class="muted" style="max-width: 40ch">
          Mangue, fraise, pomme, myrtille, pêche… Chaque parfum part d’un fruit (parfois deux),
          et de rien d’autre.
        </p>
      </div>

      <div class="projects-grid">
        <NuxtLink
          v-for="drink in drinks"
          :key="drink.slug"
          :to="`/boissons/${drink.slug}`"
          class="fruit-card"
          data-cursor="Voir"
          v-reveal
        >
          <div class="reveal-mask">
            <BottleShot
              :label="drink.name"
              :src="drink.render"
              :color="drink.color"
              :color2="drink.color2"
              ratio="1x1"
              :alt="`Bouteille Luméa ${drink.name}`"
              :filter="drink.renderFilter"
            />
          </div>
          <p class="fruit-card__name">{{ drink.name }}</p>
          <p class="muted fruit-card__fruit">{{ drink.fruit }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Savoir-faire — Luméa' })

const method = [
  {
    title: 'Choisir',
    desc: 'Des fruits mûrs et de saison, cueillis à moins de 200 km. Un fruit qui a mûri au soleil n’a besoin de rien d’autre.'
  },
  {
    title: 'Presser',
    desc: 'À froid, sans chauffer ni rien ajouter. Mise en bouteille dans les 48 heures.'
  },
  {
    title: 'Goûter',
    desc: 'Un panel d’enfants goûte chaque recette à l’aveugle. Aucune ne sort sans leur accord.'
  },
  {
    title: 'Savourer',
    desc: 'Bien frais, au goûter, au pique-nique ou au retour de l’école. Et la bouteille revient.'
  }
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
.method {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: var(--sp-4);
}
.method__step {
  border-top: 1px solid var(--line);
  padding-top: 1.5rem;
}
.method__idx {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  color: var(--ink-soft);
}
.method__step h3 {
  font-size: 1.6rem;
  margin-block: 1rem 0.8rem;
}
.fruit-card {
  display: grid;
  gap: 0.35rem;
}
.fruit-card__name {
  margin-top: 0.9rem;
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
}
.fruit-card__fruit {
  font-size: 0.9rem;
}
</style>
