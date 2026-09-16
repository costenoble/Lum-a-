<template>
  <div>
    <section class="container page-head">
      <p class="eyebrow" v-reveal>Savoir-faire</p>
      <h1 v-lines="0.05" style="font-size: var(--fs-hero); margin-top: 1.5rem">
        <span class="line-mask"><span>De la recette</span></span>
        <span class="line-mask"><span>au <em>render</em></span></span>
      </h1>
      <p class="lead" v-reveal="0.4" style="margin-top: 2rem">
        Cinq métiers dans une même pièce. C’est la raison pour laquelle une bouteille Luméa
        ressemble à ce qu’elle a le goût d’être.
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

    <MarqueeBand :items="['Recette', 'Direction artistique', 'Packaging', 'Image 3D']" :speed="24" />

    <section class="section container">
      <div class="section-head">
        <h2 style="font-size: var(--fs-h1)">Les rendus 3D</h2>
        <p class="muted" style="max-width: 40ch">
          Chaque parfum est modélisé sous Blender avant d’être produit : étiquette, condensation,
          verre teinté. Les images ci-dessous sont les emplacements attendus dans
          <code>/public/renders/</code>.
        </p>
      </div>

      <div class="projects-grid">
        <div v-for="drink in drinks" :key="drink.slug" class="reveal-mask" v-reveal>
          <BottleShot
            :label="drink.name"
            :src="drink.render"
            :color="drink.color"
            :color2="drink.color2"
            ratio="1x1"
            :alt="`Render 3D ${drink.name}`"
            :filter="drink.renderFilter"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Savoir-faire — Luméa' })

const method = [
  {
    title: 'Goûter',
    desc: 'Un panel de vingt enfants teste chaque piste à l’aveugle. Aucune recette ne sort sans leur accord.'
  },
  {
    title: 'Presser',
    desc: 'Pressage à froid dans un rayon de 200 km, mise en bouteille sous 48 h.'
  },
  {
    title: 'Dessiner',
    desc: 'Une étiquette par parfum, une seule typographie, une couleur qui vient du fruit lui-même.'
  },
  {
    title: 'Rendre',
    desc: 'Modélisation et éclairage sous Blender : la photo produit existe avant le produit.'
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
code {
  font-family: var(--font-mono);
  font-size: 0.85em;
}
</style>
