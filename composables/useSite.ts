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
  /** Modèle glTF/glb exporté depuis Blender, dans /public/models/. Vide =
      bouteille procédurale générée par BottleCanvas. */
  model3d?: string
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
    render: '/renders/solaire.jpg',
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
    render: '/renders/comete.jpg',
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
    render: '/renders/prairie.jpg',
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
    render: '/renders/lagon.jpg',
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
    render: '/renders/nuage.jpg',
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
    render: '/renders/aurore.jpg',
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
    image: '/expertise/recette.jpg'
  },
  {
    idx: '02',
    title: 'Direction artistique',
    desc: 'Un univers graphique qui parle aux enfants sans infantiliser les parents.',
    color: '#ff4f79',
    image: '/expertise/direction-artistique.jpg'
  },
  {
    idx: '03',
    title: 'Packaging',
    desc: 'Verre consigné, étiquette monomatière, format pensé pour une main de cinq ans.',
    color: '#4fbf7a',
    image: '/expertise/packaging.jpg'
  },
  {
    idx: '04',
    title: 'Image 3D',
    desc: 'Chaque bouteille est modélisée et rendue sous Blender avant d’exister en verre.',
    color: '#7b6cf6',
    image: '/renders/solaire.jpg'
  },
  {
    idx: '05',
    title: 'Retail & digital',
    desc: 'Du linéaire épicerie fine au site marchand, une seule et même grammaire visuelle.',
    color: '#2fc4c0',
    image: '/expertise/retail-digital.jpg'
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

export function useDrink(slug: string) {
  return drinks.find((d) => d.slug === slug) ?? null
}

export function nextDrink(slug: string) {
  const i = drinks.findIndex((d) => d.slug === slug)
  return drinks[(i + 1) % drinks.length]!
}
