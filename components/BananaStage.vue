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
    <!-- Plans de coupe serrés sur le couloir. Le `far` par défaut de Three se
         compte en milliers d'unités : le tampon de profondeur y perd toute
         précision utile, et la profondeur de champ n'a alors presque rien à
         lire. Borné au couloir, l'effet retrouve de la matière. -->
    <TresPerspectiveCamera
      :position="cameraPosition"
      :fov="30"
      :near="0.3"
      :far="60"
      :look-at="cameraLookAt"
    />

    <TresDirectionalLight :position="keyLight" :intensity="1.5" />
    <TresDirectionalLight :position="rimLight" :intensity="1.1" :color="'#ffe2a8'" />
    <TresDirectionalLight :position="fillLight" :intensity="0.5" />

    <StudioEnvironment />

    <BananaField :progress="progress" />

    <BottlePostFX
      v-if="postfx"
      :bloom="true"
      :bloom-intensity="0.16"
      :bloom-threshold="0.92"
      :vignette="true"
      :dof="true"
      :dof-focus-distance="FOCUS_AHEAD"
      :dof-focus-range="1.6"
      :dof-bokeh-scale="5"
    />
  </TresCanvas>
</template>

<script setup lang="ts">
import { ACESFilmicToneMapping, Vector3 } from 'three'
import { clamp01 } from '~/utils/bottle3d'

// ---------------------------------------------------------------------------
// Traversée du couloir de bananes. La caméra avance en continu — aucun arrêt,
// aucune orbite — et c'est le défilement qui la fait descendre dans l'axe du
// couloir. L'immersion vient d'être *dedans* et du parallaxe entre les plans,
// pas de la proximité au sujet.
//
// Le point clé est la mise au point : elle reste fixée à une distance
// constante **devant** la caméra. Les fruits qui la croisent de près sont donc
// hors focus (premier plan flou, comme à la prise de vue réelle) et ceux du
// fond aussi ; il n'y a de net que ce qui se présente à la bonne distance.
// C'est ce qui règle le problème de finesse : on ne grossit plus jamais une
// texture au-delà de ce qu'elle contient, et le flou devient un choix de
// cadrage plutôt qu'un manque.
// ---------------------------------------------------------------------------

const props = withDefaults(defineProps<{ progress?: number; postfx?: boolean }>(), {
  progress: 0,
  postfx: true
})

const dpr = [1, 1.5] as const
const keyLight = new Vector3(3.2, 2.6, 3)
const rimLight = new Vector3(-3, 1.4, -2.6)
const fillLight = new Vector3(-2.2, -0.8, 2.6)

/** Distance de netteté, constante devant la caméra. */
const FOCUS_AHEAD = 7.5

/** Départ et arrivée de la traversée, le long du couloir. */
const TRAVEL_FROM = 10
const TRAVEL_TO = -30

// Dérive latérale et verticale : sans elle, la traversée est un rail et tous
// les fruits défilent au même endroit de l'écran. Deux sinusoïdes de périodes
// différentes suffisent à faire serpenter la caméra sans jamais la faire
// revenir sur ses pas.
function driftX(t: number) {
  return Math.sin(t * Math.PI * 1.6) * 1.9
}
function driftY(t: number) {
  return Math.sin(t * Math.PI * 1.1 + 0.6) * 1.2
}

const cameraPosition = computed(() => {
  const t = clamp01(props.progress)
  return new Vector3(driftX(t), driftY(t), TRAVEL_FROM + (TRAVEL_TO - TRAVEL_FROM) * t)
})

// La caméra vise toujours droit devant, à la distance de netteté : c'est ce
// qui garde le sujet net au centre pendant que le reste file sur les côtés.
// Toujours un nouveau Vector3 — TresJS ne réappelle `camera.lookAt()` que si
// la référence change, une instance figée ne le déclenche qu'au premier rendu.
const cameraLookAt = computed(() => {
  const t = clamp01(props.progress)
  const ahead = Math.min(t + 0.05, 1)
  return new Vector3(driftX(ahead), driftY(ahead), cameraPosition.value.z - FOCUS_AHEAD)
})
</script>
