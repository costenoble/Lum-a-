<template>
  <div v-if="enabled" ref="lane" class="sprint" aria-hidden="true">
    <div ref="runner" class="sprint__runner">
      <canvas ref="canvas" class="sprint__canvas" :width="SIZE.w" :height="SIZE.h" />
    </div>
    <!-- La source : jamais affichée, seulement lue puis copiée dans le canvas. -->
    <video
      ref="video"
      class="sprint__source"
      :src="SRC"
      muted
      playsinline
      preload="none"
      disablepictureinpicture
    />
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import sprintSrc from '~/components/minimaxH3/fruit-sprint-footer.alpha.mp4'

// ---------------------------------------------------------------------------
// Trois fruits qui détalent le long du bord du pied de page, de gauche à droite,
// de temps en temps. La vidéo vient de MiniMax H3 (components/minimaxH3/).
//
// Filmée sur fond de studio blanc, avec une caméra qui suit les personnages : ils
// courent sur place. Pour les poser sur la page :
//   - le fond est détouré une fois pour toutes, hors ligne, par
//     scripts/sprint-alpha.py. Il en sort une vidéo « alpha empilée » : la couleur
//     en moitié haute, le masque de transparence en moitié basse, dans un .mp4
//     ordinaire que tous les navigateurs lisent. Aucun navigateur ne lit d'alpha
//     dans un .mp4, d'où cette astuce ;
//   - un petit shader WebGL recompose chaque image (couleur x masque) dans un
//     canvas transparent. Pas de mode de fusion CSS, donc rien à craindre selon le
//     navigateur ou le fond de la page : les fruits sont opaques, leurs ombres
//     translucides, et les yeux restent blancs ;
//   - la vidéo est déplacée par GSAP, de hors écran à hors écran : c'est ce
//     glissement qui les fait traverser la page, et qui cache la coupure de la
//     boucle (le plan est hors champ quand elle se produit).
//
// Rien ne charge tant que le pied de page n'est pas en vue (preload="none"), et
// tout se met en pause quand on le quitte. Sans animation (prefers-reduced-motion)
// ni WebGL, le composant ne s'affiche pas : ce n'est qu'un décor.
// ---------------------------------------------------------------------------

const SRC = sprintSrc

/** Taille d'une image une fois recomposée : la moitié de la hauteur de la vidéo
 *  (l'autre moitié est le masque). À accorder avec OUT_W dans scripts/sprint-alpha.py. */
const SIZE = { w: 1320, h: 528 }

/** Vitesse de lecture : sous 1, la course paraît moins frénétique. */
const RATE = 0.8
/** Attente entre deux traversées, en ms (tirée au hasard dans cet intervalle). */
const PAUSE = [3500, 8000] as const

const { $reduceMotion } = useNuxtApp()

// Rendu côté serveur : rien. Le choix se fait au montage, une fois connu
// prefers-reduced-motion, pour ne pas créer de décalage d'hydratation.
const enabled = ref(false)
const lane = ref<HTMLElement | null>(null)
const runner = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const video = ref<HTMLVideoElement | null>(null)

// --- recomposition : couleur (haut) x masque (bas) ---------------------------

// Un demi-texel et demi de marge : les deux moitiés sont filtrées en LINEAR, sans
// cette marge le bord de l'une déteindrait sur l'autre.
const EDGE = (1.5 / (SIZE.h * 2)).toFixed(6)

const VERTEX = `
attribute vec2 p;
varying vec2 uv;
void main() {
  uv = p;
  gl_Position = vec4(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);
}`

const FRAGMENT = `
precision mediump float;
uniform sampler2D tex;
varying vec2 uv;
void main() {
  float y = uv.y * 0.5;
  vec3 c = texture2D(tex, vec2(uv.x, clamp(y, ${EDGE}, 0.5 - ${EDGE}))).rgb;
  float a = texture2D(tex, vec2(uv.x, clamp(0.5 + y, 0.5 + ${EDGE}, 1.0 - ${EDGE}))).r;
  a = clamp((a - 0.03) / 0.94, 0.0, 1.0);   // le bruit de compression, ramené à 0 et à 1
  gl_FragColor = vec4(c * a, a);
}`

let gl: WebGLRenderingContext | null = null
let texture: WebGLTexture | null = null

