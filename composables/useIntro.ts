// ---------------------------------------------------------------------------
// Petit canal de synchronisation entre le loader d'intro et les directives
// d'animation : tant que le rideau couvre l'écran, les révélations de la page
// d'accueil ne doivent pas jouer dans le vide.
//
// Le module est évalué côté serveur aussi ; la promesse n'y est simplement
// jamais résolue, ce qui est sans effet puisque mounted() n'y tourne pas.
// ---------------------------------------------------------------------------

/** Attente maximale du loader pour la vidéo du hero (voir plus bas), en ms. */
export const HERO_WAIT_MS = 3500

let resolveIntro: (() => void) | null = null
let resolveCurtain: (() => void) | null = null

export const introReady = new Promise<void>((resolve) => {
  resolveIntro = resolve
})

// Le rideau commence à se lever : c'est le top départ de la vidéo du hero, qui ne
// doit pas jouer dans le vide derrière lui. Plus tôt que introReady, qui n'est
// résolue qu'une fois le rideau entièrement parti.
export const curtainUp = new Promise<void>((resolve) => {
  resolveCurtain = resolve
})

export function markCurtainUp() {
  resolveCurtain?.()
  resolveCurtain = null
}

export function markIntroDone() {
  // Sans rideau (page interne, mouvement réduit, filet de sécurité), le top
  // départ est donné en même temps.
  markCurtainUp()
  resolveIntro?.()
  resolveIntro = null
}

// Filet de sécurité : si le loader ne monte pas (page interne, erreur, JS
// partiellement chargé), les animations ne restent pas bloquées.
if (import.meta.client) {
  // 4 s de rideau, plus l'attente maximale de la vidéo du hero.
  setTimeout(markIntroDone, 4000 + HERO_WAIT_MS)
}

// ---------------------------------------------------------------------------
// Le hero d'accueil est une vidéo : le rideau ne doit se lever que quand elle
// peut jouer, sinon on découvre un cadre noir qui se remplit. HeroVideo signale
// qu'elle est prête ; le loader l'attend, au plus HERO_WAIT_MS, pour ne jamais
// rester bloqué sur une connexion lente ou une lecture refusée.
// ---------------------------------------------------------------------------

let resolveHero: (() => void) | null = null

export const heroReady = new Promise<void>((resolve) => {
  resolveHero = resolve
})

export function markHeroReady() {
  resolveHero?.()
  resolveHero = null
}

