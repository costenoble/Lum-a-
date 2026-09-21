<template>
  <div class="build">
    <svg
      class="build__svg"
      viewBox="0 0 600 900"
      role="img"
      :aria-labelledby="`${uid}-title`"
      preserveAspectRatio="xMidYMid meet"
    >
      <title :id="`${uid}-title`">
        Une bouteille Luméa se construit : les fruits sont pressés, le jus remplit le verre,
        l’étiquette se pose, puis le bouchon scelle la bouteille.
      </title>

      <defs>
        <clipPath :id="`${uid}-glass`">
          <path :d="GLASS" />
        </clipPath>
        <radialGradient :id="`${uid}-apricot`" cx="35%" cy="30%" r="80%">
          <stop offset="0" :stop-color="drink.color2" />
          <stop offset="1" :stop-color="drink.color" />
        </radialGradient>
        <linearGradient :id="`${uid}-mango`" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#9bd66b" />
          <stop offset="0.35" :stop-color="drink.color2" />
          <stop offset="1" :stop-color="drink.color" />
        </linearGradient>
        <linearGradient :id="`${uid}-depth`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#000" stop-opacity="0" />
          <stop offset="1" stop-color="#000" stop-opacity="0.16" />
        </linearGradient>
        <linearGradient :id="`${uid}-wrap`" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#000" stop-opacity="0.16" />
          <stop offset="0.2" stop-color="#000" stop-opacity="0" />
          <stop offset="0.8" stop-color="#000" stop-opacity="0" />
          <stop offset="1" stop-color="#000" stop-opacity="0.16" />
        </linearGradient>
      </defs>

      <!-- Halo : grossit à mesure que la bouteille se remplit. -->
      <g :transform="`translate(300 560) scale(${f.halo})`">
        <circle r="270" :fill="drink.color2" opacity="0.28" />
        <circle r="190" :fill="drink.color2" opacity="0.34" />
      </g>

      <!-- Ombre au sol -->
      <ellipse cx="300" cy="880" rx="140" ry="12" class="shadow" />

      <!-- La presse : cadre, plateau mobile, fruits. Sort par le haut à l'étape 3. -->
      <g :transform="`translate(0 ${f.pressShift})`">
        <!-- fruits, écrasés depuis le plateau du bas -->
        <g :transform="`translate(300 165) scale(${f.fruitSx} ${f.fruitSy}) translate(-300 -165)`">
          <circle cx="255" cy="129" r="36" :fill="`url(#${uid}-apricot)`" class="outline" />
          <path d="M255 94 C245 115 245 145 255 164" class="crease" />
          <path d="M258 93 q12 -22 32 -15 q-7 19 -32 15z" class="leaf" />
          <ellipse
            cx="350"
            cy="129"
            rx="45"
            ry="36"
            transform="rotate(-12 350 129)"
            :fill="`url(#${uid}-mango)`"
            class="outline"
          />
          <path d="M338 96 q-14 30 -2 66" class="crease" />
        </g>

        <!-- montants + plateau du bas + bec -->
        <rect x="172" y="-300" width="14" height="485" rx="5" class="metal" />
        <rect x="414" y="-300" width="14" height="485" rx="5" class="metal" />
        <rect x="160" y="165" width="280" height="20" rx="9" class="metal" />
        <path d="M284 185 H316 L308 203 H292 Z" class="metal" />

        <!-- plateau du haut + tige -->
        <g :transform="`translate(0 ${f.plateY})`">
          <rect x="288" y="-300" width="24" height="340" class="metal" />
          <rect x="186" y="40" width="228" height="30" rx="8" class="metal" />
          <rect x="196" y="47" width="208" height="7" rx="3.5" class="band" />
        </g>
      </g>

      <!-- Gouttes qui giclent pendant le pressage -->
      <circle
        v-for="(drop, i) in f.drops"
        :key="i"
        :cx="drop.x"
        :cy="drop.y"
        :r="drop.r"
        :fill="drink.color"
        :opacity="drop.o"
      />

      <!-- La bouteille, posée à y = BOTTLE_Y -->
      <g :transform="`translate(0 ${BOTTLE_Y})`">
        <!-- verre, fond -->
        <path :d="GLASS" class="glass" />

        <!-- jus -->
        <g :clip-path="`url(#${uid}-glass)`">
          <path :d="f.waveBack" :fill="drink.color2" opacity="0.7" />
          <path :d="f.waveFront" :fill="drink.color" />
          <rect x="190" :y="f.surface" width="220" height="600" :fill="`url(#${uid}-depth)`" />
        </g>

        <!-- collerette + contour du verre -->
        <rect x="268" y="86" width="64" height="14" rx="6" class="glass" />
        <path :d="GLASS" class="glass-line" />

        <!-- étiquette : glisse depuis la droite, se cintre en arrivant -->
        <g
          :opacity="f.labelOpacity"
          :transform="`translate(${f.labelDx} 0) translate(300 0) scale(${f.labelSx} 1) translate(-300 0)`"
        >
          <rect x="206" y="430" width="188" height="215" rx="14" class="label" />
          <g :transform="`translate(300 492)`">
            <circle r="24" :fill="drink.color" class="outline-thin" />
            <path
              v-for="n in 8"
              :key="n"
              d="M0 -32 V-42"
              class="ray"
              :transform="`rotate(${(n - 1) * 45})`"
            />
          </g>
          <text x="300" y="578" class="label__brand">{{ site.name }}</text>
          <text x="300" y="602" class="label__name">{{ drink.name.toUpperCase() }}</text>
          <text x="300" y="622" class="label__fruit">{{ drink.fruit }}</text>
          <rect x="206" y="430" width="188" height="215" rx="14" :fill="`url(#${uid}-wrap)`" />
        </g>

        <!-- reflets du verre -->
        <path d="M222 350 V650" class="shine" />
        <path d="M222 672 V690" class="shine" />

        <!-- bouchon : tombe d'en haut en tournant -->
        <g
          :opacity="f.capOpacity"
          :transform="`translate(0 ${f.capY}) rotate(${f.capRot} 300 90)`"
        >
          <rect x="265" y="62" width="70" height="56" rx="10" class="cap" />
          <path
            v-for="x in [279, 291, 303, 315, 327]"
            :key="x"
            :d="`M${x} 72 V108`"
            class="cap__ridge"
          />
        </g>
      </g>

      <!-- Le jus qui coule du bec jusqu'à la surface -->
      <rect
        v-if="f.streamH > 0.5"
        x="296"
        :y="f.streamTop"
        width="8"
        :height="f.streamH"
        rx="4"
        :fill="drink.color"
      />

      <!-- Pastille finale -->
      <g :transform="`translate(486 350) rotate(12) scale(${f.badge})`" :opacity="f.badgeOpacity">
        <circle r="54" class="badge" />
        <text y="-14" class="badge__small">PRÊT EN</text>
        <text y="22" class="badge__big">48 h</text>
      </g>

      <!-- Étincelles -->
      <path
        v-for="(spark, i) in f.sparks"
        :key="i"
        :d="spark.d"
        :transform="`translate(${spark.x} ${spark.y}) scale(${spark.k})`"
        :class="i % 2 ? 'spark spark--alt' : 'spark'"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
