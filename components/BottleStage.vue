<template>
  <TresCanvas
    :alpha="true"
    :clear-alpha="0"
    :antialias="true"
    :tone-mapping="ACESFilmicToneMapping"
    :tone-mapping-exposure="0.95"
    render-mode="on-demand"
    :dpr="dpr"
  >
    <TresPerspectiveCamera :position="cameraPosition" :fov="cameraFov" :look-at="cameraLookAt" />

    <!-- Studio : une clé chaude, un contre-jour teinté par le parfum, une
         nappe froide de remplissage. Ce sont les deux premières qui posent les
         longs reflets verticaux du packshot. -->
    <TresDirectionalLight :position="keyLight" :intensity="2.6" />
    <TresDirectionalLight :position="rimLight" :intensity="2.2" :color="color2" />
    <TresDirectionalLight :position="fillLight" :intensity="1.1" />

    <StudioEnvironment />

    <!-- Ombre de contact : sans elle la bouteille flotte dans le vide du
         studio, surtout aux cadrages larges du début et de la fin. La texture
         est créée côté client (canvas), donc le mesh n'apparaît qu'une fois
         montée. -->
    <TresMesh v-if="groundTexture" :position="groundPosition" :rotation-x="-Math.PI / 2">
      <TresCircleGeometry :args="groundArgs" />
      <TresMeshBasicMaterial :map="groundTexture" :transparent="true" :depth-write="false" />
    </TresMesh>

    <BottleModel :color="color" :color2="color2" :name="name" :progress="progress" />

    <BottlePostFX v-if="postfx" />
  </TresCanvas>
</template>

<script setup lang="ts">
import { ACESFilmicToneMapping, CanvasTexture, Vector3 } from 'three'
import { clamp01, groundShadowTexture } from '~/utils/bottle3d'

// ---------------------------------------------------------------------------
// Le décor : caméra, lumières, environnement. Séparé du modèle pour que le
// hero et la page fabrication partagent exactement la même mise en lumière.
//
// `render-mode="on-demand"` : la scène ne se redessine que lorsqu'une valeur
// change, donc au scroll — pas soixante fois par seconde pour rien.
//
// `alpha` autorise la transparence, mais c'est `clear-alpha` qui l'applique :
// sans lui, TresJS efface le canvas en noir opaque et la bouteille se retrouve
// sur un rectangle noir au milieu du papier.
//
// L'environnement vient de RoomEnvironment (StudioEnvironment) plutôt que du
// `<Environment preset>` de cientos : ce dernier télécharge un HDRI distant,
// alors que le verre n'a besoin ici que de reflets doux et prévisibles.
// ---------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    color?: string
    color2?: string
    name?: string
    progress?: number
    /** Recul de la caméra : plus grand = bouteille plus petite dans le cadre. */
    distance?: number
    /** Bloom + vignette + grain léger. Coupe-circuit pour un profilage rapide. */
    postfx?: boolean
  }>(),
  {
    color: '#ff8a3d',
    color2: '#ffd166',
    name: 'Luméa',
    progress: 1,
    distance: 7.9,
    postfx: true
  }
)

// TresJS accepte la notation en tableau à l'exécution, mais ses types exigent
// des Vector3 : on les crée une fois plutôt qu'à chaque rendu.
const dpr = [1, 1.5] as const
const keyLight = new Vector3(3.2, 3, 3.4)
const rimLight = new Vector3(-3.4, 1.2, -2.2)
const fillLight = new Vector3(-2.4, -1, 3)

const groundArgs = [1.35, 48] as const
const groundPosition = new Vector3(0, -1.51, 0)
// Canvas : ne peut être créé que côté client, jamais pendant le SSR.
const groundTexture = ref<CanvasTexture | null>(null)
onMounted(() => {
  groundTexture.value = groundShadowTexture()
})
onBeforeUnmount(() => groundTexture.value?.dispose())

// ---------------------------------------------------------------------------
// Caméra cinématique : quatre plans calés sur les mêmes bornes que les gestes
// de BottleModel (fruits, remplissage, étiquette, capsule). Le dernier point
// (t: 1) reproduit exactement l'ancien cadrage fixe — c'est ce qui garde
// BottleCanvas (progress toujours à 1) identique à avant, alors que la page
// fabrication traverse tout le trajet pendant le scroll.
// ---------------------------------------------------------------------------
type Vec3Tuple = [number, number, number]
interface CamKey {
  t: number
  pos: Vec3Tuple
  fov: number
  look: Vec3Tuple
}

const keyframes = computed<CamKey[]>(() => [
  // Plan large d'entrée, légèrement surélevé.
  { t: 0, pos: [3.2, 2.2, props.distance + 2.4], fov: 34, look: [0, 0.9, 0] },
  // Gros plan sur le goulot pendant la chute des fruits.
  { t: 0.16, pos: [1.1, 1.85, 4.6], fov: 20, look: [0, 1.55, 0] },
  // Recul de l'autre côté pour voir le niveau monter dans la bouteille entière.
  { t: 0.42, pos: [-2.6, 0.35, props.distance + 0.3], fov: 28, look: [0, -0.1, 0] },
  // Rapprochement sur la bande d'étiquette pendant qu'elle s'enroule.
  { t: 0.68, pos: [2.35, -0.15, 5.4], fov: 23, look: [0, -0.55, 0] },
  // Retour exact au cadrage par défaut pour la capsule et la suite de la page.
  { t: 1, pos: [0, 0.1, props.distance], fov: 30, look: [0, 0, 0] }
])

function smootherstep(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10)
}
function lerpVec3(a: Vec3Tuple, b: Vec3Tuple, t: number): Vec3Tuple {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

const camSample = computed(() => {
  const p = clamp01(props.progress)
  const frames = keyframes.value
  for (let i = 0; i < frames.length - 1; i++) {
    const a = frames[i]!
    const b = frames[i + 1]!
    if (p >= a.t && p <= b.t) {
      const e = smootherstep((p - a.t) / (b.t - a.t))
      return { pos: lerpVec3(a.pos, b.pos, e), fov: a.fov + (b.fov - a.fov) * e, look: lerpVec3(a.look, b.look, e) }
    }
  }
  return frames[frames.length - 1]!
})

const cameraPosition = computed(() => new Vector3(...camSample.value.pos))
const cameraLookAt = computed(() => new Vector3(...camSample.value.look))
const cameraFov = computed(() => camSample.value.fov)
</script>
