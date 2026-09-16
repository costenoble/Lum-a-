<template>
  <TresGroup :rotation-y="spin">
    <!-- verre -->
    <TresMesh>
      <TresLatheGeometry :args="glassArgs" />
      <TresMeshPhysicalMaterial
        :color="'#ffffff'"
        :transmission="1"
        :thickness="0.3"
        :roughness="0.05"
        :ior="1.45"
        :metalness="0"
        :clearcoat="0.25"
        :clearcoat-roughness="0.1"
        :side="DoubleSide"
      />
    </TresMesh>

    <!-- liquide : un solide plein, coupé par un plan horizontal dont la
         hauteur fait le niveau — aucune géométrie n'est reconstruite -->
    <TresMesh>
      <TresLatheGeometry :args="liquidArgs" />
      <TresMeshPhysicalMaterial
        :color="color"
        :roughness="0.14"
        :clipping-planes="clipPlanes"
        :side="DoubleSide"
      />
    </TresMesh>

    <!-- surface du liquide : un disque calé sur le niveau. C'est lui qui donne
         la sensation de remplissage — sans surface, le plan de coupe ne montre
         qu'une coque creuse et la bouteille paraît vide. -->
    <TresMesh
      :geometry="surfaceGeometry"
      :position-y="level"
      :rotation-x="-Math.PI / 2"
      :scale="surfaceScale"
      :visible="filling"
    >
      <TresMeshPhysicalMaterial
        :color="color"
        :roughness="0.12"
        :metalness="0"
        :bump-map="surfaceBump"
        :bump-scale="0.006"
        :clearcoat="0.85"
        :clearcoat-roughness="0.1"
        :side="DoubleSide"
      />
    </TresMesh>

    <!-- jet : il coule du goulot jusqu'à la surface pendant le remplissage -->
    <TresMesh :position-y="streamY" :scale="streamScale" :visible="pouring">
      <TresCylinderGeometry :args="streamArgs" />
      <!-- Opaque à dessein : la passe de transmission du verre ne collecte que
           la géométrie opaque. Un jet translucide serait tout simplement
           invisible derrière la bouteille. -->
      <TresMeshPhysicalMaterial
        :color="color"
        :roughness="0.06"
        :metalness="0"
        :clearcoat="0.6"
      />
    </TresMesh>

    <!-- éclaboussure : petit dôme aplati à l'endroit où le jet frappe la
         surface, sans lequel le jet a juste l'air de se planter dans un gel. -->
    <TresMesh :position-y="level" :scale="splashScale" :visible="pouring">
      <TresSphereGeometry :args="splashArgs" />
      <TresMeshPhysicalMaterial
        :color="color"
        :roughness="0.1"
        :metalness="0"
        :clearcoat="0.7"
        :transparent="true"
        :opacity="0.85"
      />
    </TresMesh>

    <!-- étiquette : elle s'enroule en ne dessinant qu'une part de ses faces -->
    <TresMesh ref="labelRef" :position-y="BOTTLE.labelY" :visible="labelVisible">
      <TresCylinderGeometry :args="labelArgs" />
      <TresMeshStandardMaterial
        :map="labelMap"
        :roughness="0.85"
        :metalness="0"
        :side="DoubleSide"
        :transparent="true"
      />
    </TresMesh>

    <!-- capsule -->
    <TresMesh :position-y="capY" :rotation-y="capSpin" :visible="capVisible">
      <TresCylinderGeometry :args="capArgs" />
      <TresMeshStandardMaterial :color="color2" :metalness="1" :roughness="0.28" />
    </TresMesh>

    <!-- fruits : ils tombent dans le goulot et s'y écrasent. Groupe plutôt
         que simple sphère, pour porter la queue et permettre l'écrasement. -->
    <TresGroup
      v-for="fruit in fruits"
      :key="fruit.index"
      :position="fruit.position"
      :scale="fruit.scale"
      :visible="fruit.visible"
    >
      <TresMesh :geometry="fruitGeometries[fruit.index]" :rotation-x="fruit.spin">
        <TresMeshStandardMaterial
          :color="fruit.color"
          :map="fruitSkin.map"
          :bump-map="fruitSkin.bump"
          :bump-scale="0.012"
          :roughness="0.55"
        />
      </TresMesh>
      <TresMesh :position-y="0.2" :rotation-z="0.3">
        <TresCylinderGeometry :args="stemArgs" />
        <TresMeshStandardMaterial :color="'#4a7c3f'" :roughness="0.7" />
      </TresMesh>
    </TresGroup>

  </TresGroup>
</template>

<script setup lang="ts">
import { Color, DoubleSide, Plane, Vector3 } from 'three'
import { useTresContext } from '@tresjs/core'