function setupGL(el: HTMLCanvasElement) {
  gl = el.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false })
  if (!gl) return false

  const compile = (type: number, src: string) => {
    const s = gl!.createShader(type)!
    gl!.shaderSource(s, src)
    gl!.compileShader(s)
    return gl!.getShaderParameter(s, gl!.COMPILE_STATUS) ? s : null
  }
  const vs = compile(gl.VERTEX_SHADER, VERTEX)
  const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT)
  if (!vs || !fs) return false

  const program = gl.createProgram()!
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false
  gl.useProgram(program)

  // Un rectangle plein cadre (deux triangles), coordonnées de 0 à 1.
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(program, 'p')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  // La vidéo n'a pas des dimensions en puissance de deux : bords étirés, pas de mipmaps.
  texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

  gl.viewport(0, 0, el.width, el.height)
  gl.clearColor(0, 0, 0, 0)
  return true
}

function draw() {
  const v = video.value
  if (!gl || !v || v.readyState < 2) return
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, v)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.drawArrays(gl.TRIANGLES, 0, 6)
}

// Une image du canvas par image de la vidéo, pas une de plus (24 i/s, pas 60).
let raf = 0
let lastTime = -1
function tick() {
  raf = requestAnimationFrame(tick)
  const v = video.value
  if (!v || v.currentTime === lastTime) return
  lastTime = v.currentTime
  draw()
}
function startTick() {
  if (!raf) tick()
}
function stopTick() {
  cancelAnimationFrame(raf)
  raf = 0
}

// --- déroulé : une traversée, une pause, et ainsi de suite ------------------

let tween: gsap.core.Tween | null = null
let timer = 0
let observer: IntersectionObserver | null = null
let visible = false
let running = false

function schedule(delay: number) {
  window.clearTimeout(timer)
  timer = window.setTimeout(run, delay)
}

async function run() {
  const el = runner.value
  const v = video.value
  const ln = lane.value
  if (!el || !v || !ln || !visible || running) return

  running = true
  v.currentTime = 0
  v.playbackRate = RATE
  lastTime = -1
  try {
    await v.play()
  } catch {
    // Lecture refusée (économie de données, blocage du navigateur) : on renonce
    // sans bruit, ce n'est qu'un décor.
    running = false
    return
  }

  startTick()
  const seconds = (v.duration || 5.9) / RATE
  gsap.set(el, { opacity: 1 })
  tween = gsap.fromTo(
    el,
    { x: -el.offsetWidth },
    {
      x: ln.clientWidth,
      duration: seconds,
      ease: 'none',
      onComplete: () => {
        v.pause()
        stopTick()
        gsap.set(el, { opacity: 0 })
        tween = null
        running = false
        if (visible) schedule(PAUSE[0] + Math.random() * (PAUSE[1] - PAUSE[0]))
      }
    }
  )
}

function onVisibility(entries: IntersectionObserverEntry[]) {
  visible = entries[entries.length - 1]?.isIntersecting ?? false
  if (visible) {
    if (tween) {
      tween.resume()
      video.value?.play().catch(() => {})
      startTick()
    } else if (!running) {
      schedule(400)
    }
  } else {
    window.clearTimeout(timer)
    tween?.pause()
    video.value?.pause()
    stopTick()
  }
}

onMounted(async () => {
  if ($reduceMotion) return
  enabled.value = true
  await nextTick()
  if (!lane.value || !canvas.value) return
  if (!setupGL(canvas.value)) {
    // Pas de WebGL : mieux vaut pas de décor qu'un rectangle blanc.
    enabled.value = false
    return
  }
  observer = new IntersectionObserver(onVisibility)
  observer.observe(lane.value)
})

onUnmounted(() => {
  window.clearTimeout(timer)
  stopTick()
  tween?.kill()
  observer?.disconnect()
  gl?.getExtension('WEBGL_lose_context')?.loseContext()
  gl = null
})
</script>

<style scoped>
/* Posée sur le bord du pied de page, par-dessus le bas de la page. Trois fois la
   taille de départ : c'est cette seule variable qui règle la taille des fruits
   (de 180 px sur téléphone à 450 px sur grand écran). */
.sprint {
  --h: var(--sprint-h);
  position: absolute;
  inset-inline: 0;
  bottom: 100%;
  height: var(--h);
  overflow: hidden;
  pointer-events: none;
}

.sprint__runner {
  position: absolute;
  left: 0;
  bottom: 0;
  height: var(--h);
  aspect-ratio: 1320 / 528;
  opacity: 0;
  will-change: transform;
}
.sprint__canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* La vidéo source lit en coulisse : un pixel, invisible, hors du flux. */
.sprint__source {
  position: absolute;
  left: 0;
  top: 0;
  width: 1px;
  height: 1px;
  opacity: 0;
}
</style>
