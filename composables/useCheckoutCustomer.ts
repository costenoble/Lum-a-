// ---------------------------------------------------------------------------
// Coordonnées de livraison du panier. Même principe que useCart.ts : gardées
// dans localStorage (pas de compte client, pas de back-office), pour que le
// formulaire ne se vide pas à une navigation ou un rechargement accidentel.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'lumea-checkout-customer'

export interface CheckoutCustomer {
  prenom: string
  nom: string
  email: string
  telephone: string
  adresse: string
  complement: string
  codePostal: string
  ville: string
  pays: string
}

function empty(): CheckoutCustomer {
  return {
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    complement: '',
    codePostal: '',
    ville: '',
    pays: 'FR'
  }
}

export function useCheckoutCustomer() {
  const customer = useState<CheckoutCustomer>('checkout-customer', empty)

  const restore = () => {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) Object.assign(customer.value, empty(), JSON.parse(raw))
    } catch {
      // Stockage indisponible (navigation privée, quota) : formulaire vide.
    }
  }

  const persist = () => {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customer.value))
    } catch {
      // Idem : on n'empêche jamais la saisie pour une erreur de quota.
    }
  }

  return { customer, restore, persist }
}
