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
      lenis = new Lenis({
        duration: 1.15,
        smoothWheel: true,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
      })
      lenis.on('scroll', ScrollTrigger.update)
      gsap.ticker.add((time: number) => {
        lenis?.raf(time * 1000)
      })
      gsap.ticker.lagSmoothing(0)
    }
  }

  nuxtApp.provide('lenis', lenis)
  nuxtApp.provide('reduceMotion', reduceMotion)

  // v-reveal : fondu + translation à l'entrée dans le viewport.
  // `v-reveal="0.15"` décale le départ (stagger manuel).
  nuxtApp.vueApp.directive('reveal', {
    mounted(el: HTMLElement, binding) {
      const delay = typeof binding.value === 'number' ? binding.value : 0
      // L'état masqué est posé tout de suite, la timeline seulement après le
      // loader : sinon les blocs au-dessus de la ligne de flottaison se
      // révèlent derrière le rideau, donc pour personne.
      gsap.set(el, { autoAlpha: 0, y: reduceMotion ? 0 : 40 })
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
  nuxtApp.vueApp.directive('lines', {
    mounted(el: HTMLElement, binding) {
      const inner = el.querySelectorAll<HTMLElement>('.line-mask > span')
      if (!inner.length) return
      const delay = typeof binding.value === 'number' ? binding.value : 0
      if (reduceMotion) {
        gsap.set(inner, { yPercent: 0, autoAlpha: 1 })
        return
      }
      gsap.set(inner, { yPercent: 110 })
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
