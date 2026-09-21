<template>
  <svg
    class="buddy"
    viewBox="0 0 200 290"
    aria-hidden="true"
    :style="{ '--delay': `${delay}s`, '--al': `${arms.l}deg`, '--ar': `${arms.r}deg` }"
  >
    <defs>
      <radialGradient :id="`${uid}-fruit`" cx="0.35" cy="0.3" r="0.85">
        <stop offset="0" :stop-color="c.hi" />
        <stop offset="0.55" :stop-color="c.mid" />
        <stop offset="1" :stop-color="c.lo" />
      </radialGradient>
      <linearGradient :id="`${uid}-denim`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#4b7cc4" />
        <stop offset="1" stop-color="#35609f" />
      </linearGradient>
      <linearGradient :id="`${uid}-shoe`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="c.shoe" />
        <stop offset="1" :stop-color="c.shoe" stop-opacity="0.78" />
      </linearGradient>
      <pattern :id="`${uid}-stripe`" width="10" height="7" patternUnits="userSpaceOnUse">
        <rect width="10" height="7" fill="#fff" />
        <rect width="10" height="3.5" :fill="c.tee" />
      </pattern>
    </defs>

    <ellipse cx="100" cy="281" rx="54" ry="7" class="buddy__shadow" />

    <g class="buddy__body">
      <!-- jambes, chaussettes -->
      <rect x="82" y="238" width="10" height="24" rx="4" :fill="c.mid" />
      <rect x="108" y="238" width="10" height="24" rx="4" :fill="c.mid" />
      <rect x="81" y="251" width="12" height="11" rx="3" fill="#fff" />
      <rect x="107" y="251" width="12" height="11" rx="3" fill="#fff" />

      <!-- baskets -->
      <g v-for="side in [-1, 1]" :key="side" :transform="`translate(${100 + side * 22} 261) scale(${-side} 1)`">
        <path d="M-16 9 Q-16 -2 -6 -3 L8 -3 Q15 -3 15 6 L15 14 H-16 Z" :fill="`url(#${uid}-shoe)`" />
        <circle cx="-9" cy="8" r="6" fill="#fff" opacity="0.92" />
        <path d="M2 -1 l7 3 M2 3 l7 3" class="lace" />
        <rect x="-17.5" y="12" width="34" height="5.5" rx="2.75" fill="#fff" />
      </g>

      <!-- bras : sous les manches, pivotent depuis l'épaule -->
      <g transform="translate(53 196)">
        <g class="arm arm--l" :class="{ 'is-up': arms.l > 90 }">
          <path d="M0 0 L-6 30" class="limb" :stroke="c.mid" />
          <circle cx="-7" cy="35" r="7.5" :fill="c.mid" />
          <rect x="-12.5" y="24" width="11" height="5" rx="2.2" transform="rotate(12 -7 26)" fill="#fff" />
        </g>
      </g>
      <g transform="translate(147 196)">
        <g class="arm arm--r" :class="{ 'is-up': arms.r < -90 }">
          <path d="M0 0 L6 30" class="limb" :stroke="c.mid" />
          <circle cx="7" cy="35" r="7.5" :fill="c.mid" />
          <rect x="1.5" y="24" width="11" height="5" rx="2.2" transform="rotate(-12 7 26)" fill="#fff" />
        </g>
      </g>

      <!-- manches rayées -->
      <path d="M62 166 L40 177 L45 204 L65 197 Z" :fill="`url(#${uid}-stripe)`" class="seam" />
      <path d="M138 166 L160 177 L155 204 L135 197 Z" :fill="`url(#${uid}-stripe)`" class="seam" />

      <!-- salopette -->
      <path
        d="M74 176 H126 L132 212 L138 214 L140 238 Q140 245 133 245 H108 Q102 245 101 236 L100 229 L99 236 Q98 245 92 245 H67 Q60 245 60 238 L62 214 L68 212 Z"
        :fill="`url(#${uid}-denim)`"
        class="seam"
      />
      <rect x="61" y="236" width="79" height="9" rx="4" fill="#5a89cc" opacity="0.7" />
      <path d="M100 229 V212" class="stitch" />
      <path d="M70 216 Q70 226 76 230" class="stitch" />
      <path d="M130 216 Q130 226 124 230" class="stitch" />
      <rect x="85" y="188" width="30" height="20" rx="4.5" class="pocket" />
      <path d="M72 178 L66 158 M128 178 L134 158" class="strap" />
      <circle cx="75" cy="182" r="3.6" class="button" />
      <circle cx="125" cy="182" r="3.6" class="button" />

      <!-- emblème du parfum, sur la poche -->
      <g transform="translate(100 198)">
        <template v-if="c.emblem === 'sun'">
          <circle r="4.2" fill="#ffb92e" />
          <path
            v-for="n in 8"
            :key="n"
            d="M0 -6.4 V-9.4"
            stroke="#ffb92e"
            stroke-width="1.7"
            stroke-linecap="round"
            :transform="`rotate(${(n - 1) * 45})`"
          />
        </template>
        <path
          v-else-if="c.emblem === 'star'"
          d="M0 -8 L2.4 -2.5 L8 -2.5 L3.5 1.2 L5.2 7 L0 3.6 L-5.2 7 L-3.5 1.2 L-8 -2.5 L-2.4 -2.5 Z"
          fill="#ffd84d"
          transform="scale(0.85)"
        />
        <template v-else-if="c.emblem === 'leaf'">
          <path d="M-7 4 Q-6 -7 6 -7 Q7 5 -7 4 Z" fill="#c6f08a" />
          <path d="M-5 3 L4 -5" stroke="#4fbf7a" stroke-width="1.2" stroke-linecap="round" />
        </template>
        <template v-else-if="c.emblem === 'wave'">
          <path d="M-8 -3 Q-4 -8 0 -3 T8 -3" class="wave" />
          <path d="M-8 3 Q-4 -2 0 3 T8 3" class="wave" />
        </template>
        <template v-else-if="c.emblem === 'cloud'">
          <circle cx="-4" cy="1" r="4" fill="#fff" />
          <circle cx="1" cy="-2" r="5" fill="#fff" />
          <circle cx="5.5" cy="1.5" r="3.6" fill="#fff" />
          <rect x="-8" y="1" width="17" height="4.5" rx="2.2" fill="#fff" />
        </template>
        <template v-else>
          <path d="M-6.5 4 A6.5 6.5 0 0 1 6.5 4 Z" fill="#ffd166" />
          <path d="M-9 4 H9 M0 -6 V-9 M-7 -3 L-9.5 -5.5 M7 -3 L9.5 -5.5" class="ray" />
        </template>
      </g>

      <!-- le fruit-tête -->
      <path :d="c.head" :fill="`url(#${uid}-fruit)`" :stroke="c.lo" stroke-opacity="0.4" stroke-width="1.5" />
      <g v-if="c.seeds">
        <ellipse
          v-for="(p, i) in speckle"
          :key="i"
          :cx="p.x"
          :cy="p.y"
          rx="2"
          ry="3.4"
          :transform="`rotate(${p.a} ${p.x} ${p.y})`"
          fill="#ffe9a0"
        />
      </g>
      <g v-else :fill="c.lo" opacity="0.3">
        <circle v-for="(p, i) in speckle" :key="i" :cx="p.x" :cy="p.y" :r="p.r" />
      </g>
      <ellipse cx="72" cy="52" rx="13" ry="22" transform="rotate(-28 72 52)" fill="#fff" opacity="0.3" />
      <circle cx="58" cy="84" r="4" fill="#fff" opacity="0.28" />

      <!-- accessoires : tige, feuille, couronne… -->
      <template v-if="kind === 'solaire'">
        <path d="M100 26 Q100 14 109 9" class="stem" />
      </template>
      <template v-else-if="kind === 'comete'">
        <path
          d="M100 52 L86 34 L96 44 L100 26 L104 44 L114 34 Z M100 52 L76 46 L92 46 M100 52 L124 46 L108 46"
          fill="#4fbf7a"
          stroke="#2f8f56"
          stroke-width="1.5"
          stroke-linejoin="round"
        />
      </template>
      <template v-else-if="kind === 'prairie'">
        <path d="M100 38 Q100 24 108 16" class="stem" />
        <path d="M106 24 q16 -16 34 -6 q-10 16 -34 6z" class="leaf" />
      </template>
      <template v-else-if="kind === 'lagon'">
        <path d="M100 24 Q100 12 108 8" class="stem" />
        <path d="M104 14 q16 -14 32 -4 q-10 14 -32 4z" class="leaf" />
      </template>
      <template v-else-if="kind === 'nuage'">
        <path
          d="M100 30 L92 24 L96 34 L86 34 L94 40 L100 46 L106 40 L114 34 L104 34 L108 24 Z"
          fill="#3b2f9a"
          opacity="0.85"
        />
      </template>
      <template v-else>
        <path d="M100 34 Q100 22 108 14" class="stem" />
        <path d="M106 22 q16 -16 34 -6 q-10 16 -34 6z" class="leaf" />
        <g v-for="(f, i) in [[62, 46], [50, 60], [70, 34]]" :key="i" :transform="`translate(${f[0]} ${f[1]})`">
          <circle
            v-for="k in 5"
            :key="k"
            :cx="Math.cos(((k - 1) * 72 - 90) * 0.01745) * 5"
            :cy="Math.sin(((k - 1) * 72 - 90) * 0.01745) * 5"
            r="3.6"
            fill="#fff"
          />
          <circle r="2.4" fill="#ffd166" />
        </g>
      </template>

      <!-- le visage -->
      <g :transform="`translate(0 ${c.faceDy})`">
        <circle cx="64" cy="114" r="8.5" class="cheek" />
        <circle cx="136" cy="114" r="8.5" class="cheek" />
        <path d="M67 82 Q78 75 89 81 M111 81 Q122 75 133 82" class="brow" :stroke="c.lo" />
        <g class="eyes">
          <g v-for="x in [78, 122]" :key="x" :transform="`translate(${x} 99)`">
            <ellipse rx="9" ry="10.5" fill="#23160f" />
            <circle cx="-2.6" cy="-3.6" r="3.4" fill="#fff" />
            <circle cx="3.2" cy="3.6" r="1.5" fill="#fff" opacity="0.8" />
          </g>
        </g>
        <template v-if="c.mouth === 'o'">
          <ellipse cx="100" cy="128" rx="7" ry="9" fill="#7a1f2b" />
          <ellipse cx="100" cy="133" rx="4.5" ry="3.4" fill="#ff8a9a" />
        </template>
        <template v-else-if="c.mouth === 'grin'">
          <path d="M80 117 Q100 154 120 117 Z" fill="#7a1f2b" />
          <path d="M88 133 Q100 143 112 133 Q100 128 88 133 Z" fill="#ff8a9a" />
          <path d="M82.5 117 H117.5 Q116 124 100 124 Q84 124 82.5 117 Z" fill="#fff" />
        </template>
        <template v-else>
          <path d="M85 118 Q100 148 115 118 Q100 124 85 118 Z" fill="#7a1f2b" />
          <path d="M92 132 Q100 141 108 132 Q100 128 92 132 Z" fill="#ff8a9a" />
          <rect x="94" y="118.5" width="5.6" height="6" rx="1.4" fill="#fff" />
          <rect x="100.4" y="118.5" width="5.6" height="6" rx="1.4" fill="#fff" />
        </template>
      </g>
    </g>
  </svg>
