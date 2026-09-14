<template>
  <div>
    <div class="cart-scrim" :class="{ 'is-on': open }" @click="open = false" />

    <aside class="cart" :class="{ 'is-on': open }" :aria-hidden="!open" aria-label="Panier">
      <header class="cart__head">
        <p class="eyebrow">Panier ({{ count }})</p>
        <button class="cart__close" @click="open = false">Fermer</button>
      </header>

      <p v-if="!detailed.length" class="cart__empty muted">
        Votre panier est vide. Les packs sont expédiés sous 48 h, consigne incluse.
      </p>

      <ul v-else class="cart__lines">
        <li v-for="line in detailed" :key="line.slug">
          <div class="cart__thumb">
            <BottleShot
              :label="line.drink.name"
              :src="line.drink.render"
              :color="line.drink.color"
              :color2="line.drink.color2"
              ratio="1x1"
            />
          </div>

          <div class="cart__info">
            <p class="cart__name">{{ line.drink.name }}</p>
            <p class="cart__pack muted">{{ line.drink.pack }}</p>

            <div class="cart__qty">
              <button aria-label="Retirer un pack" @click="setQty(line.slug, line.qty - 1)">−</button>
              <span>{{ line.qty }}</span>
              <button aria-label="Ajouter un pack" @click="setQty(line.slug, line.qty + 1)">+</button>
              <button class="cart__remove link-under" @click="remove(line.slug)">Supprimer</button>
            </div>
          </div>

          <p class="cart__price">{{ formatPrice(line.total) }}</p>
        </li>
      </ul>

      <footer v-if="detailed.length" class="cart__foot">
        <div class="cart__total">
          <span>Total TTC</span>
          <span>{{ formatPrice(total) }}</span>
        </div>
        <p class="muted cart__note">Livraison offerte dès 40 € · consigne 0,30 €/bouteille</p>
        <NuxtLink to="/panier" class="btn cart__checkout" @click="open = false">
          <span>Voir le panier</span>
        </NuxtLink>
        <button class="cart__quick link-under" @click="checkout">
          {{ ordered ? 'Commande simulée ✓' : 'Commander directement' }}
        </button>
      </footer>
    </aside>
  </div>
</template>

<script setup lang="ts">
const { detailed, count, total, open, setQty, remove, clear, restore } = useCart()

const ordered = ref(false)

// Le panier est relu une fois côté client, après l'hydratation.
onMounted(restore)

// Aucun paiement branché : on confirme visuellement puis on vide. Brancher
// ici l'appel au prestataire de paiement le moment venu.
function checkout() {
  ordered.value = true
  setTimeout(() => {
    clear()
    ordered.value = false
    open.value = false
  }, 1600)
}

// Le scroll de la page est bloqué tant que le tiroir est ouvert.
watch(open, (isOpen) => {
  if (import.meta.client) document.body.classList.toggle('nav-locked', isOpen)
})
</script>

<style scoped>
.cart-scrim {
  position: fixed;
  inset: 0;
  z-index: 70;
  background: rgba(11, 11, 11, 0.45);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.4s var(--ease-soft), visibility 0.4s;
}
.cart-scrim.is-on {
  opacity: 1;
  visibility: visible;
}
.cart {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 75;
  width: min(440px, 100vw);
  background: var(--paper);
  border-left: 1px solid var(--line);
  padding: 1.8rem var(--sp-3);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  transform: translateX(101%);
  transition: transform 0.55s var(--ease-soft);
  overflow-y: auto;
}
.cart.is-on {
  transform: translateX(0);
}
.cart__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cart__close {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.cart__lines li {
  display: grid;
  grid-template-columns: 72px 1fr auto;
  gap: 1rem;
  padding-block: 1.2rem;
  border-top: 1px solid var(--line);
  align-items: start;
}
.cart__name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.15rem;
}
.cart__pack {
  font-size: 0.85rem;
}
.cart__qty {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.8rem;
  font-family: var(--font-mono);
  font-size: 0.85rem;
}
.cart__qty button {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px var(--line);
  line-height: 1;
}
.cart__remove {
  width: auto !important;
  height: auto !important;
  box-shadow: none !important;
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-soft);
  margin-left: auto;
}
.cart__price {
  font-family: var(--font-mono);
  font-size: 0.95rem;
}
.cart__foot {
  margin-top: auto;
  border-top: 1px solid var(--line);
  padding-top: 1.4rem;
}
.cart__total {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.3rem;
}
.cart__note {
  font-size: 0.8rem;
  margin-top: 0.5rem;
}
.cart__checkout {
  width: 100%;
  justify-content: center;
  margin-top: 1.2rem;
}
.cart__empty {
  font-size: 0.95rem;
}
.cart__quick {
  display: block;
  margin: 1rem auto 0;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
</style>
