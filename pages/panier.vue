<template>
  <div>
    <section class="container page-head">
      <p class="eyebrow" v-reveal>{{ count }} pack{{ count > 1 ? 's' : '' }}</p>
      <h1 v-lines="0.05" style="font-size: var(--fs-hero); margin-top: 1.5rem">
        <span class="line-mask"><span>Panier</span></span>
      </h1>
    </section>

    <!-- PANIER VIDE -->
    <section v-if="!detailed.length" class="container empty">
      <p class="lead" v-reveal>
        Rien pour l’instant. Six parfums attendent, tous sans sucres ajoutés.
      </p>
      <NuxtLink to="/boutique" class="btn" v-magnetic v-reveal="0.1">
        <span>Voir la boutique</span>
      </NuxtLink>

      <div class="empty__row" v-reveal="0.15">
        <NuxtLink
          v-for="drink in drinks.slice(0, 4)"
          :key="drink.slug"
          :to="`/boissons/${drink.slug}`"
          class="empty__card reveal-mask"
          data-cursor="Voir"
        >
          <BottleShot
            :label="drink.name"
            :src="drink.render"
            :color="drink.color"
            :color2="drink.color2"
            ratio="4x5"
          />
        </NuxtLink>
      </div>
    </section>

    <!-- PANIER REMPLI -->
    <section v-else class="container cart-page">
      <div>
        <!-- Chaque ligne entre en cascade et se replie sur elle-même à la
             suppression : les hooks JS de TransitionGroup laissent GSAP piloter
             la hauteur, ce qu'une transition CSS ne sait pas faire proprement. -->
        <TransitionGroup
          tag="ul"
          class="lines"
          :css="false"
          @enter="onEnter"
          @leave="onLeave"
        >
          <li v-for="(line, i) in detailed" :key="line.slug" :data-index="i" class="line">
            <NuxtLink
              :to="`/boissons/${line.drink.slug}`"
              class="line__media reveal-mask"
              data-cursor="Voir"
            >
              <BottleShot
                :label="line.drink.name"
                :src="line.drink.render"
                :color="line.drink.color"
                :color2="line.drink.color2"
                ratio="1x1"
              />
            </NuxtLink>

            <div class="line__body">
              <h2 class="line__name">{{ line.drink.name }}</h2>
              <p class="muted line__fruit">{{ line.drink.fruit }}</p>
              <p class="line__pack">{{ line.drink.pack }} · {{ line.drink.age }}</p>

              <div class="stepper">
                <button aria-label="Retirer un pack" @click="setQty(line.slug, line.qty - 1)">
                  −
                </button>
                <span class="stepper__value">{{ line.qty }}</span>
                <button aria-label="Ajouter un pack" @click="setQty(line.slug, line.qty + 1)">
                  +
                </button>
              </div>
            </div>

            <div class="line__end">
              <p class="line__price">{{ formatPrice(line.total) }}</p>
              <button class="line__remove link-under" @click="remove(line.slug)">Supprimer</button>
            </div>
          </li>
        </TransitionGroup>

        <button class="clear link-under" @click="clear">Vider le panier</button>
      </div>

      <!-- RÉCAPITULATIF -->
      <aside class="summary" v-reveal>
        <h2 class="eyebrow">Récapitulatif</h2>

        <dl class="summary__rows">
          <div>
            <dt>Sous-total</dt>
            <dd>{{ formatPrice(total) }}</dd>
          </div>
          <div>
            <dt>Consigne ({{ bottles }} bouteilles)</dt>
            <dd>{{ formatPrice(deposit) }}</dd>
          </div>
          <div>
            <dt>Livraison</dt>
            <dd>{{ shipping === 0 ? 'Offerte' : formatPrice(shipping) }}</dd>
          </div>
        </dl>

        <!-- Jauge de franco de port : la barre s'anime à chaque changement. -->
        <div class="franco">
          <div class="franco__track"><span ref="francoBar" class="franco__bar" /></div>
          <p class="franco__label muted">
            {{
              remaining > 0
                ? `Plus que ${formatPrice(remaining)} pour la livraison offerte`
                : 'Livraison offerte 🎉'
            }}
          </p>
        </div>

        <p class="summary__total">
          <span>Total TTC</span>
          <span ref="totalEl">{{ formatPrice(grandTotal) }}</span>
        </p>

        <button class="btn summary__cta" v-magnetic :disabled="state !== 'idle'" @click="checkout">
          <span>{{ ctaLabel }}</span>
        </button>

        <!-- Confirmation : la coche se dessine au lieu d'apparaître. -->
        <div v-if="state === 'done'" class="done" role="status">
          <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <circle ref="doneCircle" cx="20" cy="20" r="18" stroke="currentColor" stroke-width="2" />
            <path
              ref="doneCheck"
              d="M12 20.5 18 26 28 14"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <p>Commande simulée. Aucun paiement n’a été déclenché.</p>
        </div>

        <p class="summary__note muted">
          Expédition sous 48 h · consigne remboursée en point de vente
        </p>
      </aside>
    </section>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'

