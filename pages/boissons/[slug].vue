<template>
  <div v-if="drink" :style="{ '--accent': drink.color }">
    <section class="container case-head">
      <p class="eyebrow" v-reveal>{{ drink.range }} · {{ drink.year }}</p>

      <h1 v-lines="0.05" style="font-size: var(--fs-hero); margin-top: 1.5rem">
        <span class="line-mask"><span>{{ drink.name }}</span></span>
      </h1>

      <p class="lead" v-reveal="0.3" style="margin-top: 2rem">{{ drink.intro }}</p>

      <div class="buy" v-reveal="0.4">
        <div>
          <p class="buy__price">{{ formatPrice(drink.price) }}</p>
          <p class="buy__pack">{{ drink.pack }}</p>
        </div>
        <button class="btn" v-magnetic @click="add(drink.slug)">
          <span>Ajouter au panier</span>
        </button>
      </div>
    </section>

    <div class="container">
      <div class="reveal-mask" v-reveal>
        <BottleShot
          :label="drink.name"
          :src="drink.render"
          :color="drink.color"
          :color2="drink.color2"
          ratio="16x9"
        />
      </div>

      <dl class="case-meta" v-reveal>
        <div>
          <dt>Parfum</dt>
          <dd>{{ drink.fruit }}</dd>
        </div>
        <div>
          <dt>Format</dt>
          <dd>{{ drink.volume }}</dd>
        </div>
        <div>
          <dt>Âge</dt>
          <dd>{{ drink.age }}</dd>
        </div>
        <div>
          <dt>Gamme</dt>
          <dd>{{ drink.range }}</dd>
        </div>
      </dl>
    </div>

    <section class="container section--tight">
      <div class="case-body">
        <div class="col-7">
          <p v-for="(para, i) in drink.story" :key="i" class="story" v-reveal>{{ para }}</p>
        </div>

        <div class="col-5">
          <h2 class="eyebrow" v-reveal>Composition</h2>
          <ul class="ingredients" v-reveal="0.05">
            <li v-for="ing in drink.ingredients" :key="ing">{{ ing }}</li>
          </ul>
        </div>

        <div class="col-full stats" v-reveal>
          <div v-for="f in drink.facts" :key="f.label" class="stat">
            <p class="stat__num" style="font-size: clamp(2.4rem, 5vw, 4rem)">{{ f.value }}</p>
            <p class="stat__label">{{ f.label }}</p>
          </div>
        </div>

        <div class="col-6 reveal-mask" v-reveal>
          <BottleShot
            :label="drink.name"
            :src="drink.render"
            :color="drink.color2"
            :color2="drink.color"
            ratio="4x5"
            :alt="`Détail de l’étiquette ${drink.name}`"
          />
        </div>
        <div class="col-6 reveal-mask" v-reveal="0.1">
          <BottleShot
            :label="drink.name"
            :color="drink.color"
            :color2="drink.color2"
            ratio="4x5"
            :alt="`Mise en situation ${drink.name}`"
          />
        </div>
      </div>
    </section>

    <MarqueeBand :items="[drink.name, drink.fruit, drink.range]" :speed="22" />

    <NuxtLink :to="`/boissons/${next.slug}`" class="next-case container">
      <span class="eyebrow">Parfum suivant</span>
      <span class="cta-giant" style="margin-top: 1rem">{{ next.name }}</span>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
// Sans clé explicite, passer d'un parfum à l'autre réutiliserait l'instance
// et le setup ne rejouerait pas : on force un remount par slug.
definePageMeta({ key: (route) => route.fullPath })

const route = useRoute()
const drink = useDrink(String(route.params.slug))

// Slug inconnu : vraie 404 plutôt qu'une page vide.
if (!drink) {
  throw createError({ statusCode: 404, statusMessage: 'Parfum introuvable', fatal: true })
}

const next = nextDrink(drink.slug)
const { add } = useCart()

useHead({ title: `${drink.name} — ${drink.fruit} · Luméa` })
</script>

<style scoped>
.buy {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-3);
  margin-top: var(--sp-4);
}
.buy__price {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 2rem;
  letter-spacing: -0.03em;
}
.buy__pack {
  font-family: var(--font-mono);
  font-size: 0.74rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-soft);
  margin-top: 0.3rem;
}
.story {
  font-size: var(--fs-lead);
  line-height: 1.45;
  letter-spacing: -0.01em;
}
.story + .story {
  margin-top: 1.5rem;
}
.ingredients {
  margin-top: 1.5rem;
  font-family: var(--font-mono);
  font-size: 0.9rem;
}
.ingredients li {
  padding-block: 0.8rem;
  border-bottom: 1px solid var(--line);
}
.next-case:hover .cta-giant {
  color: var(--accent);
}
</style>
