import {
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  RepeatWrapping,
  SRGBColorSpace,
  SphereGeometry,
  Vector2,
  Vector3
} from 'three'

// ---------------------------------------------------------------------------
// Géométrie et constantes de la bouteille Luméa, partagées par le hero et la
// page fabrication. Le modèle lui-même est déclaré dans BottleModel.vue : ce
// fichier ne fournit que les données (profil, repères, texture d'étiquette).
//
// Silhouette calée sur un packshot de jus : corps droit, épaule courte, col
// long. Hauteur totale de 3 unités, centrée sur l'origine.
// ---------------------------------------------------------------------------

/** Profil en coupe (rayon, hauteur), mis en révolution par une LatheGeometry. */
const PROFILE: [number, number][] = [
  [0.0, -1.5],
  [0.34, -1.5],
  [0.38, -1.44],
  [0.38, 0.34],
  [0.375, 0.5],
  [0.32, 0.72],
  [0.22, 0.92],
  [0.17, 1.06],
  [0.17, 1.36],
  [0.19, 1.4],
  [0.19, 1.5]
]

export const BOTTLE = {
  top: 1.5,
  /** Hauteur maximale du liquide : juste sous l'épaule. */
  fillTop: 0.62,
  fillBottom: -1.5,
  labelY: -0.62,
  labelHeight: 0.62,
  labelRadius: 0.392,
  capY: 1.56
}

export const glassProfile = () => PROFILE.map(([x, y]) => new Vector2(x, y))

/** Même profil, resserré : le liquide ne touche pas la paroi. */
const INNER: [number, number][] = [
  ...PROFILE.filter(([, y]) => y <= 0.95).map(
    ([x, y]) => [Math.max(x - 0.05, 0), y] as [number, number]
  ),
  [0, 0.95]
]

export const liquidProfile = () => INNER.map(([x, y]) => new Vector2(x, y))

/**
 * Rayon intérieur à une hauteur donnée. Sert à dimensionner le disque de
 * surface : sans lui, le plan de coupe ne révélerait qu'une coque creuse, et
 * la bouteille aurait l'air vide même à moitié pleine.
 */
export function liquidRadiusAt(y: number) {
  for (let i = 0; i < INNER.length - 1; i++) {
    const [r1, y1] = INNER[i]!
    const [r2, y2] = INNER[i + 1]!
    if (y >= y1 && y <= y2) {
      const t = y2 === y1 ? 0 : (y - y1) / (y2 - y1)
      return r1 + (r2 - r1) * t
    }
  }
  return INNER[INNER.length - 1]![0]
}

/** Convertit un remplissage 0-1 en constante de plan de coupe. */
export function levelFor(fill: number) {
  return BOTTLE.fillBottom + (BOTTLE.fillTop - BOTTLE.fillBottom) * clamp01(fill)
}

/**
 * Étiquette dessinée en canvas : ni fichier image à charger, ni texture à
 * refaire quand la marque ou la couleur du parfum change.
 */
export function labelTexture(name: string, color: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 2048
  canvas.height = 512
  const c = canvas.getContext('2d')!

  c.fillStyle = '#f7f6f3'
  c.fillRect(0, 0, canvas.width, canvas.height)

  // Deux répétitions : la texture fait le tour de la bouteille, le nom reste
  // donc lisible même quand elle pivote.
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  for (let i = 0; i < 2; i++) {
    const x = canvas.width * ((i + 0.5) / 2)
    c.fillStyle = color
    c.font = '700 170px DynaPuff, Helvetica, sans-serif'
    c.fillText(name.toUpperCase(), x, 205)
    c.fillStyle = 'rgba(15,15,15,0.5)'
    c.font = '500 46px "JetBrains Mono", monospace'
    c.fillText('100 % FRUIT', x, 320)
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  // Sur un cylindre Three.js, u = 0 tombe pile face à la caméra : sans
  // décalage, c'est la couture de l'étiquette qu'on verrait de face et le nom
  // sur les côtés. Un quart de tour recentre un « LUMÉA » (deux répétitions).
  texture.wrapS = RepeatWrapping
  texture.offset.x = 0.25
  return texture
}

export function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

/**
 * Peau de fruit procédurale : un semis de mouchetures claires/sombres, en
 * couleur (map) et en niveaux de gris (bump). Sans elle, la sphère du fruit
 * lit comme une bille en plastique — ce sont les pores irréguliers qui la
 * font ressembler à un agrume ou un abricot vu de près. Les deux textures
 * partagent le même semis pour que le relief tombe pile sur les taches.
 */
export function fruitSkinTextures() {
  const size = 512
  const speckles = Array.from({ length: 900 }, () => ({
    x: Math.random() * size,
    y: Math.random() * size,
    r: 0.6 + Math.random() * 1.6,
    dark: Math.random() > 0.4
  }))

  const colorCanvas = document.createElement('canvas')
  colorCanvas.width = colorCanvas.height = size
  const cc = colorCanvas.getContext('2d')!
  cc.fillStyle = '#ffffff'
  cc.fillRect(0, 0, size, size)
  for (const s of speckles) {
    cc.fillStyle = s.dark ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.5)'
    cc.beginPath()
    cc.arc(s.x, s.y, s.r, 0, Math.PI * 2)
    cc.fill()
  }
  const map = new CanvasTexture(colorCanvas)
  map.colorSpace = SRGBColorSpace

  const bumpCanvas = document.createElement('canvas')
  bumpCanvas.width = bumpCanvas.height = size
  const bc = bumpCanvas.getContext('2d')!
  bc.fillStyle = '#888888'
  bc.fillRect(0, 0, size, size)
  for (const s of speckles) {
    bc.fillStyle = s.dark ? '#4d4d4d' : '#c2c2c2'
    bc.beginPath()
    bc.arc(s.x, s.y, s.r, 0, Math.PI * 2)
    bc.fill()
  }
  const bump = new CanvasTexture(bumpCanvas)

  return { map, bump }
}

