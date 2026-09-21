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
| `/fabrication` | Scrollytelling en SVG : on survole l'univers de la Source (couches en parallaxe), six personnages-fruits, quatre étapes de fabrication |
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
- **Univers de la Source au scroll** ([components/FabricationScene.vue](components/FabricationScene.vue)) :
  un bloc haut, un visuel collant, et la position de scroll qui donne un `progress` (0 → 1). Le
  décor ([components/UniverseScene.vue](components/UniverseScene.vue)) est un SVG en couches — ciel,
  îles flottantes, château, lac, cristal, cerisiers, prairie — dont chaque couche grossit à sa
  vitesse depuis l'horizon : le parallaxe donne la profondeur, sans 3D ni vidéo. Direction
  artistique tirée de l'illustration envoyée par le client, à remplacer par l'illustration finale.
- **Course au bord du pied de page** ([components/FooterSprint.vue](components/FooterSprint.vue)) :
  trois fruits (fraise, banane, pastèque) traversent l'arête du pied de page de temps en temps, à
  trois fois la taille d'origine. Vidéo générée avec MiniMax H3 ([components/minimaxH3/](components/minimaxH3/),
  prompt et fiche de tâche à côté). Elle est filmée sur fond de studio blanc, caméra qui suit les
  personnages : ils courent sur place, et c'est GSAP qui fait glisser la vidéo d'un bord à l'autre.
  **Le fond est retiré par un vrai canal alpha**, pas par un mode de fusion CSS (qui n'est pas
  respecté partout sur une vidéo) : [scripts/sprint-alpha.py](scripts/sprint-alpha.py) détoure chaque
  image hors ligne (fond = ce qui touche le bord du cadre, donc les yeux blancs restent opaques ;
  ombres du sol conservées, translucides) et écrit `fruit-sprint-footer.alpha.mp4` : un `.mp4`
  ordinaire, couleur en moitié haute et masque en moitié basse, que le shader WebGL du composant
  recompose dans un canvas transparent. Pour régénérer : `pip install numpy scipy` puis
  `python3 scripts/sprint-alpha.py` (ffmpeg requis, environ 1 min 30). Si la vidéo change, ajuster
  `CROP` et `FLOOR_Y` dans le script, et `SIZE` dans le composant. Rien n'est téléchargé avant que le
  pied de page approche, lecture en pause hors écran, composant absent sous `prefers-reduced-motion`
  ou sans WebGL. Taille à l'écran : une seule variable CSS, `--h`.
- **Sauvetage à l'ouverture du menu** ([components/NavRescue.vue](components/NavRescue.vue)) : un
  personnage tombe du haut de l'écran, la corde que tient son compagnon (debout sur un rocher
  flottant) se tend, il rebondit et se balance en s'amortissant, puis les deux se réjouissent.
  La scène vit derrière les liens du menu ; le duo change à chaque ouverture. Le balancier est un
  pendule amorti calculé (pas une image clé) : la corde et les positions suivent n'importe quel
  écran. Sous `prefers-reduced-motion`, on affiche directement la dernière image.
- **Personnages-fruits** ([components/FruitBuddy.vue](components/FruitBuddy.vue)) : un fruit-tête
  habillé en enfant (salopette, t-shirt rayé, baskets) par parfum, avec l'emblème de la boisson sur
  la poche — mangue/soleil, fraise/étoile, pomme/feuille, poire/vague, myrtille/nuage,
  pêche/lever de soleil. SVG pur, animés en CSS (souffle, clignement, bras qui saluent), figés en
  `prefers-reduced-motion`. On les retrouve dans l'univers, dans la carte de légende et dans le
  sauvetage du menu.
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

## Le couloir de fruits (glb importés)

> Version précédente de `/fabrication`. La page ne l'utilise plus ; `BananaStage`, `FruitField` et
> les modèles restent dans le dépôt en attendant d'être nettoyés.

