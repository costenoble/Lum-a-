import { CanvasTexture, RepeatWrapping, SRGBColorSpace, Vector2 } from 'three'

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
    c.font = '700 170px Archivo, Helvetica, sans-serif'
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
