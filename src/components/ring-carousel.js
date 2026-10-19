// Concept: animos "Cover Ring" template (animos.app). Original implementation.

import { gsap } from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { InertiaPlugin } from 'gsap/InertiaPlugin'

gsap.registerPlugin(Draggable, InertiaPlugin)

const PX_TO_DEG = 0.3

export const params = [
  { id: 'tilt', label: 'Tilt', min: -45, max: 0, step: 1, default: -18 },
  { id: 'roll', label: 'Roll', min: -20, max: 20, step: 1, default: -6 },
  { id: 'stepDuration', label: 'Step time (s)', min: 0.6, max: 4, step: 0.1, default: 1.75 },
  { id: 'backFade', label: 'Back fade', min: 0, max: 0.9, step: 0.05, default: 0.55 },
]

const CSS = `
.ring-stage { width: 100%; height: 100%; display: grid; place-items: center; border-radius: inherit; cursor: grab; touch-action: pan-y; outline: none; user-select: none; }
.ring-stage:active { cursor: grabbing; }
.ring-stage:focus-visible { box-shadow: inset 0 0 0 2px var(--hc-accent, #9aa27c); }
.ring { position: relative; transform-style: preserve-3d; }
.ring-tile { position: absolute; width: var(--tw); height: var(--th); margin: calc(var(--th) / -2) 0 0 calc(var(--tw) / -2); overflow: hidden; border-radius: 6px; background: var(--hc-surface, #141414); transform: rotateY(calc(var(--i) * var(--step))) translateZ(var(--r)); }
.ring-tile img { display: block; width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

// Opacity for a tile at `deg` around the ring (0 = facing the viewer). Curve measured from animos' "Cover Ring".
export function tileOpacity(deg, backFade = 0.55) {
  const t = (Math.cos((deg * Math.PI) / 180) + 0.3) / 0.6
  return 1 - backFade + backFade * Math.min(1, Math.max(0, t))
}

// Radius, 4:5 tile size and camera distance for `count` tiles in a `width` x `height` stage.
export function ringGeometry(width, height, count, gap = 0.08) {
  const radius = Math.min(width * 0.4, height * 0.5)
  const tileW = 2 * radius * Math.tan(Math.PI / count) * (1 - gap)
  return { radius, tileW, tileH: tileW * 1.25, perspective: radius * 4.9 }
}

export function createRingCarousel(stage, {
  images,
  tilt = -18,
  roll = -6,
  stepDuration = 1.75,
  backFade = 0.55,
  label = 'Image ring',
}) {
  const count = images.length
  const step = 360 / count
  const snapAngle = (a) => Math.round(a / step) * step
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const state = { angle: 0 }

  injectCSS('ring-carousel-css', CSS)
  stage.classList.add('ring-stage')
  stage.tabIndex = 0
  stage.setAttribute('role', 'group')
  stage.setAttribute('aria-roledescription', 'carousel')
  stage.setAttribute('aria-label', `${label}. Drag or use the arrow keys to rotate.`)

  const ring = document.createElement('div')
  ring.className = 'ring'
  ring.style.setProperty('--step', `${step}deg`)
  const tiles = images.map(({ src, alt }, i) => {
    const tile = document.createElement('figure')
    tile.className = 'ring-tile'
    tile.style.setProperty('--i', i)
    const img = new Image()
    img.src = src
    img.alt = alt
    img.draggable = false
    tile.append(img)
    ring.append(tile)
    return tile
  })
  stage.append(ring)

  const resize = () => {
    const g = ringGeometry(stage.clientWidth, stage.clientHeight, count)
    ring.style.setProperty('--r', `${g.radius}px`)
    ring.style.setProperty('--tw', `${g.tileW}px`)
    ring.style.setProperty('--th', `${g.tileH}px`)
    stage.style.perspective = `${g.perspective}px`
  }
  const observer = new ResizeObserver(resize)
  observer.observe(stage)

  const render = () => {
    ring.style.transform = `rotateZ(${roll}deg) rotateX(${tilt}deg) rotateY(${state.angle}deg)`
    tiles.forEach((tile, i) => { tile.style.opacity = tileOpacity(state.angle + i * step, backFade) })
  }
  gsap.ticker.add(render)

  // One tile per step: ease over the first 55% of the slot, hold for the rest (animos' "step per card").
  let auto
  const stop = () => auto?.kill()
  const play = () => {
    stop()
    if (reduceMotion) return
    auto = gsap.to(state, {
      angle: `-=${step}`,
      duration: stepDuration * 0.55,
      ease: 'power3.inOut',
      delay: stepDuration * 0.45,
      repeat: -1,
      repeatDelay: stepDuration * 0.45,
      repeatRefresh: true,
    })
  }

  let startAngle = 0
  const [drag] = Draggable.create(document.createElement('div'), {
    trigger: stage,
    type: 'x',
    inertia: true,
    onDragStart() { stop(); startAngle = state.angle - this.x * PX_TO_DEG },
    onDrag() { state.angle = startAngle + this.x * PX_TO_DEG },
    onThrowUpdate() { state.angle = startAngle + this.x * PX_TO_DEG },
    snap: (x) => (snapAngle(startAngle + x * PX_TO_DEG) - startAngle) / PX_TO_DEG,
    onRelease() { if (!this.isThrowing) play() },
    onThrowComplete: play,
  })

  let keyTarget = null
  const onKey = (e) => {
    const dir = { ArrowLeft: 1, ArrowRight: -1 }[e.key]
    if (!dir) return
    e.preventDefault()
    stop()
    keyTarget = (keyTarget ?? snapAngle(state.angle)) + dir * step
    gsap.to(state, {
      angle: keyTarget,
      duration: 0.6,
      ease: 'power3.out',
      overwrite: true,
      onComplete() { keyTarget = null; play() },
    })
  }
  const slow = () => auto && gsap.to(auto, { timeScale: 0.35, duration: 0.6 })
  const resume = () => auto && gsap.to(auto, { timeScale: 1, duration: 0.6 })
  stage.addEventListener('keydown', onKey)
  stage.addEventListener('pointerenter', slow)
  stage.addEventListener('pointerleave', resume)

  play()

  return {
    destroy() {
      stop()
      gsap.killTweensOf(state)
      gsap.ticker.remove(render)
      observer.disconnect()
      drag.kill()
      stage.removeEventListener('keydown', onKey)
      stage.removeEventListener('pointerenter', slow)
      stage.removeEventListener('pointerleave', resume)
      ring.remove()
      stage.classList.remove('ring-stage')
    },
  }
}

export const mount = createRingCarousel
