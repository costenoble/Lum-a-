<template>
  <svg
    class="rescue"
    :viewBox="`0 0 ${size.w} ${size.h}`"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <defs>
      <linearGradient :id="`${uid}-rock`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#b07d86" />
        <stop offset="1" stop-color="#5e4067" />
      </linearGradient>
    </defs>

    <g :opacity="st.o">
      <!-- le rocher : une île flottante posée contre le bord droit -->
      <g :transform="`translate(${g.islandX + st.dx} ${g.islandY}) scale(${g.islandW / 200} ${g.islandD / 176})`">
        <path
          d="M-100 0 Q0 22 100 0 L76 46 Q52 96 14 176 Q0 128 -26 92 Q-62 56 -100 0 Z"
          :fill="`url(#${uid}-rock)`"
        />
        <path d="M-60 26 Q-30 40 -12 82 M30 30 Q40 60 26 100" class="rescue__crack" />
        <ellipse cx="0" cy="-2" rx="102" ry="17" fill="#6fbf4a" />
        <ellipse cx="0" cy="-6" rx="94" ry="11" fill="#9be06a" />
        <circle cx="-70" cy="-16" r="13" fill="#3f9a3c" />
        <circle cx="-52" cy="-24" r="16" fill="#4fae46" />
        <circle cx="70" cy="-14" r="11" fill="#3f9a3c" />
      </g>

      <!-- le compagnon, sur le rocher, la corde en main -->
      <g
        :transform="`translate(${g.feetX + st.dx} ${g.feetY + st.hop}) rotate(${st.lean}) scale(${g.s}) translate(-100 -277)`"
      >
        <FruitBuddy width="200" height="290" :kind="pair.hold" :pose="st.poseC" />
      </g>

      <!-- la corde : détendue, elle pend en boucle ; tendue, elle file droit -->
      <template v-if="st.rope">
        <path :d="rope" class="rescue__rope" />
        <path :d="rope" class="rescue__twist" />
      </template>

      <!-- celui qui tombe, encordé à la taille -->
      <g
        v-if="st.showChar"
        :transform="`translate(${char.x} ${char.y}) rotate(${char.tilt}) scale(${g.s}) translate(-100 -238)`"
      >
        <FruitBuddy width="200" height="290" :kind="pair.fall" :pose="st.poseF" />
        <!-- Harnais : ceinture et bretelles qui remontent sous le menton. La corde
             part de derrière la tête ; sans lui, on le croirait pendu par la tête. -->
        <path d="M80 233 L88 176 M120 233 L112 176" class="rescue__belt rescue__belt--strap" />
        <path d="M58 232 Q100 246 142 232" class="rescue__belt" />
        <circle cx="100" cy="239" r="5" class="rescue__knot" />
      </g>
    </g>
  </svg>
</template>

<script setup lang="ts">
import gsap from 'gsap'

// ---------------------------------------------------------------------------
// Sauvetage de l'ouverture du menu : un personnage tombe du haut de l'écran,
// la corde que tient son compagnon (debout sur un rocher) se tend d'un coup,
// il rebondit, se balance en s'amortissant, puis tout le monde se réjouit.
//
// Trois phases, pilotées par une timeline GSAP qui écrit dans `st` :
//   fall   chute libre, corde détendue (`st.fall` de 0 à 1)
//   swing  la corde est tendue : pendule amorti autour de la main du compagnon
//   idle   micro-balancement, jusqu'à la fermeture du menu
//
// Rien n'est animé « à la main » dans le SVG : tout est recalculé depuis `st`
// et la taille de l'écran, donc le dessin suit n'importe quel format.
// NavOverlay appelle play() à l'ouverture et stop() / reset() à la fermeture.
// ---------------------------------------------------------------------------

const uid = useId()