// ---------------------------------------------------------------------------
// La bouteille, déclarée en TresJS. Toute l'animation dérive d'une seule
// valeur : `progress`, de 0 (rien) à 1 (bouteille finie). Le hero la laisse à
// 1, la page fabrication la branche sur le scroll.
// ---------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    color?: string
    color2?: string
    name?: string
    /** 0 → bouteille vide et nue, 1 → bouteille finie. */
    progress?: number
  }>(),
  { color: '#ff8a3d', color2: '#ffd166', name: 'Luméa', progress: 1 }
)

// Bornes des quatre gestes — les mêmes que les légendes de /fabrication.
const STEPS = {
  fruits: [0.0, 0.28],
  juice: [0.3, 0.64],
  label: [0.56, 0.84],
  cap: [0.8, 1.0]
} as const

// Tous les `args` sont figés hors du template : un tableau littéral dans le
// template crée une nouvelle référence à chaque rendu, TresJS croit que la
// géométrie a changé, la reconstruit, ce qui déclenche un rendu — et ainsi de
// suite. La page se bloquait avant même d'atteindre WebGL.
const glassArgs = [glassProfile(), 64] as const
const liquidArgs = [liquidProfile(), 48] as const
// Cylindre unitaire en hauteur, ouvert : l'échelle Y en fait la longueur du
// jet. Plus large en haut qu'en bas : un jet qui tombe accélère, donc se
// resserre — l'inverse se lisait comme une tige de verre plutôt qu'un filet.
const streamArgs = [0.065, 0.03, 1, 20, 1, true] as const
const splashArgs = [0.1, 16, 12] as const
const labelArgs = [
  BOTTLE.labelRadius,
  BOTTLE.labelRadius,
  BOTTLE.labelHeight,
  96,
  1,
  true
] as const
const capArgs = [0.215, 0.215, 0.22, 48] as const
const stemArgs = [0.022, 0.022, 0.12, 8] as const

const labelMap = labelTexture(props.name, props.color)
const fruitSkin = fruitSkinTextures()
const surfaceBump = liquidSurfaceBump()

// Une sphère parfaite, même texturée, trahit tout de suite « c'est une bille »
// dès que la caméra s'approche (elle le fait, pendant la chute). Chaque fruit
// a donc sa propre géométrie légèrement bosselée, construite une fois.
const fruitGeometries = [0, 1, 2].map((i) => fruitGeometry(0.2, i * 2.7))

// Disque à anneaux concentriques (rayon unitaire, mis à l'échelle comme
// avant) : sans subdivision radiale, impossible de faire onduler la surface
// autrement qu'en le peignant en faux relief.
const RIPPLE_RINGS = 10
const RIPPLE_SEGMENTS = 48
const surfaceGeometry = rippleDiscGeometry(RIPPLE_RINGS, RIPPLE_SEGMENTS)

// Le plan de coupe est un objet Three mutable : on ne le remplace jamais, on
// déplace sa constante. Le matériau garde donc la même référence.
const clip = new Plane(new Vector3(0, -1, 0), levelFor(0))
const clipPlanes = [clip]

const { renderer } = useTresContext()

const span = (range: readonly [number, number], p: number) =>
  clamp01((p - range[0]) / (range[1] - range[0]))
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

const spin = computed(() => -0.42 + props.progress * 0.84)

// Remplissage : niveau, disque de surface et jet en découlent tous.
const juiceFill = computed(() => easeOut(span(STEPS.juice, props.progress)))
const level = computed(() => levelFor(juiceFill.value))
const filling = computed(() => juiceFill.value > 0.001)
const surfaceScale = computed(() => {
  const r = liquidRadiusAt(level.value)
  return new Vector3(r, r, 1)
})

// Le jet ne coule que tant que le niveau monte, et s'arrête net à la fin.
const pouring = computed(() => juiceFill.value > 0.001 && juiceFill.value < 0.995)
const streamTop = BOTTLE.top - 0.22
// Le scroll sert de source de « temps » : `progress` n'avance jamais vraiment
// tout seul, donc c'est la seule variable qui puisse faire vibrer un jet ou
// pulser une éclaboussure sans passer en rendu continu.
const pourPulse = computed(() => Math.sin(props.progress * 130))
const streamScale = computed(() => {
  const h = Math.max(streamTop - level.value, 0.01)
  const wobble = pourPulse.value * 0.12
  return new Vector3(1 + wobble, h, 1 - wobble)
})
const streamY = computed(() => (streamTop + level.value) / 2)

