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

    <!-- Le personnage qui écrit « MENU » à la craie, joué une fois à l'ouverture.
         Une petite vignette calée en haut à droite, sous Panier/Fermer — pas un
         fond plein écran : sans mouvement, l'image d'attente montre directement
         le mot déjà écrit. -->
    <video
      ref="introVideo"
      class="nav-overlay__video"
      :poster="menuPoster"
      muted
      playsinline
      preload="none"
      disablepictureinpicture
      aria-hidden="true"
    />
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import menuVideoSrc from '~/components/minimaxH3/menu/menu.web.mp4'
import menuPoster from '~/components/minimaxH3/menu/menu-poster.jpg'

const navOpen = useNavOpen()
const root = ref<HTMLElement | null>(null)
const introVideo = ref<HTMLVideoElement | null>(null)
const { $reduceMotion, $lenis } = useNuxtApp()

// Chargée en mémoire dès le montage (elle vit toute la session, pas seulement le
// temps où le menu est ouvert) : au premier clic sur « Menu », elle doit démarrer
// tout de suite. `preload` n'est qu'un souhait pour le navigateur — sans lancer la
// lecture au moins une fois, certains ne téléchargent rien tant qu'on ne le leur
// demande pas (voir HeroVideo) ; charger le fichier soi-même en Blob le garantit.
let videoReady: Promise<void> | null = null
if (import.meta.client && !$reduceMotion) {
  videoReady = fetch(menuVideoSrc)
    .then((r) => r.blob())
    .then((blob) => {
      if (introVideo.value) introVideo.value.src = URL.createObjectURL(blob)
    })
    .catch(() => {}) // hors ligne, ou fetch refusé : elle restera sur son image d'attente
}

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
  }

  if ($reduceMotion) {
    gsap.set(el, { autoAlpha: open ? 1 : 0, clipPath: 'inset(0 0 0 0)' })
    gsap.set([items, meta], { yPercent: 0, autoAlpha: 1 })
    return
  }

  // La vidéo démarre tout de suite (« s'active » avec le clic), pas seulement une
  // fois le rideau ouvert : elle joue pendant que le panneau se déploie.
  if (open) {
    const v = introVideo.value
    if (v) {
      v.currentTime = 0
      ;(videoReady ?? Promise.resolve()).then(() => v.play().catch(() => {}))
    }
  } else {
    introVideo.value?.pause()
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

<style scoped>
/* Petite vignette, en haut à droite du panneau : sous « Panier »/« Fermer » (même
   bord droit que l'en-tête, via --pad-inline), à côté de la liste des liens plutôt
   qu'en fond plein écran. Le ratio reprend presque exactement celui de la vidéo
   source (1934 x 1080) : « cover » n'a alors quasiment rien à rogner, le mot
   « MENU » reste entier quelle que soit la taille de la vignette. */
.nav-overlay__video {
  position: absolute;
  top: calc(var(--header-h) + 1.4rem);
  right: var(--pad-inline);
  width: clamp(592px, 68vw, 880px);
  aspect-ratio: 1934 / 1080;
  object-fit: cover;
  pointer-events: none;
}
@media (max-width: 640px) {
  /* Sous ce panneau, la liste de liens en gros caractères peut passer sous la
     vignette : on la réduit encore pour ne rester que dans la marge du haut. */
  .nav-overlay__video {
    width: clamp(280px, 74vw, 380px);
  }
}
</style>
