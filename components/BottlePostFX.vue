<template>
  <EffectComposer>
    <!-- Léger halo sur les hautes lumières (le reflet du verre, la capsule
         métal) : c'est ce qui manque le plus à un rendu WebGL brut pour
         qu'il lise comme un vrai produit fini plutôt qu'une démo technique. -->
    <BloomPmndrs :intensity="0.45" :luminance-threshold="0.55" :luminance-smoothing="0.3" mipmap-blur />

    <!-- Assombrit très légèrement les coins : concentre l'œil sur la
         bouteille sans qu'on remarque consciemment l'effet. -->
    <VignettePmndrs :offset="0.32" :darkness="0.38" />

    <!-- Aberration chromatique à peine perceptible sur les bords : c'est le
         détail qui différencie un rendu « propre mais plat » d'un rendu qui a
         l'air d'être passé par un vrai objectif. -->
    <ChromaticAberrationPmndrs :offset="chromaOffset" />

    <!-- Un grain très fin évite l'aplat numérique typique du dégradé sur le
         verre et la surface du liquide. -->
    <NoisePmndrs :premultiply="true" :blend-function="BlendFunction.OVERLAY" />
  </EffectComposer>
</template>

<script setup lang="ts">
import { EffectComposer, BloomPmndrs, VignettePmndrs, ChromaticAberrationPmndrs, NoisePmndrs } from '@tresjs/post-processing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'

// ---------------------------------------------------------------------------
// Post-traitement partagé par le hero et la page fabrication. Volontairement
// discret : le but n'est pas un effet qu'on remarque, mais l'absence de la
// planéité numérique qui trahit un rendu WebGL brut. Chaque valeur a été
// choisie pour rester sous le seuil de perception consciente.
// ---------------------------------------------------------------------------

const chromaOffset = new Vector2(0.0006, 0.0006)
</script>
