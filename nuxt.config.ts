// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  // Devtools en développement seulement : la pastille flottante n'a rien à
  // faire dans un build de production.
  devtools: { enabled: import.meta.dev },

  // lenis.css : règles officielles de Lenis (html.lenis, blocage quand il est arrêté,
  // zones `data-lenis-prevent` qui gardent leur propre défilement).
  css: ['lenis/dist/lenis.css', '~/assets/css/main.css'],

  // Emplacement réservé pour Stripe (server/api/checkout.post.ts) : aucune clé
  // n'est configurée ici. Le jour venu, une variable d'environnement
  // STRIPE_SECRET_KEY (jamais commitée, dans .env) prendra automatiquement le
  // dessus sur cette valeur vide, par la convention Nuxt NUXT_STRIPE_SECRET_KEY.
  runtimeConfig: {
    stripeSecretKey: ''
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'Luméa — Boissons revigorantes pour les petits',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            "Luméa, marque lyonnaise de boissons pour enfants : six parfums pressés à froid, sans sucres ajoutés, en bouteille de verre consignée."
        }
      ],
      // Posée avant le premier rendu : main.css ne masque les blocs animés
      // (data-reveal, data-lines) que si JS tourne, sinon ils restent lisibles.
      script: [{ innerHTML: "document.documentElement.classList.add('js')" }],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=DynaPuff:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap'
        }
      ]
    }
    // La transition de page (rideau plein écran) vit dans app.vue : elle a
    // besoin de $lenis et du ref de l'overlay, pas exprimable ici.
  },

  typescript: { strict: true },

  hooks: {
    // Nuxt annonce en `prefetch` tout fichier importé par une page, vidéos comprises :
    // sur l'accueil, la bouteille Comète (1,6 Mo) partait dès le HTML, en concurrence
    // avec la vidéo du hero que le rideau d'intro attend. Les vidéos se chargent
    // elles-mêmes au bon moment (HeroVideo tout de suite, BottleScroll à l'approche
    // de sa section) : on les retire des annonces.
    'build:manifest'(manifest) {
      for (const chunk of Object.values(manifest)) {
        if (chunk.assets) chunk.assets = chunk.assets.filter((file) => !file.endsWith('.mp4'))
      }
    }
  }
})