</template>

<script setup lang="ts">
// ---------------------------------------------------------------------------
// Personnage-fruit : un fruit-tête, habillé comme un enfant — salopette en
// jean, t-shirt rayé, baskets — avec l'emblème du parfum sur la poche. Un par
// boisson. Dessiné en SVG (pas de raster) : aucune image à charger, il suit
// n'importe quelle taille, et bouge en CSS seulement (souffle, clignement,
// bras qui saluent), coupé sous prefers-reduced-motion.
//
// Le composant rend un <svg> autonome : on le pose dans du HTML avec une
// largeur, ou dans un autre SVG avec x / y / width / height.
// ---------------------------------------------------------------------------

type Kind = 'solaire' | 'comete' | 'prairie' | 'lagon' | 'nuage' | 'aurore'
type Pose = 'stand' | 'wave' | 'cheer'

const props = withDefaults(
  defineProps<{
    kind: Kind
    pose?: Pose
    /** Décalage des animations, en secondes : évite des personnages synchrones. */
    delay?: number
  }>(),
  { pose: 'stand', delay: 0 }
)

const uid = useId()

interface Look {
  head: string
  hi: string
  mid: string
  lo: string
  tee: string
  shoe: string
  emblem: 'sun' | 'star' | 'leaf' | 'wave' | 'cloud' | 'sunrise'
  mouth: 'smile' | 'grin' | 'o'
  /** Décalage vertical du visage, pour les silhouettes dont le ventre est plus bas. */
  faceDy: number
  /** Graines (fraise) plutôt que pores (autres fruits). */
  seeds?: boolean
}

