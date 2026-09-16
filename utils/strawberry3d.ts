import {
  BufferGeometry,
  CatmullRomCurve3,
  Float32BufferAttribute,
  Matrix4,
  SphereGeometry,
  Vector3
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// ---------------------------------------------------------------------------
// Fraise procédurale — même philosophie que la bouteille (utils/bottle3d.ts) :
// aucune géométrie importée, aucun fichier à charger, et une silhouette qui se
// règle avec quelques constantes. Le style visé est le rendu « icône 3D » :
// corps en goutte bien lisse, akènes dans de vrais creux, calice en volume,
// matériau très brillant. Trois maillages seulement en sortie (corps, akènes
// fusionnés, verdure fusionnée), donc trois appels de rendu.
// ---------------------------------------------------------------------------

/** Nombre d'akènes visés sur le corps (la calotte du calice est exclue). */
const SEED_COUNT = 150
/** Au-delà de cette hauteur (y de la sphère unité), c'est le calice : pas d'akène. */
const SEED_TOP_LIMIT = 0.74

/** Plus la valeur est basse, plus la pointe du bas est effilée. */
const BODY_TAPER = 0.6
/** Écrasement vertical : sans lui la goutte est trop allongée pour le style. */
const BODY_HEIGHT = 0.78
/** Creux dans lequel se loge chaque akène, en fraction du rayon. */
const DIMPLE_DEPTH = 0.055
/** Bourrelet autour du creux — c'est lui qui donne le relief « peau de fraise ». */
const DIMPLE_RIM = 0.014
/** Rayon angulaire d'un creux, en cosinus (0.988 ≈ 9°). */
const DIMPLE_COS = 0.988
/** Petit enfoncement au sommet, là où le calice se pose. */
const CROWN_DIP = 0.07

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))
const UP = new Vector3(0, 1, 0)

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/**
 * Directions des akènes, en spirale de Fibonacci : c'est la répartition que
 * suit réellement une fraise (phyllotaxie), et surtout la seule qui évite les
 * alignements en damier d'une grille régulière.
 */
export function seedDirections() {
  const directions: Vector3[] = []
  // On sur-échantillonne : la calotte du calice est retirée juste après.
  const total = Math.round(SEED_COUNT / ((SEED_TOP_LIMIT + 1) / 2))
  for (let i = 0; i < total; i++) {
    const y = 1 - (i / (total - 1)) * 2
    if (y > SEED_TOP_LIMIT) continue
    const radius = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = GOLDEN_ANGLE * i
    directions.push(new Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius))
  }
  return directions
}

/** Passe d'un point de la sphère unité à la silhouette en goutte. */
function shapePoint(direction: Vector3, target: Vector3) {
  const t = Math.max(0, Math.min(1, (direction.y + 1) / 2))
  const taper = Math.pow(t, BODY_TAPER)
  return target.set(direction.x * taper, direction.y * BODY_HEIGHT, direction.z * taper)
}

/**
 * Corps de la fraise : une sphère remodelée en goutte, puis creusée à
 * l'emplacement de chaque akène. Le dégradé (plus sombre vers la pointe) est
 * cuit dans les couleurs de sommets, en niveaux de gris : le matériau le
 * multiplie par la couleur du parfum, donc une seule géométrie sert à toutes
 * les teintes.
 */
export function strawberryBodyGeometry(seeds: Vector3[]) {
  const geometry = new SphereGeometry(1, 180, 130)
  const position = geometry.attributes.position!
  const direction = new Vector3()
  const shaped = new Vector3()
  const colors: number[] = []

  for (let i = 0; i < position.count; i++) {
    direction.fromBufferAttribute(position, i).normalize()
    shapePoint(direction, shaped)

    // Creux des akènes : un puits au centre, un léger bourrelet au bord.
    let offset = 0
    for (const seed of seeds) {
      const cos = direction.dot(seed)
      if (cos < DIMPLE_COS) continue
      const x = (1 - cos) / (1 - DIMPLE_COS)
      const bell = 1 - x * x
      offset += -DIMPLE_DEPTH * bell * bell + DIMPLE_RIM * 4 * x * x * bell
    }

    // Assise du calice, sinon les sépales flottent sur une calotte bombée.
    offset -= CROWN_DIP * smoothstep(0.88, 1, direction.y)

    shaped.addScaledVector(direction, offset)
    position.setXYZ(i, shaped.x, shaped.y, shaped.z)

    const shade = 0.68 + 0.32 * smoothstep(0.05, 0.72, (direction.y + 1) / 2)
    colors.push(shade, shade, shade)
  }

  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  return geometry
}

/**
 * Les akènes, fusionnés en une seule géométrie : ils ne bougent jamais les uns
 * par rapport aux autres, donc autant n'avoir qu'un maillage plutôt que 150.
 * Chaque grain est un ovale posé au fond de son creux, orienté dans le sens du
 * méridien comme sur un vrai fruit.
 */
