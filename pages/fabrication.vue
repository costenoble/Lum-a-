<template>
  <div>
    <section class="container page-head">
      <p class="eyebrow" v-reveal>Fabrication</p>
      <h1 v-lines="0.05" style="font-size: var(--fs-hero); margin-top: 1.5rem">
        <span class="line-mask"><span>Quatre gestes,</span></span>
        <span class="line-mask"><span>une <em>bouteille</em></span></span>
      </h1>
      <p class="lead" v-reveal="0.4" style="margin-top: 2rem">
        Du fruit pressé à la capsule vissée. Faites défiler : la bouteille se fabrique
        sous vos yeux, en 3D, au rythme de votre scroll.
      </p>
    </section>

    <!-- La scène occupe tout l'écran ; les légendes suivent l'avancement. -->
    <FabricationScene
      :color="hero.color"
      :color2="hero.color2"
      :name="site.name"
      @progress="onProgress"
    >
      <div class="steps" aria-hidden="true">
        <p class="steps__index">{{ String(currentStep + 1).padStart(2, '0') }} / 04</p>

        <div class="steps__stack">
          <div
            v-for="(step, i) in steps"
            :key="step.title"
            class="steps__item"
            :class="{ 'is-on': i === currentStep }"
          >
            <h2 class="steps__title">{{ step.title }}</h2>
            <p class="steps__desc">{{ step.desc }}</p>
          </div>
        </div>

        <div class="steps__track">
          <span class="steps__bar" :style="{ transform: `scaleX(${progress})` }" />
        </div>
      </div>
    </FabricationScene>

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

const hero = drinks[0]!

const steps = [
  {
    title: 'Presser',
    desc: 'Les fruits arrivent entiers le matin et passent au pressoir dans la journée. Rien n’est chauffé, la couleur reste celle du fruit.'
  },
  {
    title: 'Remplir',
    desc: 'Mise en bouteille sous 48 h, à froid. Le niveau est calé au millimètre : une main de cinq ans doit pouvoir la tenir pleine.'
  },
  {
    title: 'Étiqueter',
    desc: 'Étiquette monomatière, encre végétale, collée sur un seul tour. Elle se retire d’un geste au retour de la consigne.'
  },
  {
    title: 'Sceller',
    desc: 'Capsule métal vissée, joint sans plastique. La bouteille repart en caisse consignée vers ses 240 points de vente.'
  }
]

// Les bornes suivent celles des gestes de FabricationScene.
const BOUNDS = [0, 0.28, 0.55, 0.78]

const progress = ref(0)
const currentStep = computed(() => {
  let index = 0
  BOUNDS.forEach((bound, i) => {
    if (progress.value >= bound) index = i
  })
  return index
})

function onProgress(value: number) {
  progress.value = value
}

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

/* --- légendes superposées à la séquence ----------------------------------- */
.steps {
  position: absolute;
  inset-inline: 0;
  bottom: clamp(2rem, 6vh, 4rem);
  padding-inline: var(--pad-inline);
  max-width: var(--container);
  margin-inline: auto;
  pointer-events: none;
}
.steps__index {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  color: var(--ink-soft);
}
/* Les quatre légendes sont empilées au même endroit : seule l'active est
   visible, ce qui évite tout saut de hauteur au changement d'étape. */
.steps__stack {
  position: relative;
  margin-top: 0.8rem;
  min-height: 9.5rem;
}
.steps__item {
  position: absolute;
  inset: 0;
  max-width: 42ch;
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 0.45s var(--ease-soft), transform 0.6s var(--ease-soft);
}
.steps__item.is-on {
  opacity: 1;
  transform: translateY(0);
}
.steps__title {
  font-size: clamp(2rem, 5vw, 3.6rem);
  text-transform: uppercase;
}
.steps__desc {
  margin-top: 0.8rem;
  color: var(--ink-soft);
  font-size: 0.98rem;
}
.steps__track {
  margin-top: 1.4rem;
  height: 2px;
  background: rgba(15, 15, 15, 0.12);
  border-radius: 999px;
  overflow: hidden;
}
.steps__bar {
  display: block;
  height: 100%;
  background: var(--accent);
  transform-origin: left;
  transform: scaleX(0);
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