useHead({ title: 'Panier — Luméa' })

const { detailed, count, total, setQty, remove, clear, restore } = useCart()
const { $reduceMotion } = useNuxtApp()

onMounted(restore)

// --- calculs de commande ----------------------------------------------------
const BOTTLES_PER_PACK = 6
const DEPOSIT_PER_BOTTLE = 0.3
const FREE_SHIPPING_FROM = 40
const SHIPPING_COST = 5.9

const bottles = computed(() => count.value * BOTTLES_PER_PACK)
const deposit = computed(() => bottles.value * DEPOSIT_PER_BOTTLE)
const shipping = computed(() => (total.value >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST))
const grandTotal = computed(() => total.value + deposit.value + shipping.value)
const remaining = computed(() => Math.max(FREE_SHIPPING_FROM - total.value, 0))

// --- total animé ------------------------------------------------------------
// Le montant est écrit directement dans le DOM : à 60 fps, une ref déclencherait
// autant de rendus Vue pour un seul nombre qui bouge.
const totalEl = ref<HTMLElement | null>(null)
watch(grandTotal, (next, previous) => {
  if (!totalEl.value) return
  if ($reduceMotion) {
    totalEl.value.textContent = formatPrice(next)
    return
  }
  const proxy = { n: previous ?? next }
  gsap.to(proxy, {
    n: next,
    duration: 0.6,
    ease: 'power2.out',
    onUpdate: () => {
      if (totalEl.value) totalEl.value.textContent = formatPrice(proxy.n)
    }
  })
})

// --- jauge de franco --------------------------------------------------------
const francoBar = ref<HTMLElement | null>(null)
const francoRatio = computed(() => Math.min(total.value / FREE_SHIPPING_FROM, 1))

watch(
  francoRatio,
  (ratio) => {
    if (!francoBar.value) return
    gsap.to(francoBar.value, {
      scaleX: ratio,
      duration: $reduceMotion ? 0.01 : 0.7,
      ease: 'power3.out'
    })
  },
  { immediate: true }
)
onMounted(() => {
  if (francoBar.value) gsap.set(francoBar.value, { scaleX: francoRatio.value })
})

