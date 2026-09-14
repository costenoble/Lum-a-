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
    <TresPerspectiveCamera :position="cameraPosition" :fov="30" :look-at="origin" />

    <!-- Studio : une clé chaude, un contre-jour teinté par le parfum, une
         nappe froide de remplissage. Ce sont les deux premières qui posent les
         longs reflets verticaux du packshot. -->
    <TresDirectionalLight :position="keyLight" :intensity="2.6" />
    <TresDirectionalLight :position="rimLight" :intensity="2.2" :color="color2" />
    <TresDirectionalLight :position="fillLight" :intensity="1.1" />

    <StudioEnvironment />

    <BottleModel :color="color" :color2="color2" :name="name" :progress="progress" />

    <BottlePostFX v-if="postfx" />
  </TresCanvas>
</template>

<script setup lang="ts">
import { ACESFilmicToneMapping, Vector3 } from 'three'

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
const origin = new Vector3(0, 0, 0)
const keyLight = new Vector3(3.2, 3, 3.4)
const rimLight = new Vector3(-3.4, 1.2, -2.2)
const fillLight = new Vector3(-2.4, -1, 3)
const cameraPosition = computed(() => new Vector3(0, 0.1, props.distance))
</script>
