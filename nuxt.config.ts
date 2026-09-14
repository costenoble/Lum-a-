// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  // Devtools en développement seulement : la pastille flottante n'a rien à
  // faire dans un build de production.
  devtools: { enabled: import.meta.dev },

  // TresJS : couche déclarative au-dessus de Three.js. Le module s'occupe du
  // rendu client-only du canvas et de l'auto-import des composants <Tres*>.
  modules: ['@tresjs/nuxt'],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'Luméa — Boissons lumineuses pour les petits',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            "Luméa, marque lyonnaise de boissons pour enfants : six parfums pressés à froid, sans sucres ajoutés, en bouteille de verre consignée."
        }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap'
        }
      ]
    }
    // La transition de page (rideau plein écran) vit dans app.vue : elle a
    // besoin de $lenis et du ref de l'overlay, pas exprimable ici.
  },

  typescript: { strict: true }
})
