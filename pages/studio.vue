<template>
  <div>
    <section class="container page-head">
      <p class="eyebrow" v-reveal>Le studio</p>
      <h1 v-lines="0.05" style="font-size: var(--fs-hero); margin-top: 1.5rem">
        <span class="line-mask"><span>Onze</span></span>
        <span class="line-mask"><span>personnes</span></span>
      </h1>
      <p class="lead" v-reveal="0.4" style="margin-top: 2rem">
        Un pressoir, une chambre froide et une grande table pour goûter. Luméa fabrique toutes
        ses boissons au même endroit, à {{ site.city }}.
      </p>
    </section>

    <section class="container section--tight">
      <div class="case-body">
        <div class="col-6 reveal-mask" v-reveal>
          <div v-parallax="12" class="parallax-pad">
            <BottleShot
              label="Atelier"
              src="/expertise/recette-1200.webp"
              alt="Fruits frais sur la table de l’atelier"
              ratio="4x5"
            />
          </div>
        </div>
        <div class="col-6 reveal-mask" v-reveal="0.1" style="align-self: end">
          <div v-parallax="-10" class="parallax-pad">
            <BottleShot
              label="Bouteilles"
              src="/expertise/packaging-1200.webp"
              alt="Bouteilles de l’atelier, étiquetées à la main"
              ratio="1x1"
            />
          </div>
        </div>
      </div>
    </section>

    <section class="section container manifesto-wrap">
      <ManifestoText
        text="On a commencé en 2024 avec 400 bouteilles et un four à étiquettes emprunté. On n’a jamais cherché à faire une boisson pour enfants : on a cherché à faire une bonne boisson, puis on a baissé la taille de la bouteille."
      />
    </section>

    <section class="night section">
      <div class="container">
        <p class="eyebrow">Ce à quoi on tient</p>
        <div class="values">
          <article v-for="value in values" :key="value.title" v-reveal>
            <h3>{{ value.title }}</h3>
            <p>{{ value.desc }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section container">
      <div class="section-head">
        <h2 style="font-size: var(--fs-h1)">Repères</h2>
      </div>
      <ul class="timeline">
        <li v-for="item in timeline" :key="item.year" v-reveal>
          <span class="timeline__year">{{ item.year }}</span>
          <span>{{ item.text }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Le studio — Luméa' })

const values = [
  {
    title: 'Le fruit d’abord',
    desc: 'Aucun arôme de synthèse, aucun colorant, aucun édulcorant. Si la couleur ne vient pas du fruit, elle ne vient pas.'
  },
  {
    title: 'Le verre, toujours',
    desc: '100 % de notre volume part en bouteille consignée, collectée dans nos 240 points de vente.'
  },
  {
    title: 'Parler aux enfants',
    desc: 'Sans licence, sans mascotte criarde. Un univers qu’ils reconnaissent de loin et que les parents veulent bien poser sur la table.'
  },
  {
    title: 'Tout faire ici',
    desc: 'Choisir les fruits, presser, goûter, mettre en bouteille : la même équipe, le même bâtiment, le même goût.'
  }
]

const timeline = [
  { year: '2024', text: 'Premières 400 bouteilles d’Aurore, produites à la Croix-Rousse.' },
  { year: '2025', text: 'Ouverture de l’atelier quai Rambaud, arrivée des gammes pétillantes.' },
  { year: '2026', text: 'Six parfums, 240 points de vente, et toujours zéro sucre ajouté.' }
]
</script>

<style scoped>
.page-head {
  padding-block: calc(var(--header-h) + 6rem) var(--sp-5);
}
.parallax-pad {
  padding-block: 7%;
  margin-block: -7%;
}
.manifesto-wrap {
  display: grid;
  justify-items: start;
}
.values {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--sp-4);
  margin-top: var(--sp-4);
}
.values h3 {
  font-size: 1.5rem;
  margin-bottom: 0.9rem;
}
.values p {
  color: var(--on-night-soft);
}
.timeline li {
  display: grid;
  grid-template-columns: 6rem 1fr;
  gap: var(--sp-3);
  padding-block: 1.6rem;
  border-top: 1px solid var(--line);
  font-size: var(--fs-lead);
  letter-spacing: -0.01em;
}
.timeline__year {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  color: var(--ink-soft);
}
</style>
