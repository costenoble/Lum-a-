<template>
  <div>
    <section class="container page-head">
      <p class="eyebrow" v-reveal>Fabrication</p>
      <h1 v-lines="0.05" style="font-size: var(--fs-hero); margin-top: 1.5rem">
        <span class="line-mask"><span>Traversée</span></span>
        <span class="line-mask"><span>du <em>verger</em></span></span>
      </h1>
      <p class="lead" v-reveal="0.4" style="margin-top: 2rem">
        Faites défiler : la caméra avance, sans jamais s'arrêter, au milieu des fruits.
        Un seul plan continu — ce qui passe trop près sort de la mise au point.
      </p>
    </section>

    <!-- La scène occupe tout l'écran ; les légendes suivent l'avancement. -->
    <FabricationScene @progress="onProgress">
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

const steps = [
  {
    title: 'Entrée',
    desc: 'On s’avance dans le couloir. Les premiers fruits passent tout près de l’objectif, hors de la zone de netteté.'
  },
  {
    title: 'À hauteur de fruit',
    desc: 'Chaque fruit traverse le champ à son tour : nervures de la banane, grains de la fraise, taches de maturité.'
  },
  {
    title: 'Au cœur',
    desc: 'Le défilement porte au milieu du couloir. Devant, derrière, la profondeur se lit d’un seul coup d’œil.'
  },
  {
    title: 'Sortie',
    desc: 'La traversée s’achève, les derniers fruits s’écartent et laissent le passage.'
  }
]

// Les bornes suivent les points de passage de la spline caméra (BananaStage).
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
