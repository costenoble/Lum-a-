<template>
  <div>
    <section class="container page-head">
      <p class="eyebrow" v-reveal>Coffret sur mesure</p>
      <h1 v-lines="0.05" style="font-size: var(--fs-hero); margin-top: 1.5rem">
        <span class="line-mask"><span>Composez</span></span>
        <span class="line-mask"><span>votre <em>six</em></span></span>
      </h1>
      <p class="lead" v-reveal="0.4" style="margin-top: 2rem">
        Six bouteilles, les parfums que vous voulez, dans l’ordre que vous voulez.
        Huit pour cent moins cher qu’à l’unité.
      </p>
    </section>

    <section class="container composer">
      <!-- LA CAISSE -->
      <div class="crate" v-reveal>
        <div
          class="crate__glow"
          ref="glowEl"
          :style="{ background: glow }"
          aria-hidden="true"
        />

        <ol class="crate__slots" :aria-label="`Coffret : ${picked.length} bouteilles sur ${SIZE}`">
          <li v-for="(slot, i) in slots" :key="i" class="slot" :class="{ 'is-empty': !slot }">
            <Transition :css="false" @enter="onDrop" @leave="onPull">
              <button
                v-if="slot"
                :key="`${slot.slug}-${i}`"
                class="slot__bottle"
                :aria-label="`Retirer ${slot.name}`"
                @click="removeAt(i)"
              >
                <BottleShot
                  :label="slot.name"
                  :src="slot.render"
                  :color="slot.color"
                  :color2="slot.color2"
                  ratio="4x5"
                />
                <span class="slot__name">{{ slot.name }}</span>
              </button>
            </Transition>

            <span v-if="!slot" class="slot__index">{{ i + 1 }}</span>
          </li>
        </ol>

        <p class="crate__count">
          <span ref="countEl">{{ picked.length }}</span> / {{ SIZE }} bouteilles
        </p>
      </div>

      <!-- LE CHOIX -->
      <aside class="picker" v-reveal="0.1">
        <h2 class="eyebrow">Les parfums</h2>

        <ul class="picker__list">
          <li v-for="drink in drinks" :key="drink.slug">
            <button
              class="picker__row"
              :disabled="isFull"
              :style="{ '--c': drink.color }"
              @click="addBottle(drink)"
            >
              <span class="picker__dot" />
              <span class="picker__name">{{ drink.name }}</span>
              <span class="picker__fruit muted">{{ drink.fruit }}</span>
              <span class="picker__qty" v-if="countOf(drink.slug)">×{{ countOf(drink.slug) }}</span>
              <span class="picker__plus" aria-hidden="true">+</span>
            </button>
          </li>
        </ul>

        <div class="picker__shortcuts">
          <button class="link-under" @click="fillOneEach">Un de chaque</button>
          <button class="link-under" :disabled="!picked.length" @click="clearBox">Tout retirer</button>
        </div>

        <div class="picker__price">
          <div>
            <p class="picker__amount" ref="priceEl">{{ formatPrice(price) }}</p>
            <p class="muted picker__saving">
              {{ picked.length ? `Soit ${formatPrice(saving)} d’économie` : 'Prix du coffret complet' }}
            </p>
          </div>

          <button class="btn" v-magnetic :disabled="!isFull" @click="addToCart">
            <span>{{ added ? 'Ajouté ✓' : 'Ajouter au panier' }}</span>
          </button>
        </div>
      </aside>
    </section>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import type { Drink } from '~/composables/useSite'

useHead({ title: 'Coffret sur mesure — Luméa' })

const SIZE = 6

const { add, open: cartOpen } = useCart()
const { $reduceMotion } = useNuxtApp()

const route = useRoute()
const router = useRouter()

// La composition vit aussi dans l'URL (?c=solaire-comete-…) : un coffret se
// partage donc par simple lien, et un rechargement ne perd pas la sélection.
const picked = ref<Drink[]>(
  String(route.query.c ?? '')
    .split('-')
    .map((slug) => drinks.find((d) => d.slug === slug))
    .filter((d): d is Drink => Boolean(d))
    .slice(0, SIZE)
)
const added = ref(false)

watch(
  picked,
  (list) => {
    const c = list.map((d) => d.slug).join('-')
    // `replace` plutôt que `push` : composer un coffret ne doit pas remplir
    // l'historique de navigation.
    router.replace({ query: c ? { c } : {} })
  },
  { deep: true }
)

// Six emplacements toujours affichés : la caisse garde sa forme même vide,
// c'est elle qui donne l'échelle du coffret.
const slots = computed<(Drink | null)[]>(() =>
  Array.from({ length: SIZE }, (_, i) => picked.value[i] ?? null)
)

const isFull = computed(() => picked.value.length >= SIZE)

// Le halo de la caisse mélange les couleurs choisies : le coffret prend
// littéralement la teinte de sa composition.
const glow = computed(() => {
  if (!picked.value.length) return 'radial-gradient(60% 60% at 50% 60%, rgba(15,15,15,0.05), transparent)'
  const stops = picked.value
    .map((d, i) => `${d.color} ${(i / picked.value.length) * 100}%`)
    .join(', ')
  return `radial-gradient(75% 70% at 50% 65%, ${stops})`
})

// --- prix -------------------------------------------------------------------
// Le tarif vient de boxFromSlug : une seule règle de calcul pour la page, le
// panier et le récapitulatif de commande.
const boxSlug = computed(() => makeBoxSlug(picked.value.map((d) => d.slug)))
const price = computed(() => (picked.value.length ? (boxFromSlug(boxSlug.value)?.price ?? 0) : 0))
const fullPrice = computed(() => picked.value.reduce((sum, d) => sum + d.price / 6, 0))
const saving = computed(() => Math.round((fullPrice.value - price.value) * 100) / 100)

