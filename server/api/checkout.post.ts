// ---------------------------------------------------------------------------
// Point d'entrée de la commande, pensé pour Stripe mais pas encore branché :
// aucune clé API n'est configurée dans ce dépôt (rien à faire fuiter), donc
// on se contente de valider le corps de la requête et de renvoyer une
// confirmation simulée (`simulated: true`) — pages/panier.vue affiche alors
// sa confirmation locale exactement comme avant, sans rien changer d'autre.
//
// Le corps de la requête (customer + lines + amounts, voir CheckoutBody
// ci-dessous) est déjà celui dont Stripe Checkout a besoin : rien à changer
// côté client le jour où une vraie clé existe. Pour brancher pour de vrai :
//
//   1. npm install stripe
//   2. Ajouter STRIPE_SECRET_KEY dans .env (jamais commité), puis dans
//      runtimeConfig (nuxt.config.ts) sous la clé stripeSecretKey — pas sous
//      `public`, elle ne doit exister que côté serveur.
//   3. Remplacer le corps de ce gestionnaire par quelque chose comme :
//
//        import Stripe from 'stripe'
//        const { stripeSecretKey } = useRuntimeConfig()
//        const stripe = new Stripe(stripeSecretKey)
//        const origin = getRequestURL(event).origin
//        const session = await stripe.checkout.sessions.create({
//          mode: 'payment',
//          customer_email: body.customer.email,
//          line_items: body.lines.map((l) => ({
//            quantity: l.qty,
//            price_data: {
//              currency: 'eur',
//              unit_amount: Math.round(l.unitPrice * 100),
//              product_data: { name: l.name }
//            }
//          })),
//          shipping_address_collection: { allowed_countries: ['FR', 'BE', 'CH', 'LU'] },
//          success_url: `${origin}/panier?commande=ok`,
//          cancel_url: `${origin}/panier`
//        })
//        return { url: session.url, simulated: false }
//
//      Côté pages/panier.vue, `checkout()` redirige déjà vers `url` quand il
//      est présent : rien à toucher là-bas non plus.
// ---------------------------------------------------------------------------

interface CheckoutBody {
  customer: {
    prenom: string
    nom: string
    email: string
    telephone?: string
    adresse: string
    complement?: string
    codePostal: string
    ville: string
    pays: string
  }
  lines: Array<{ slug: string; name: string; qty: number; unitPrice: number; total: number }>
  amounts: { total: number; deposit: number; shipping: number; grandTotal: number }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<Partial<CheckoutBody>>(event)

  const requiredCustomerFields = ['prenom', 'nom', 'email', 'adresse', 'codePostal', 'ville', 'pays'] as const
  const missing = requiredCustomerFields.filter((key) => !body?.customer?.[key])
  if (missing.length) {
    throw createError({
      statusCode: 400,
      statusMessage: `Coordonnées incomplètes : ${missing.join(', ')}`
    })
  }
  if (!body?.lines?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Panier vide' })
  }

  // TODO Stripe : voir le commentaire en tête de fichier.
  return { ok: true, simulated: true, url: null }
})
