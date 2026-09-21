<template>
  <div>
    <section class="container page-head">
      <p class="eyebrow" v-reveal>Fabrication</p>
      <h1 v-lines="0.05" style="font-size: var(--fs-hero); margin-top: 1.5rem">
        <span class="line-mask"><span>Le monde</span></span>
        <span class="line-mask"><span>des saveurs <em>magiques</em></span></span>
      </h1>
      <p class="lead" v-reveal="0.4" style="margin-top: 2rem">
        Faites défiler : on s’envole vers la Source, là où les fruits deviennent des boissons
        lumineuses. Quatre gestes, quarante-huit heures.
      </p>
    </section>

    <!-- La scène occupe tout l'écran ; la carte de légende suit l'avancement. -->
    <FabricationScene :rest-progress="0" @progress="onProgress">
      <div class="steps">
        <div class="steps__card">
          <p class="steps__index" aria-hidden="true">
            {{ String(currentStep + 1).padStart(2, '0') }} / 04 —
            {{ String(hours).padStart(2, '0') }} h / 48 h
          </p>

          <div class="steps__stack">
            <div
              v-for="(step, i) in steps"
              :key="step.title"
              class="steps__item"
              :class="{ 'is-on': i === currentStep }"
            >
              <div class="steps__who" aria-hidden="true">
                <FruitBuddy :kind="step.kind" pose="wave" :delay="i * 0.4" class="steps__avatar" />
                <span>{{ step.who }}</span>
              </div>
              <div>
                <h2 class="steps__title">{{ step.title }}</h2>
                <p class="steps__desc">{{ step.desc }}</p>
              </div>
            </div>
          </div>

          <div class="steps__track" aria-hidden="true">
            <span class="steps__bar" :style="{ transform: `scaleX(${progress})` }" />
          </div>
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

// Un personnage par geste : chacun vient de la boisson dont il porte l'emblème.
const steps = ([
  {
    kind: 'solaire',
    title: 'Presser',
    desc: 'Mangue et abricot passent sous la presse, à froid. Rien n’est chauffé, rien n’est ajouté.'
  },
  {
    kind: 'lagon',
    title: 'Remplir',
    desc: 'Le jus coule directement dans le verre consigné. Pas de pasteurisation haute température : le goût reste entier.'
  },
  {
    kind: 'nuage',
    title: 'Étiqueter',
    desc: 'La presse s’efface, l’étiquette se pose. Monomatière : une seule matière, donc un seul geste de tri.'
  },
  {
    kind: 'comete',
    title: 'Sceller',
    desc: 'Le bouchon se referme et la bouteille part au frais. Elle se garde six semaines.'
  }
] as const).map((step) => ({ ...step, who: useDrink(step.kind)?.name ?? '' }))

// Une étape par quart de défilement.
const BOUNDS = [0, 0.25, 0.5, 0.75]

const progress = ref(0)
const hours = computed(() => Math.round(progress.value * 48))
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

/* --- carte de légende, posée sur le ciel ---------------------------------- */
/* En haut à gauche : le bas de l'écran appartient à la prairie et à ses habitants.
   Le fond papier garde le texte lisible, quoi qu'il y ait derrière. */
.steps {
  position: absolute;
  inset-inline: 0;
  top: calc(var(--header-h) + 1rem);
  padding-inline: var(--pad-inline);
  max-width: var(--container);
  margin-inline: auto;
  pointer-events: none;
}
.steps__card {
  width: min(27rem, 100%);
  padding: 1.1rem 1.3rem 1.25rem;
  background: rgba(243, 242, 239, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 22px;
  box-shadow: 0 10px 40px rgba(58, 20, 102, 0.2);
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
  margin-top: 0.7rem;
  min-height: 8.6rem;
}
.steps__item {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: 4.6rem 1fr;
  gap: 1rem;
  align-items: start;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.45s var(--ease-soft), transform 0.6s var(--ease-soft);
}
.steps__item.is-on {
  opacity: 1;
  transform: translateY(0);
}
.steps__who {
  display: grid;
  justify-items: center;
  gap: 0.3rem;
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
.steps__avatar {
  width: 100%;
  height: auto;
}
.steps__title {
  font-size: clamp(1.7rem, 3.4vw, 2.4rem);
  text-transform: uppercase;
}
.steps__desc {
  margin-top: 0.5rem;
  color: var(--ink-soft);
  font-size: 0.92rem;
  line-height: 1.45;
}
.steps__track {
  margin-top: 1rem;
  height: 3px;
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
