<template>
  <div ref="root" class="fabrication-flight" />
</template>

<script setup lang="ts">
// ---------------------------------------------------------------------------
// Vol scrollé à travers deux orbites de bouteille (générées avec MiniMax H3,
// fournies par le client dans components/minimaxH3/bottle/lumea-scroll/),
// préparées par scripts/bottle-video.py (fond cuit à la couleur du site,
// filigrane retiré, images clés rapprochées pour un défilement fluide — voir
// les commentaires de ce script). Le moteur lui-même
// (assets/js/scroll-flight.js) est une adaptation du "scroll-world" fourni
// par le client : voir son en-tête pour ce qui a changé (nettoyage au
// démontage, indispensable dans une SPA ; z-index abaissés sous ceux du
// header et du menu).
//
// Les deux flacons (banane, pastèque) sont des essais MiniMax, pas des
// parfums du catalogue (Solaire, Comète, Prairie, Lagon, Nuage, Aurore) :
// le texte reste volontairement centré sur le geste de fabrication (pressage,
// mise en bouteille), jamais sur le nom du fruit, pour ne pas laisser croire
// que ce sont des parfums en vente.
// ---------------------------------------------------------------------------

import { mountScrollWorld } from '~/assets/js/scroll-flight.js'
import bananaVideo from '~/components/minimaxH3/bottle/web/fabrication-banana.mp4'
import bananaPoster from '~/components/minimaxH3/bottle/web/fabrication-banana-poster.jpg'
import watermelonVideo from '~/components/minimaxH3/bottle/web/fabrication-watermelon.mp4'
import watermelonPoster from '~/components/minimaxH3/bottle/web/fabrication-watermelon-poster.jpg'

const root = ref<HTMLElement | null>(null)
let engine: { destroy: () => void } | null = null

onMounted(() => {
  if (!root.value) return

  engine = mountScrollWorld(root.value, {
    // 3,2 hauteurs d'écran par bouteille : assez pour que l'orbite (bouchon →
    // profil → base) se déploie sans précipitation, sans pour autant peser sur
    // le reste du défilement de la page (texte, marquee, CTA suivent en dessous).
    diveScroll: 3.2,
    hint: 'Faites défiler',
    nav: false, // le site a déjà son propre menu ; pas de second, redondant
    sections: [
      {
        id: 'pressage',
        label: 'Pressage',
        still: bananaPoster,
        clip: bananaVideo,
        accent: '#e3a73d',
        // Par défaut, le moteur traite la première section comme un « accueil »
        // qui s'efface dès 62 % du défilement (pensé pour un texte de bienvenue
        // suivi d'un vrai second temps) — ici les deux sections se valent, le
        // texte doit rester lisible presque tout du long des deux côtés.
        overlayEnter: 0.08,
        overlayExit: 0.92,
        eyebrow: '01 · Pressage à froid',
        title: 'Le fruit passe sous la presse, jamais sous la flamme.',
        body: 'Rien n’est chauffé, rien n’est ajouté. Chaque fruit vient d’un rayon de 200 km et file en bouteille dans les 48 heures.',
        tags: ['Pressage à froid', '200 km', 'Sans additif']
      },
      {
        id: 'mise-en-bouteille',
        label: 'Mise en bouteille',
        still: watermelonPoster,
        clip: watermelonVideo,
        accent: '#e0677b',
        overlayEnter: 0.08,
        overlayExit: 0.92,
        eyebrow: '02 · Verre et bouchon',
        title: 'Un bouchon de liège, un verre qu’on reprend.',
        body: 'L’étiquette est monomatière, le verre consigné. La bouteille se garde six semaines au frais — un choix, pas une contrainte subie.',
        tags: ['Verre consigné', 'Monomatière', '6 semaines'],
        cta: { primary: { label: 'Voir le savoir-faire', href: '/savoir-faire' } }
      }
    ]
  })

  // Le moteur construit de simples <a href> (il ne connaît pas le routeur de
  // Nuxt) : sans ceci, le lien de fin rechargerait la page entière plutôt que
  // de naviguer côté client comme le reste du site.
  root.value.querySelectorAll('a.sw-btn').forEach((a) => {
    const href = a.getAttribute('href')
    if (!href || !href.startsWith('/')) return
    a.addEventListener('click', (e) => {
      e.preventDefault()
      navigateTo(href)
    })
  })
})

onUnmounted(() => engine?.destroy())
</script>

<style scoped>
/* Reprend les jetons du site plutôt que les couleurs par défaut du moteur
   (voir --sw-* dans assets/js/scroll-flight.js) : chaque bouteille garde son
   accent propre (jaune, corail), mais le fond, l'encre et les polices restent
   celles de Luméa. */
.fabrication-flight {
  --sw-bg: var(--paper);
  --sw-ink: var(--ink);
  --sw-ink-soft: var(--ink-soft);
  --sw-accent: var(--accent);
  --sw-font-display: var(--font-display);
  --sw-font-body: var(--font-body);
}
</style>