const LOOKS: Record<Kind, Look> = {
  // Mangue : œuf haut, comme le modèle du client.
  solaire: {
    head: 'M100 22 C140 22 164 62 162 106 C160 150 134 172 100 172 C66 172 40 150 38 106 C36 62 60 22 100 22 Z',
    hi: '#ffe27a', mid: '#ffb92e', lo: '#f08a1c',
    tee: '#e84a4a', shoe: '#3b6fd0', emblem: 'sun', mouth: 'smile', faceDy: 0
  },
  // Fraise : large en haut, pointue en bas.
  comete: {
    head: 'M100 174 C62 168 36 120 40 80 C43 46 78 36 100 48 C122 36 157 46 160 80 C164 120 138 168 100 174 Z',
    hi: '#ff9db8', mid: '#ff4f79', lo: '#c41f50',
    tee: '#ff4f79', shoe: '#7b6cf6', emblem: 'star', mouth: 'grin', faceDy: 6, seeds: true
  },
  // Pomme : ronde, creusée au sommet.
  prairie: {
    head: 'M100 40 C84 28 40 34 38 92 C36 148 68 174 100 166 C132 174 164 148 162 92 C160 34 116 28 100 40 Z',
    hi: '#c6f08a', mid: '#5fc46e', lo: '#2f8f56',
    tee: '#4fbf7a', shoe: '#e8b93a', emblem: 'leaf', mouth: 'smile', faceDy: 2
  },
  // Poire : fine en haut, ventrue en bas.
  lagon: {
    head: 'M100 20 C116 20 122 44 128 64 C134 84 160 98 160 130 C160 162 132 174 100 174 C68 174 40 162 40 130 C40 98 66 84 72 64 C78 44 84 20 100 20 Z',
    hi: '#f4f6a0', mid: '#cfe45a', lo: '#86b83a',
    tee: '#2fc4c0', shoe: '#2fc4c0', emblem: 'wave', mouth: 'o', faceDy: 18
  },
  // Myrtille : ronde, couronnée.
  nuage: {
    head: 'M100 28 C140 28 162 60 162 100 C162 140 138 172 100 172 C62 172 38 140 38 100 C38 60 60 28 100 28 Z',
    hi: '#b9b0ff', mid: '#7b6cf6', lo: '#4a3cc4',
    tee: '#7b6cf6', shoe: '#ffd166', emblem: 'cloud', mouth: 'smile', faceDy: 2
  },
  // Pêche : pomme joufflue, fleur de sureau dans les cheveux.
  aurore: {
    head: 'M100 36 C86 24 44 32 40 90 C36 146 66 174 100 172 C134 174 164 146 160 90 C156 32 114 24 100 36 Z',
    hi: '#ffe0c0', mid: '#ffb07a', lo: '#ff7a5c',
    tee: '#ffb03d', shoe: '#e8534a', emblem: 'sunrise', mouth: 'grin', faceDy: 2
  }
}

