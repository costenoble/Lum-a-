<!-- Composant sans rendu : il ne doit produire aucun nœud dans le graphe de
     TresJS, qui tenterait d'en faire un objet 3D. Un commentaire est ignoré. -->
<template><!-- studio --></template>

<script setup lang="ts">
import { PMREMGenerator } from 'three'
import { useTresContext } from '@tresjs/core'

// ---------------------------------------------------------------------------
// Environnement de studio généré localement : RoomEnvironment de Three.js
// passée au PMREM. Aucun fichier HDRI à télécharger, et des reflets doux qui
// suffisent à faire lire le verre comme du verre.
// ---------------------------------------------------------------------------

const { scene, renderer } = useTresContext()

let dispose: (() => void) | null = null

onMounted(async () => {
  const instance = renderer.instance as import('three').WebGLRenderer | undefined
  if (!instance || !scene.value) return

  const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js')
  const pmrem = new PMREMGenerator(instance)
  const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

  // La transmission du verre coûte une passe de rendu complète par image :
  // la calculer à moitié résolution divise ce coût par quatre, sans que ça se
  // voie sur un objet aussi flou en arrière-plan.
  if ('transmissionResolutionScale' in instance) {
    ;(instance as { transmissionResolutionScale: number }).transmissionResolutionScale = 0.5
  }

  scene.value.environment = envMap
  // L'environnement sert aux reflets, pas à éclairer : trop fort, il délave la
  // couleur du jus.
  if ('environmentIntensity' in scene.value) scene.value.environmentIntensity = 0.75
  renderer.invalidate()

  dispose = () => {
    envMap.dispose()
    pmrem.dispose()
  }
})

onBeforeUnmount(() => dispose?.())
</script>