Contrairement à la bouteille, entièrement procédurale, les fruits de `/fabrication` sont de vrais
modèles Blender : la banane (1,7 Mo, textures 2048 px complètes) et la fraise (glb + une seule
texture couleur, le reste posé à la main — voir plus bas). Une variante compressée meshopt de la
banane, à 130 Ko, existe dans `blender/banane/` : elle descend les textures à 1024 px, ce qui se
voit dès qu'un fruit s'approche de l'objectif. Pour y repasser, changer `BANANA_URL` dans
`FruitField` ; le décodeur meshopt reste branché.

```bash
npx @gltf-transform/cli optimize banane.glb banane.min.glb --compress meshopt --texture-size 1024
```

| Fichier | Rôle |
| --- | --- |
| [components/FruitField.vue](components/FruitField.vue) | charge chaque glb une seule fois, pousse l'anisotropie des textures au maximum, pose la couleur de la fraise à la main, et en dispose une douzaine d'exemplaires le long du couloir (`clone()` : géométrie et matériaux partagés, deux chargements réseau quel que soit le nombre de fruits) |
| [components/BananaStage.vue](components/BananaStage.vue) | le décor (lumières, `StudioEnvironment`, `BottlePostFX`) et la caméra, qui descend le couloir en continu |

Le glb de la banane est complet : couleur, rugosité et normales bakées dedans (WebP intégré).
Celui de la fraise ne porte que sa rugosité — `fraise_color.png` est posée sur le matériau
`ChairFraise` au chargement, et le calice (matériau `Calice`, sans couleur exportée par Blender)
reçoit un vert en dur. Seule contrainte partagée : la compression meshopt de la banane demande un
décodeur que `useGLTF` de `@tresjs/cientos` ne branche pas — d'où le `GLTFLoader` monté
directement dans `FruitField`, avec le `MeshoptDecoder` livré par Three.

### Pourquoi un couloir plutôt qu'une orbite

La contrainte est arithmétique, pas esthétique. La texture est bakée en 2048 px pour 19 cm de
fruit, soit ~8 300 px/m. Un écran de 1400 px affichant la banane **entière**, c'est ~7 300 px/m :
net. Si elle déborde et qu'on n'en voit que la moitié, on passe à ~14 600 px/m — près du double
de ce que la texture contient. Aucun éclairage ni post-traitement ne réinvente des pixels
absents : **tourner autour d'un fruit unique interdit donc de s'en approcher**, ce qui rend vite
le mouvement tiède.

D'où la traversée. Une douzaine d'exemplaires dispersés en profondeur, la caméra avance en
continu, et surtout **la mise au point reste fixée à distance constante devant elle** : ce qui
frôle l'objectif est hors focus, comme un vrai premier plan de cinéma. Le flou devient un parti
pris de cadrage au lieu d'un manque de finesse, et il y a toujours un fruit à bonne distance,
net et plein cadre. L'immersion vient d'être *dedans* et du parallaxe, plus de la proximité.

Deux pistes écartées en chemin, pour mémoire : l'orbite rapprochée, qui exposait les limites de
la texture, et une variante où la caméra **s'arrêtait** sur chaque cadrage le temps de la lecture
— plus lisible sur le papier, mais elle cassait net la sensation d'immersion.

### Post-traitement : une panne silencieuse

`BottlePostFX` importait `EffectComposer` là où les effets `*Pmndrs` s'enregistrent auprès de
`EffectComposerPmndrs`, via une injection que le premier ne fournit pas. Conséquence : **aucun
effet n'était appliqué**, ni ici ni sur le hero bouteille. Rien ne plantait — seul un
avertissement Vue signalant une injection introuvable passait dans la console, et le rendu
restait correct, juste brut. Les valeurs documentées avaient donc été réglées à l'aveugle :
activées telles quelles, elles saturaient l'image de grain.

Chaque effet est désormais **éteint par défaut** et activable par prop : tout rallumer d'un coup
changerait l'aspect de scènes que personne n'a demandé à retoucher. La page fabrication allume
bloom (seuil haut), vignette et profondeur de champ. Trois points à connaître :

- **Le bloom déborde sur les sujets clairs.** Un seuil bas (0,55, calé sur le verre sombre de la
  bouteille) est dépassé sur *toute* la surface d'un fruit jaune, qui se retrouve délavé.