const SEEDS: Record<Kind, number> = { solaire: 11, comete: 23, prairie: 37, lagon: 41, nuage: 53, aurore: 67 }

const c = computed(() => LOOKS[props.kind])

// Pores ou graines : points tirés dans la silhouette, hors de la zone du visage.
const speckle = computed(() => {
  const rnd = mulberry32(SEEDS[props.kind])
  const n = c.value.seeds ? 16 : 26
  const pts: { x: number; y: number; r: number; a: number }[] = []
  for (let guard = 0; pts.length < n && guard < 600; guard++) {
    const a = rnd() * Math.PI * 2
    const r = Math.sqrt(rnd())
    const x = 100 + Math.cos(a) * r * 54
    const y = 96 + Math.sin(a) * r * 62
    if (x > 52 && x < 148 && y > 72 && y < 140) continue
    pts.push({ x: +x.toFixed(1), y: +y.toFixed(1), r: 0.8 + rnd() * 0.9, a: Math.round(rnd() * 180) })
  }
  return pts
})

// Angle de chaque bras au repos (positif = vers l'extérieur à gauche, négatif à droite).
const arms = computed(() => {
  // Levés à 125–135° plutôt qu'à la verticale : le bras reste hors de la tête.
  if (props.pose === 'cheer') return { l: 135, r: -135 }
  if (props.pose === 'wave') return { l: 6, r: -125 }
  return { l: 6, r: -6 }
})
</script>

