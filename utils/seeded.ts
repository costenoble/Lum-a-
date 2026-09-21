// Générateur pseudo-aléatoire à graine (mulberry32). Sert aux décors dessinés
// par le code — fleurs, graines, feuillages — pour qu'ils soient identiques à
// chaque rendu, côté serveur comme côté client (pas de mismatch d'hydratation).
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