// ---------------------------------------------------------------------------
// La bouteille se construit au scroll, en illustration SVG.
//
// Aucune animation ici : le composant ne fait que traduire `progress` (0 → 1,
// fourni par FabricationScene) en attributs SVG. Rien à démarrer, rien à
// nettoyer, et `progress = 1` (reduced motion) donne directement la bouteille
// terminée.
//
//   0.00 – 0.25   Presser     le plateau descend, les fruits s'écrasent
//   0.25 – 0.50   Remplir     le jus coule, le niveau monte dans le verre
//   0.50 – 0.75   Étiqueter   la presse s'efface, l'étiquette se colle
//   0.75 – 1.00   Sceller     le bouchon tombe, la pastille « 48 h » apparaît
//
// Les coordonnées de la presse sont en repère du dessin (600 × 900). Celles de
// la bouteille sont locales, décalées de BOTTLE_Y : le col en haut (y = 90),
// le fond en bas (y = 732).
// ---------------------------------------------------------------------------

const props = defineProps<{ progress: number }>()

const uid = useId()
const drink = useDrink('solaire')!

const BOTTLE_Y = 140

const GLASS =
  'M274 90 H326 V190 C326 230 400 250 400 320 V690 Q400 732 358 732 H242 Q200 732 200 690 V320 C200 250 274 230 274 190 Z'

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
const ramp = (a: number, b: number) => clamp((props.progress - a) / (b - a))
const easeOut = (t: number) => 1 - (1 - t) ** 3
const easeIn = (t: number) => t ** 3
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
const easeOutBack = (t: number) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2