// --- lignes : entrée en cascade, sortie en repli ----------------------------
function onEnter(el: Element, done: () => void) {
  const index = Number((el as HTMLElement).dataset.index ?? 0)
  if ($reduceMotion) {
    done()
    return
  }
  gsap.fromTo(
    el,
    { autoAlpha: 0, y: 60 },
    { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', delay: index * 0.08, onComplete: done }
  )
}

function onLeave(el: Element, done: () => void) {
  if ($reduceMotion) {
    done()
    return
  }
  const height = (el as HTMLElement).offsetHeight
  gsap
    .timeline({ onComplete: done })
    .to(el, { autoAlpha: 0, x: 40, duration: 0.35, ease: 'power2.in' })
    .fromTo(
      el,
      { height, marginBottom: 0 },
      { height: 0, paddingTop: 0, paddingBottom: 0, duration: 0.4, ease: 'power2.inOut' },
      '-=0.1'
    )
}

// --- passage de commande ----------------------------------------------------
// Aucun paiement branché : on joue la confirmation puis on vide. Brancher ici
// l'appel au prestataire le moment venu.
const state = ref<'idle' | 'sending' | 'done'>('idle')
const doneCircle = ref<SVGCircleElement | null>(null)
const doneCheck = ref<SVGPathElement | null>(null)

const ctaLabel = computed(() =>
  state.value === 'sending' ? 'Traitement…' : state.value === 'done' ? 'Merci !' : 'Commander'
)

async function checkout() {
  if (state.value !== 'idle') return
  state.value = 'sending'
  await new Promise((resolve) => setTimeout(resolve, 900))
  state.value = 'done'
  await nextTick()
  drawConfirmation()
  setTimeout(() => {
    clear()
    state.value = 'idle'
  }, 2600)
}

function drawConfirmation() {
  if ($reduceMotion || !doneCircle.value || !doneCheck.value) return
  const circleLength = doneCircle.value.getTotalLength()
  const checkLength = doneCheck.value.getTotalLength()
  gsap
    .timeline()
    .fromTo(
      doneCircle.value,
      { strokeDasharray: circleLength, strokeDashoffset: circleLength },
      { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' }
    )
    .fromTo(
      doneCheck.value,
      { strokeDasharray: checkLength, strokeDashoffset: checkLength },
      { strokeDashoffset: 0, duration: 0.4, ease: 'power2.out' },
      '-=0.2'
    )
}
</script>

<style scoped>
.page-head {
  padding-block: calc(var(--header-h) + 6rem) var(--sp-4);
}

/* --- vide ----------------------------------------------------------------- */
.empty {
  display: grid;
  justify-items: start;
  gap: var(--sp-3);
  padding-bottom: var(--sp-6);
}
.empty__row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.2rem;
  width: 100%;
  margin-top: var(--sp-4);
}
.empty__card :deep(.ph__tag) {
  display: none;
}

/* --- lignes --------------------------------------------------------------- */
.cart-page {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr);
  gap: clamp(2rem, 5vw, 4.5rem);
  padding-bottom: var(--sp-6);
  align-items: start;
}
.line {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr) auto;
  gap: clamp(1rem, 2.5vw, 2rem);
  padding-block: clamp(1.4rem, 3vw, 2.2rem);
  border-top: 1px solid var(--line);
  align-items: start;
  overflow: hidden;
}
.line__media {
  display: block;
}
.line__media :deep(.ph__tag) {
  display: none;
}
.line__name {
  font-size: clamp(1.5rem, 2.6vw, 2.1rem);
}
.line__fruit {
  margin-top: 0.2rem;
}
.line__pack {
  margin-top: 0.7rem;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
.stepper {
  display: inline-flex;
  align-items: center;
  gap: 0.9rem;
  margin-top: 1.2rem;
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px var(--line);
  font-family: var(--font-mono);
  font-size: 0.9rem;
}
.stepper button {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  line-height: 1;
  transition: background 0.3s var(--ease-soft), color 0.3s var(--ease-soft);
}
.stepper button:hover {
  background: var(--accent);
  color: #fff;
}
.stepper__value {
  min-width: 1.4ch;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.line__end {
  text-align: right;
}
.line__price {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.3rem;
}
.line__remove {
  margin-top: 0.8rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
.clear {
  margin-top: var(--sp-3);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

/* --- récapitulatif -------------------------------------------------------- */
.summary {
  position: sticky;
  top: calc(var(--header-h) + 2rem);
  padding: var(--sp-3);
  border-radius: 16px;
  background: var(--paper-2);
}
.summary__rows {
  margin: 1.4rem 0 0;
  display: grid;
  gap: 0.8rem;
}
.summary__rows > div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.95rem;
}
.summary__rows dt {
  color: var(--ink-soft);
}
.summary__rows dd {
  margin: 0;
  font-family: var(--font-mono);
}
.franco {
  margin-top: var(--sp-3);
}
.franco__track {
  height: 3px;
  border-radius: 999px;
  background: rgba(15, 15, 15, 0.12);
  overflow: hidden;
}
.franco__bar {
  display: block;
  height: 100%;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left;
}
.franco__label {
  margin-top: 0.6rem;
  font-size: 0.8rem;
}
.summary__total {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: var(--sp-3);
  padding-top: 1.2rem;
  border-top: 1px solid var(--line);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.4rem;
  font-variant-numeric: tabular-nums;
}
.summary__cta {
  width: 100%;
  justify-content: center;
  margin-top: 1.4rem;
}
.summary__cta:disabled {
  opacity: 0.75;
  cursor: default;
}
.done {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-top: 1.2rem;
  font-size: 0.9rem;
  color: var(--ink-soft);
}
.done svg {
  width: 40px;
  height: 40px;
  flex: none;
  color: var(--accent);
}
.summary__note {
  margin-top: 1.2rem;
  font-size: 0.78rem;
}

@media (max-width: 900px) {
  .cart-page {
    grid-template-columns: 1fr;
  }
  .summary {
    position: static;
  }
  .line {
    grid-template-columns: 84px minmax(0, 1fr);
  }
  .line__end {
    grid-column: 2;
    text-align: left;
  }
}
</style>