/**
 * Relief de la surface du liquide : quelques anneaux concentriques irréguliers
 * en niveaux de gris. Sans lui, le disque de surface est un miroir parfait —
 * ce léger bump suffit à le faire lire comme un liquide plutôt qu'un gel.
 */
export function liquidSurfaceBump() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const c = canvas.getContext('2d')!
  c.fillStyle = '#808080'
  c.fillRect(0, 0, size, size)
  const cx = size / 2
  const cy = size / 2
  for (let ring = 0; ring < 6; ring++) {
    const radius = (ring + 1) * (size / 13) + Math.random() * 6
    c.strokeStyle = ring % 2 === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
    c.lineWidth = 2 + Math.random() * 3
    c.beginPath()
    c.arc(cx + (Math.random() - 0.5) * 14, cy + (Math.random() - 0.5) * 14, radius, 0, Math.PI * 2)
    c.stroke()
  }
  return new CanvasTexture(canvas)
}

/**
 * Sphère de fruit déformée par un bruit bon marché (quelques sinusoïdes
 * déphasées, pas de vraie librairie de bruit) : une sphère parfaite trahit
 * tout de suite « c'est une bille », même texturée, dès que la caméra
 * s'approche. Chaque fruit reçoit sa propre géométrie, figée une fois pour
 * toutes à partir de son `seed`.
 */
export function fruitGeometry(radius: number, seed: number) {
  const geometry = new SphereGeometry(radius, 32, 16)
  const position = geometry.attributes.position!
  const v = new Vector3()
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i)
    const len = v.length() || 1
    const [nx, ny, nz] = [v.x / len, v.y / len, v.z / len]
    const noise =
      Math.sin(nx * 9 + seed) * Math.cos(ny * 7 - seed * 1.3) * 0.5 +
      Math.sin(nz * 11 - seed * 0.7) * Math.cos(nx * 5 + seed * 2.1) * 0.35 +
      Math.sin(ny * 13 + nz * 6 + seed) * 0.25
    v.multiplyScalar(1 + noise * 0.045)
    position.setXYZ(i, v.x, v.y, v.z)
  }
  geometry.computeVertexNormals()
  return geometry
}

/**
 * Disque à anneaux concentriques (rayon unitaire, à mettre à l'échelle comme
 * l'ancien TresCircleGeometry) : contrairement à une CircleGeometry — un
 * simple éventail sans subdivision radiale — celui-ci a des sommets à
 * plusieurs rayons, seule façon de faire onduler la surface du liquide au
 * lieu de la peindre en faux relief sur un plan.
 */
export function rippleDiscGeometry(radialSegments = 10, angularSegments = 48) {
  const positions: number[] = [0, 0, 0]
  const uvs: number[] = [0.5, 0.5]
  const indices: number[] = []

  for (let ring = 1; ring <= radialSegments; ring++) {
    const r = ring / radialSegments
    for (let a = 0; a < angularSegments; a++) {
      const theta = (a / angularSegments) * Math.PI * 2
      positions.push(Math.cos(theta) * r, Math.sin(theta) * r, 0)
      uvs.push(0.5 + Math.cos(theta) * r * 0.5, 0.5 + Math.sin(theta) * r * 0.5)
    }
  }

  for (let a = 0; a < angularSegments; a++) {
    const a2 = (a + 1) % angularSegments
    indices.push(0, 1 + a2, 1 + a)
  }
  for (let ring = 1; ring < radialSegments; ring++) {
    const ringStart = 1 + (ring - 1) * angularSegments
    const nextStart = 1 + ring * angularSegments
    for (let a = 0; a < angularSegments; a++) {
      const a2 = (a + 1) % angularSegments
      const p0 = ringStart + a
      const p1 = ringStart + a2
      const p2 = nextStart + a
      const p3 = nextStart + a2
      indices.push(p0, p3, p2)
      indices.push(p0, p1, p3)
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

/**
 * Déplace radialement les sommets d'un rippleDiscGeometry pour simuler une
 * onde qui part du centre (là où le jet tombe) et s'atténue vers le bord.
 * Mute la géométrie en place — c'est l'appelant qui décide quand rappeler
 * `renderer.invalidate()`.
 */
export function applySurfaceRipple(
  geometry: BufferGeometry,
  radialSegments: number,
  angularSegments: number,
  phase: number,
  amplitude: number
) {
  const position = geometry.attributes.position!
  for (let ring = 1; ring <= radialSegments; ring++) {
    const r = ring / radialSegments
    const wave = amplitude > 0 ? Math.sin(r * 16 - phase) * Math.exp(-r * 2.2) * amplitude : 0
    for (let a = 0; a < angularSegments; a++) {
      position.setZ(1 + (ring - 1) * angularSegments + a, wave)
    }
  }
  position.needsUpdate = true
  geometry.computeVertexNormals()
}

/**
 * Ombre de contact douce sous la bouteille : un dégradé radial en canvas,
 * jamais un fichier à charger. Sans elle, la bouteille flotte dans le vide du
 * studio — c'est ce halo au sol qui la pose sur une surface.
 */
export function groundShadowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const c = canvas.getContext('2d')!
  const gradient = c.createRadialGradient(256, 256, 0, 256, 256, 256)
  gradient.addColorStop(0, 'rgba(0,0,0,0.38)')
  gradient.addColorStop(0.6, 'rgba(0,0,0,0.16)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  c.fillStyle = gradient
  c.fillRect(0, 0, canvas.width, canvas.height)
  return new CanvasTexture(canvas)
}
