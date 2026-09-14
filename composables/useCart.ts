// ---------------------------------------------------------------------------
// Panier local. Aucun back-office ici : les lignes sont conservées dans
// localStorage, ce qui suffit pour la démo et laisse un point d'accroche net
// pour brancher plus tard un vrai commerce (Shopify, Stripe, API maison).
// ---------------------------------------------------------------------------

import { drinks, type Drink } from './useSite'

const STORAGE_KEY = 'lumea-cart'

// Un coffret composé est stocké comme une ligne ordinaire, dont le slug encode
// sa composition : « coffret:solaire-comete-nuage-... ». Le panier reste donc
// une simple liste { slug, qty } — rien à migrer dans localStorage, et tout le
// reste de l'interface continue de lire `line.drink.*` sans savoir si c'est un
// pack du catalogue ou un coffret. (Aucun slug de parfum ne contient de tiret,
// c'est ce qui rend le décodage sûr.)
const BOX_PREFIX = 'coffret:'

// Tarif coffret : 8 % sous le prix des bouteilles achetées séparément.
const BOX_DISCOUNT = 0.92

export function isBox(slug: string) {
  return slug.startsWith(BOX_PREFIX)
}

export function makeBoxSlug(bottleSlugs: string[]) {
  return BOX_PREFIX + bottleSlugs.join('-')
}

/** Reconstitue un « produit » présentable à partir du slug d'un coffret. */
export function boxFromSlug(slug: string): Drink | null {
  const bottles = slug
    .slice(BOX_PREFIX.length)
    .split('-')
    .map((part) => drinks.find((d) => d.slug === part))
    .filter((d): d is Drink => Boolean(d))

  if (!bottles.length) return null

  const first = bottles[0]!
  const last = bottles[bottles.length - 1]!
  // Le prix unitaire d'une bouteille se déduit du pack de six.
  const unitSum = bottles.reduce((sum, d) => sum + d.price / 6, 0)
  const names = [...new Set(bottles.map((d) => d.name))]

  return {
    ...first,
    slug,
    name: 'Coffret sur mesure',
    fruit: names.join(' · '),
    pack: `${bottles.length} bouteilles`,
    price: Math.round(unitSum * BOX_DISCOUNT * 100) / 100,
    color: first.color,
    color2: last.color2,
    render: ''
  }
}

export interface CartLine {
  slug: string
  qty: number
}

export function useCart() {
  const lines = useState<CartLine[]>('cart', () => [])
  const open = useState('cart-open', () => false)

  // Hydratation depuis le stockage : côté client uniquement, sinon le rendu
  // serveur et le rendu client ne partiraient pas du même panier.
  const restore = () => {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) lines.value = JSON.parse(raw)
    } catch {
      // Stockage indisponible (navigation privée, quota) : panier vide.
    }
  }

  const persist = () => {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines.value))
    } catch {
      // Idem : on n'empêche jamais l'ajout au panier pour une erreur de quota.
    }
  }

  const detailed = computed(() =>
    lines.value
      .map((line) => {
        const drink = isBox(line.slug) ? boxFromSlug(line.slug) : drinks.find((d) => d.slug === line.slug)
        return drink ? { ...line, drink, total: drink.price * line.qty } : null
      })
      .filter((l): l is CartLine & { drink: Drink; total: number } => l !== null)
  )

  const count = computed(() => lines.value.reduce((n, l) => n + l.qty, 0))
  const total = computed(() => detailed.value.reduce((sum, l) => sum + l.total, 0))

  function add(slug: string, qty = 1) {
    const existing = lines.value.find((l) => l.slug === slug)
    if (existing) existing.qty += qty
    else lines.value.push({ slug, qty })
    persist()
    open.value = true
  }

  function setQty(slug: string, qty: number) {
    if (qty <= 0) return remove(slug)
    const line = lines.value.find((l) => l.slug === slug)
    if (line) line.qty = qty
    persist()
  }

  function remove(slug: string) {
    lines.value = lines.value.filter((l) => l.slug !== slug)
    persist()
  }

  function clear() {
    lines.value = []
    persist()
  }

  return { lines, detailed, count, total, open, add, setQty, remove, clear, restore }
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
}
