// ---------------------------------------------------------------------------
// Petit canal de synchronisation entre le loader d'intro et les directives
// d'animation : tant que le rideau couvre l'écran, les révélations de la page
// d'accueil ne doivent pas jouer dans le vide.
//
// Le module est évalué côté serveur aussi ; la promesse n'y est simplement
// jamais résolue, ce qui est sans effet puisque mounted() n'y tourne pas.
// ---------------------------------------------------------------------------

let resolveIntro: (() => void) | null = null

export const introReady = new Promise<void>((resolve) => {
  resolveIntro = resolve
})

export function markIntroDone() {
  resolveIntro?.()
  resolveIntro = null
}

// Filet de sécurité : si le loader ne monte pas (page interne, erreur, JS
// partiellement chargé), les animations ne restent pas bloquées.
if (import.meta.client) {
  setTimeout(markIntroDone, 4000)
}