- **La profondeur de champ exige le tampon de profondeur** (`:depth-buffer`) *et* des plans de
  coupe serrés. Avec le `far` par défaut de Three, qui se compte en milliers d'unités, la
  précision de profondeur est telle que l'effet ne floute quasiment rien.
- **Le grain n'a pas de réglage d'intensité** : c'est le mode de fusion qui dose. `OVERLAY`
  sature, `SOFT_LIGHT` reste discret.

### Netteté du fruit

Par ordre d'effet réel, si la peau paraît molle ou délavée : le bloom d'abord (voir ci-dessus),
puis **l'intensité des lumières** — le trio du studio est réglé pour du verre, sur un fruit jaune
il partait en surexposition (divisé par ~1,6, exposition à 0,95) — puis **l'anisotropie des
textures**, que Three laisse à 1 par défaut, ce qui transforme en bouillie toute surface vue de
biais (`getMaxAnisotropy()` sur chaque texture au chargement).

Les sources Blender (dont les `.blend`, les textures haute résolution et les composants React
Three Fiber fournis avec le modèle de banane) sont dans `blender/banane/` et `blender/fraise/`.
Ces deux dossiers sont exclus du typecheck : les `.tsx` sont écrits pour React, pas pour TresJS,
et ne compileraient pas ici.

Pièges rencontrés en construisant ces scènes, à ajouter à la liste de ceux de la
bouteille :

- **Une caméra qui bouge ne redemande pas d'image à elle seule.** Changer `:position` sur
  `TresPerspectiveCamera` ne suffit pas en `render-mode="on-demand"` : sans un
  `renderer.invalidate()` explicite à chaque tick de `progress` (voir le `watch` dans
  `FruitField`), le canevas affiche une seule image puis reste figé — ou vide, si ce premier
  rendu a eu lieu avant la fin du chargement du modèle. Constaté par un canevas obstinément blanc
  malgré une scène par ailleurs correcte (bounding box, matériaux, aucune erreur console).
- **`look-at` ne recalcule l'orientation que si sa référence change.** Une cible fixe passée comme
  une constante (`new Vector3(...)` créée une seule fois) ne déclenche `camera.lookAt()` qu'au
  tout premier rendu : la caméra garde ensuite l'orientation de départ en se déplaçant le long de
  la spline, et sort du cadre dès qu'elle s'éloigne de sa position initiale. Il faut un `computed`
  qui recrée un nouveau `Vector3` à chaque changement de `progress`, même si la valeur pointée ne
  change jamais.
- **Sur une trajectoire en spline, ce sont les segments qu'il faut surveiller, pas les points.**
  Vaut pour l'orbite abandonnée, et pour toute reprise du genre. Un objet allongé couché sur
  l'axe X se filme de bout — écrasé — depuis toute position à fort |x| et faible |z| ; or on peut
  placer huit points de contrôle irréprochables et voir quand même la caméra traverser l'axe
  *entre* deux d'entre eux. Même mécanique pour la distance : deux points assez éloignés ne
  garantissent pas un segment assez éloigné, la corde coupant par l'intérieur. Dans les deux cas
  le diagnostic est venu de la lecture des valeurs réelles à plusieurs points du scroll, pas de
  l'œil.
- **Dans un champ de fruits statiques, c'est la caméra qui bouge — donc ce sont les `PLACEMENTS`
  qu'il faut tenir à distance de son chemin, pas l'inverse.** La dérive sinusoïdale de
  `BananaStage` fait passer la caméra à des endroits différents selon `progress` ; un fruit posé
  trop près de ce chemin se fait littéralement traverser, et le plan de coupe rapproché
  (`:near`) le tranche net. Ça s'est d'abord vu comme une coupure franche à l'écran, pas comme un
  défaut de mise au point. Diagnostiqué en calculant, pour chaque position, la distance minimale
  entre le fruit et le chemin de la caméra sur tout `[0, 1]` — un rayon de dégagement par type de
  fruit (~2,9 pour une banane, ~1,6 pour une fraise) suffit à l'éliminer.

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
