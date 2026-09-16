<template>
  <primitive v-if="field" :object="field" />
</template>

<script setup lang="ts">
import { useTresContext } from '@tresjs/core'
import {
  Box3,
  Group,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type Mesh,
  type MeshStandardMaterial,
  type Object3D,
  type Texture
} from 'three'

// ---------------------------------------------------------------------------
// Le couloir de fruits traversé par la caméra : des bananes, et des fraises
// glissées entre elles.
//
// Pourquoi un champ plutôt qu'un fruit unique : les textures sont bakées en
// 2048 px pour ~19 cm de banane (~8 300 px/m). Dès qu'un fruit déborde du
// cadre, on l'agrandit au-delà de ce que la texture contient et la peau
// devient molle — c'est arithmétique, aucun réglage ne le rattrape. En
// dispersant une douzaine d'exemplaires en profondeur, on n'a plus jamais
// besoin d'en grossir un seul : ceux qui frôlent l'objectif sont hors focus
// (le flou devient un parti pris de mise au point, pas un défaut de finesse),
// et il y en a toujours un à bonne distance, net et plein cadre.
//
// Les exemplaires partagent géométrie et matériaux via `clone()` : deux
// chargements seulement, quel que soit le nombre de fruits affichés.
// ---------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    progress?: number
    /** Longueur d'une banane dans la scène. Le glb est à l'échelle réelle (19,2 cm). */
    bananaLength?: number
    /** Hauteur d'une fraise. Gardée petite : c'est sa taille réelle face à une banane. */
    strawberrySize?: number
  }>(),
  { bananaLength: 3.4, strawberrySize: 1.25 }
)

const BANANA_URL = '/models/banane/banane.glb'
const STRAWBERRY_URL = '/models/fraise/fraise.glb'
const STRAWBERRY_COLOR_URL = '/models/fraise/fraise_color.png'
/** Le calice de la fraise n'a aucune couleur exportée par Blender : glTF
    retombe sur du blanc, d'où ce vert posé à la main. */
const CALYX_GREEN = '#5a8a42'

/**
 * Position, orientation et taille de chaque fruit, le long du couloir que la
 * caméra descend (z décroissant).
 *
 * Les écarts latéraux ne sont pas décoratifs : la caméra suit une dérive
 * sinusoïdale au milieu du couloir, et un fruit planté trop près de ce chemin
 * se fait littéralement traverser — le plan de coupe rapproché le tranche
 * alors net, ce qui se lit comme un bug d'affichage. Chaque position est donc
 * tenue à au moins ~2,9 unités du passage de la caméra, pour un rayon de
 * fruit d'environ 1,7.
 */
const PLACEMENTS: readonly {
  kind: 'banana' | 'strawberry'
  pos: [number, number, number]
  rot: [number, number, number]
  scale: number
}[] = [
  { kind: 'banana', pos: [-1.6, -0.3, 4], rot: [0.2, 0.35, 0.1], scale: 1 },
  { kind: 'strawberry', pos: [2.6, 2.4, 2], rot: [0.3, 0.6, 0.2], scale: 1 },
  { kind: 'banana', pos: [4.6, 2.4, 0.5], rot: [-0.3, 1.1, 0.5], scale: 0.92 },
  { kind: 'banana', pos: [-3.8, -1.2, -3], rot: [0.5, -0.6, -0.35], scale: 1.05 },
  { kind: 'strawberry', pos: [-2.6, 1.4, -4.8], rot: [-0.2, 1.4, 0.35], scale: 1.1 },
  { kind: 'banana', pos: [-0.6, 3.2, -6.5], rot: [-0.15, 2.2, 0.25], scale: 0.88 },
  { kind: 'banana', pos: [-2.4, -2.2, -10], rot: [0.35, 0.8, 0.6], scale: 1 },
  { kind: 'strawberry', pos: [2.9, -1.1, -11.6], rot: [0.45, -0.7, -0.3], scale: 0.95 },
  { kind: 'banana', pos: [3.9, 0.4, -13.5], rot: [-0.45, -1.4, -0.2], scale: 0.95 },
  { kind: 'banana', pos: [-2.6, 3, -17], rot: [0.25, 0.15, -0.5], scale: 1.08 },
  { kind: 'strawberry', pos: [1.6, 2.4, -18.4], rot: [-0.35, 0.9, 0.15], scale: 1 },
  { kind: 'banana', pos: [2.6, -1.8, -20.5], rot: [-0.2, 1.8, 0.4], scale: 0.9 },
  { kind: 'banana', pos: [-4.08, 1.21, -24], rot: [0.4, -0.35, 0.15], scale: 1 },
  { kind: 'strawberry', pos: [-1.4, -2.3, -25.6], rot: [0.2, 1.7, -0.25], scale: 1.05 },
  { kind: 'banana', pos: [0.98, -0.43, -27.5], rot: [-0.1, 0.5, -0.25], scale: 1.04 },
  { kind: 'banana', pos: [3.2, 2.1, -31], rot: [0.3, -1.9, 0.45], scale: 0.93 },
  { kind: 'banana', pos: [-0.8, -1.6, -34.5], rot: [-0.35, 0.95, -0.4], scale: 1 }
]

