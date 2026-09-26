<template>
  <div class="intro" ref="root" aria-hidden="true">
    <div class="intro__bands"><span /><span /><span /></div>

    <div class="intro__content">
      <p class="intro__word line-mask"><span ref="wordEl">Luméa</span></p>
      <p class="intro__baseline" ref="baselineEl">Boissons revigorantes pour les petits</p>
    </div>

    <p class="intro__count" ref="countEl">{{ initialCount }}</p>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'

// ---------------------------------------------------------------------------
// Rideau d'accueil : compteur 0 → 100 pendant que le mot « Luméa » se lève,
// puis les bandes remontent et découvrent le hero. Le reste des animations
// attend markIntroDone() (cf. composables/useIntro.ts).
// ---------------------------------------------------------------------------

const root = ref<HTMLElement | null>(null)
const wordEl = ref<HTMLElement | null>(null)
const baselineEl = ref<HTMLElement | null>(null)
const countEl = ref<HTMLElement | null>(null)

// Le compteur est écrit directement dans le DOM pendant l'animation : à
// 60 fps, passer par une ref déclencherait autant de rendus Vue, ce qui se
// voyait sur le rideau (à-coups).
const initialCount = '000'

const emit = defineEmits<{ done: [] }>()

const { $reduceMotion, $lenis } = useNuxtApp()

onMounted(() => {
  const el = root.value
  if (!el) return

  // En mode « mouvement réduit », pas de rideau du tout : la page est déjà là.
  if ($reduceMotion) {
    markIntroDone()
    emit('done')
    return
  }

  document.body.classList.add('nav-locked')
  ;($lenis as any)?.stop()

  const finish = () => {
    document.body.classList.remove('nav-locked')
    ;($lenis as any)?.start()
    markIntroDone()
    emit('done')
  }

  const progress = { n: 0 }
  const tl = gsap.timeline({ onComplete: finish })

  // Garde-fou : GSAP avance au rythme du requestAnimationFrame, qui est bridé
  // quand l'onglet démarre en arrière-plan. Sans cela, le rideau pourrait
  // rester en place bien après les 3,4 s prévues.
  const failsafe = window.setTimeout(() => {
    if (!tl.isActive()) return
    tl.kill()
    finish()
  }, 5000 + HERO_WAIT_MS)
  tl.eventCallback('onComplete', () => {
    window.clearTimeout(failsafe)
    finish()
  })

  tl.fromTo(
    wordEl.value,
    { yPercent: 110 },
    { yPercent: 0, duration: 1, ease: 'expo.out' }
  )
    .fromTo(baselineEl.value, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, '-=0.5')
    // Le compteur mène la danse : sa durée fixe la longueur du loader.
    .to(
      progress,
      {
        n: 100,
        duration: 1.9,
        ease: 'power2.inOut',
        onUpdate: () => {
          if (countEl.value) {
            countEl.value.textContent = String(Math.round(progress.n)).padStart(3, '0')
          }
        }
      },
      0
    )
    // Le compteur est à 100. Si la vidéo du hero n'est pas encore prête, on attend
    // (au plus HERO_WAIT_MS) avant de lever le rideau : on ne veut pas découvrir un
    // cadre noir. La pause vit dans un callback, hors du calcul des durées ci-dessus.
    .call(() => {
      tl.pause()
      Promise.race([heroReady, new Promise<void>((r) => window.setTimeout(r, HERO_WAIT_MS))]).then(() =>
        tl.play()
      )
    })
    // Sortie : le mot repart vers le haut, puis les bandes le suivent.
    .to([wordEl.value, baselineEl.value], {
      yPercent: -120,
      duration: 0.7,
      ease: 'expo.in',
      stagger: 0.05
    })
    .to(countEl.value, { autoAlpha: 0, duration: 0.3 }, '-=0.5')
    // Les bandes vont se lever : la vidéo du hero démarre à cet instant précis.
    .call(markCurtainUp, undefined, '-=0.25')
    .to(
      el.querySelectorAll('.intro__bands span'),
      {
        scaleY: 0,
        transformOrigin: 'top',
        duration: 0.9,
        ease: 'expo.inOut',
        stagger: 0.07
      },
      '-=0.25'
    )
})

onUnmounted(() => {
  // Sécurité si l'utilisateur navigue pendant le loader.
  document.body.classList.remove('nav-locked')
  ;($lenis as any)?.start()
  markIntroDone()
})
</script>

<style scoped>
.intro {
  position: fixed;
  inset: 0;
  z-index: 100;
  color: var(--on-night);
  display: grid;
  place-items: center;
  overflow: hidden;
}
/* Les bandes forment le fond : elles remontent une à une à la sortie. */
.intro__bands {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
.intro__bands span {
  background: var(--night);
  will-change: transform;
  /* Même couture d'un demi-pixel que sur le rideau de transition : chaque
     bande mord sur sa voisine pour qu'aucun trait clair ne subsiste. */
  width: calc(100% + 1px);
  backface-visibility: hidden;
}
.intro__content {
  position: relative;
  text-align: center;
  padding-inline: var(--pad-inline);
}
.intro__word {
  font-family: var(--font-display);
  font-weight: 700;
  /* 14vw faisait dépasser le mot de sa boîte sur les écrans étroits, et le
     masque (overflow: hidden) coupait alors le A. On resserre et on ouvre le
     masque latéralement — même principe que le padding vertical des accents. */
  font-size: clamp(3rem, 12vw, 11rem);
  line-height: 0.9;
  letter-spacing: -0.04em;
  text-transform: uppercase;
  white-space: nowrap;
  padding-inline: 0.12em;
  margin-inline: -0.12em;
}
.intro__baseline {
  margin-top: 1.2rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--on-night-soft);
}
.intro__count {
  position: absolute;
  right: var(--pad-inline);
  bottom: 2rem;
  font-family: var(--font-mono);
  font-size: clamp(2.5rem, 7vw, 5rem);
  letter-spacing: -0.04em;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}
</style>
