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
| `/` | Hero vidéo plein écran qui rétrécit en carte au défilement, puis hero titré, manifeste, bouteille qui tourne au scroll, carrousel des six parfums, 3 nouveautés, savoir-faire, chiffres, teaser studio |
| `/boissons` | Grille filtrable par gamme |
| `/fabrication` | Deux bouteilles qui tournent au scroll, texte à gauche (pressage, verre et bouchon), puis le détail de fabrication |
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
- **Bouton menu « pilule »** ([components/TheHeader.vue](components/TheHeader.vue)) : rond d'accent
  réduit à 20 % qui grossit pour remplir le bouton, les deux barres cèdent la place à la croix.
  Il vit hors du `<header>`, qui est un groupe `mix-blend-mode: difference` (le blend
  inverserait l'orange).
- **Curseur maison** ([components/CustomCursor.vue](components/CustomCursor.vue)) : point qui suit
  la souris et devient une pastille libellée au survol de tout élément portant
  `data-cursor="Voir"`. Inactif au tactile et en `prefers-reduced-motion`.
- **Vol scrollé sur /fabrication** ([components/FabricationFlight.vue](components/FabricationFlight.vue)) :
  deux `BottleScroll` chaînés l'un après l'autre dans le flux normal de la page — même composant, même
  principe que la bouteille Comète de l'accueil (texte à gauche, bouteille à droite ; empilés sur
  téléphone), juste utilisé deux fois avec un texte et une vidéo différents à chaque fois. Dès que le
  premier bloc relâche son épinglage, le second prend la main directement : rien entre les deux, pas de
  chapitre de transition. Les deux vidéos viennent du même dossier que Comète ; préparées avec
  `scripts/bottle-video.py` (fond cuit à la couleur du site, filigrane retiré — chacune avait un nombre
  d'images de filigrane différent, mesuré au cas par cas). Les deux flacons (banane, pastèque) sont des
  essais MiniMax, pas des parfums du catalogue : le texte reste centré sur le geste de fabrication
  (pressage, mise en bouteille), jamais sur le nom du fruit, pour ne pas laisser croire que ce sont des
  parfums en vente.
  **Essayé puis abandonné** : un moteur plein écran emprunté au client (« scroll-world », vidéo bord à
  bord avec texte en surimpression, navigation à points, fondu enchaîné vidéo entre les deux bouteilles
  — voir l'historique Git). Le rendu ne convainquait pas et la mise en page (texte flottant sur la vidéo,
  pas de colonne dédiée) ne correspondait pas à celle du reste du site — retour à `BottleScroll`, qui
  l'avait déjà résolue.
  `BottleScroll` est devenu un composant à propriété à cette occasion (`src` / `poster` / `scroll`,
  plus de vidéo Comète codée en dur) : la page d'accueil lui passe désormais les siennes explicitement.
  Les anciennes versions de la page (« Univers de la Source » en SVG, couloir de fruits en 3D) ne
  sont plus que dans l'historique Git.
- **Hero vidéo** ([components/HeroVideo.vue](components/HeroVideo.vue)) : au chargement, le rideau se
  lève sur une vidéo MiniMax H3 en plein écran, titre superposé. En défilant, le cadre rétrécit en une
  carte arrondie calée sur la colonne du site (un gabarit invisible mesure sa place exacte, donc elle
  s'aligne à toutes les largeurs ; carte 4:5 sur téléphone), puis la zone se libère et le hero d'origine
  arrive dessous. Même mécanique que la fabrication : une zone haute au contenu collant, un avancement
  0 → 1 fourni par GSAP, tout recalculé depuis lui. Le loader attend, au plus 3,5 s, que la vidéo puisse
  jouer (`heroReady` dans [composables/useIntro.ts](composables/useIntro.ts)) pour ne pas révéler un cadre
  noir. La vidéo est amorcée dès le montage (muette, sous le rideau) puis remise sur sa première image :
  les navigateurs ne préchargent pas de façon fiable une vidéo qu'on n'a pas lancée, et sans cela le
  loader attendrait ses 3,5 s pour rien. Elle **démarre depuis le début quand le rideau se lève**
  (`curtainUp`, même fichier), et repart si l'onglet était masqué à ce moment-là. Si le navigateur
  refuse la lecture automatique (réglage du site, économie d'énergie, aperçu intégré à un éditeur),
  elle ne force rien et repart au premier toucher, clic ou touche : on respecte la politique du
  navigateur. En pause hors écran ; sous `prefers-reduced-motion`, une
  carte fixe, sans zone collante.
  La vidéo brute ([components/minimaxH3/hero/](components/minimaxH3/hero/), 2262 × 960, la plus récente) est recompressée
  avec son image d'attente par [scripts/hero-video.sh](scripts/hero-video.sh), qui écarte aussi les
  premières images touchées par le filigrane du fournisseur (`START_FRAME` dans le script — son
  compte dépend de la vidéo brute, à revérifier à chaque nouvelle génération plutôt qu'à supposer
  inchangé).
- **Manifeste sur la bouteille qui tourne** ([components/BottleScroll.vue](components/BottleScroll.vue)) : sur
  l'accueil, la section « La marque » est épinglée sur une bouteille posée directement sur le fond du
  site. Le défilement de la zone épinglée fait à la fois tourner la bouteille (la vidéo n'est pas lue mais
  « scrubée » : du bouchon vu d'en haut au pied du verre, orbite de 10 s générée avec MiniMax H3, parfum
  Comète) et s'encrer le texte mot à mot ([components/ManifestoText.vue](components/ManifestoText.vue),
  piloté par sa prop `progress` au lieu de son propre suivi de scroll) ; le lien « Découvrir le studio »
  n'apparaît qu'à la fin. `BottleScroll` fournit son avancement (0 → 1) à son emplacement (`v-slot`), et
  reste utilisable sans texte. Sur grand écran, le texte est à gauche et la vidéo est décalée de 20 vw vers
  la droite : un gros plan de la bouteille est un mur rouge sombre, il ne doit jamais passer derrière le
  texte noir. Sur téléphone, le texte se pose en bas sur un voile de la couleur du fond, et la vidéo remonte
  (`-17svh`).
  Reprend trois astuces du moteur scroll-world sans l'embarquer (il construit sa propre page et sa propre
  nav) : image clé toutes les 4 images, donc afficher n'importe quel instant, dans les deux sens, ne décode
  jamais plus de 3 images ; chargement en mémoire (Blob) avant usage ; un saut n'est jamais redemandé tant
  que le précédent n'est pas terminé. Rien ne charge avant que la section approche ; sous
  `prefers-reduced-motion`, une image fixe. Sur téléphone la vidéo remplit l'écran (`cover`) : bouteille
  entière grande et nette, gros plans qui débordent sur les côtés.
  **Le fond est celui du site, cuit dans la vidéo** par [scripts/bottle-video.py](scripts/bottle-video.py) :
  chaque image est détourée (bouteille, bouchon, étiquette, ombre au sol, verre clair) puis recomposée sur
  `--paper` (`#f3f2ef`). C'est une vidéo ordinaire, sans canal alpha ni shader, qui se fond dans la page ;
  le verre clair est rendu pour un fond CLAIR (sur un fond sombre il faudrait un autre traitement). Le
  script agrandit (x1,25) et affûte légèrement (la source est en 768p), rogne le début (`START_FRAME` : un
  zoom éclair depuis la photo de départ, qui porte aussi le filigrane du fournisseur) et compense l'écart de
  couleur du décodage vidéo (`DISPLAY_OFFSET`, mesuré dans Chrome : sans cela, la vidéo apparaîtrait de 2 à
  3 niveaux plus claire que la page). `BottleScroll` est un composant à propriété (`src`, `poster`,
  `scroll` — hauteurs d'écran de rotation, 3 par défaut) : ajouter un parfum, c'est lancer le script sur
  sa vidéo, puis poser un nouveau `<BottleScroll :src :poster>` là où on le veut (voir `/fabrication`,
  qui en chaîne deux). Les fichiers de travail
  `components/minimaxH3/bottle/lumea-scroll/work/args_*.json` contiennent des liens signés : ne pas les
  versionner.
- **Composeur de coffret** ([pages/coffret.vue](pages/coffret.vue)) : six casiers, la bouteille
  tombe dans son emplacement, le halo de la caisse mélange les couleurs choisies, le prix roule.
  La composition est encodée dans l'URL (`?c=solaire-comete-…`), donc un coffret se partage par
  lien. Le tarif est calculé par `boxFromSlug` dans [composables/useCart.ts](composables/useCart.ts)
  — une seule règle pour la page, le panier et la commande.
- **Heure du visiteur** ([composables/useTimeOfDay.ts](composables/useTimeOfDay.ts)) : le hero
  affiche l'heure locale et le moment correspondant (« l'heure du goûter », « la nuit »…).
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
  confirmation tracée au `stroke-dasharray`.
  **Livraison** : `pages/panier.vue` a un formulaire (prénom, nom, e-mail,
  téléphone, adresse, code postal, ville, pays), gardé dans `localStorage`
  comme le panier lui-même ([composables/useCheckoutCustomer.ts](composables/useCheckoutCustomer.ts))
  pour survivre à un rechargement. Le bouton Commander (dans le récapitulatif,
  à droite) est rattaché au formulaire par son `id` (`form="checkout-form"`),
  pas par imbrication : la validation (`required`, `type="email"`) est celle
  du navigateur, rien à dupliquer en JS.
  **Paiement — terrain préparé pour Stripe, pas branché** :
  [server/api/checkout.post.ts](server/api/checkout.post.ts) reçoit les
  coordonnées, les lignes et les montants exactement dans la forme dont Stripe
  Checkout a besoin (`line_items`, `customer_email`...), valide les champs
  obligatoires, mais ne contacte aucun prestataire — aucune clé n'est
  configurée dans ce dépôt. Il renvoie une confirmation simulée
  (`simulated: true`), que `checkout()` affiche comme avant. Le commentaire en
  tête de fichier donne le code exact à ajouter le jour où une clé
  `STRIPE_SECRET_KEY` existe (variable d'environnement, jamais commitée —
  emplacement réservé dans `runtimeConfig`, [nuxt.config.ts](nuxt.config.ts)) :
  `pages/panier.vue` redirige déjà vers `url` dès qu'elle est renseignée,
  rien d'autre à changer côté client ce jour-là.
- **Focus retenu sous aria-hidden** ([components/NavOverlay.vue](components/NavOverlay.vue),
  [components/CartDrawer.vue](components/CartDrawer.vue)) : fermer le menu ou le tiroir panier juste
  après avoir cliqué un lien qu'il contient (« Boissons », « Voir le panier »...) laissait ce lien
  gardé le focus clavier pile au moment où le panneau passait en `aria-hidden="true"` — Chrome bloque
  ça et le signale en erreur console à raison (un lecteur d'écran ne doit jamais perdre le focus sur
  du contenu qu'il ne peut plus annoncer). Les deux composants blurrent l'élément actif s'il est
  dans le panneau, juste avant/au moment de le masquer. Reproduit puis vérifié en désactivant puis
  réactivant le correctif (le message d'erreur exact disparaît et revient à l'identique).
  Le tiroir panier est en plus `inert` et masqué (`visibility`) une fois fermé : il n'est que poussé
  hors de l'écran, et son bouton « Fermer » restait sinon atteignable à la touche Tab. Ouvert, il
  prend le focus ; Échap le ferme et rend le focus à ce qui l'avait ouvert.

## Performance

Le site ne charge plus de WebGL : la bouteille 3D (TresJS / Three.js, près d'1 Mo de JavaScript
chargé sur toutes les pages) et les fruits du pied de page (4,7 Mo d'images) ont été retirés.
Ce qui reste à surveiller en ajoutant du contenu :

- **Images** : ne jamais servir un original. [scripts/images-webp.sh](scripts/images-webp.sh)
  produit les `.webp` du site ; chaque render existe en 320, 640, 960 et 1400 px, et
  [components/BottleShot.vue](components/BottleShot.vue) les propose en `srcset` (`sizes="auto"` :
  le navigateur mesure lui-même la place de l'image). Une image qui change de largeur après coup
  (carrousel accordéon) doit préciser `sizes`.
- **Révélations au scroll** : `v-reveal` et `v-lines` posent leur état de départ dès le HTML
  servi (`data-reveal` / `data-lines` via `getSSRProps`, masqués par [main.css](assets/css/main.css)
  sous `html.js`). Sans cela, en arrivant directement sur une page, le texte s'affichait,
  disparaissait à l'hydratation, puis revenait en fondu. Filet : si JS ne démarre jamais, une
  animation CSS retardée de 5 s rend tout lisible.
- **Positions de scroll** : `ScrollTrigger.refresh()` est relancé une fois les polices chargées
  ([plugins/gsap.ts](plugins/gsap.ts)) ; une police qui arrive en retard change la hauteur des
  titres et décalerait sinon les zones épinglées.
- **Vidéos** : toutes muettes, recompressées par les scripts de `scripts/`, chargées seulement à
  l'approche de leur section (sauf le hero).

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

Les visuels sont affichés par [components/BottleShot.vue](components/BottleShot.vue) ; sans
render, il dessine un placeholder (dégradé signature du parfum + grain + initiale).

Pour brancher ou remplacer une image :

1. Exporter le render en JPG ou PNG, 1400 px de large minimum.
2. Le déposer dans `public/renders/` avec le nom du slug, ex. `public/renders/solaire.jpg`.
3. Lancer `scripts/images-webp.sh` (prérequis : `brew install webp`), qui produit les `.webp`.
4. Renseigner le champ `render` du parfum dans `useSite.ts` :

```ts
{ slug: 'solaire', /* … */ render: '/renders/solaire.webp' }
```

La boîte, le ratio et l'animation de survol ne changent pas — seul le contenu de la
figure est remplacé. Ratios utilisés : `4x5` (cartes), `3x2`, `16x9` (bandeau fiche),
`1x1` (planche savoir-faire) ; prévoir des cadrages qui supportent le recadrage
`object-fit: cover`.

## Packshots Blender (optionnel)

[blender/fabrication.py](blender/fabrication.py) construit une bouteille procédurale sous Blender et
rend une séquence ou une image fixe dans `blender/out/`. Le site ne s'en sert pas ; c'est l'outil pour
des visuels haute définition (fiche produit, presse) où un rendu hors ligne reste meilleur.

`blender/banane/` et `blender/fraise/` gardent les sources des modèles 3D de fruits (`.blend`,
textures, composants React Three Fiber livrés avec la banane). Le site ne les utilise plus ; ils
sont exclus du typecheck.

```bash
blender -b --factory-startup -P blender/fabrication.py -- --only 118 --width 2000 --height 2500
```

Les références visuelles (packshots macrovector / Freepik) sont dans `blender/reference/` — usage
interne uniquement, l'attribution est obligatoire si l'illustration est publiée telle quelle.

## Typographie

Le site tourne sur **DynaPuff** (titres) et **JetBrains Mono** (texte courant), en Google Fonts,
à la demande du client. Akaru, lui, auto-héberge « Alliance Neue / Alliance Platt » (Degarism
Studio), une police **commerciale** qui ne peut pas être livrée ici. Un bloc `@font-face` prêt à
décommenter attend en haut de
[assets/css/main.css](assets/css/main.css) : déposer les `.woff2` dans `assets/fonts/`,
décommenter, et changer `--font-display` / `--font-body`. Aucune règle n'appelle de police en
dur, donc rien d'autre à toucher.

## À faire avant mise en ligne

- Brancher un vrai endpoint dans `submit()` de [pages/contact.vue](pages/contact.vue).
- Remplacer les mentions légales par les informations réelles de la société.
- Remplacer les liens réseaux sociaux (placeholders) et ajouter un favicon dans `public/`.
- Brancher une vraie clé Stripe dans [server/api/checkout.post.ts](server/api/checkout.post.ts) — le
  terrain est prêt (formulaire de livraison, route serveur au bon format), voir le commentaire en
  tête de ce fichier et la section Panier plus haut. Le raccourci « Commander directement » de
  [components/CartDrawer.vue](components/CartDrawer.vue) (sans passer par `pages/panier.vue`) reste lui
  purement local, à aligner sur le même circuit le moment venu.