export function seedsGeometry(seeds: Vector3[]) {
  const shaped = new Vector3()
  const tangent = new Vector3()
  const bitangent = new Vector3()
  const matrix = new Matrix4()
  const pieces: BufferGeometry[] = []

  seeds.forEach((direction, index) => {
    shapePoint(direction, shaped)
    // Le grain est posé au fond du creux, la pointe affleurant la peau.
    shaped.addScaledVector(direction, -DIMPLE_DEPTH * 0.55)

    // Repère local : Z suit la normale, Y remonte le long du méridien.
    tangent.copy(UP).addScaledVector(direction, -UP.dot(direction))
    if (tangent.lengthSq() < 1e-6) tangent.set(1, 0, 0)
    tangent.normalize()
    bitangent.crossVectors(tangent, direction).normalize()
    matrix.makeBasis(bitangent, tangent, direction)
    matrix.setPosition(shaped)

    // Un peu de variété : sans ça les 150 grains sont rigoureusement identiques
    // et l'œil y lit tout de suite une texture répétée.
    const variation = 0.88 + ((index * 7919) % 100) / 100 * 0.24
    const seed = new SphereGeometry(1, 12, 8)
    seed.scale(0.031 * variation, 0.043 * variation, 0.02)
    seed.applyMatrix4(matrix)
    pieces.push(seed)
  })

  const merged = mergeGeometries(pieces)
  pieces.forEach((piece) => piece.dispose())
  return merged
}

/**
 * Tube à section elliptique le long d'une courbe, dont la largeur suit un
 * profil : la seule façon d'obtenir un sépale charnu qui s'affine en pointe.
 * `TubeGeometry` de Three ne sait faire qu'un rayon constant et circulaire.
 */
function taperedTube(
  curve: CatmullRomCurve3,
  steps: number,
  radial: number,
  widthAt: (s: number) => number,
  flatness: number
) {
  const frames = curve.computeFrenetFrames(steps, false)
  const positions: number[] = []
  const indices: number[] = []
  const point = new Vector3()
  const vertex = new Vector3()

  for (let i = 0; i <= steps; i++) {
    const s = i / steps
    curve.getPointAt(s, point)
    const normal = frames.normals[i]!
    const binormal = frames.binormals[i]!
    const width = widthAt(s)

    for (let j = 0; j < radial; j++) {
      const theta = (j / radial) * Math.PI * 2
      vertex
        .copy(point)
        .addScaledVector(normal, Math.cos(theta) * width)
        .addScaledVector(binormal, Math.sin(theta) * width * flatness)
      positions.push(vertex.x, vertex.y, vertex.z)
    }
  }

  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * radial + j
      const b = i * radial + ((j + 1) % radial)
      const c = (i + 1) * radial + j
      const d = (i + 1) * radial + ((j + 1) % radial)
      indices.push(a, c, b, b, c, d)
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

/**
 * Le calice : une couronne de sépales charnus qui montent puis retombent, plus
 * la tige. Fusionné en une seule géométrie, comme les akènes.
 */
export function calyxGeometry() {
  const pieces: BufferGeometry[] = []
  const crown = 0.66 // hauteur du sommet du corps, calice posé dessus

  const sepals = 8
  for (let i = 0; i < sepals; i++) {
    const angle = (i / sepals) * Math.PI * 2
    // Une sépale sur deux est plus courte : une couronne parfaitement régulière
    // fait tout de suite « généré », et le fruit de référence est irrégulier.
    const long = i % 2 === 0
    const reach = long ? 0.62 : 0.46
    const lift = long ? 0.3 : 0.24

    const curve = new CatmullRomCurve3([
      new Vector3(0, crown, 0),
      new Vector3(Math.cos(angle) * reach * 0.34, crown + lift * 0.72, Math.sin(angle) * reach * 0.34),
      new Vector3(Math.cos(angle) * reach * 0.74, crown + lift, Math.sin(angle) * reach * 0.74),
      new Vector3(Math.cos(angle) * reach, crown + lift * 0.42, Math.sin(angle) * reach)
    ])

    const maxWidth = long ? 0.085 : 0.075
    pieces.push(
      taperedTube(
        curve,
        26,
        12,
        (s) => maxWidth * (0.45 + 0.55 * Math.sin(Math.PI * s)) * (1 - Math.pow(s, 3)),
        0.55
      )
    )
  }

  // Tige : courte, légèrement penchée, coupée net en haut.
  const stem = new CatmullRomCurve3([
    new Vector3(0, crown - 0.02, 0),
    new Vector3(0.012, crown + 0.16, 0.01),
    new Vector3(0.035, crown + 0.3, 0.02),
    new Vector3(0.05, crown + 0.42, 0.025)
  ])
  pieces.push(taperedTube(stem, 22, 12, (s) => 0.062 - 0.016 * s, 1))

  const merged = mergeGeometries(pieces)
  pieces.forEach((piece) => piece.dispose())
  return merged
}
