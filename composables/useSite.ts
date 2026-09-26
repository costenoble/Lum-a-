// ---------------------------------------------------------------------------
// Source de vérité du contenu éditorial. Tout ce qui est « texte de marque »
// vit ici pour que les composants restent purement structurels.
// ---------------------------------------------------------------------------

export const site = {
  name: 'Luméa',
  baseline: 'Boissons lumineuses pour les petits',
  city: 'Lyon',
  since: 2024,
  email: 'bonjour@lumea.fr',
  phone: '+33 4 78 00 00 00',
  address: ['12 quai Rambaud', '69002 Lyon, France'],
  socials: [
    { label: 'Instagram', href: 'https://instagram.com' },
    { label: 'TikTok', href: 'https://tiktok.com' },
    { label: 'LinkedIn', href: 'https://linkedin.com' },
    { label: 'Pinterest', href: 'https://pinterest.com' }
  ]
}

// Navigation principale : les six entrées affichées en très gros dans le menu
// plein écran. Au-delà, la liste ne tient plus à l'écran — le reste passe en
// navigation secondaire, en petits caractères.
export const nav = [
  { label: 'Boissons', to: '/boissons' },
  { label: 'Fabrication', to: '/fabrication' },
  { label: 'Coffret', to: '/coffret' },
  { label: 'Boutique', to: '/boutique' },
  { label: 'Studio', to: '/studio' },
  { label: 'Contact', to: '/contact' }
]

export const navSecondary = [
  { label: 'Savoir-faire', to: '/savoir-faire' },
  { label: 'Panier', to: '/panier' },
  { label: 'Mentions légales', to: '/mentions-legales' }
]

export interface Drink {
  slug: string
  name: string
  /** Sous-titre parfum, affiché sous le nom. */
  fruit: string
  /** Gamme, sert aussi de filtre sur /boissons. */
  range: 'Jus pressé' | 'Pétillant doux' | 'Infusion froide' | 'Lait végétal'
  year: number
  age: string
  volume: string
  /** Prix TTC du pack, en euros. */
  price: number
  pack: string
  /** Couleur signature du parfum : dégradés, halo, accent local. */
  color: string
  color2: string
  /** Render Blender attendu dans /public/renders/. Vide = placeholder. */
  render: string
  /** Filtre CSS optionnel appliqué sur le render (ex. recolorer une vraie
      photo neutre vers la teinte signature quand aucun vrai render n'existe). */
  renderFilter?: string
  intro: string
  story: string[]
  ingredients: string[]
  /** Chiffres affichés sur la fiche. */
  facts: { label: string; value: string }[]
}

