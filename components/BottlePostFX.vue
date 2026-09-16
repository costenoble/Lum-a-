<template>
  <!-- La profondeur de champ lit la profondeur de la scène : sans ce tampon,
       l'effet est bien monté mais ne floute rien du tout. -->
  <EffectComposerPmndrs :depth-buffer="dof">
    <!-- Léger halo sur les hautes lumières. Sur un sujet clair et uniformément
         lumineux, monter le seuil est indispensable : sinon toute la surface
         dépasse et le sujet se retrouve délavé. -->
    <BloomPmndrs
      v-if="bloom"
      :intensity="bloomIntensity"
      :luminance-threshold="bloomThreshold"
      :luminance-smoothing="0.3"
      mipmap-blur
    />

    <!-- Assombrit légèrement les coins : concentre l'œil sans qu'on remarque
         consciemment l'effet. -->
    <VignettePmndrs v-if="vignette" :offset="vignetteOffset" :darkness="vignetteDarkness" />

    <!-- Aberration chromatique. À garder minuscule : au-delà, elle frange les
         contours de couleur au lieu d'évoquer un objectif. -->
    <ChromaticAberrationPmndrs v-if="chroma" :offset="chromaOffset" />

    <!-- Profondeur de champ, focus donné en unités monde donc calé sur la
         distance réelle caméra → sujet. Au-delà du rendu « passé par un
         objectif », elle rend le flou intentionnel : ce qui sort de la zone
         nette ne se lit plus comme un manque de finesse. -->
    <DepthOfFieldPmndrs
      v-if="dof"
      :world-focus-distance="dofFocusDistance"
      :world-focus-range="dofFocusRange"
      :bokeh-scale="dofBokehScale"
    />

    <!-- Grain. Aucun réglage d'intensité côté librairie : c'est le mode de
         fusion qui dose. OVERLAY est très marqué, SOFT_LIGHT reste discret. -->
    <NoisePmndrs v-if="grain" :premultiply="true" :blend-function="BlendFunction.SOFT_LIGHT" />
  </EffectComposerPmndrs>
</template>

<script setup lang="ts">
// EffectComposerPmndrs, pas EffectComposer : les effets `*Pmndrs` s'enregistrent
// auprès du premier via une injection que le second ne fournit pas. Avec le
// mauvais parent, ils se montent sans erreur — Vue signale seulement
// « injection "Symbol(effectComposerPmndrs)" not found » — et aucun effet n'est
// appliqué. Le rendu reste correct, juste brut, ce qui rend la panne facile à
// ne pas voir : c'est resté ainsi longtemps, valeurs réglées à l'aveugle.
import { EffectComposerPmndrs, BloomPmndrs, VignettePmndrs, ChromaticAberrationPmndrs, NoisePmndrs, DepthOfFieldPmndrs } from '@tresjs/post-processing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'

// ---------------------------------------------------------------------------
// Post-traitement partagé. Chaque effet est éteint par défaut : ils n'ont
// jamais tourné jusqu'ici, donc « tout activer » changerait l'aspect de scènes
// que personne n'a demandé à retoucher. Chaque scène allume ce dont elle a
// besoin, avec des valeurs vérifiées à l'écran.
// ---------------------------------------------------------------------------

withDefaults(
  defineProps<{
    bloom?: boolean
    bloomIntensity?: number
    bloomThreshold?: number
    vignette?: boolean
    vignetteOffset?: number
    vignetteDarkness?: number
    chroma?: boolean
    grain?: boolean
    dof?: boolean
    /** Distance de netteté, en unités monde (= distance caméra → sujet). */
    dofFocusDistance?: number
    /** Épaisseur de la zone nette, en unités monde. */
    dofFocusRange?: number
    dofBokehScale?: number
  }>(),
  {
    bloom: false,
    bloomIntensity: 0.2,
    bloomThreshold: 0.88,
    vignette: false,
    vignetteOffset: 0.35,
    vignetteDarkness: 0.35,
    chroma: false,
    grain: false,
    dof: false,
    dofFocusDistance: 7.5,
    dofFocusRange: 2.2,
    dofBokehScale: 3.4
  }
)

const chromaOffset = new Vector2(0.0005, 0.0005)
</script>