const { renderer } = useTresContext()
const field = shallowRef<Group | null>(null)

/** Pousse l'anisotropie au maximum : sans elle, toute surface vue de biais —
    et dans un couloir, presque toutes le sont — part en bouillie. */
function sharpenTextures(root: Object3D, maxAnisotropy: number) {
  root.traverse((child) => {
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
}

/** Ramène un modèle importé à une taille donnée, sur sa plus grande dimension. */
function fitTo(root: Object3D, target: number) {
  const size = new Box3().setFromObject(root).getSize(new Vector3())
  return target / (Math.max(size.x, size.y, size.z) || 1)
}

onMounted(async () => {
  const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
    import('three/examples/jsm/loaders/GLTFLoader.js'),
    import('three/examples/jsm/libs/meshopt_decoder.module.js')
  ])

  const loader = new GLTFLoader()
  // Le décodeur ne coûte rien s'il ne sert pas : il reste branché pour pouvoir
  // repasser sur une version compressée meshopt sans y retoucher.
  loader.setMeshoptDecoder(MeshoptDecoder)

  const [banana, strawberry, strawberrySkin] = await Promise.all([
    loader.loadAsync(BANANA_URL),
    loader.loadAsync(STRAWBERRY_URL),
    new TextureLoader().loadAsync(STRAWBERRY_COLOR_URL)
  ])

  // Le glb de la banane est complet (couleur, rugosité, normales bakées). Celui
  // de la fraise ne porte que sa rugosité : la couleur se pose à la main.
  strawberrySkin.colorSpace = SRGBColorSpace
  strawberry.scene.traverse((child) => {
    const mesh = child as Mesh
    if (!mesh.isMesh) return
    const material = mesh.material as MeshStandardMaterial
    if (material.name === 'ChairFraise') {
      material.map = strawberrySkin
      // Le matériau n'avait aucune texture : Three doit recompiler son shader.
      material.needsUpdate = true
    } else if (material.name === 'Calice') {
      material.color.set(CALYX_GREEN)
    }
  })

  const instance = renderer.instance as import('three').WebGLRenderer | undefined
  const maxAnisotropy = instance?.capabilities.getMaxAnisotropy() ?? 1
  sharpenTextures(banana.scene, maxAnisotropy)
  sharpenTextures(strawberry.scene, maxAnisotropy)

  const base = {
    banana: fitTo(banana.scene, props.bananaLength),
    strawberry: fitTo(strawberry.scene, props.strawberrySize)
  }
  const source = { banana: banana.scene, strawberry: strawberry.scene }

  const group = new Group()
  for (const { kind, pos, rot, scale } of PLACEMENTS) {
    const copy = source[kind].clone()
    copy.position.set(...pos)
    copy.rotation.set(...rot)
    copy.scale.setScalar(base[kind] * scale)
    group.add(copy)
  }

  field.value = group
  renderer.invalidate()
})

watch(() => props.progress, () => renderer.invalidate(), { immediate: true })

onBeforeUnmount(() => {
  // `clone()` partage géométrie et matériaux : les libérer une seule fois
  // suffit, et le faire par exemplaire reviendrait à disposer plusieurs fois
  // les mêmes ressources.
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
