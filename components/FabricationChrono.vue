<template>
  <section ref="root" class="chrono">
    <div class="chrono__stage">
      <div class="container chrono__head">
        <div>
          <p class="eyebrow" v-reveal>Le chrono</p>
          <h2 class="chrono__title" v-reveal="0.05">48 heures, du verger au carton</h2>
        </div>

        <!-- Compteur : suit le défilement, heure par heure, d'une étape à l'autre.
             Décoratif (chaque carte porte déjà son heure), donc caché aux lecteurs d'écran. -->
        <p class="chrono__clock" aria-hidden="true">
          <span ref="clockEl">00</span><small>h</small>
        </p>
      </div>

      <div class="container chrono__meter" aria-hidden="true">
        <span ref="barEl" class="chrono__bar" />
      </div>

      <ol ref="track" class="chrono__track">
        <li
          v-for="(step, i) in steps"
          :key="step.title"
          class="chrono__card"
          :class="{ 'is-on': i === 0 }"
          :style="{ '--c': step.drink.color, '--c2': step.drink.color2 }"
        >
          <div class="chrono__text">
            <div class="chrono__top">
              <span class="chrono__hour">H+{{ pad(step.hour) }}</span>
              <span class="chrono__num" aria-hidden="true">{{ pad(i + 1) }}</span>
            </div>
            <div>
              <p class="chrono__step">{{ step.title }}</p>
              <h3 class="chrono__headline">{{ step.headline }}</h3>
              <p class="chrono__body">{{ step.text }}</p>
            </div>
          </div>

          <div class="chrono__media">
            <BottleShot
              :label="step.drink.name"
              :src="step.drink.render"
              :color="step.drink.color"
              :color2="step.drink.color2"
              :filter="step.drink.renderFilter"
              :alt="`${step.title} — bouteille Luméa ${step.drink.name}`"
              sizes="(max-width: 900px) 90vw, 440px"
            />
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Drink } from '~/composables/useSite'

// ---------------------------------------------------------------------------
// Les six étapes de fabrication, en frise horizontale. Sur grand écran, la zone
// est haute et sa scène collante (même mécanique que HeroVideo et BottleScroll) :
// le défilement vertical fait glisser les cartes de droite à gauche, et le
// compteur passe de 00 h à 48 h au rythme des étapes.
//
// Sur téléphone et en mouvement réduit, pas de frise : les cartes s'empilent
// simplement, chacune avec son heure.
// ---------------------------------------------------------------------------

const steps = fabricationSteps.map((step) => ({
  ...step,
  drink: drinks.find((d) => d.slug === step.drink) as Drink
}))
const HOURS = steps.map((s) => s.hour)
const LAST_HOUR = HOURS[HOURS.length - 1]!

/** Pixels de défilement vertical par pixel de glisse : > 1 laisse le temps de lire. */
const PACE = 1

const pad = (n: number) => String(n).padStart(2, '0')

const { $reduceMotion } = useNuxtApp()

const root = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)
const clockEl = ref<HTMLElement | null>(null)
const barEl = ref<HTMLElement | null>(null)

let mm: gsap.MatchMedia | null = null

onMounted(() => {
  if ($reduceMotion) return

  mm = gsap.matchMedia()
  mm.add('(min-width: 900px)', () => {
    const el = root.value
    const tr = track.value
    if (!el || !tr) return
    const cards = [...tr.children] as HTMLElement[]

    // La classe change la mise en page : les mesures ne se prennent qu'après.
    el.classList.add('is-rail')

    /** Glisse totale : amener la dernière carte là où était la première. */
    const distance = () => cards[cards.length - 1]!.offsetLeft - cards[0]!.offsetLeft
    const size = () => {
      el.style.height = `${window.innerHeight + distance() * PACE}px`
    }
    size()
    // Avant tout recalcul de ScrollTrigger (redimensionnement…), la zone reprend la
    // bonne hauteur : sinon les sections suivantes seraient mesurées à l'ancienne.
    ScrollTrigger.addEventListener('refreshInit', size)

    let active = 0
    const show = (p: number) => {
      const f = p * (cards.length - 1)
      const i = Math.min(cards.length - 2, Math.floor(f))
      const hour = HOURS[i]! + (HOURS[i + 1]! - HOURS[i]!) * (f - i)
      if (clockEl.value) clockEl.value.textContent = pad(Math.round(hour))
      if (barEl.value) barEl.value.style.transform = `scaleX(${hour / LAST_HOUR})`
      const next = Math.round(f)
      if (next !== active) {
        cards[active]?.classList.remove('is-on')
        cards[next]?.classList.add('is-on')
        active = next
      }
    }
    show(0)

    gsap.to(tr, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => show(self.progress)
      }
    })

    // Retour sous 900 px (ou démontage) : la frise redevient une pile.
    return () => {
      ScrollTrigger.removeEventListener('refreshInit', size)
      el.classList.remove('is-rail')
      el.style.height = ''
      cards.forEach((c, k) => c.classList.toggle('is-on', k === 0))
    }
  })
})