export const drinks: Drink[] = [
  {
    slug: 'solaire',
    name: 'Solaire',
    fruit: 'Mangue & abricot',
    range: 'Jus pressé',
    year: 2026,
    age: 'Dès 3 ans',
    volume: '20 cl',
    price: 17.4,
    pack: 'Pack de 6 · 20 cl',
    color: '#ff8a3d',
    color2: '#ffd166',
    render: '/renders/solaire.webp',
    intro:
      "Le goûter qui a la couleur de 17 h en été. Mangue pressée, abricot du Rhône, zéro sucre ajouté.",
    story: [
      "Solaire est né d'une contrainte simple : faire tenir la douceur d'un abricot mûr dans une bouteille de 20 cl sans jamais ajouter un gramme de sucre.",
      "La mangue apporte la rondeur, l'abricot la vivacité. Entre les deux, une pointe de fleur d'oranger que les enfants ne savent pas nommer mais réclament."
    ],
    ingredients: ['Mangue 62 %', 'Abricot 31 %', 'Eau de source', 'Fleur d’oranger'],
    facts: [
      { label: 'Sucres ajoutés', value: '0 g' },
      { label: 'Fruits', value: '93 %' },
      { label: 'Bouteille', value: 'Verre consigné' }
    ]
  },
  {
    slug: 'comete',
    name: 'Comète',
    fruit: 'Fraise & framboise',
    range: 'Pétillant doux',
    year: 2026,
    age: 'Dès 4 ans',
    volume: '25 cl',
    price: 19.8,
    pack: 'Pack de 6 · 25 cl',
    color: '#ff4f79',
    color2: '#ff9ec4',
    render: '/renders/comete.webp',
    intro:
      "Des bulles fines, calibrées pour chatouiller sans piquer. La première boisson festive qu'on peut vraiment donner à un enfant.",
    story: [
      "On a passé onze mois à baisser la pression du gaz jusqu'à trouver le point exact où la bulle amuse au lieu d'agresser.",
      "Résultat : une effervescence deux fois plus douce qu'un soda classique, une couleur qui vire au rose sous la lumière, et un rituel d'anniversaire."
    ],
    ingredients: ['Fraise 48 %', 'Framboise 22 %', 'Eau pétillante', 'Jus de citron'],
    facts: [
      { label: 'Sucres ajoutés', value: '0 g' },
      { label: 'Effervescence', value: '2,1 g/L' },
      { label: 'Bouteille', value: 'Verre consigné' }
    ]
  },
  {
    slug: 'prairie',
    name: 'Prairie',
    fruit: 'Pomme & menthe douce',
    range: 'Jus pressé',
    year: 2025,
    age: 'Dès 3 ans',
    volume: '20 cl',
    price: 16.9,
    pack: 'Pack de 6 · 20 cl',
    color: '#4fbf7a',
    color2: '#c6f08a',
    render: '/renders/prairie.webp',
    intro:
      "Pommes de Savoie pressées à froid, menthe douce infusée douze heures. Le vert qui ne fait pas peur aux enfants.",
    story: [
      "La menthe classique est trop froide en bouche pour un palais de cinq ans. On a sélectionné une variété douce, presque sucrée, cultivée à 40 km du pressoir.",
      "L'infusion se fait à froid pour garder la couleur : un vert tendre, jamais fluo, qui a fait toute la direction artistique de la gamme."
    ],
    ingredients: ['Pomme 71 %', 'Poire 20 %', 'Infusion de menthe douce'],
    facts: [
      { label: 'Sucres ajoutés', value: '0 g' },
      { label: 'Pressage', value: 'À froid' },
      { label: 'Origine', value: 'Savoie' }
    ]
  },
  {
    slug: 'lagon',
    name: 'Lagon',
    fruit: 'Poire & citron vert',
    range: 'Pétillant doux',
    year: 2025,
    age: 'Dès 4 ans',
    volume: '25 cl',
    price: 19.8,
    pack: 'Pack de 6 · 25 cl',
    color: '#2fc4c0',
    color2: '#9ef0e6',
    render: '/renders/lagon.webp',
    // Pas de vraie boisson bleu-vert sans alcool ni marque visible trouvée en
    // photo libre de droits : on recolore une vraie photo de bouteille (jus
    // rouge neutre) vers la teinte signature plutot que d'inventer un rendu.
    renderFilter: 'hue-rotate(185deg) saturate(2.4) brightness(1.4)',
    intro:
      'La bouteille qu’on emporte à la plage. Poire williams, un trait de citron vert, des bulles minuscules.',
    story: [
      "Lagon est notre parfum le plus désaltérant : moins de fruit, plus d'eau de source, pensé pour être bu glacé après une course dans le sable.",
      "Le bleu-vert du liquide vient uniquement de la spiruline. Aucun colorant, ce qui nous a coûté six formulations."
    ],
    ingredients: ['Poire 54 %', 'Citron vert 9 %', 'Eau pétillante', 'Spiruline'],
    facts: [
      { label: 'Sucres ajoutés', value: '0 g' },
      { label: 'Colorants', value: 'Aucun' },
      { label: 'À boire', value: 'Très frais' }
    ]
  },
  {
    slug: 'nuage',
    name: 'Nuage',
    fruit: 'Myrtille & vanille',
    range: 'Lait végétal',
    year: 2025,
    age: 'Dès 2 ans',
    volume: '20 cl',
    price: 21.6,
    pack: 'Pack de 6 · 20 cl',
    color: '#7b6cf6',
    color2: '#c3b5ff',
    render: '/renders/nuage.webp',
    intro:
      "Avoine française, myrtilles sauvages, vanille de Madagascar. La boisson du soir, celle qui calme tout le monde.",
    story: [
      "Nuage est arrivé après une remarque de parent : « ce qu'il me faut, c'est quelque chose à donner à 19 h qui ne réveille pas. »",
      "Base d'avoine cultivée dans la Drôme, texture volontairement épaisse, sucrée uniquement par la myrtille."
    ],
    ingredients: ['Boisson d’avoine 74 %', 'Myrtille 21 %', 'Vanille bourbon'],
    facts: [
      { label: 'Sucres ajoutés', value: '0 g' },
      { label: 'Calcium', value: '120 mg' },
      { label: 'Sans', value: 'Lactose' }
    ]
  },
  {
    slug: 'aurore',
    name: 'Aurore',
    fruit: 'Pêche & fleur de sureau',
    range: 'Infusion froide',
    year: 2024,
    age: 'Dès 3 ans',
    volume: '25 cl',
    price: 18.6,
    pack: 'Pack de 6 · 25 cl',
    color: '#ffb03d',
    color2: '#ffe2a8',
    render: '/renders/aurore.webp',
    intro:
      'Notre premier parfum. Une infusion froide de fleur de sureau, adoucie à la pêche de vigne.',
    story: [
      "Aurore a lancé la marque en 2024, avec 400 bouteilles produites dans un atelier de la Croix-Rousse.",
      "Deux ans plus tard, la recette n'a pas bougé d'un gramme — seule la bouteille a été redessinée."
    ],
    ingredients: ['Infusion de sureau', 'Pêche 38 %', 'Eau de source', 'Jus de citron'],
    facts: [
      { label: 'Sucres ajoutés', value: '0 g' },
      { label: 'Théine', value: '0 mg' },
      { label: 'Depuis', value: '2024' }
    ]
  }
]

export const ranges = ['Jus pressé', 'Pétillant doux', 'Infusion froide', 'Lait végétal'] as const

