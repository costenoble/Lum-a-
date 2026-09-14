<template>
  <div>
    <section class="container page-head">
      <p class="eyebrow" v-reveal>Boutique</p>
      <h1 v-lines="0.05" style="font-size: var(--fs-hero); margin-top: 1.5rem">
        <span class="line-mask"><span>Commander</span></span>
      </h1>
      <p class="lead" v-reveal="0.3" style="margin-top: 2rem">
        Packs de six bouteilles, expédiés sous 48 h. Consigne incluse, retour en point de vente.
      </p>
    </section>

    <section class="container" style="padding-bottom: var(--sp-6)">
      <div class="shop-grid">
        <article v-for="drink in drinks" :key="drink.slug" class="shop-card" v-reveal>
          <NuxtLink :to="`/boissons/${drink.slug}`" class="shop-card__media reveal-mask" data-cursor="Voir">
            <BottleShot
              :label="drink.name"
              :src="drink.render"
              :color="drink.color"
              :color2="drink.color2"
              ratio="1x1"
            />
          </NuxtLink>

          <div class="shop-card__body">
            <h2 class="shop-card__title">{{ drink.name }}</h2>
            <p class="muted shop-card__fruit">{{ drink.fruit }}</p>
            <p class="shop-card__pack">{{ drink.pack }}</p>

            <div class="shop-card__buy">
              <span class="shop-card__price">{{ formatPrice(drink.price) }}</span>
              <button class="btn" @click="add(drink.slug)">
                <span>Ajouter</span>
              </button>
            </div>
          </div>
        </article>
      </div>

      <div class="shop-info" v-reveal>
        <div>
          <h3 class="eyebrow">Livraison</h3>
          <p class="muted">Expédition sous 48 h en France métropolitaine, offerte dès 40 €.</p>
        </div>
        <div>
          <h3 class="eyebrow">Consigne</h3>
          <p class="muted">0,30 € par bouteille, remboursés au retour dans nos 240 points de vente.</p>
        </div>
        <div>
          <h3 class="eyebrow">Paiement</h3>
          <p class="muted">Démonstration : aucun paiement réel n’est déclenché depuis cette page.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Boutique — Luméa' })

const { add } = useCart()
</script>

<style scoped>
.page-head {
  padding-block: calc(var(--header-h) + 6rem) var(--sp-5);
}
.shop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: clamp(2rem, 4vw, 3.5rem);
}
.shop-card {
  display: grid;
  gap: 1.1rem;
  align-content: start;
}
.shop-card__media {
  display: block;
}
.shop-card__title {
  font-size: 1.7rem;
}
.shop-card__fruit {
  font-size: 0.95rem;
  margin-top: 0.2rem;
}
.shop-card__pack {
  font-family: var(--font-mono);
  font-size: 0.74rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-soft);
  margin-top: 0.8rem;
}
.shop-card__buy {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.2rem;
}
.shop-card__price {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.4rem;
}
.shop-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--sp-3);
  margin-top: var(--sp-6);
  padding-top: var(--sp-4);
  border-top: 1px solid var(--line);
}
.shop-info p {
  margin-top: 0.8rem;
  font-size: 0.95rem;
}
</style>