// Éclaboussure à l'impact du jet sur la surface : un dôme aplati qui pulse
// légèrement, sans quoi le jet a l'air de simplement se poser sur un bouchon
// de gel plutôt que de heurter un liquide.
const splashScale = computed(() => {
  const pulse = 1 + pourPulse.value * 0.35
  return new Vector3(pulse, 0.22 * pulse, pulse)
})

// Onde qui part du centre du disque (là où le jet tombe) et s'atténue vers le
// bord — une phase différente du jet/de l'éclaboussure pour que les trois
// n'aient pas l'air de battre en rythme parfaitement synchronisé.
const ripplePhase = computed(() => props.progress * 90)
const rippleAmplitude = computed(() => (pouring.value ? 0.05 : 0))

const labelFill = computed(() => easeOut(span(STEPS.label, props.progress)))
const labelVisible = computed(() => labelFill.value > 0)

const capFill = computed(() => easeOut(span(STEPS.cap, props.progress)))
const capVisible = computed(() => capFill.value > 0)
const capY = computed(() => BOTTLE.capY + (1 - capFill.value) * 1.15)
const capSpin = computed(() => (1 - capFill.value) * Math.PI * 4)

// Une vraie sphère parfaite lit comme une bille : chaque fruit a sa propre
// silhouette légèrement ovale et sa propre nuance, fixées une fois pour
// toutes plutôt que randomisées à chaque rendu.
const FRUIT_VARIANTS = [
  { natural: [1, 0.94, 1.05], hue: -0.035 },
  { natural: [0.96, 1.03, 0.97], hue: 0.02 },
  { natural: [1.05, 0.9, 1], hue: -0.012 }
] as const

const fruitColors = computed(() =>
  FRUIT_VARIANTS.map((v) => new Color(props.color).offsetHSL(0, 0, v.hue))
)

// Chaque fruit a sa propre fenêtre à l'intérieur de l'étape « presser », donc
// aucun ne traîne à l'écran une fois le remplissage commencé. Il tombe en
// accélérant, puis s'écrase dans le goulot au lieu de disparaître.
const FRUIT_DROP = 0.16
const fruits = computed(() =>
  [0, 1, 2].map((index) => {
    const [from, to] = STEPS.fruits
    const start = from + index * 0.055
    const t = clamp01((props.progress - start) / FRUIT_DROP)
    const fall = t * t // chute accélérée, pas linéaire
    const squash = clamp01((t - 0.78) / 0.22)
    const flat = 1 - squash * 0.8
    const wide = 1 + squash * 0.25
    const fade = 1 - clamp01((t - 0.94) / 0.06)
    const natural = FRUIT_VARIANTS[index]!.natural
    return {
      index,
      // Départ calé sur le haut du cadre : la caméra ne voit qu'environ
      // 2,1 unités au-dessus du centre, un fruit lâché plus haut tombe hors champ.
      position: new Vector3((index - 1) * 0.17, 1.94 - fall * 0.52, 0),
      spin: fall * 1.6,
      scale: new Vector3(
        wide * fade * natural[0],
        flat * fade * natural[1],
        wide * fade * natural[2]
      ),
      color: fruitColors.value[index]!,
      visible: t > 0 && t < 1 && props.progress < to + 0.02
    }
  })
)

const labelRef = ref<{ geometry: import('three').BufferGeometry } | null>(null)

onMounted(() => {
  // Le découpage du liquide passe par un plan local : sans ce drapeau, le
  // rendu l'ignore et la bouteille paraît pleine dès le départ.
  const instance = renderer.instance as import('three').WebGLRenderer | undefined
  if (instance) instance.localClippingEnabled = true
})

// Les choses qui ne se déclarent pas dans le template : la hauteur du plan de
// coupe, le nombre de triangles dessinés pour l'étiquette, et l'ondulation de
// la surface — toutes trois mutent une géométrie existante plutôt que d'en
// recréer une, donc rien ne notifie Vue ; c'est cet invalidate qui redemande
// une image en mode « on-demand ».
watch(
  () => props.progress,
  () => {
    clip.constant = level.value

    const geometry = labelRef.value?.geometry
    if (geometry?.index) {
      const triangles = Math.floor((geometry.index.count / 3) * labelFill.value)
      geometry.setDrawRange(0, triangles * 3)
    }

    applySurfaceRipple(surfaceGeometry, RIPPLE_RINGS, RIPPLE_SEGMENTS, ripplePhase.value, rippleAmplitude.value)

    renderer.invalidate()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  labelMap.dispose()
  fruitSkin.map.dispose()
  fruitSkin.bump.dispose()
  surfaceBump.dispose()
  surfaceGeometry.dispose()
  fruitGeometries.forEach((g) => g.dispose())
})
</script>