const priceEl = ref<HTMLElement | null>(null)
watch(price, (next, previous) => {
  if (!priceEl.value) return
  if ($reduceMotion) {
    priceEl.value.textContent = formatPrice(next)
    return
  }
  const proxy = { n: previous ?? 0 }
  gsap.to(proxy, {
    n: next,
    duration: 0.5,
    ease: 'power2.out',
    onUpdate: () => {
      if (priceEl.value) priceEl.value.textContent = formatPrice(proxy.n)
    }
  })
})

// --- composition ------------------------------------------------------------
function addBottle(drink: Drink) {
  if (isFull.value) return
  picked.value = [...picked.value, drink]
  added.value = false
  bumpCount()
}

function removeAt(index: number) {
  picked.value = picked.value.filter((_, i) => i !== index)
  added.value = false
  bumpCount()
}

function fillOneEach() {
  picked.value = drinks.slice(0, SIZE)
  added.value = false
  bumpCount()
}

function clearBox() {
  picked.value = []
  added.value = false
  bumpCount()
}

function countOf(slug: string) {
  return picked.value.filter((d) => d.slug === slug).length
}

function addToCart() {
  if (!isFull.value) return
  add(boxSlug.value)
  added.value = true
  cartOpen.value = false
}

// --- animations -------------------------------------------------------------
const countEl = ref<HTMLElement | null>(null)

function bumpCount() {
  if ($reduceMotion || !countEl.value) return
  gsap.fromTo(
    countEl.value,
    { scale: 1.35, color: 'var(--accent)' },
    { scale: 1, color: 'inherit', duration: 0.5, ease: 'back.out(2)' }
  )
}

// La bouteille tombe dans son casier, avec un léger rebond et une rotation qui
// se remet droite : c'est ce qui donne la sensation de « poser » un objet.
function onDrop(el: Element, done: () => void) {
  if ($reduceMotion) {
    done()
    return
  }
  gsap.fromTo(
    el,
    { y: -90, rotate: -9, autoAlpha: 0 },
    { y: 0, rotate: 0, autoAlpha: 1, duration: 0.75, ease: 'back.out(1.6)', onComplete: done }
  )
}

function onPull(el: Element, done: () => void) {
  if ($reduceMotion) {
    done()
    return
  }
  gsap.to(el, { y: 60, rotate: 6, autoAlpha: 0, duration: 0.35, ease: 'power2.in', onComplete: done })
}
</script>

<style scoped>
.page-head {
  padding-block: calc(var(--header-h) + 6rem) var(--sp-4);
}
.page-head em {
  font-style: normal;
  color: var(--accent);
}

.composer {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(300px, 1fr);
  gap: clamp(2rem, 5vw, 4.5rem);
  align-items: start;
  padding-bottom: var(--sp-6);
}

/* --- la caisse ------------------------------------------------------------ */
.crate {
  position: relative;
  padding: clamp(1.2rem, 3vw, 2.2rem);
  border-radius: 20px;
  background: var(--paper-2);
  overflow: hidden;
}
.crate__glow {
  position: absolute;
  inset: -20%;
  filter: blur(60px);
  opacity: 0.55;
  transition: background 0.8s var(--ease-soft);
  pointer-events: none;
}
.crate__slots {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(0.6rem, 1.5vw, 1.1rem);
}
.slot {
  position: relative;
  aspect-ratio: 4 / 5;
  border-radius: 12px;
  display: grid;
  place-items: center;
}
.slot.is-empty {
  box-shadow: inset 0 0 0 1px var(--line);
  background: rgba(255, 255, 255, 0.35);
}
.slot__index {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--ink-soft);
  opacity: 0.5;
}
.slot__bottle {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  overflow: hidden;
  padding: 0;
}
.slot__bottle :deep(.media) {
  height: 100%;
  border-radius: 12px;
}
.slot__bottle :deep(.ph__tag) {
  display: none;
}
.slot__name {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  padding: 0.6rem;
  font-family: var(--font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #fff;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
}
.crate__count {
  position: relative;
  margin-top: 1.4rem;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
.crate__count span {
  display: inline-block;
  font-size: 1.1rem;
  color: var(--ink);
}

/* --- le choix ------------------------------------------------------------- */
.picker__list {
  margin-top: 1.2rem;
  border-top: 1px solid var(--line);
}
.picker__row {
  width: 100%;
  display: grid;
  grid-template-columns: auto auto 1fr auto auto;
  align-items: center;
  gap: 0.8rem;
  padding-block: 0.95rem;
  border-bottom: 1px solid var(--line);
  text-align: left;
  transition: padding-left 0.4s var(--ease-soft);
}
.picker__row:hover:not(:disabled) {
  padding-left: 0.6rem;
}
.picker__row:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.picker__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--c);
}
.picker__name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.05rem;
}
.picker__fruit {
  font-size: 0.85rem;
}
.picker__qty {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--accent);
}
.picker__plus {
  font-family: var(--font-mono);
  color: var(--ink-soft);
}
.picker__shortcuts {
  display: flex;
  gap: 1.4rem;
  margin-top: 1.2rem;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
.picker__shortcuts button:disabled {
  opacity: 0.4;
}
.picker__price {
  margin-top: var(--sp-4);
  padding-top: 1.4rem;
  border-top: 1px solid var(--line);
  display: grid;
  gap: 1.2rem;
}
.picker__amount {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(2rem, 4vw, 2.8rem);
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}
.picker__saving {
  font-size: 0.85rem;
  margin-top: 0.2rem;
}
.picker__price .btn {
  justify-content: center;
}
.picker__price .btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .composer {
    grid-template-columns: 1fr;
  }
}
</style>