// Couples fournis à tour de rôle : chaque ouverture change de duo.
const PAIRS = [
  { fall: 'lagon', hold: 'comete' },
  { fall: 'nuage', hold: 'solaire' },
  { fall: 'prairie', hold: 'aurore' },
  { fall: 'comete', hold: 'lagon' }
] as const
const pairIndex = ref(0)
const pair = computed(() => PAIRS[pairIndex.value % PAIRS.length]!)

const size = ref({ w: 1440, h: 900 })
function measure() {
  size.value = { w: window.innerWidth, h: window.innerHeight }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

interface Pt {
  x: number
  y: number
}

// Main du compagnon dans son repère (200 × 290), pose « hold », et point
// d'attache de la corde sur la taille du personnage qui tombe.
const HAND = { x: 19, y: 206 }
const FEET = { x: 100, y: 277 }

const g = computed(() => {
  const { w, h } = size.value
  const cw = clamp(w * 0.075, 64, 132) // largeur d'un personnage, en px
  const s = cw / 200
  const islandW = clamp(w * 0.24, 150, 360)
  const islandD = h * 0.24
  const islandY = clamp(h * 0.3, 190, 320)
  const islandX = w - islandW / 2 - 12
  const L = clamp(h * 0.46, 260, 520) // longueur de la corde
  const theta0 = w < 700 ? 0.42 : 0.66 // angle d'où il est rattrapé (rad)
  return { s, islandW, islandD, islandX, islandY, feetX: islandX, feetY: islandY + 6, L, theta0 }
})

/** Position de la main du compagnon, avec son penché et son saut. */
const hand = computed<Pt>(() => {
  const a = (st.lean * Math.PI) / 180
  const dx = (HAND.x - FEET.x) * g.value.s
  const dy = (HAND.y - FEET.y) * g.value.s
  return {
    x: g.value.feetX + st.dx + dx * Math.cos(a) - dy * Math.sin(a),
    y: g.value.feetY + st.hop + dx * Math.sin(a) + dy * Math.cos(a)
  }
})

// --- état animé -------------------------------------------------------------

const initial = () => ({
  o: 0, // opacité de la scène
  dx: 240, // décalage d'entrée du rocher et du compagnon
  showChar: false,
  rope: false,
  phase: 'fall' as 'fall' | 'swing',
  fall: 0, // 0 → 1 : la chute
  sw: 0, // 0 → 1 : le balancier (temps normalisé)
  idle: 0, // -1 → 1 : micro-balancement de fin
  lean: 0, // penché du compagnon, en degrés
  hop: 0, // petit saut du compagnon, en px
  poseF: 'cheer' as 'cheer' | 'wave' | 'stand',
  poseC: 'hold' as 'hold' | 'cheer'
})
const st = reactive(initial())

// Balancier : pendule amorti. θ0 = angle à la prise de corde, V0 = vitesse
// angulaire à cet instant (vers la verticale). Solution exacte de
// θ'' + 2βθ' + ω²θ = 0 avec ces conditions initiales.
const SWING_S = 3.4
const OMEGA = 3.6
const BETA = 0.85
const V0 = -1.0

const char = computed(() => {
  const { L, theta0 } = g.value
  const P = hand.value
  if (st.phase === 'fall') {
    // Chute verticale, de hors écran jusqu'au point où la corde devient droite.
    const cx = P.x - L * Math.sin(theta0)
    const cy = P.y + L * Math.cos(theta0)
    const y0 = -size.value.h * 0.14
    return { x: cx, y: y0 + (cy - y0) * st.fall, tilt: -24 + 36 * st.fall }
  }
  const T = st.sw * SWING_S
  const theta =
    Math.exp(-BETA * T) * (theta0 * Math.cos(OMEGA * T) + ((V0 + BETA * theta0) / OMEGA) * Math.sin(OMEGA * T)) +
    st.idle * 0.035
  // La corde s'étire un peu à la prise, puis se raidit.
  const r = L * (1 + 0.05 * Math.exp(-14 * T) * Math.cos(34 * T))
  return {
    x: P.x - r * Math.sin(theta),
    y: P.y + r * Math.cos(theta),
    tilt: (-theta * 180) / Math.PI * 0.45
  }
})

const rope = computed(() => {
  const P = hand.value
  const Q = { x: char.value.x, y: char.value.y }
  const d = Math.hypot(Q.x - P.x, Q.y - P.y)
  // Corde détendue : plus elle a de mou, plus la boucle pend bas.
  const slack = Math.sqrt(Math.max(0, g.value.L ** 2 - d ** 2))
  const mx = (P.x + Q.x) / 2
  const my = (P.y + Q.y) / 2 + slack * 0.9
  return `M${P.x} ${P.y} Q${mx} ${my} ${Q.x} ${Q.y}`
})

// --- pilotage ----------------------------------------------------------------

let tl: gsap.core.Timeline | null = null
let idleTween: gsap.core.Tween | null = null

function stop() {
  tl?.kill()
  idleTween?.kill()
  tl = idleTween = null
}

function reset() {
  stop()
  Object.assign(st, initial())
}

function play() {
  reset()
  pairIndex.value += 1
  measure()

  st.rope = true
  tl = gsap.timeline()
  tl.to(st, { o: 1, duration: 0.3, ease: 'none' }, 0)
    .to(st, { dx: 0, duration: 0.85, ease: 'expo.out' }, 0)
    // 1. La chute : il apparaît par le haut de l'écran.
    .call(() => { st.showChar = true }, undefined, 0.55)
    .to(st, { fall: 1, duration: 0.8, ease: 'power2.in' }, 0.55)
    // 2. La corde se tend : secousse, le compagnon encaisse.
    .call(() => {
      st.phase = 'swing'
      idleTween = gsap.fromTo(
        st,
        { idle: -1 },
        { idle: 1, duration: 1.7, ease: 'sine.inOut', yoyo: true, repeat: -1 }
      )
    }, undefined, 1.35)
    .to(st, { sw: 1, duration: SWING_S, ease: 'none' }, 1.35)
    .to(st, { lean: -11, duration: 0.09, ease: 'power2.out' }, 1.35)
    .to(st, { lean: -3, duration: 0.9, ease: 'elastic.out(1, 0.35)' }, 1.44)
    // 3. Soulagement : le compagnon saute de joie, l'autre salue.
    .call(() => { st.poseC = 'cheer' }, undefined, 3.0)
    .to(st, { hop: -12, lean: 0, duration: 0.17, ease: 'power1.out', yoyo: true, repeat: 3 }, 3.0)
    .call(() => { st.poseF = 'wave' }, undefined, 3.4)
}

// Sans animation : la dernière image, tout de suite.
function showRest() {
  reset()
  measure()
  pairIndex.value += 1
  Object.assign(st, { o: 1, dx: 0, showChar: true, rope: true, phase: 'swing', sw: 1, poseC: 'cheer', poseF: 'wave' })
}

defineExpose({ play, stop, reset, showRest })

onMounted(() => {
  measure()
  window.addEventListener('resize', measure)
})
onUnmounted(() => {
  window.removeEventListener('resize', measure)
  stop()
})
</script>

<style scoped>
.rescue {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.rescue__crack {
  fill: none;
  stroke: #4a2f55;
  stroke-width: 3;
  opacity: 0.35;
}

/* Corde de chanvre : un trait clair, un tressage sombre par-dessus. */
.rescue__rope {
  fill: none;
  stroke: #e0bf8c;
  stroke-width: 4.5;
  stroke-linecap: round;
}
.rescue__twist {
  fill: none;
  stroke: #8a6a3c;
  stroke-width: 4.5;
  stroke-linecap: butt;
  stroke-dasharray: 2 6;
  opacity: 0.55;
}
.rescue__belt {
  fill: none;
  stroke: #e0bf8c;
  stroke-width: 6;
  stroke-linecap: round;
}
.rescue__belt--strap {
  stroke-width: 4.5;
}
.rescue__knot {
  fill: #c9a56c;
  stroke: #8a6a3c;
  stroke-width: 1.5;
}
</style>
