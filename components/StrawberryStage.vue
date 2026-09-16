<template>
  <TresCanvas
    :alpha="true"
    :clear-alpha="0"
    :antialias="true"
    :tone-mapping="ACESFilmicToneMapping"
    :tone-mapping-exposure="1.05"
    render-mode="on-demand"
    :dpr="dpr"
  >
    <TresPerspectiveCamera :position="cameraPosition" :fov="cameraFov" :look-at="cameraLookAt" />

    <TresDirectionalLight :position="keyLight" :intensity="2.4" />
    <TresDirectionalLight :position="rimLight" :intensity="2" :color="'#ffe2a8'" />
    <TresDirectionalLight :position="fillLight" :intensity="1" />

    <StudioEnvironment />

    <!-- Ombre de contact : même principe que sous la bouteille, la fraise
         flotterait sinon dans le vide du studio. -->
    <TresMesh v-if="groundTexture" :position="groundPosition" :rotation-x="-Math.PI / 2">
      <TresCircleGeometry :args="groundArgs" />
      <TresMeshBasicMaterial :map="groundTexture" :transparent="true" :depth-write="false" />
    </TresMesh>

    <StrawberryModel :progress="progress" />

    <BottlePostFX v-if="postfx" />
  </TresCanvas>
</template>

<script setup lang="ts">
import { ACESFilmicToneMapping, CanvasTexture, CatmullRomCurve3, Vector3 } from 'three'
import { clamp01, groundShadowTexture } from '~/utils/bottle3d'

// ---------------------------------------------------------------------------
// Le décor de la fraise : caméra, lumières, environnement — même structure
// que BottleStage, dont on réutilise directement StudioEnvironment,
// BottlePostFX et groundShadowTexture (rien de spécifique à la bouteille
// dans ces trois-là).
//
// La fraise elle-même ne bouge jamais : c'est la caméra qui parcourt une
// spline (CatmullRomCurve3) autour d'elle, à vitesse constante quel que soit
// l'espacement des points de passage (`getPointAt`, paramétrage par longueur
// d'arc — `getPoint` avancerait par saccades entre deux points proches).
// ---------------------------------------------------------------------------

const props = withDefaults(defineProps<{ progress?: number; postfx?: boolean }>(), {
  progress: 0,
  postfx: true
})

const dpr = [1, 1.5] as const
const keyLight = new Vector3(3.2, 2.6, 3)
const rimLight = new Vector3(-3, 1.4, -2.6)
const fillLight = new Vector3(-2.2, -0.8, 2.6)

const groundArgs = [2.4, 48] as const
const groundPosition = new Vector3(0, -1.62, 0)
const groundTexture = ref<CanvasTexture | null>(null)
onMounted(() => {
  groundTexture.value = groundShadowTexture()
})
onBeforeUnmount(() => groundTexture.value?.dispose())

// Sept points de passage formant un tour complet à hauteur et distance
// variables : une orbite plate serait lisible comme « caméra en pilote
// automatique », ce zigzag en hauteur donne le vol plutôt que la rotation.
const CAMERA_PATH = [
  new Vector3(5.6, 1.4, 2.4),
  new Vector3(3.2, 2.4, 5.4),
  new Vector3(-1.6, 0.6, 5.8),
  new Vector3(-5.4, -0.5, 1.6),
  new Vector3(-4.4, 2.6, -4.2),
  new Vector3(1.4, 1.6, -5.8),
  new Vector3(5.2, 0.4, -1.8)
]
const cameraCurve = new CatmullRomCurve3(CAMERA_PATH, false, 'catmullrom', 0.4)

// Champ de vision : large aux deux bouts (vue d'ensemble), plus serré au
// passage le plus proche du fruit (t≈0.32, le survol des grains).
const FOV_KEYS: readonly [number, number][] = [
  [0, 30],
  [0.32, 20],
  [0.6, 24],
  [1, 28]
]

function smootherstep(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function fovAt(t: number) {
  for (let i = 0; i < FOV_KEYS.length - 1; i++) {
    const [t0, f0] = FOV_KEYS[i]!
    const [t1, f1] = FOV_KEYS[i + 1]!
    if (t <= t1) return f0 + (f1 - f0) * smootherstep((t - t0) / (t1 - t0))
  }
  return FOV_KEYS[FOV_KEYS.length - 1]![1]
}

const cameraPosition = computed(() => cameraCurve.getPointAt(clamp01(props.progress)))
const cameraFov = computed(() => fovAt(clamp01(props.progress)))
// La cible ne bouge jamais (la fraise est fixe), mais doit tout de même
// rester un `computed` qui dépend de `progress` plutôt qu'une constante :
// TresJS ne réappelle `camera.lookAt()` que lorsque la référence passée à
// `look-at` change. Une même instance de Vector3 figée ne le redéclenche
// qu'au tout premier rendu — la caméra garde alors l'orientation de départ
// en se déplaçant, et sort du cadre dès qu'elle s'éloigne de sa position
// initiale. `void props.progress` force ce recalcul à chaque tick sans
// influencer la valeur elle-même.
const cameraLookAt = computed(() => {
  void props.progress
  return new Vector3(0, 0.15, 0)
})
</script>
