<template>
  <primitive v-if="field" :object="field" />
</template>

<script setup lang="ts">
import { useTresContext } from '@tresjs/core'
import { Box3, Group, Vector3, type Mesh, type MeshStandardMaterial, type Texture } from 'three'

// ---------------------------------------------------------------------------
// Le couloir de bananes traversé par la caméra.
//
// Pourquoi un champ plutôt qu'un fruit unique : la texture est bakée en
// 2048 px pour 19 cm de fruit (~8 300 px/m). Dès que la banane déborde du
// cadre, on l'agrandit au-delà de ce que la texture contient et la peau
// devient molle — c'est arithmétique, aucun réglage ne le rattrape. En
// dispersant une douzaine d'exemplaires en profondeur, on n'a plus jamais
// besoin d'en grossir un seul : celles qui frôlent l'objectif sont hors focus
// (le flou devient un parti pris de mise au point, pas un défaut de finesse),
// et il y en a toujours une à bonne distance, nette et plein cadre.
//
// Les exemplaires partagent géométrie et matériaux via `clone()` : douze
// appels de rendu, une seule copie en mémoire.
// ---------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    progress?: number
    /** Longueur d'un fruit dans la scène. Le glb est à l'échelle réelle (19,2 cm). */
    length?: number
  }>(),
  { length: 3.4 }
)

const MODEL_URL = '/models/banane/banane.glb'

/**
 * Position, orientation et taille de chaque exemplaire, le long du couloir que
 * la caméra descend (z décroissant). L'écartement latéral est volontairement
 * irrégulier : une grille régulière se lit immédiatement comme telle. Les
 * `scale` légèrement différents cassent la répétition d'un même objet.
 */
const PLACEMENTS: readonly { pos: [number, number, number]; rot: [number, number, number]; scale: number }[] = [
  { pos: [-0.6, 0.3, 4], rot: [0.2, 0.35, 0.1], scale: 1 },
  { pos: [3.4, 1.6, 0.5], rot: [-0.3, 1.1, 0.5], scale: 0.92 },
  { pos: [-3.8, -1.2, -3], rot: [0.5, -0.6, -0.35], scale: 1.05 },
  { pos: [0.9, 2.4, -6.5], rot: [-0.15, 2.2, 0.25], scale: 0.88 },
  { pos: [-2.4, -2.2, -10], rot: [0.35, 0.8, 0.6], scale: 1 },
  { pos: [3.9, 0.4, -13.5], rot: [-0.45, -1.4, -0.2], scale: 0.95 },
  { pos: [-1.1, 1.9, -17], rot: [0.25, 0.15, -0.5], scale: 1.08 },
  { pos: [2.6, -1.8, -20.5], rot: [-0.2, 1.8, 0.4], scale: 0.9 },
  { pos: [-3.5, 0.8, -24], rot: [0.4, -0.35, 0.15], scale: 1 },
  { pos: [0.4, -0.5, -27.5], rot: [-0.1, 0.5, -0.25], scale: 1.04 },
  { pos: [3.2, 2.1, -31], rot: [0.3, -1.9, 0.45], scale: 0.93 },
  { pos: [-0.8, -1.6, -34.5], rot: [-0.35, 0.95, -0.4], scale: 1 }
]

const { renderer } = useTresContext()
const field = shallowRef<Group | null>(null)

onMounted(async () => {
  const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
    import('three/examples/jsm/loaders/GLTFLoader.js'),
    import('three/examples/jsm/libs/meshopt_decoder.module.js')
  ])

  const loader = new GLTFLoader()
  // Le décodeur ne coûte rien s'il ne sert pas : il reste branché pour pouvoir
  // repasser sur une version compressée meshopt sans y retoucher.
  loader.setMeshoptDecoder(MeshoptDecoder)
  const gltf = await loader.loadAsync(MODEL_URL)

  // Sans anisotropie, une texture vue de biais devient une bouillie — et dans
  // un couloir, presque tous les fruits sont vus de biais.
  const instance = renderer.instance as import('three').WebGLRenderer | undefined
  const maxAnisotropy = instance?.capabilities.getMaxAnisotropy() ?? 1
  gltf.scene.traverse((child) => {
    const mesh = child as Mesh
    if (!mesh.isMesh) return
    const material = mesh.material as MeshStandardMaterial
    for (const value of Object.values(material)) {
      if (value && typeof value === 'object' && 'isTexture' in value) {
        const texture = value as Texture
        texture.anisotropy = maxAnisotropy
        texture.needsUpdate = true
      }
    }
  })

  // Le modèle est centré sur l'origine côté Blender : seule l'échelle change,
  // la banane passant de ses 19 cm réels à la taille de la scène.
  const size = new Box3().setFromObject(gltf.scene).getSize(new Vector3())
  const base = props.length / (size.x || 1)

  const group = new Group()
  for (const { pos, rot, scale } of PLACEMENTS) {
    const copy = gltf.scene.clone()
    copy.position.set(...pos)
    copy.rotation.set(...rot)
    copy.scale.setScalar(base * scale)
    group.add(copy)
  }

  field.value = group
  renderer.invalidate()
})

watch(() => props.progress, () => renderer.invalidate(), { immediate: true })

onBeforeUnmount(() => {
  // `clone()` partage géométrie et matériaux : les libérer une seule fois
  // suffit, et le faire par exemplaire reviendrait à disposer douze fois les
  // mêmes ressources.
  const seen = new Set<object>()
  field.value?.traverse((child) => {
    const mesh = child as Mesh
    if (!mesh.isMesh) return
    if (!seen.has(mesh.geometry)) {
      seen.add(mesh.geometry)
      mesh.geometry.dispose()
    }
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const material of materials) {
      if (seen.has(material)) continue
      seen.add(material)
      for (const value of Object.values(material)) {
        if (value && typeof value === 'object' && 'isTexture' in value) {
          ;(value as { dispose: () => void }).dispose()
        }
      }
      material.dispose()
    }
  })
})
</script>
