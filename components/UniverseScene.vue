<template>
  <svg
    class="universe"
    viewBox="0 0 1600 1000"
    preserveAspectRatio="xMidYMax slice"
    aria-hidden="true"
  >
    <defs>
      <linearGradient :id="`${uid}-sky`" gradientUnits="userSpaceOnUse" x1="0" y1="-100" x2="0" y2="600">
        <stop offset="0" stop-color="#5a5fd8" />
        <stop offset="0.3" stop-color="#8f6be0" />
        <stop offset="0.55" stop-color="#ff9ac1" />
        <stop offset="0.8" stop-color="#ffc27a" />
        <stop offset="1" stop-color="#ffe9a8" />
      </linearGradient>
      <radialGradient :id="`${uid}-sun`">
        <stop offset="0" stop-color="#fffbe6" stop-opacity="0.95" />
        <stop offset="0.35" stop-color="#ffe9a8" stop-opacity="0.55" />
        <stop offset="1" stop-color="#ffc27a" stop-opacity="0" />
      </radialGradient>
      <radialGradient :id="`${uid}-glow`">
        <stop offset="0" stop-color="#fff" stop-opacity="0.95" />
        <stop offset="0.3" stop-color="#e2ccff" stop-opacity="0.6" />
        <stop offset="1" stop-color="#a77bff" stop-opacity="0" />
      </radialGradient>
      <linearGradient :id="`${uid}-rock`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#a3707a" />
        <stop offset="1" stop-color="#5e4067" />
      </linearGradient>
      <linearGradient :id="`${uid}-fall`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity="0.85" />
        <stop offset="1" stop-color="#9ef0f4" stop-opacity="0" />
      </linearGradient>
      <linearGradient :id="`${uid}-lake`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#8ff0e6" />
        <stop offset="1" stop-color="#2c8fd6" />
      </linearGradient>
      <linearGradient :id="`${uid}-mist`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffe9a8" stop-opacity="0" />
        <stop offset="1" stop-color="#ffe9a8" stop-opacity="0.75" />
      </linearGradient>
      <linearGradient :id="`${uid}-hill`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#9be05a" />
        <stop offset="0.45" stop-color="#4ea640" />
        <stop offset="1" stop-color="#2a6a34" />
      </linearGradient>
      <radialGradient :id="`${uid}-vig`" cx="0.5" cy="0.5" r="0.75">
        <stop offset="0.6" stop-color="#3a1466" stop-opacity="0" />
        <stop offset="1" stop-color="#3a1466" stop-opacity="0.4" />
      </radialGradient>

      <!-- île flottante : roc, gazon, arbres. Le centre du dessus est l'origine. -->
      <g :id="`${uid}-isl`">
        <path d="M-70 0 Q0 14 70 0 L48 34 Q26 76 6 120 Q-4 84 -30 46 Z" :fill="`url(#${uid}-rock)`" />
        <path d="M-52 22 Q-20 30 -4 60 M20 20 Q30 40 22 70" fill="none" stroke="#4a2f55" stroke-width="3" opacity="0.35" />
        <ellipse cx="0" cy="-2" rx="72" ry="14" fill="#6fbf4a" />
        <ellipse cx="0" cy="-5" rx="66" ry="10" fill="#9be06a" />
        <circle cx="-34" cy="-16" r="13" fill="#3f9a3c" />
        <circle cx="-16" cy="-22" r="16" fill="#4fae46" />
        <circle cx="26" cy="-17" r="14" fill="#3f9a3c" />
        <circle cx="42" cy="-12" r="9" fill="#4fae46" />
      </g>
    </defs>

    <!-- ciel -->
    <g :transform="zoom(0.06)">
      <rect x="-300" y="-300" width="2200" height="1500" :fill="`url(#${uid}-sky)`" />
    </g>

    <!-- soleil -->
    <g :transform="zoom(0.12)">
      <circle cx="800" cy="520" :r="430 + 90 * progress" :fill="`url(#${uid}-sun)`" />
      <circle cx="800" cy="520" r="46" fill="#fffbe6" />
    </g>

    <!-- nuages lointains -->
    <g :transform="zoom(0.25)">
      <g v-for="(cl, i) in CLOUDS" :key="i" :transform="`translate(${cl.x} ${cl.y}) scale(${cl.s})`">
        <ellipse cx="0" cy="14" rx="96" ry="16" fill="#ff8f9c" opacity="0.5" />
        <ellipse cx="0" cy="0" rx="92" ry="28" fill="#fff0e6" opacity="0.92" />
        <ellipse cx="-46" cy="-14" rx="46" ry="26" fill="#fff5ee" opacity="0.95" />
        <ellipse cx="28" cy="-22" rx="54" ry="30" fill="#fff5ee" opacity="0.95" />
      </g>
    </g>

    <!-- montagnes -->
    <g :transform="zoom(0.32)">
      <path d="M-300 600 L-300 500 Q-100 430 60 490 T330 470 T600 505 T900 480 T1200 500 T1500 465 T1900 500 L1900 600 Z" fill="#c79be3" opacity="0.75" />
      <path d="M-300 610 L-300 545 Q0 500 200 540 T520 540 T860 550 T1180 535 T1500 550 T1900 530 L1900 610 Z" fill="#9b78cf" opacity="0.9" />
      <rect x="-300" y="510" width="2200" height="120" :fill="`url(#${uid}-mist)`" />
    </g>

    <!-- petites îles au loin -->
    <g :transform="zoom(0.6)">
      <use
        v-for="(isl, i) in FAR_ISLANDS"
        :key="i"
        :href="`#${uid}-isl`"
        :transform="`translate(${isl.x} ${isl.y}) scale(${isl.s})`"
        opacity="0.92"
      />
    </g>

    <!-- grandes îles : le château à gauche (posé plus bas que l'autre : la carte de
         légende occupe le haut de l'écran), la chute à droite -->
    <g :transform="zoom(1.2)">
      <g transform="translate(310 430)">
        <rect x="46" y="36" width="24" height="520" :fill="`url(#${uid}-fall)`" />
        <use :href="`#${uid}-isl`" transform="scale(2.1)" />
        <g transform="translate(0 -6) scale(1.15)">
          <rect x="-34" y="-30" width="68" height="30" fill="#f0d6a8" />
          <rect x="-20" y="-74" width="40" height="74" fill="#f6e3c4" />
          <path d="M-27 -74 L27 -74 L0 -120 Z" fill="#7b5cd6" />
          <rect x="-58" y="-50" width="24" height="50" fill="#f6e3c4" />
          <path d="M-62 -50 L-30 -50 L-46 -90 Z" fill="#9b7be8" />
          <rect x="34" y="-50" width="24" height="50" fill="#f6e3c4" />
          <path d="M30 -50 L62 -50 L46 -90 Z" fill="#9b7be8" />
          <rect x="-5" y="-54" width="10" height="16" rx="5" fill="#ffd166" />
          <rect x="-52" y="-34" width="8" height="12" rx="4" fill="#ffd166" />
          <rect x="44" y="-34" width="8" height="12" rx="4" fill="#ffd166" />
          <path d="M0 -120 V-134 L14 -129 L0 -124" fill="#ff5b1f" stroke="#ff5b1f" stroke-width="1.5" stroke-linejoin="round" />
        </g>
        <g transform="translate(-76 -10) scale(0.2)">
          <FruitBuddy width="200" height="290" kind="prairie" pose="wave" :delay="0.5" />
        </g>
      </g>

      <g transform="translate(1310 350)">
        <rect x="-78" y="44" width="30" height="520" :fill="`url(#${uid}-fall)`" />
        <use :href="`#${uid}-isl`" transform="scale(2.4)" />
        <circle cx="-64" cy="-40" r="26" fill="#3f9a3c" />
        <circle cx="-30" cy="-52" r="30" fill="#4fae46" />
        <circle cx="60" cy="-38" r="24" fill="#3f9a3c" />
        <circle cx="90" cy="-24" r="16" fill="#4fae46" />
        <g transform="translate(6 -20) scale(0.2)">
          <FruitBuddy width="200" height="290" kind="aurore" pose="wave" :delay="1.1" />
        </g>
      </g>
    </g>

    <!-- le lac, la plateforme de la Source, la cascade -->
    <g :transform="zoom(0.9)">
      <rect x="-300" y="606" width="2200" height="260" :fill="`url(#${uid}-lake)`" />
      <ellipse
        v-for="(r, i) in RIPPLES"
        :key="i"
        :cx="r.x"
        :cy="r.y"
        :rx="r.w"
        ry="3"
        fill="#fff"
        opacity="0.26"
      />
      <path d="M-300 650 Q160 600 470 664 Q300 706 -300 770 Z" fill="#5fae45" />
      <path d="M-300 690 Q120 668 360 700 Q220 730 -300 790 Z" fill="#3f8f3c" />
      <path d="M1900 650 Q1440 600 1130 664 Q1300 706 1900 770 Z" fill="#5fae45" />
      <path d="M1900 690 Q1480 668 1240 700 Q1380 730 1900 790 Z" fill="#3f8f3c" />
      <g v-for="(m, i) in ISLETS" :key="i" :transform="`translate(${m.x} ${m.y}) scale(${m.s})`">
        <ellipse cx="0" cy="6" rx="60" ry="10" fill="#2a6a34" opacity="0.5" />
        <ellipse cx="0" cy="0" rx="58" ry="11" fill="#6fbf4a" />
        <circle cx="-22" cy="-12" r="14" fill="#3f9a3c" />
        <circle cx="4" cy="-18" r="17" fill="#4fae46" />
        <circle cx="30" cy="-10" r="12" fill="#3f9a3c" />
      </g>
      <ellipse cx="800" cy="668" rx="200" ry="32" fill="#cfeeff" opacity="0.55" />
      <ellipse cx="800" cy="664" rx="150" ry="22" fill="#eafaff" opacity="0.9" />
      <ellipse cx="800" cy="664" rx="112" ry="15" fill="none" stroke="#a77bff" stroke-width="3" opacity="0.8" />
      <path d="M754 676 L846 676 L900 840 L700 840 Z" :fill="`url(#${uid}-fall)`" />
      <ellipse cx="800" cy="842" rx="112" ry="14" fill="#fff" opacity="0.5" />
    </g>

    <!-- le cristal de la Source : grossit à mesure qu'on s'en approche -->
    <g :transform="zoom(2.3)">
      <circle cx="800" cy="568" r="320" :fill="`url(#${uid}-glow)`" :opacity="0.5 + 0.5 * progress" />
      <g class="crystal">
        <polygon
          v-for="(f, i) in CRYSTAL_FACETS"
          :key="i"
          :points="f"
          :fill="CRYSTAL_TONES[i]"
          stroke="#fff"
          stroke-opacity="0.55"
          stroke-width="1.5"
          stroke-linejoin="round"
        />
        <polygon points="800,470 758,528 782,548" fill="#fff" opacity="0.55" />
      </g>
      <path
        v-for="(s, i) in SPARKLES"
        :key="i"
        :d="STAR"
        :transform="`translate(${s.x} ${s.y}) scale(${s.k})`"
        class="twinkle"
        :style="{ animationDelay: `${s.d}s` }"
      />
    </g>

    <!-- cerisiers qui encadrent la scène -->
    <g :transform="zoom(1.5)">
      <g v-for="side in [0, 1]" :key="side" :transform="side ? 'translate(1600 0) scale(-1 1)' : ''">
        <path d="M-40 340 C30 230 100 130 260 60" stroke="#6b4030" stroke-width="32" fill="none" stroke-linecap="round" />
        <path d="M100 190 C160 210 230 180 320 205" stroke="#6b4030" stroke-width="18" fill="none" stroke-linecap="round" />
        <path d="M170 120 C210 60 250 30 300 -10" stroke="#6b4030" stroke-width="16" fill="none" stroke-linecap="round" />
        <circle
          v-for="(b, i) in BLOSSOMS[side]"
          :key="i"
          :cx="b.x"
          :cy="b.y"
          :r="b.r"
          :fill="b.c"
        />
      </g>
    </g>

    <!-- papillons -->
    <g :transform="zoom(1.3)">
      <!-- placement en attribut, dérive en CSS : sur le même élément, la seconde écraserait la première -->
      <g transform="translate(190 610)">
        <g class="butterfly">
          <ellipse cx="-12" cy="0" rx="14" ry="10" fill="#4fb8ff" />
          <ellipse cx="12" cy="0" rx="14" ry="10" fill="#4fb8ff" />
          <ellipse cx="-9" cy="12" rx="9" ry="7" fill="#7fd0ff" />
          <ellipse cx="9" cy="12" rx="9" ry="7" fill="#7fd0ff" />
        </g>
      </g>
      <g transform="translate(1430 590)">
        <g class="butterfly butterfly--b">
          <ellipse cx="-12" cy="0" rx="14" ry="10" fill="#ffd23f" />
          <ellipse cx="12" cy="0" rx="14" ry="10" fill="#ffd23f" />
          <ellipse cx="-9" cy="12" rx="9" ry="7" fill="#ffb03d" />
          <ellipse cx="9" cy="12" rx="9" ry="7" fill="#ffb03d" />
        </g>
      </g>
    </g>

    <!-- premier plan : la prairie et ses habitants. Descend et sort vite du champ. -->
    <g :transform="`translate(0 ${700 * progress}) ${zoom(1.6)}`">
      <path
        d="M-300 1100 L-300 830 Q200 770 800 810 T1900 800 L1900 1100 Z"
        :fill="`url(#${uid}-hill)`"
      />
      <circle
        v-for="(f, i) in FLOWERS"
        :key="i"
        :cx="f.x"
        :cy="f.y"
        :r="f.r"
        :fill="f.c"
      />
      <g v-for="(d, i) in DAISIES" :key="`d${i}`" :transform="`translate(${d.x} ${d.y})`">
        <path :d="`M0 0 Q${d.lean} 60 ${d.lean * 0.4} 140`" stroke="#3f9a3c" stroke-width="7" fill="none" stroke-linecap="round" />
        <ellipse
          v-for="n in 10"
          :key="n"
          cx="0"
          :cy="-d.r * 0.55"
          :rx="d.r * 0.26"
          :ry="d.r * 0.5"
          :fill="d.c"
          :transform="`rotate(${(n - 1) * 36})`"
        />
        <circle r="10" fill="#ffd166" />
      </g>
      <g
        v-for="b in BUDDIES"
        :key="b.kind"
        :class="{ 'is-side': b.side }"
        :transform="`translate(${b.x - 100 * b.s} ${b.y - 281 * b.s}) scale(${b.s})`"
      >
        <FruitBuddy width="200" height="290" :kind="b.kind" :pose="b.pose" :delay="b.d" />
      </g>
    </g>

    <!-- lucioles : dérivent vers le haut pendant le vol, sans jamais être zoomées -->
    <g>
      <circle
        v-for="(m, i) in MOTES"
        :key="i"
        :cx="m.x"
        :cy="m.y - progress * m.v"
        :r="m.r"
        fill="#fff8d6"
        class="twinkle"
        :style="{ animationDelay: `${m.d}s` }"
      />
    </g>

    <rect x="-300" y="-300" width="2200" height="1500" :fill="`url(#${uid}-vig)`" />
  </svg>
</template>

<script setup lang="ts">
// ---------------------------------------------------------------------------
// L'univers de la Source, en SVG : un décor en couches qu'on survole au scroll.
//
// Comme BottleBuild, le composant n'anime rien lui-même : il traduit `progress`
// (0 → 1, fourni par FabricationScene) en transformations. La profondeur vient
// d'un facteur par couche — plus une couche est proche, plus elle grossit vite
// depuis le point de fuite — d'où le parallaxe et l'impression de foncer vers
// le cristal, sans vidéo ni 3D.
//
//   0.00 – 0.35   la prairie et ses habitants, puis on décolle
//   0.35 – 0.80   survol : îles flottantes, château, cascade, lac
//   0.80 – 1.00   le cristal de la Source remplit le cadre
//
// Le dessin est calé en bas (xMidYMax) : sur un écran très large, c'est le haut
// du ciel qui est rogné, jamais les pieds des personnages.
// ---------------------------------------------------------------------------

const props = defineProps<{ progress: number }>()

const uid = useId()

// Point de fuite : la Source, à l'horizon.
const VP = { x: 800, y: 580 }

/** Grossissement d'une couche depuis le point de fuite ; `k` = facteur de proximité. */
function zoom(k: number) {
  const s = 1 + k * props.progress
  return `translate(${VP.x} ${VP.y}) scale(${s}) translate(${-VP.x} ${-VP.y})`
}

const CLOUDS = [
  { x: 260, y: 150, s: 1.3 },
  { x: 640, y: 90, s: 0.9 },
  { x: 1000, y: 170, s: 1.1 },
  { x: 1380, y: 110, s: 1.4 },
  { x: 460, y: 330, s: 0.7 },
  { x: 1180, y: 350, s: 0.75 },
  { x: 800, y: 260, s: 0.6 }
]

const FAR_ISLANDS = [
  { x: 520, y: 300, s: 0.8 },
  { x: 1090, y: 255, s: 0.7 },
  { x: 650, y: 440, s: 0.55 },
  { x: 985, y: 425, s: 0.6 },
  { x: 405, y: 470, s: 0.5 },
  { x: 1215, y: 480, s: 0.5 }
]

const ISLETS = [
  { x: 570, y: 700, s: 0.9 },
  { x: 1040, y: 706, s: 0.8 },
  { x: 690, y: 750, s: 0.6 },
  { x: 1190, y: 668, s: 0.7 }
]

const RIPPLES = (() => {
  const rnd = mulberry32(5)
  return Array.from({ length: 14 }, () => ({
    x: Math.round(-100 + rnd() * 1800),
    y: Math.round(630 + rnd() * 200),
    w: Math.round(30 + rnd() * 40)
  }))
})()

// Le cristal : sommet, huit points de contour, facettes en éventail vers le centre.
const CRYSTAL_OUT: [number, number][] = [
  [800, 470], [842, 528], [872, 600], [850, 646], [800, 662], [750, 646], [728, 600], [758, 528]
]
const CRYSTAL_C: [number, number] = [800, 590]
const CRYSTAL_FACETS = CRYSTAL_OUT.map((p, i) => {
  const q = CRYSTAL_OUT[(i + 1) % CRYSTAL_OUT.length]!
  return `${CRYSTAL_C.join(',')} ${p.join(',')} ${q.join(',')}`
})
const CRYSTAL_TONES = ['#c9a8ff', '#a77bff', '#7b4fd6', '#5b32b0', '#5b32b0', '#7b4fd6', '#a77bff', '#d9c2ff']

// Étoile à quatre branches, centrée sur l'origine.
const STAR = 'M0 -1 Q0 0 1 0 Q0 0 0 1 Q0 0 -1 0 Q0 0 0 -1Z'
const SPARKLES = [
  { x: 690, y: 500, k: 16, d: 0 },
  { x: 915, y: 520, k: 12, d: 0.7 },
  { x: 700, y: 650, k: 10, d: 1.4 },
  { x: 910, y: 640, k: 14, d: 2.1 },
  { x: 800, y: 440, k: 10, d: 0.35 }
]

const MOTES = (() => {
  const rnd = mulberry32(9)
  return Array.from({ length: 26 }, () => ({
    x: Math.round(rnd() * 1600),
    y: Math.round(300 + rnd() * 700),
    r: +(1.5 + rnd() * 2.6).toFixed(1),
    v: Math.round(120 + rnd() * 380),
    d: +(rnd() * 3).toFixed(1)
  }))
})()

// Feuillage des cerisiers : nuage de disques roses tirés dans un quart d'ellipse
// posé sur le coin. Une graine par côté, pour que les deux arbres diffèrent.
const BLOSSOMS = [21, 34].map((seed) => {
  const rnd = mulberry32(seed)
  const tones = ['#ff7fae', '#ff9ec4', '#ffc1d8', '#ffb0cf', '#e9609a', '#ffd6e6']
  return Array.from({ length: 48 }, () => {
    const a = rnd() * (Math.PI / 2)
    const d = Math.sqrt(rnd())
    return {
      x: Math.round(Math.cos(a) * d * 470 - 20),
      y: Math.round(Math.sin(a) * d * 300 - 20),
      r: Math.round(22 + rnd() * 30),
      c: tones[Math.floor(rnd() * tones.length)]!
    }
  })
})

const FLOWERS = (() => {
  const rnd = mulberry32(77)
  const tones = ['#ff9ec4', '#fff', '#c3b5ff', '#ffd166', '#ff7fae']
  return Array.from({ length: 80 }, () => ({
    x: Math.round(-100 + rnd() * 1800),
    y: Math.round(850 + rnd() * 150),
    r: +(3 + rnd() * 4).toFixed(1),
    c: tones[Math.floor(rnd() * tones.length)]!
  }))
})()

const DAISIES = [
  { x: 90, y: 880, r: 64, c: '#c58bff', lean: 20 },
  { x: 1520, y: 860, r: 74, c: '#ff9ec4', lean: -24 },
  { x: 210, y: 960, r: 40, c: '#fff', lean: 10 },
  { x: 1400, y: 970, r: 44, c: '#ffd166', lean: -12 }
]

// Les six habitants. Les deux du milieu restent seuls visibles sur un écran étroit.
const BUDDIES = [
  { kind: 'nuage', x: 320, y: 905, s: 0.78, pose: 'stand', d: 1.4, side: true },
  { kind: 'lagon', x: 500, y: 950, s: 0.92, pose: 'stand', d: 0.7, side: true },
  { kind: 'solaire', x: 680, y: 990, s: 1.05, pose: 'wave', d: 0, side: false },
  { kind: 'comete', x: 920, y: 990, s: 1.05, pose: 'cheer', d: 0.3, side: false },
  { kind: 'prairie', x: 1100, y: 950, s: 0.92, pose: 'stand', d: 1, side: true },
  { kind: 'aurore', x: 1280, y: 905, s: 0.78, pose: 'wave', d: 1.8, side: true }
] as const
</script>

<style scoped>
.universe {
  display: block;
}

/* Le cristal flotte doucement ; les étincelles scintillent. */
.crystal {
  animation: crystal-float 4.5s ease-in-out infinite alternate;
}
.twinkle {
  fill: #fff8d6;
  animation: twinkle 2.6s ease-in-out infinite;
}
.butterfly {
  animation: drift 6s ease-in-out infinite alternate;
}
.butterfly--b {
  animation-delay: -3s;
}
.butterfly ellipse {
  transform-box: fill-box;
  transform-origin: center;
  animation: flap 0.5s ease-in-out infinite alternate;
}

/* Sur écran étroit (portrait), le dessin est rogné sur les côtés : seuls les
   deux personnages du centre tiennent, les autres seraient coupés en deux. */
@media (max-aspect-ratio: 1/1) {
  .is-side {
    display: none;
  }
}

@keyframes crystal-float {
  to {
    transform: translateY(-8px);
  }
}
@keyframes twinkle {
  0%,
  100% {
    opacity: 0.25;
  }
  50% {
    opacity: 1;
  }
}
@keyframes drift {
  to {
    transform: translate(60px, -30px);
  }
}
@keyframes flap {
  to {
    transform: scaleX(0.45);
  }
}

@media (prefers-reduced-motion: reduce) {
  .crystal,
  .twinkle,
  .butterfly,
  .butterfly ellipse {
    animation: none;
  }
}
</style>
