# Luméa — site de marque (Nuxt 3)

Site vitrine façon studio/agence pour **Luméa**, marque de boissons pour enfants.
Structure et grammaire d'animation inspirées des sites d'agence type Akaru :
scroll lissé, révélations au scroll, transitions de page en rideau, nav plein écran.

## Lancer

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && node .output/server/index.mjs
npm run generate # version 100 % statique
```

## Pages

| Route | Contenu |
| --- | --- |
| `/` | Hero, manifeste, carrousel des six parfums, 3 nouveautés, savoir-faire, chiffres, teaser studio |
| `/boissons` | Grille filtrable par gamme |
| `/fabrication` | Scrollytelling 3D : la bouteille se fabrique au rythme du scroll |
| `/coffret` | Composeur de coffret six bouteilles, partageable par URL |
| `/boutique` | Packs, prix, ajout au panier (tiroir latéral) |
| `/panier` | Page panier : lignes animées, récap, jauge de franco, confirmation |
| `/boissons/[slug]` | Fiche parfum façon étude de cas + parfum suivant |
| `/savoir-faire` | 5 expertises (survol avec vignette), méthode, planche de rendus |
| `/studio` | Histoire, valeurs, repères |
| `/contact` | Formulaire (sans backend) + coordonnées |
| `/mentions-legales` | Texte de démonstration à remplacer |

## Blocs d'interface notables

- **Loader d'intro** ([components/IntroLoader.vue](components/IntroLoader.vue)) : compteur 0 → 100
  pendant que « Luméa » se lève, puis trois bandes remontent. Il ne joue qu'au premier
  chargement et seulement sur `/` (décidé dans [app.vue](app.vue)). Les révélations de la page
  attendent sa fin via [composables/useIntro.ts](composables/useIntro.ts) ; deux garde-fous
  (5 s côté loader, 4 s côté promesse) évitent tout blocage si le rAF est bridé.
- **Bouteille 3D** ([components/BottleCanvas.vue](components/BottleCanvas.vue)) : Three.js importé
  dynamiquement, rotation suivant le curseur, boucle coupée hors écran et onglet caché. Voir
  « Modèles 3D » plus bas.
- **Bouton menu « pilule »** ([components/TheHeader.vue](components/TheHeader.vue)) : rond d'accent
  réduit à 20 % qui grossit pour remplir le bouton, les deux barres cèdent la place à la croix.
  Il vit hors du `<header>`, qui est un groupe `mix-blend-mode: difference` (le blend
  inverserait l'orange).
- **Curseur maison** ([components/CustomCursor.vue](components/CustomCursor.vue)) : point qui suit
  la souris et devient une pastille libellée au survol de tout élément portant
  `data-cursor="Voir"`. Inactif au tactile et en `prefers-reduced-motion`.
- **Fabrication en 3D au scroll** ([components/FabricationScene.vue](components/FabricationScene.vue)) :
  un bloc haut, un visuel collant, et la position de scroll qui pilote la scène Three.js.
  Voir « La bouteille 3D » plus bas.
- **Composeur de coffret** ([pages/coffret.vue](pages/coffret.vue)) : six casiers, la bouteille
  tombe dans son emplacement, le halo de la caisse mélange les couleurs choisies, le prix roule.
  La composition est encodée dans l'URL (`?c=solaire-comete-…`), donc un coffret se partage par
  lien. Le tarif est calculé par `boxFromSlug` dans [composables/useCart.ts](composables/useCart.ts)
  — une seule règle pour la page, le panier et la commande.
- **Lumière selon l'heure** ([composables/useTimeOfDay.ts](composables/useTimeOfDay.ts)) : la
  bouteille 3D du hero s'éclaire selon l'heure locale du visiteur (dorée au goûter, bleutée le
  soir), et le hero affiche l'heure et le moment correspondant.
- **Carrousel accordéon** ([components/ExpandingCarousel.vue](components/ExpandingCarousel.vue)) :
  la slide active prend l'espace restant, les autres se réduisent en escalier (220 / 96 / 64 px)
  selon leur distance. Largeurs calculées en JS depuis un `ResizeObserver`, transition CSS sur
  `width`. Portage Vue de `ExpandingCarousel.tsx` (React + Tailwind), gardé à la racine comme
  référence et exclu du typecheck. Sous 900 px, il repasse en carrousel swipeable.
- **Panier** ([composables/useCart.ts](composables/useCart.ts),
  [components/CartDrawer.vue](components/CartDrawer.vue) aperçu rapide, et
  [pages/panier.vue](pages/panier.vue) page complète) : lignes persistées dans
  `localStorage`, entrée en cascade et repli à la suppression (hooks JS de
  TransitionGroup pilotés par GSAP), total et jauge de franco animés, coche de
  confirmation tracée au `stroke-dasharray`. Aucun paiement branché — `checkout()`
  dans `pages/panier.vue` est le point d'accroche.

## Où modifier quoi

- **Contenu éditorial** : [composables/useSite.ts](composables/useSite.ts) — marque, nav,
  parfums, expertises, distinctions, chiffres. Les composants ne contiennent aucun texte de marque.
- **Design tokens** : haut de [assets/css/main.css](assets/css/main.css) — couleurs, typo,
  échelles, rythme. Le reskin se fait ici.
- **Animation** : [plugins/gsap.ts](plugins/gsap.ts) — Lenis + ScrollTrigger et les directives
  `v-reveal`, `v-lines`, `v-parallax`, `v-magnetic`.
- **Transition de page** : [app.vue](app.vue).

Tout respecte `prefers-reduced-motion` : Lenis est désactivé et les animations
tombent à l'état final.

## Renders Blender

Les visuels sont aujourd'hui des **placeholders générés** (dégradé signature du parfum +
grain + initiale), rendus par [components/BottleShot.vue](components/BottleShot.vue).

Pour brancher les vraies images :

1. Exporter le render en PNG (fond transparent ou fond studio), 2000 px de large minimum.
2. Le déposer dans `public/renders/` avec le nom du slug, ex. `public/renders/solaire.png`.
3. Renseigner le champ `render` du parfum dans `useSite.ts` :

```ts
{ slug: 'solaire', /* … */ render: '/renders/solaire.png' }
```

La boîte, le ratio et l'animation de survol ne changent pas — seul le contenu de la
figure est remplacé. Ratios utilisés : `4x5` (cartes), `3x2`, `16x9` (bandeau fiche),
`1x1` (planche savoir-faire) ; prévoir des cadrages qui supportent le recadrage
`object-fit: cover`.

## Modèles 3D (Blender → site)

1. Exporter en **glTF binaire (.glb)**, Y-up, matériaux Principled BSDF, textures embarquées.
2. Déposer dans `public/models/`, ex. `public/models/solaire.glb`.
3. Renseigner le champ `model3d` du parfum dans `useSite.ts` :

```ts
{ slug: 'solaire', /* … */ model3d: '/models/solaire.glb' }
```

Le composant recentre et normalise le modèle sur ~3 unités : pas besoin de caler l'origine ni
l'échelle dans Blender. Sans `model3d`, une bouteille procédurale (révolution d'un profil +
verre physique) est générée et la mention « modèle procédural · glb à venir » s'affiche —
masquable avec `:note="false"`, comme dans le hero.

## La bouteille 3D (TresJS)

La couche 3D est déclarative, en **TresJS** — l'équivalent Vue de react-three-fiber. Le module
`@tresjs/nuxt` monte le canvas côté client tout seul : aucun `<ClientOnly>` à écrire.

| Fichier | Rôle |
| --- | --- |
| [utils/bottle3d.ts](utils/bottle3d.ts) | données : profil de révolution, repères, texture d'étiquette dessinée en canvas |
| [components/BottleModel.vue](components/BottleModel.vue) | la bouteille, déclarée en `<TresMesh>` ; toute l'animation dérive d'une seule valeur, `progress` |
| [components/BottleStage.vue](components/BottleStage.vue) | le décor : caméra, trois lumières, environnement |
| [components/StudioEnvironment.vue](components/StudioEnvironment.vue) | `RoomEnvironment` passée au PMREM, sans HDRI distant |
| [components/FabricationScene.vue](components/FabricationScene.vue) | le bloc collant et le ScrollTrigger qui pilote `progress` |

Le hero et `/fabrication` partagent le même modèle : le premier fige `progress` à 1, la seconde
le branche sur le scroll.

| Geste | Mécanique |
| --- | --- |
| Presser | trois sphères tombent dans le goulot et s'y effacent |
| Remplir | un **plan de coupe** monte dans le liquide, un **disque de surface** le suit et un **jet** coule du col |
| Étiqueter | `setDrawRange` ne dessine qu'une part des triangles du cylindre : il s'enroule |
| Sceller | la capsule descend en tournant de deux tours |

Cinq pièges rencontrés, à connaître avant d'y toucher :

- **Jamais de tableau littéral dans le template.** `:args="[...]"` crée une nouvelle référence à
  chaque rendu : TresJS croit la géométrie changée, la reconstruit, ce qui déclenche un rendu, et
  ainsi de suite. Tous les `args` et `clipping-planes` sont figés dans le script.
- **`alpha` ne suffit pas pour la transparence** : sans `clear-alpha="0"`, le canvas est effacé en
  noir opaque et la bouteille se retrouve sur un rectangle noir.
- **Un composant sans rendu ne doit pas produire de nœud HTML** dans le graphe Tres : un `<span>`
  y devient un objet 3D. `StudioEnvironment` ne rend qu'un commentaire.
- **Les types de TresJS exigent des `Vector3`**, pas la notation en tableau acceptée à l'exécution.
- **`u = 0` d'un cylindre tombe face à la caméra**, donc sans décalage de texture c'est la couture
  de l'étiquette qu'on voit de face — d'où le `offset.x = 0.25`.
- **La passe de transmission ne collecte que la géométrie opaque.** Un jet translucide derrière le
  verre est purement invisible ; le jet et le disque de surface sont donc opaques. Même piège que
  sous Blender, pour la même raison.
- **Sans disque de surface, le plan de coupe ne révèle qu'une coque creuse** : la bouteille semble
  vide même à moitié pleine. C'est ce disque, dimensionné par `liquidRadiusAt()`, qui donne la
  sensation de remplissage.

Budget de rendu : transmission à demi-résolution (`transmissionResolutionScale`), un seul matériau
transmissif (le verre), `dpr` plafonné à 1,5 et segments réduits. Si ça reste lourd sur une machine
modeste, les deux leviers suivants sont la transmission du verre (la remplacer par une simple
opacité) et le `scrub` du ScrollTrigger.

`render-mode="on-demand"` : la scène ne se redessine que lorsqu'une valeur change, donc au scroll.

**Post-processing** ([BottlePostFX.vue](components/BottlePostFX.vue), `@tresjs/post-processing`) :
bloom léger sur les hautes lumières, vignette, aberration chromatique et grain fin — le paquet qui
change le plus la lecture d'un rendu WebGL « démo » en rendu « produit fini ». Chaque valeur est
sous le seuil de perception consciente ; désactivable via `:postfx="false"` sur `BottleStage` pour
profiler sans lui.

Quand les vrais modèles Blender arriveront, `useGLTF` de `@tresjs/cientos` remplace `BottleModel`
sans toucher au reste.

## Packshots Blender (optionnel)

[blender/fabrication.py](blender/fabrication.py) construit la même bouteille sous Blender et rend
une séquence ou une image fixe dans `blender/out/`. Le site ne s'en sert pas ; c'est l'outil pour
des visuels haute définition (fiche produit, presse) où un rendu hors ligne reste meilleur.

```bash
blender -b --factory-startup -P blender/fabrication.py -- --only 118 --width 2000 --height 2500
```

Les références visuelles (packshots macrovector / Freepik) sont dans `blender/reference/` — usage
interne uniquement, l'attribution est obligatoire si l'illustration est publiée telle quelle.

## Typographie

Le site tourne sur **Archivo + Inter** (Google Fonts). Akaru, lui, auto-héberge « Alliance
Neue / Alliance Platt » (Degarism Studio), une police **commerciale** qui ne peut pas être
livrée ici. Un bloc `@font-face` prêt à décommenter attend en haut de
[assets/css/main.css](assets/css/main.css) : déposer les `.woff2` dans `assets/fonts/`,
décommenter, et changer `--font-display` / `--font-body`. Aucune règle n'appelle de police en
dur, donc rien d'autre à toucher.

## À faire avant mise en ligne

- Brancher un vrai endpoint dans `submit()` de [pages/contact.vue](pages/contact.vue).
- Remplacer les mentions légales par les informations réelles de la société.
- Remplacer les liens réseaux sociaux (placeholders) et ajouter un favicon dans `public/`.
- Brancher un vrai paiement dans `checkout()` de [components/CartDrawer.vue](components/CartDrawer.vue)
  (le panier est purement local aujourd'hui).
