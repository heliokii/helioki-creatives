// Concept: animos "Cover Flow" template (animos.app). Original implementation.

import { gsap } from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { InertiaPlugin } from 'gsap/InertiaPlugin'

gsap.registerPlugin(Draggable, InertiaPlugin)

export const params = [
  { id: 'count', label: 'Cards', min: 5, max: 12, step: 1, default: 9 },
  { id: 'spacing', label: 'Spacing', min: 0.3, max: 1, step: 0.05, default: 0.55 },
  { id: 'angle', label: 'Side angle (°)', min: 0, max: 80, step: 1, default: 50 },
  { id: 'interval', label: 'Interval (s)', min: 1, max: 6, step: 0.1, default: 2.5 },
]

const CSS = `
.flow-stage { position: relative; width: 100%; height: 100%; overflow: hidden; perspective: 1000px; cursor: grab; touch-action: pan-y; outline: none; user-select: none; }
.flow-stage:active { cursor: grabbing; }
.flow-stage:focus-visible { box-shadow: inset 0 0 0 2px var(--hc-accent, #9aa27c); }
.flow-track { position: absolute; left: 50%; top: 50%; transform-style: preserve-3d; }
.flow-card { position: absolute; width: var(--cw); aspect-ratio: 4 / 5; margin: calc(var(--cw) * -0.625) 0 0 calc(var(--cw) / -2); border-radius: 10px; overflow: hidden; background: var(--hc-surface, #141414); -webkit-box-reflect: below 6px linear-gradient(transparent 70%, rgb(255 255 255 / 0.18)); }
.flow-card img { display: block; width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

// Signed distance from `pos` to card `i` on a looping list of `count`, in (-count/2, count/2].
export const loopDistance = (i, pos, count) => {
  const d = (((i - pos) % count) + count) % count
  return d > count / 2 ? d - count : d
}

export function mount(stage, { images, spacing = 0.55, angle = 50, interval = 2.5, label = 'Cover flow' }) {
  injectCSS('cover-flow-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const count = images.length
  stage.classList.add('flow-stage')
  stage.tabIndex = 0
  stage.setAttribute('role', 'group')
  stage.setAttribute('aria-roledescription', 'carousel')
  stage.setAttribute('aria-label', `${label}. Drag, click a card, or use the arrow keys.`)

  const track = document.createElement('div')
  track.className = 'flow-track'
  const cards = images.map(({ src, alt }, i) => {
    const card = document.createElement('figure')
    card.className = 'flow-card'
    const img = new Image()
    img.src = src
    img.alt = alt
    img.draggable = false
    card.append(img)
    card.addEventListener('click', () => go(state.pos + loopDistance(i, state.pos, count)))
    track.append(card)
    return card
  })
  stage.append(track)

  let cw = 0
  const resize = () => {
    cw = Math.min(stage.clientWidth * 0.3, (stage.clientHeight * 0.55) / 1.25)
    stage.style.setProperty('--cw', `${cw}px`)
  }
  const observer = new ResizeObserver(resize)
  observer.observe(stage)

  const state = { pos: 0 }
  const render = () => {
    cards.forEach((card, i) => {
      const d = loopDistance(i, state.pos, count)
      const side = Math.max(-1, Math.min(1, d))
      // The first step off-center turns the card; later steps only stack it tighter.
      const x = side * cw * 0.8 + (d - side) * cw * spacing * 0.5
      gsap.set(card, {
        x,
        z: -Math.abs(side) * cw * 0.6,
        rotationY: -side * angle,
        zIndex: 100 - Math.round(Math.abs(d) * 10),
        // Fade out before the loop seam so the wrapping card never visibly jumps sides.
        opacity: Math.max(0, Math.min(1, Math.min(count / 2, 3.5) - Math.abs(d))),
      })
    })
  }
  gsap.ticker.add(render)

  const go = (target) => {
    gsap.to(state, { pos: Math.round(target), duration: reduceMotion ? 0 : 0.6, ease: 'power3.out', overwrite: true })
    if (!reduceMotion) loop.restart(true)
  }
  const loop = gsap.delayedCall(interval, () => go(state.pos + 1))
  if (reduceMotion) loop.pause()

  let startPos = 0
  const [drag] = Draggable.create(document.createElement('div'), {
    trigger: stage,
    type: 'x',
    inertia: true,
    onDragStart() { loop.pause(); gsap.killTweensOf(state); startPos = state.pos + this.x / cw },
    onDrag() { state.pos = startPos - this.x / cw },
    onThrowUpdate() { state.pos = startPos - this.x / cw },
    snap: (x) => (startPos - Math.round(startPos - x / cw)) * cw,
    onRelease() { if (!this.isThrowing) go(state.pos) },
    onThrowComplete: () => !reduceMotion && loop.restart(true),
  })

  const onKey = (e) => {
    const dir = { ArrowLeft: -1, ArrowRight: 1 }[e.key]
    if (!dir) return
    e.preventDefault()
    go(Math.round(state.pos) + dir)
  }
  stage.addEventListener('keydown', onKey)

  return {
    destroy() {
      loop.kill()
      gsap.killTweensOf(state)
      gsap.ticker.remove(render)
      observer.disconnect()
      drag.kill()
      stage.removeEventListener('keydown', onKey)
      track.remove()
      stage.classList.remove('flow-stage')
    },
  }
}
