<template>
  <section class="night section refus">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow" v-reveal>Jamais</p>
        <h2 class="refus__title" v-reveal="0.05">Ce qui ne passe pas la porte</h2>
      </div>

      <ul ref="list" class="refus__list">
        <li v-for="r in refusals" :key="r.word" class="refus__row">
          <span class="refus__word">
            {{ r.word }}
            <i class="refus__strike" aria-hidden="true" />
          </span>
          <span class="refus__why">{{ r.why }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import gsap from 'gsap'

// ---------------------------------------------------------------------------
// La liste de ce que Luméa refuse, en très gros : chaque mot se fait barrer à
// mesure qu'il monte dans l'écran (scrub), et s'efface derrière son trait pendant
// que sa raison s'allume à côté.
//
// Sans JS ou en mouvement réduit, les mots sont déjà barrés : le trait est l'état
// par défaut en CSS, l'animation ne fait que le rejouer.
// ---------------------------------------------------------------------------

const { $reduceMotion } = useNuxtApp()
const list = ref<HTMLElement | null>(null)

let ctx: gsap.Context | null = null

onMounted(() => {
  if ($reduceMotion || !list.value) return
  ctx = gsap.context(() => {
    list.value!.querySelectorAll<HTMLElement>('.refus__row').forEach((row) => {
      gsap
        .timeline({
          scrollTrigger: { trigger: row, start: 'top 82%', end: 'top 50%', scrub: true }
        })
        .fromTo(row.querySelector('.refus__strike'), { scaleX: 0 }, { scaleX: 1, ease: 'none' })
        // La couleur, pas l'opacité : le trait est dans le mot et doit rester vif.
        .fromTo(
          row.querySelector('.refus__word'),
          { color: 'rgba(243, 242, 239, 1)' },
          { color: 'rgba(243, 242, 239, 0.35)', ease: 'none' },
          0.3
        )
        .fromTo(row.querySelector('.refus__why'), { autoAlpha: 0.15, x: 24 }, { autoAlpha: 1, x: 0, ease: 'none' }, 0.3)
    })
  }, list.value)
})

onUnmounted(() => ctx?.revert())
</script>

<style scoped>
.refus__title {
  font-size: var(--fs-h1);
  max-width: 14ch;
}
.refus__list {
  margin-top: var(--sp-4);
  border-top: 1px solid var(--line-dark);
}
.refus__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 22rem);
  align-items: center;
  gap: var(--sp-3);
  padding-block: clamp(1rem, 2.4vw, 1.75rem);
  border-bottom: 1px solid var(--line-dark);
}
.refus__word {
  position: relative;
  justify-self: start;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(1.9rem, 6.4vw, 6rem);
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--on-night);
  /* Une seule ligne par mot : le trait est tiré à mi-hauteur de la boîte. */
  white-space: nowrap;
}
.refus__strike {
  position: absolute;
  left: -0.06em;
  right: -0.06em;
  top: 54%;
  height: 0.11em;
  border-radius: 999px;
  background: var(--accent);
  transform-origin: left center;
}
.refus__why {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--on-night-soft);
}
@media (max-width: 700px) {
  .refus__row {
    grid-template-columns: 1fr;
    gap: 0.6rem;
  }
}
</style>