onUnmounted(() => mm?.revert())
</script>

<style scoped>
/* --- par défaut (téléphone, mouvement réduit) : une pile de cartes ------------ */
.chrono {
  position: relative;
  padding-block: var(--sp-5);
}
.chrono__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--sp-3);
}
.chrono__title {
  font-size: var(--fs-h1);
  margin-top: 1.25rem;
  max-width: 14ch;
}
.chrono__clock,
.chrono__meter {
  display: none;
}
.chrono__track {
  display: grid;
  gap: 1.25rem;
  margin: var(--sp-4) auto 0;
  padding: 0 var(--pad-inline);
  max-width: var(--container);
  list-style: none;
}
.chrono__card {
  display: grid;
  gap: clamp(1.25rem, 3vw, 3rem);
  padding: clamp(1.25rem, 3vw, 2.75rem);
  border-radius: 28px;
  background: var(--c2);
  color: var(--ink);
  transition: opacity 0.5s var(--ease-soft);
}
.chrono__text {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--sp-3);
}
.chrono__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
.chrono__hour {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  background: var(--ink);
  color: var(--paper);
}
.chrono__num {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(4rem, 9vw, 8.5rem);
  line-height: 0.8;
  letter-spacing: -0.05em;
  color: var(--c);
}
.chrono__step {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.chrono__headline {
  font-size: var(--fs-h2);
  line-height: 1.02;
  margin-block: 0.75rem 1rem;
  max-width: 16ch;
}
.chrono__body {
  max-width: 44ch;
  line-height: 1.55;
}
.chrono__media :deep(.media) {
  aspect-ratio: 4 / 3;
}

@media (min-width: 900px) {
  .chrono__card {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
    min-height: min(70svh, 640px);
  }
  .chrono__media :deep(.media) {
    height: 100%;
    aspect-ratio: auto;
  }
}

/* --- grand écran : la frise ---------------------------------------------------
   La zone reçoit sa hauteur du script (un écran + la longueur de la glisse) ; la
   scène colle en haut de l'écran pendant que la piste glisse. */
.chrono.is-rail {
  padding-block: 0;
}
.chrono.is-rail .chrono__stage {
  position: sticky;
  top: 0;
  height: 100svh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 2.6vh, 2rem);
  padding: calc(var(--header-h) + 1rem) 0 clamp(1.5rem, 4vh, 3rem);
}
.chrono.is-rail .chrono__head {
  /* Enfant d'une colonne flex : sans largeur explicite, le conteneur se centrerait
     sur son contenu au lieu de s'aligner sur la colonne du site. */
  width: 100%;
}
.chrono.is-rail .chrono__title {
  font-size: clamp(2rem, 3.6vw, 3.4rem);
  max-width: none;
}
.chrono.is-rail .chrono__clock {
  display: block;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(3.5rem, 7vw, 6.5rem);
  line-height: 0.85;
  letter-spacing: -0.05em;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}
.chrono__clock small {
  font-size: 0.4em;
  margin-left: 0.1em;
  color: var(--ink);
}
.chrono.is-rail .chrono__meter {
  display: block;
  width: 100%;
}
.chrono__meter::before {
  content: '';
  display: block;
  height: 2px;
  background: var(--line);
}
.chrono__bar {
  display: block;
  height: 2px;
  margin-top: -2px;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left;
}
.chrono.is-rail .chrono__track {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 1.5rem;
  margin: 0;
  max-width: none;
  /* La première carte s'aligne sur la colonne du site, à toutes les largeurs. */
  padding: 0 max(var(--pad-inline), calc((100vw - var(--container)) / 2 + var(--pad-inline)));
  will-change: transform;
}
.chrono.is-rail .chrono__card {
  flex: 0 0 min(74vw, 1040px);
  min-height: 0;
  height: 100%;
  /* Une seule rangée, bornée à la carte : une photo en portrait ne doit pas l'étirer. */
  grid-template-rows: minmax(0, 1fr);
}
.chrono.is-rail .chrono__media {
  min-height: 0;
}
/* Les cartes qui attendent leur tour restent en retrait. */
.chrono.is-rail .chrono__card:not(.is-on) {
  opacity: 0.45;
}
</style>
