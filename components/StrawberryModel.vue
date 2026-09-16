<template>
  <TresGroup :scale="scaleVector">
    <TresMesh :geometry="body">
      <TresMeshPhysicalMaterial
        :color="color"
        :vertex-colors="true"
        :roughness="0.28"
        :metalness="0"
        :clearcoat="1"
        :clearcoat-roughness="0.06"
      />
    </TresMesh>

    <TresMesh :geometry="seeds">
      <TresMeshStandardMaterial :color="SEED_COLOR" :roughness="0.35" :metalness="0" />
    </TresMesh>

    <TresMesh :geometry="calyx">
      <TresMeshPhysicalMaterial
        :color="LEAF_COLOR"
        :roughness="0.32"
        :metalness="0"
        :clearcoat="0.5"
        :clearcoat-roughness="0.15"
      />
    </TresMesh>
  </TresGroup>
</template>

<script setup lang="ts">
import { useTresContext } from '@tresjs/core'
import { Vector3 } from 'three'

// ---------------------------------------------------------------------------
// Fraise entièrement procédurale — aucun glb, aucune texture à charger, comme
// la bouteille. Le corps prend la couleur passée en prop : la même géométrie
// sert donc à n'importe quel parfum (le dégradé vers la pointe est cuit en
// couleurs de sommets, en niveaux de gris, et vient multiplier cette teinte).
//
// `progress` ne change rien au modèle, qui est fixe : il ne sert qu'à réclamer
// une nouvelle image tant qu'il varie. En `render-mode="on-demand"`, déplacer
// la caméra dans StrawberryStage ne suffit pas à lui seul à redemander un
// rendu — sans cette pompe, le canevas se fige après la première image.
// ---------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    progress?: number
    /** Couleur du fruit : rouge fraise par défaut, mais suit le parfum. */
    color?: string
    /** Le corps mesure ~1,55 unité de haut ; 1,6 le porte à l'échelle de la scène. */
    scale?: number
  }>(),
  { color: '#e5342e', scale: 1.6 }
)

const SEED_COLOR = '#edd06a'
const LEAF_COLOR = '#3fbd33'

// Les types de TresJS exigent un Vector3, pas le scalaire accepté à l'exécution.
const scaleVector = computed(() => new Vector3().setScalar(props.scale))

const { renderer } = useTresContext()

// Construites une fois pour toutes : rien ici ne dépend du scroll.
const seedDirs = seedDirections()
const body = strawberryBodyGeometry(seedDirs)
const seeds = seedsGeometry(seedDirs)
const calyx = calyxGeometry()

watch(() => props.progress, () => renderer.invalidate(), { immediate: true })

onBeforeUnmount(() => {
  body.dispose()
  seeds.dispose()
  calyx.dispose()
})
</script>
