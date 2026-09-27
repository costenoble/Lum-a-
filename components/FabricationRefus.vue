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
            <!-- Le mot entier pour les lecteurs d'écran, les lettres pour l'animation. -->
            <span class="refus__sr">{{ r.word }}</span>
            <span
              v-for="(char, k) in [...r.word]"
              :key="k"
              class="refus__char"
              aria-hidden="true"
            >{{ char }}</span>
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
// La liste de ce que Luméa refuse, en très gros. Chaque ligne entre net, avec sa
// raison qui s'allume à côté ; arrivé tout en haut de l'écran, le mot se dissout
// lettre par lettre (fondu, léger flou, de gauche à droite). Tout est lié
// au scroll (scrub) : en remontant, le mot se reforme.
//
// Sans JS ou en mouvement réduit, les mots restent simplement lisibles.
// ---------------------------------------------------------------------------

const { $reduceMotion } = useNuxtApp()
const list = ref<HTMLElement | null>(null)

let ctx: gsap.Context | null = null

onMounted(() => {
  if ($reduceMotion || !list.value) return
  ctx = gsap.context(() => {
    list.value!.querySelectorAll<HTMLElement>('.refus__row').forEach((row) => {
      // La raison d'abord, dès que la ligne entre par le bas : on lit le mot (encore net)
      // et sa raison ensemble. En y et non en x : sur téléphone, un décalage latéral
      // sortait de l'écran.
      gsap.fromTo(
        row.querySelector('.refus__why'),
        { autoAlpha: 0.15, y: 14 },
        {
          autoAlpha: 1,
          y: 0,
          ease: 'none',
          scrollTrigger: { trigger: row, start: 'top 88%', end: 'top 68%', scrub: true }
        }
      )
      // Le mot ne se dissout qu'en arrivant tout en haut de l'écran, juste avant de
      // passer sous le header : de 88 % à 26 % de la hauteur, la ligne entière (mot et
      // raison) reste parfaitement lisible, et le mot suivant n'a pas encore bougé
      // quand on finit de lire la raison du précédent.
      gsap.to(row.querySelectorAll('.refus__char'), {
        opacity: 0.1,
        filter: 'blur(6px)',
        yPercent: -8,
        ease: 'none',
        stagger: 0.04,
        scrollTrigger: { trigger: row, start: 'top 26%', end: 'top 2%', scrub: true }
      })
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
  white-space: nowrap;
}
/* inline-block : une lettre doit pouvoir bouger et se flouter ; `pre` garde les espaces. */
.refus__char {
  display: inline-block;
  white-space: pre;
  will-change: opacity, filter, transform;
}
.refus__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
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
