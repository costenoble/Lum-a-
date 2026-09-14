<template>
  <div>
    <!-- HERO -->
    <section class="hero container">
      <p class="eyebrow" v-reveal>Marque de boissons · {{ site.city }} · Depuis {{ site.since }}</p>

      <h1 class="hero__title" v-lines="0.1" style="margin-top: 2rem">
        <span class="line-mask"><span>Boissons</span></span>
        <span class="line-mask"><span><em>lumineuses</em></span></span>
        <span class="line-mask"><span>pour les petits</span></span>
      </h1>

      <!-- Bouteille 3D : purement décorative. @tresjs/nuxt ne monte le canvas
           que côté client, le rendu serveur n'en contient rien. -->
      <div class="hero__bottle">
        <BottleCanvas :label="hero.name" :color="hero.color" :color2="hero.color2" />
      </div>

      <div class="hero__bottom">
        <p class="lead" v-reveal="0.5">
          Six parfums pressés à froid, zéro sucre ajouté, et un univers dessiné pour que
          l’heure du goûter ressemble à quelque chose.
        </p>
        <div class="hero__aside">
          <!-- Rempli après l'hydratation : l'heure du serveur n'est pas celle
               du visiteur, la rendre au SSR provoquerait un écart. -->
          <p v-if="now" class="hero__now">{{ now }} · {{ moment }}</p>
          <span class="hero__scroll" v-reveal="0.7">Faites défiler <i /></span>
        </div>
      </div>
    </section>

    <MarqueeBand
      :items="['Sans sucres ajoutés', 'Verre consigné', 'Fruits français', 'Dès 2 ans']"
    />

    <!-- MANIFESTE -->
    <section class="section container manifesto-wrap">
      <p class="eyebrow" v-reveal>La marque</p>
      <ManifestoText
        text="Luméa fabrique des boissons que les enfants réclament et que les parents acceptent. Pas de sucre ajouté, pas de colorant, pas de personnage sous licence. Juste du fruit, du verre, et une lumière qu’on a mis deux ans à trouver."
      />
      <NuxtLink to="/studio" class="btn btn--ghost" v-magnetic v-reveal="0.1">
        <span>Découvrir le studio</span>
      </NuxtLink>
    </section>

    <!-- LES SIX PARFUMS — carrousel accordéon -->
    <section class="section container">
      <div class="section-head">
        <h2 style="font-size: var(--fs-h1)">Les six parfums</h2>
        <NuxtLink to="/boissons" class="link-under eyebrow-link">Toute la gamme ↗</NuxtLink>
      </div>

      <ExpandingCarousel :items="carouselItems" />
    </section>

    <!-- TROIS EN AVANT -->
    <section class="section container">
      <div class="section-head">
        <p class="eyebrow">Nouveautés 2026</p>
      </div>

      <div class="projects-stack projects-stack--featured">
        <DrinkCard
          v-for="(drink, i) in featured"
          :key="drink.slug"
          :drink="drink"
          :ratio="i === 1 ? '4x5' : '3x2'"
        />
      </div>
    </section>

    <!-- SAVOIR-FAIRE -->
    <section class="night section">
      <div class="container">
        <div class="section-head">
          <p class="eyebrow">Savoir-faire</p>
          <p class="lead" style="max-width: 34ch">
            De la recette au render 3D, tout se décide dans le même atelier.
          </p>
        </div>
        <ExpertiseList />
      </div>
    </section>

    <!-- CHIFFRES + DISTINCTIONS -->
    <section class="section container">
      <div class="stats">
        <StatCounter
          v-for="s in stats"
          :key="s.label"
          :value="s.value"
          :suffix="s.suffix"
          :label="s.label"
        />
      </div>

      <ul class="awards-list" style="margin-top: var(--sp-5)">
        <li v-for="a in awards" :key="a.name + a.year" v-reveal>
          <span>{{ a.name }}</span>
          <span class="muted">{{ a.category }}</span>
          <span>{{ a.year }}</span>
        </li>
      </ul>
    </section>

    <!-- ATELIER -->
    <section class="section container studio-teaser">
      <div class="studio-teaser__media reveal-mask" v-reveal>
        <div v-parallax="14">
          <BottleShot
            label="Atelier"
            alt="L’atelier Luméa"
            color="#2fc4c0"
            color2="#ffd166"
            ratio="4x5"
          />
        </div>
      </div>

      <div class="studio-teaser__text">
        <p class="eyebrow" v-reveal>L’atelier</p>
        <h2 v-reveal="0.05" style="font-size: var(--fs-h1); margin-block: 1.5rem">
          Onze personnes, un pressoir, une salle de rendu.
        </h2>
        <p class="muted" v-reveal="0.1">
          Luméa est né en 2024 à la Croix-Rousse, entre un atelier de jus et un studio d’image.
          On formule, on dessine, on modélise et on photographie tout au même endroit — c’est ce
          qui donne à la gamme son air de famille.
        </p>
        <NuxtLink to="/studio" class="btn" v-magnetic v-reveal="0.15" style="margin-top: 2rem">
          <span>Notre histoire</span>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Luméa — Boissons lumineuses pour les petits' })

const featured = computed(() => drinks.slice(0, 3))

// Parfum mis en scène en 3D dans le hero.
const hero = drinks[0]!

// Heure locale du visiteur : la bouteille 3D s'éclaire au même barème.
const now = ref('')
const moment = ref('')
onMounted(() => {
  const tick = () => {
    now.value = formatLocalTime()
    moment.value = timeOfDay().moment
  }
  tick()
  const id = window.setInterval(tick, 60_000)
  onUnmounted(() => window.clearInterval(id))
})

// Les six parfums pour le carrousel accordéon : même source de données que
// partout ailleurs, donc les renders Blender arriveront ici sans rien changer.
const carouselItems = computed(() =>
  drinks.map((drink) => ({
    id: drink.slug,
    title: drink.name,
    subtitle: drink.fruit,
    alt: `Bouteille Luméa ${drink.name}`,
    render: drink.render,
    color: drink.color,
    color2: drink.color2,
    to: `/boissons/${drink.slug}`
  }))
)
</script>

<style scoped>
/* La bouteille occupe la droite du hero, sous le titre dans l'ordre de
   superposition : le texte reste toujours lisible par-dessus. */
.hero {
  position: relative;
}
.hero__bottle {
  position: absolute;
  top: 46%;
  right: calc(var(--pad-inline) - 2vw);
  translate: 0 -50%;
  width: min(28vw, 360px);
  z-index: 0;
  pointer-events: none;
}
.hero__aside {
  display: grid;
  justify-items: end;
  gap: 0.9rem;
  text-align: right;
}
.hero__now {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
}
.hero__title,
.hero__bottom,
.hero .eyebrow {
  position: relative;
  z-index: 1;
}
@media (max-width: 900px) {
  .hero__bottle {
    position: static;
    translate: none;
    width: 70%;
    margin: 2rem auto 0;
  }
}
.manifesto-wrap {
  display: grid;
  gap: var(--sp-4);
  justify-items: start;
}
.eyebrow-link {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.studio-teaser {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  gap: clamp(2rem, 6vw, 5rem);
  align-items: center;
}
/* Le parallaxe déborde volontairement du masque : on donne de la marge. */
.studio-teaser__media > div {
  padding-block: 8%;
  margin-block: -8%;
}
@media (max-width: 900px) {
  .studio-teaser {
    grid-template-columns: 1fr;
  }
}
</style>
