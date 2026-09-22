<template>
  <div class="footfruits" aria-hidden="true">
    <div
      v-for="(f, i) in FRUITS"
      :key="f.id"
      ref="slots"
      class="footfruits__slot"
      :style="{ transform: `perspective(700px) rotateY(${yaw[i]}deg) rotateZ(${lean[i]}deg)` }"
    >
      <img :src="f.src" :alt="f.id" draggable="false" class="footfruits__img" />
    </div>
  </div>
</template>

<script setup lang="ts">
// ---------------------------------------------------------------------------
// Dix personnages-fruits (fournis par le client, détourés depuis
// components/minimaxH3/piedPage/), debout sur l'arête du pied de page, qui
// suivent vraiment le curseur en 2D — pas seulement gauche/droite : un
// personnage sous le curseur reste droit, un personnage loin dans un coin
// penche vers lui selon l'angle réel.
//
// Reprend la formule du composant de référence fourni
// (piedPage/fruits-nuxt-scene/components/FruitCursorScene.vue) : l'angle est
// calculé avec atan2 depuis les pieds de chaque personnage vers le curseur,
// avec un tampon vertical (BUFFER) qui adoucit la réponse quand le curseur
// est loin au-dessus ou en dessous plutôt que de saturer immédiatement au
// maximum. Comme les coordonnées (getBoundingClientRect, clientX/clientY)
// sont toutes relatives à la fenêtre, pas à la page, l'écart reste borné à
// ce qui est réellement visible à l'écran, même sur une page longue.
//
// Une version « vraie 3D » (vidéos d'orbite scrubbées au curseur, une par
// personnage) a été essayée puis abandonnée : le rendu ne convainquait pas
// à l'usage, malgré une rotation techniquement réelle. Retour à cette
// version en image, plus simple et jugée plus propre.
// ---------------------------------------------------------------------------

import strawberry from '~/components/minimaxH3/piedPage/web/strawberry.png'
import banana from '~/components/minimaxH3/piedPage/web/banana.png'
import pineapple from '~/components/minimaxH3/piedPage/web/pineapple.png'
import watermelon from '~/components/minimaxH3/piedPage/web/watermelon.png'
import mango from '~/components/minimaxH3/piedPage/web/mango.png'
import orange from '~/components/minimaxH3/piedPage/web/orange.png'
import grapes from '~/components/minimaxH3/piedPage/web/grapes.png'
import kiwi from '~/components/minimaxH3/piedPage/web/kiwi.png'
import lemon from '~/components/minimaxH3/piedPage/web/lemon.png'
import coconut from '~/components/minimaxH3/piedPage/web/coconut.png'

const FRUITS = [
  { id: 'strawberry', src: strawberry },
  { id: 'banana', src: banana },
  { id: 'pineapple', src: pineapple },
  { id: 'watermelon', src: watermelon },
  { id: 'mango', src: mango },
  { id: 'orange', src: orange },
  { id: 'grapes', src: grapes },
  { id: 'kiwi', src: kiwi },
  { id: 'lemon', src: lemon },
  { id: 'coconut', src: coconut }
]

/** Angle de rotation maximal vers le curseur, en degrés. Une image plate (pas un
 *  modèle 3D) tolère un rotateY assez généreux avant de paraître trop écrasée —
 *  nettement plus qu'une simple inclinaison à plat (rotateZ, voir plus bas). */
const MAX_YAW = 48
/** Inclinaison à plat qui accompagne le virage, en degrés : un soupçon, pas
 *  l'effet principal (c'était le seul mouvement avant l'ajout du rotateY). */
const MAX_LEAN = 10
/** Tampon vertical, en px : plus il est grand, plus la réponse est douce
 *  quand le curseur est loin au-dessus ou en dessous. Même valeur que le
 *  composant de référence. */
const BUFFER = 200

const slots = ref<HTMLElement[]>([])
const yaw = reactive<number[]>(FRUITS.map(() => 0))
const lean = reactive<number[]>(FRUITS.map(() => 0))

let raf = 0
let pending: { x: number; y: number } | null = null

function apply() {
  raf = 0
  if (!pending) return
  const { x, y } = pending
  slots.value.forEach((el, i) => {
    if (!el) return
    const r = el.getBoundingClientRect()
    // Le pivot (voir --transform-origin en CSS) est près des pieds : c'est
    // aussi depuis ce point qu'on vise le curseur, pas depuis le centre.
    const px = r.left + r.width / 2
    const py = r.bottom - r.height * 0.08
    const dx = x - px
    const dy = y - py
    // Le second argument d'atan2 ne doit jamais descendre à zéro ni devenir négatif :
    // le curseur passe souvent SOUS la rangée (le pied de page, juste en dessous, est
    // plein de liens) ; sans ce plancher, l'angle traverse alors ±180° et le
    // personnage peut basculer d'un coup entre gauche et droite pour un dx proche de
    // zéro, au lieu de simplement saturer en douceur vers le maximum.
    const denom = Math.max(40, -dy + BUFFER)
    const deg = (Math.atan2(dx, denom) * 180) / Math.PI
    // Le virage (rotateY) fait presque tout le travail ; l'inclinaison (rotateZ)
    // n'en garde qu'une fraction, dans le même sens, comme un corps qui se penche
    // légèrement en se tournant plutôt que de rester rigide.
    yaw[i] = Math.max(-MAX_YAW, Math.min(MAX_YAW, deg * (MAX_YAW / 22)))
    lean[i] = Math.max(-MAX_LEAN, Math.min(MAX_LEAN, deg * (MAX_LEAN / 22)))
  })
}

function onMove(e: PointerEvent) {
  pending = { x: e.clientX, y: e.clientY }
  if (!raf) raf = requestAnimationFrame(apply)
}

/** Le curseur quitte la fenêtre : retour à la position neutre. */
function onLeave() {
  pending = null
  yaw.fill(0)
  lean.fill(0)
}

const { $reduceMotion } = useNuxtApp()

onMounted(() => {
  if ($reduceMotion) return
  window.addEventListener('pointermove', onMove, { passive: true })
  document.addEventListener('mouseleave', onLeave)
})

onUnmounted(() => {
  window.removeEventListener('pointermove', onMove)
  document.removeEventListener('mouseleave', onLeave)
  cancelAnimationFrame(raf)
})
</script>

<style scoped>
.footfruits {
  position: absolute;
  inset-inline: 0;
  bottom: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-inline: var(--pad-inline);
  pointer-events: none;
}
.footfruits__slot {
  /* Le pivot est proche du sol, pas pile dessus : les personnages ont un peu
     de matière (pieds, ombre) sous ce point. */
  transform-origin: 50% 92%;
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  width: clamp(50px, 6.4vw, 96px);
}
.footfruits__img {
  display: block;
  width: 100%;
  height: auto;
  /* Les règles globales donnent aux images un rayon et une largeur maximale :
     ici chaque personnage est déjà détouré (fond transparent), un rayon
     couperait un bord qui n'existe pas. */
  max-width: none;
  border-radius: 0;
  filter: drop-shadow(0 6px 10px rgba(15, 15, 15, 0.1));
}

/* Dix personnages sur toute la largeur, ça ne tient plus en dessous d'un
   certain point : on en retire progressivement, en gardant l'alternance des
   couleurs plutôt que de couper une moitié d'un coup. */
@media (max-width: 900px) {
  .footfruits__slot:nth-child(3n) {
    display: none;
  }
}
@media (max-width: 600px) {
  .footfruits__slot:nth-child(2n) {
    display: none;
  }
  .footfruits__slot {
    width: clamp(60px, 15vw, 84px);
  }
}
</style>