// Gouttes qui giclent des bords de la presse : départ, dérive, instant d'apparition.
const DROPS = [
  { x: 196, dx: -40, r: 6, at: 0.075 },
  { x: 404, dx: 44, r: 7, at: 0.085 },
  { x: 190, dx: -70, r: 5, at: 0.105 },
  { x: 410, dx: 76, r: 5, at: 0.115 },
  { x: 200, dx: -24, r: 4.5, at: 0.135 },
  { x: 400, dx: 30, r: 4.5, at: 0.145 }
]

// Étoile à quatre branches, centrée sur l'origine, mise à l'échelle par `k`.
const STAR = 'M0 -1 Q0 0 1 0 Q0 0 0 1 Q0 0 -1 0 Q0 0 0 -1Z'
const SPARKS = [
  { x: 110, y: 380, size: 18 },
  { x: 505, y: 560, size: 14 },
  { x: 130, y: 720, size: 12 },
  { x: 480, y: 800, size: 16 }
]

// Vague : segments de 60 de large qui alternent creux et crête, soit une
// période de 120. Décaler le tracé d'un multiple de 120 le laisse identique,
// d'où une ondulation continue quel que soit le sens du scroll.
function wave(y: number, amp: number, shift: number) {
  const x0 = -60
  let d = `M${x0 + shift} ${y} Q${x0 + shift + 30} ${y - amp} ${x0 + shift + 60} ${y}`
  for (let i = 2; i <= 10; i++) d += ` T${x0 + shift + i * 60} ${y}`
  return `${d} V780 H${x0 + shift} Z`
}

const f = computed(() => {
  // 1 — pressage
  const plateY = 81 * easeInOut(ramp(0.02, 0.2))
  const fruitSy = clamp((95 - plateY) / 72, 0.19, 1)
  const fruitSx = 1 + (1 - fruitSy) * 0.45
  const drops = DROPS.map((d) => {
    const u = ramp(d.at, d.at + 0.1)
    return {
      x: d.x + d.dx * u,
      y: 152 - 46 * u + 130 * u * u,
      r: d.r * (1 - 0.4 * u),
      o: u <= 0 || u >= 1 ? 0 : 1 - u ** 3
    }
  })

  // 2 — remplissage
  const grow = easeOut(ramp(0.19, 0.26))
  const fill = easeInOut(ramp(0.24, 0.48))
  const retract = easeInOut(ramp(0.47, 0.52))
  const surface = 745 - (745 - 150) * fill
  const surfaceG = BOTTLE_Y + surface
  const streamTop = 200 + (surfaceG - 200) * retract
  const streamH = 200 + (surfaceG - 200) * grow - streamTop
  const amp = 2 + 6 * (1 - ramp(0.44, 0.52))
  const phase = (props.progress * 900) % 120

  // 3 — étiquette
  const pressShift = -430 * easeIn(ramp(0.53, 0.64))
  const label = easeOut(ramp(0.6, 0.74))

  // 4 — bouchon, pastille, étincelles
  const capT = ramp(0.76, 0.86)
  const cap = easeOut(capT)
  const badgeT = ramp(0.86, 0.94)

  return {
    halo: 0.72 + 0.28 * easeOut(ramp(0, 0.5)),
    plateY,
    fruitSx,
    fruitSy,
    drops,
    surface,
    streamTop,
    streamH,
    waveFront: wave(surface, amp, phase),
    waveBack: wave(surface - 5, amp, (phase + 40) % 120),
    pressShift,
    labelOpacity: clamp(label * 3),
    labelDx: 330 * (1 - label),
    labelSx: 0.55 + 0.45 * label,
    capY: -230 * (1 - cap),
    capRot: -14 * (1 - cap),
    capOpacity: clamp(capT * 6),
    badge: easeOutBack(badgeT),
    badgeOpacity: clamp(badgeT * 5),
    sparks: SPARKS.map((s, i) => ({
      d: STAR,
      x: s.x,
      y: s.y,
      k: s.size * easeOutBack(ramp(0.88 + i * 0.025, 0.96 + i * 0.01))
    }))
  }
})
</script>