export const expertises = [
  {
    idx: '01',
    title: 'Recette',
    desc: 'Formulation sans sucres ajoutés, validée par un panel de goûteurs de 3 à 10 ans.',
    color: '#ff8a3d',
    image: '/expertise/recette.webp'
  },
  {
    idx: '02',
    title: 'Direction artistique',
    desc: 'Un univers graphique qui parle aux enfants sans infantiliser les parents.',
    color: '#ff4f79',
    image: '/expertise/direction-artistique.webp'
  },
  {
    idx: '03',
    title: 'Packaging',
    desc: 'Verre consigné, étiquette monomatière, format pensé pour une main de cinq ans.',
    color: '#4fbf7a',
    image: '/expertise/packaging.webp'
  },
  {
    idx: '04',
    title: 'Image 3D',
    desc: 'Chaque bouteille est modélisée et rendue sous Blender avant d’exister en verre.',
    color: '#7b6cf6',
    image: '/renders/solaire-640.webp'
  },
  {
    idx: '05',
    title: 'Retail & digital',
    desc: 'Du linéaire épicerie fine au site marchand, une seule et même grammaire visuelle.',
    color: '#2fc4c0',
    image: '/expertise/retail-digital.webp'
  }
]

export const awards = [
  { name: 'Pentawards', category: 'Packaging boisson', year: 2026 },
  { name: 'Dieline Awards', category: 'Kids & Family', year: 2025 },
  { name: 'Design & Vie', category: 'Identité de marque', year: 2025 },
  { name: 'Sial Innovation', category: 'Sélection officielle', year: 2025 },
  { name: 'Awwwards', category: 'Site of the Day', year: 2026 }
]

export const stats = [
  { value: 6, suffix: '', label: 'Parfums au catalogue' },
  { value: 0, suffix: ' g', label: 'Sucres ajoutés' },
  { value: 240, suffix: '', label: 'Points de vente' },
  { value: 100, suffix: ' %', label: 'Verre consigné' }
]

// Page /fabrication : les étapes du « chrono », du verger au carton. `hour` est l'heure
// écoulée depuis l'arrivée des fruits (le compteur de la page s'y cale) ; `drink` prête
// sa couleur et sa photo à la carte de l'étape.
export const fabricationSteps = [
  {
    hour: 0,
    title: 'Cueillir',
    headline: 'Le chrono démarre au verger',
    text: 'Des fruits cueillis mûrs, chez des producteurs à moins de 200 km de Lyon : Drôme, Ardèche, monts du Lyonnais. Ils arrivent quai Rambaud le matin même, ni calibrés ni stockés.',
    drink: 'prairie'
  },
  {
    hour: 6,
    title: 'Presser',
    headline: 'À froid, jamais sous la flamme',
    text: 'Lavés, triés à la main, puis pressés à froid. Rien n’est chauffé, rien n’est ajouté : ce qui sort de la presse est exactement ce qui ira dans la bouteille.',
    drink: 'comete'
  },
  {
    hour: 8,
    title: 'Remplir',
    headline: 'Du pressoir au verre, sans détour',
    text: 'Le jus passe directement en bouteille de verre, remplie à 4 °C. Pas de cuve de stockage, pas de concentré à reconstituer plus tard.',
    drink: 'aurore'
  },
  {
    hour: 10,
    title: 'Sceller',
    headline: 'Une étiquette, un bouchon, un numéro',
    text: 'L’étiquette est monomatière, pour que le verre se lave sans laisser de colle. Le bouchon scelle la bouteille, et chaque lot reçoit son numéro.',
    drink: 'solaire'
  },
  {
    hour: 24,
    title: 'Reposer',
    headline: 'Une nuit au frais, un lot goûté',
    text: 'Les bouteilles passent la nuit en chambre froide. Chaque lot est goûté et analysé avant de partir : s’il n’est pas bon, il ne part pas.',
    drink: 'nuage'
  },
  {
    hour: 48,
    title: 'Livrer',
    headline: 'En rayon, deux jours plus tard',
    text: 'Expédiées au frais vers nos 240 points de vente. Elles se gardent six semaines — et le verre, une fois bu, revient chez nous.',
    drink: 'lagon'
  }
]

// Page /fabrication : ce qui n'entre jamais dans l'atelier, barré au scroll.
export const refusals = [
  { word: 'Sucre ajouté', why: 'Un fruit mûr en a déjà assez.' },
  { word: 'Colorant', why: 'La couleur, c’est le fruit qui la donne.' },
  { word: 'Arôme', why: 'Si ça sent la fraise, c’est qu’il y a de la fraise.' },
  { word: 'Concentré', why: 'Pressé le jour même, jamais reconstitué.' },
  { word: 'Pasteurisation', why: 'À 90 °C, elle allonge la date et aplatit le goût.' },
  { word: 'Bouteille jetable', why: 'Le verre revient, on le relave, il repart.' }
]

export function useDrink(slug: string) {
  return drinks.find((d) => d.slug === slug) ?? null
}

export function nextDrink(slug: string) {
  const i = drinks.findIndex((d) => d.slug === slug)
  return drinks[(i + 1) % drinks.length]!
}
