// Concept: animos "Column Drift" template (animos.app). Original implementation.

import { gsap } from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { InertiaPlugin } from 'gsap/InertiaPlugin'

gsap.registerPlugin(Draggable, InertiaPlugin)

export const params = [
  { id: 'count', label: 'Cards', min: 4, max: 10, step: 1, default: 6 },
  { id: 'speed', label: 'Speed (px/s)', min: 0, max: 120, step: 5, default: 40 },
  { id: 'curve', label: 'Curve (°)', min: 0, max: 60, step: 1, default: 35 },
]

const CSS = `
.drift-stage { position: relative; width: 100%; height: 100%; overflow: hidden; perspective: 700px; cursor: grab; touch-action: none; user-select: none; }
.drift-stage:active { cursor: grabbing; }
.drift-card { position: absolute; left: 50%; top: 50%; width: var(--cw); height: var(--ch); margin: calc(var(--ch) / -2) 0 0 calc(var(--cw) / -2); border-radius: 10px; overflow: hidden; background: var(--hc-surface, #141414); }
.drift-card img { display: block; width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

// Wrap `y` into [-span/2, span/2) so the column loops without a seam.
export const wrapCentered = (y, span) => ((((y + span / 2) % span) + span) % span) - span / 2

export function mount(stage, { images, speed = 40, curve = 35 }) {
  injectCSS('column-drift-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  stage.classList.add('drift-stage')

  // Two copies so the loop is always longer than the stage.
  const cards = [...images, ...images].map(({ src, alt }, i) => {
    const card = document.createElement('figure')
    card.className = 'drift-card'
    const img = new Image()
    img.src = src
    img.alt = i < images.length ? alt : ''
    img.draggable = false
    card.append(img)
    stage.append(card)
    return card
  })

  let pitch = 0
  let height = 0
  const resize = () => {
    height = stage.clientHeight
    const ch = Math.min(stage.clientHeight * 0.42, stage.clientWidth * 0.46 * 1.25)
    const cw = ch / 1.25
    pitch = ch + 12
    stage.style.setProperty('--cw', `${cw}px`)
    stage.style.setProperty('--ch', `${ch}px`)
  }
  const observer = new ResizeObserver(resize)
  observer.observe(stage)

  const state = { y: 0, drift: reduceMotion ? 0 : speed }
  const render = (time, delta) => {
    state.y += state.drift * (delta / 1000)
    if (!pitch) return
    const span = pitch * cards.length
    cards.forEach((card, i) => {
      const y = wrapCentered(i * pitch - state.y, span)
      const t = Math.max(-1, Math.min(1, y / (height * 0.75)))
      gsap.set(card, { y, rotationX: -t * curve, z: -Math.abs(t) * 80, opacity: 1 - Math.abs(t) * 0.6 })
    })
  }
  gsap.ticker.add(render)

  let startY = 0
  const [drag] = Draggable.create(document.createElement('div'), {
    trigger: stage,
    type: 'y',
    inertia: true,
    onPress() { gsap.killTweensOf(state); startY = state.y + this.y; state.drift = 0 },
    onDrag() { state.y = startY - this.y },
    onThrowUpdate() { state.y = startY - this.y },
    onRelease() { if (!this.isThrowing) resume() },
    onThrowComplete: () => resume(),
  })
  const resume = () => !reduceMotion && gsap.to(state, { drift: speed, duration: 1 })
  const onWheel = (e) => { e.preventDefault(); state.y += e.deltaY * 0.6 }
  stage.addEventListener('wheel', onWheel, { passive: false })

  return {
    destroy() {
      gsap.ticker.remove(render)
      gsap.killTweensOf(state)
      observer.disconnect()
      drag.kill()
      stage.removeEventListener('wheel', onWheel)
      cards.forEach((card) => card.remove())
      stage.classList.remove('drift-stage')
    },
  }
}
