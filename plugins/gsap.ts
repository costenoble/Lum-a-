import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

// ---------------------------------------------------------------------------
// Point d'entrée unique de l'animation : Lenis (scroll lissé), ScrollTrigger,
// et les directives réutilisées partout dans les pages.
//
// Le plugin tourne côté serveur ET client (pas de suffixe .client) pour que
// les directives soient *déclarées* pendant le SSR — sinon Vue avertit
// « Failed to resolve directive ». Le travail réel reste derrière
// `import.meta.client`, mounted() n'étant de toute façon jamais appelé au SSR.
// ---------------------------------------------------------------------------

export default defineNuxtPlugin((nuxtApp) => {
  let reduceMotion = false
  let lenis: Lenis | null = null

  if (import.meta.client) {
    gsap.registerPlugin(ScrollTrigger)
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!reduceMotion) {
      // Lissage par interpolation (lerp) plutôt que par durée : l'ancien réglage
      // (duration 1,15 s, courbe exponentielle) faisait glisser la page plus d'une
      // seconde après chaque cran de molette, ce qui se ressent comme du retard. À 0,12,
      // la page suit le geste de près et garde juste ce qu'il faut de glisse.
      lenis = new Lenis({
        lerp: 0.12,
        smoothWheel: true
      })
      lenis.on('scroll', ScrollTrigger.update)
      gsap.ticker.add((time: number) => {
        lenis?.raf(time * 1000)
      })
      gsap.ticker.lagSmoothing(0)
    }

    // Les polices (Google Fonts, en `swap`) arrivent souvent après le premier calcul
    // des positions : un titre qui change de hauteur décale tout ce qui suit, et les
    // zones épinglées (hero vidéo, bouteilles) démarreraient au mauvais endroit.
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
  }

  nuxtApp.provide('lenis', lenis)
  nuxtApp.provide('reduceMotion', reduceMotion)

  // v-reveal : fondu + translation à l'entrée dans le viewport.
  // `v-reveal="0.15"` décale le départ (stagger manuel).
  //
  // Au SSR, la directive pose seulement `data-reveal` : main.css masque déjà ces
  // blocs dans le HTML servi (quand JS est là). Sans cela, en arrivant directement
  // sur une page, le texte s'affichait, disparaissait à l'hydratation, puis
  // revenait en fondu. Au montage, GSAP prend le relais en style inline et
  // l'attribut est retiré (il ne sert plus que de filet si JS ne démarre jamais).
  nuxtApp.vueApp.directive('reveal', {
    getSSRProps: () => ({ 'data-reveal': '' }),
    mounted(el: HTMLElement, binding) {
      const delay = typeof binding.value === 'number' ? binding.value : 0
      // L'état masqué est posé tout de suite, la timeline seulement après le
      // loader : sinon les blocs au-dessus de la ligne de flottaison se
      // révèlent derrière le rideau, donc pour personne.
      gsap.set(el, { autoAlpha: 0, y: reduceMotion ? 0 : 40 })
      el.removeAttribute('data-reveal')
      afterIntro(el, () => {
        ;(el as any).__tween = gsap.to(el, {
          autoAlpha: 1,
          y: 0,
          delay,
          duration: reduceMotion ? 0.01 : 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' }
        })
      })
    },
    unmounted: killTween
  })

  // v-lines : découpe le texte ligne par ligne (masque + montée).
  // Chaque enfant direct doit être une ligne (<span>) — on ne fait pas de
  // découpe typographique automatique, ce qui garde le HTML lisible et le
  // rendu SSR identique au rendu client.
  // Même principe que v-reveal pour l'état de départ servi au SSR (`data-lines`).
  nuxtApp.vueApp.directive('lines', {
    getSSRProps: () => ({ 'data-lines': '' }),
    mounted(el: HTMLElement, binding) {
      const inner = el.querySelectorAll<HTMLElement>('.line-mask > span')
      if (!inner.length) return el.removeAttribute('data-lines')
      const delay = typeof binding.value === 'number' ? binding.value : 0
      // `y: 0` explicite : GSAP relit sinon le translateY(125%) posé par main.css comme un
      // décalage en pixels, qu'il garderait en plus de son yPercent (titre coincé en bas).
      if (reduceMotion) {
        gsap.set(inner, { y: 0, yPercent: 0, autoAlpha: 1 })
        el.removeAttribute('data-lines')
        return
      }
      // 125 % : le masque déborde de 0,14 em en bas (jambages), la ligne doit passer dessous.
      gsap.set(inner, { y: 0, yPercent: 125 })
      el.removeAttribute('data-lines')
      afterIntro(el, () => {
        ;(el as any).__tween = gsap.to(inner, {
          yPercent: 0,
          duration: 1.1,
          delay,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none none' }
        })
      })
    },
    unmounted: killTween
  })

  // v-parallax : l'élément dérive plus lentement que le scroll.
  // `v-parallax="14"` = amplitude en % de la hauteur de l'élément.
  nuxtApp.vueApp.directive('parallax', {
    mounted(el: HTMLElement, binding) {
      if (reduceMotion) return
      const amount = typeof binding.value === 'number' ? binding.value : 12
      const tween = gsap.fromTo(
        el,
        { yPercent: -amount / 2 },
        {
          yPercent: amount / 2,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
        }
      )
      ;(el as any).__tween = tween
    },
    unmounted: killTween
  })

  // v-magnetic : l'élément se laisse attirer par le curseur (CTA).
  nuxtApp.vueApp.directive('magnetic', {
    mounted(el: HTMLElement) {
      if (reduceMotion) return
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' })
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' })
      const onMove = (e: MouseEvent) => {
        const r = el.getBoundingClientRect()
        xTo((e.clientX - r.left - r.width / 2) * 0.3)
        yTo((e.clientY - r.top - r.height / 2) * 0.3)
      }
      const onLeave = () => {
        xTo(0)
        yTo(0)
      }
      el.addEventListener('mousemove', onMove)
      el.addEventListener('mouseleave', onLeave)
      ;(el as any).__cleanup = () => {
        el.removeEventListener('mousemove', onMove)
        el.removeEventListener('mouseleave', onLeave)
      }
    },
    unmounted(el: HTMLElement) {
      ;(el as any).__cleanup?.()
    }
  })
})

// Diffère la création d'une timeline jusqu'à la fin du loader, en abandonnant
// si l'élément a été démonté entre-temps.
function afterIntro(el: HTMLElement, build: () => void) {
  ;(el as any).__alive = true
  introReady.then(() => {
    if ((el as any).__alive) build()
  })
}

function killTween(el: HTMLElement) {
  ;(el as any).__alive = false
  const tween = (el as any).__tween as gsap.core.Tween | undefined
  tween?.scrollTrigger?.kill()
  tween?.kill()
}