<style scoped>
.buddy {
  display: block;
  overflow: visible;
}
.buddy__shadow {
  fill: #000;
  opacity: 0.16;
}

/* --- vêtements ------------------------------------------------------------ */
.seam {
  stroke: rgba(0, 0, 0, 0.22);
  stroke-width: 1.2;
  stroke-linejoin: round;
}
.stitch {
  fill: none;
  stroke: #9fc0ee;
  stroke-width: 1.2;
  stroke-dasharray: 3 2.4;
  stroke-linecap: round;
}
.pocket {
  fill: #3f6fb5;
  stroke: #9fc0ee;
  stroke-width: 1.2;
  stroke-dasharray: 3 2.4;
}
.strap {
  fill: none;
  stroke: #3f6fb5;
  stroke-width: 8;
  stroke-linecap: round;
}
.button {
  fill: #f0b43c;
  stroke: #b9821a;
  stroke-width: 1;
}
.limb {
  fill: none;
  stroke-width: 10;
  stroke-linecap: round;
}
.lace {
  fill: none;
  stroke: #fff;
  stroke-width: 1.6;
  stroke-linecap: round;
}
.wave {
  fill: none;
  stroke: #9ef0e6;
  stroke-width: 2.4;
  stroke-linecap: round;
}
.ray {
  fill: none;
  stroke: #ffb92e;
  stroke-width: 1.6;
  stroke-linecap: round;
}

/* --- fruit ---------------------------------------------------------------- */
.stem {
  fill: none;
  stroke: #6b4a2b;
  stroke-width: 5;
  stroke-linecap: round;
}
.leaf {
  fill: #4fbf7a;
  stroke: #2f8f56;
  stroke-width: 1.5;
  stroke-linejoin: round;
}
.cheek {
  fill: #ff6a5c;
  opacity: 0.35;
}
.brow {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
}

/* --- mouvement ------------------------------------------------------------ */
.buddy__body {
  animation: buddy-bob 3.2s ease-in-out var(--delay) infinite alternate;
}
.arm {
  transform-origin: 0 0;
}
.arm--l {
  transform: rotate(var(--al));
}
.arm--r {
  transform: rotate(var(--ar));
}
.arm--l.is-up {
  animation: buddy-wag-l 1.1s ease-in-out var(--delay) infinite alternate;
}
.arm--r.is-up {
  animation: buddy-wag-r 1.1s ease-in-out var(--delay) infinite alternate;
}
.eyes {
  transform-origin: 100px 99px;
  animation: buddy-blink 5.2s ease-in-out var(--delay) infinite;
}

@keyframes buddy-bob {
  to {
    transform: translateY(-4px);
  }
}
@keyframes buddy-wag-l {
  from {
    transform: rotate(calc(var(--al) - 12deg));
  }
  to {
    transform: rotate(calc(var(--al) + 12deg));
  }
}
@keyframes buddy-wag-r {
  from {
    transform: rotate(calc(var(--ar) + 12deg));
  }
  to {
    transform: rotate(calc(var(--ar) - 12deg));
  }
}
@keyframes buddy-blink {
  0%,
  94%,
  100% {
    transform: scaleY(1);
  }
  97% {
    transform: scaleY(0.08);
  }
}

@media (prefers-reduced-motion: reduce) {
  .buddy__body,
  .arm,
  .eyes {
    animation: none;
  }
}
</style>