<style scoped>
/* La scène occupe tout le bloc collant. Sur grand écran, la légende vit en bas
   à gauche : la bouteille se centre dans ce qui reste à droite. Sur mobile, la
   légende passe sous la bouteille, qui garde le haut de l'écran. */
.build {
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  padding: calc(var(--header-h) + 0.5rem) var(--pad-inline) 17rem;
  /* Le bras de la presse vient d'au-dessus de l'écran : on l'estompe sous le
     header pour qu'il ne se superpose pas aux liens de navigation. */
  --fade: linear-gradient(
    to bottom,
    transparent calc(var(--header-h) - 1.5rem),
    #000 calc(var(--header-h) + 1.5rem)
  );
  mask-image: var(--fade);
  -webkit-mask-image: var(--fade);
}
.build__svg {
  width: 100%;
  height: 100%;
  /* L'étiquette entre par la droite, hors du dessin : elle doit rester visible. */
  overflow: visible;
}
@media (min-width: 900px) {
  .build {
    /* Le bas laisse respirer la barre de progression de la légende. */
    padding: calc(var(--header-h) + 1rem) var(--pad-inline) 6.5rem 42%;
  }
}

/* --- traits communs : encre épaisse, aplats francs ------------------------ */
.shadow {
  fill: var(--ink);
  opacity: 0.12;
}
.outline {
  stroke: var(--ink);
  stroke-width: 4;
}
.outline-thin {
  stroke: var(--ink);
  stroke-width: 3;
}
.crease {
  fill: none;
  stroke: var(--ink);
  stroke-width: 3;
  stroke-linecap: round;
  opacity: 0.35;
}
.leaf {
  fill: #4fbf7a;
  stroke: var(--ink);
  stroke-width: 3;
  stroke-linejoin: round;
}
.metal {
  fill: var(--ink);
}
.band {
  fill: var(--accent);
}

/* --- verre ---------------------------------------------------------------- */
.glass {
  fill: rgba(255, 255, 255, 0.55);
  stroke: none;
}
.glass-line {
  fill: none;
  stroke: var(--ink);
  stroke-width: 4;
  stroke-linejoin: round;
}
.shine {
  fill: none;
  stroke: #fff;
  stroke-width: 9;
  stroke-linecap: round;
  opacity: 0.6;
}

/* --- étiquette ------------------------------------------------------------ */
.label {
  fill: #fffaf0;
  stroke: var(--ink);
  stroke-width: 3;
}
.ray {
  fill: none;
  stroke: var(--ink);
  stroke-width: 4;
  stroke-linecap: round;
}
.label__brand {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 36px;
  letter-spacing: -0.03em;
  text-anchor: middle;
  fill: var(--ink);
}
.label__name {
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.2em;
  text-anchor: middle;
  fill: var(--accent);
}
.label__fruit {
  font-family: var(--font-mono);
  font-size: 11px;
  text-anchor: middle;
  fill: var(--ink-soft);
}

/* --- bouchon, pastille, étincelles ---------------------------------------- */
.cap {
  fill: var(--accent);
  stroke: var(--ink);
  stroke-width: 4;
}
.cap__ridge {
  fill: none;
  stroke: var(--ink);
  stroke-width: 3;
  stroke-linecap: round;
  opacity: 0.35;
}
.badge {
  fill: var(--ink);
}
.badge__small {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.16em;
  text-anchor: middle;
  fill: var(--paper);
}
.badge__big {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 34px;
  letter-spacing: -0.03em;
  text-anchor: middle;
  fill: var(--accent);
}
.spark {
  fill: var(--accent);
}
.spark--alt {
  fill: var(--ink);
}
</style>
