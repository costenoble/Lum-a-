<template>
  <div id="nav-overlay" class="nav-overlay" ref="root" :aria-hidden="!navOpen">
    <nav>
      <ul class="nav-overlay__list">
        <li v-for="item in nav" :key="item.to">
          <NuxtLink :to="item.to" @click="navOpen = false">
            <span>{{ item.label }}</span>
            <!-- Flèche en deux tracés : la diagonale se dessine (dasharray)
                 pour donner l'étirement, la tête arrive juste derrière. -->
            <svg
              class="nav-overlay__itemArrow"
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              aria-hidden="true"
            >
              <path
                class="nav-overlay__arrowShaft"
                d="M6 22 22 6"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
              />
              <path
                class="nav-overlay__arrowHead"
                d="M9.5 6H22v12.5"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <ul class="nav-overlay__secondary">
      <li v-for="item in navSecondary" :key="item.to">
        <NuxtLink :to="item.to" class="link-under" @click="navOpen = false">
          {{ item.label }}
        </NuxtLink>
      </li>
    </ul>

    <div class="nav-overlay__meta">
      <a :href="`mailto:${site.email}`" class="link-under">{{ site.email }}</a>
      <a :href="`tel:${site.phone.replace(/\s/g, '')}`" class="link-under">{{ site.phone }}</a>
      <span>{{ site.address.join(' · ') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'

const navOpen = useNavOpen()
const root = ref<HTMLElement | null>(null)
const { $reduceMotion, $lenis } = useNuxtApp()

// Le panneau se dévoile par clip-path (rideau du haut), les entrées montent
// derrière leur masque. On garde une seule timeline, reconstruite à chaque
// bascule : plus lisible qu'un reverse() à maintenir.
// Elle est arrêtée avant d'être remplacée : sinon la fin d'une fermeture encore
// en cours (`visibility: hidden`) tomberait après une réouverture rapide et
// referait disparaître un menu pourtant ouvert.
let tl: gsap.core.Timeline | null = null

watch(navOpen, (open) => {
  const el = root.value
  if (!el) return

  tl?.kill()

  const items = el.querySelectorAll('.nav-overlay__list a')
  const meta = el.querySelector('.nav-overlay__meta')

  if (import.meta.client) {
    document.body.classList.toggle('nav-locked', open)
    if ($lenis) open ? ($lenis as any).stop() : ($lenis as any).start()

    // Le focus ne doit jamais rester sur un lien qu'on masque (aria-hidden) : en
    // cliquant un lien du menu, ce lien garde le focus le temps que la navigation
    // parte, pile au moment où navOpen passe à false — Chrome bloque alors le
    // aria-hidden et le signale en erreur console, à raison (un lecteur d'écran ne
    // doit jamais perdre le focus sur du contenu qu'il ne peut plus annoncer).
    if (!open) {
      const active = document.activeElement as HTMLElement | null
      if (active && el.contains(active)) active.blur()
    }
  }

  if ($reduceMotion) {
    gsap.set(el, { autoAlpha: open ? 1 : 0, clipPath: 'inset(0 0 0 0)' })
    gsap.set([items, meta], { yPercent: 0, autoAlpha: 1 })
    return
  }

  tl = gsap.timeline()
  if (open) {
    tl.set(el, { visibility: 'visible' })
      .fromTo(
        el,
        { clipPath: 'inset(0 0 100% 0)' },
        { clipPath: 'inset(0 0 0% 0)', duration: 0.75, ease: 'expo.inOut' }
      )
      .fromTo(
        items,
        { yPercent: 115 },
        { yPercent: 0, duration: 0.85, ease: 'expo.out', stagger: 0.07 },
        '-=0.35'
      )
      .fromTo(meta, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, '-=0.4')
  } else {
    tl.to(items, { yPercent: -115, duration: 0.4, ease: 'power3.in', stagger: 0.04 })
      .to(meta, { autoAlpha: 0, duration: 0.2 }, 0)
      .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 0.6, ease: 'expo.inOut' }, '-=0.15')
      .set(el, { visibility: 'hidden' })
  }
})

// Échap ferme le panneau.
onMounted(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') navOpen.value = false
  }
  window.addEventListener('keydown', onKey)
  onUnmounted(() => window.removeEventListener('keydown', onKey))
})
</script>
