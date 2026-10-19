// Concept: animos "Photo Orbit" template (animos.app). Original implementation.

import { gsap } from 'gsap'

export const params = [
  { id: 'count', label: 'Cards', min: 5, max: 12, step: 1, default: 8 },
  { id: 'radius', label: 'Radius (%)', min: 25, max: 48, step: 1, default: 36 },
  { id: 'speed', label: 'Speed (°/s)', min: 0, max: 30, step: 1, default: 6 },
]

const CSS = `
.orbit-stage { position: relative; width: 100%; height: 100%; overflow: hidden; perspective: 900px; user-select: none; }
.orbit-plane { position: absolute; inset: 0; transform-style: preserve-3d; }
.orbit-card { position: absolute; left: 50%; top: 50%; margin: 0; border-radius: 8px; overflow: hidden; background: var(--hc-surface, #141414); box-shadow: 0 16px 36px -16px rgb(0 0 0 / 0.9); }
.orbit-card img { display: block; width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

// Mixed card shapes (width, height) relative to the base size, cycled around the ring.
const SHAPES = [[1, 1.25], [0.8, 0.8], [1.15, 0.85], [0.75, 0.95], [0.95, 1.2], [1.05, 0.75]]

export function mount(stage, { images, radius = 36, speed = 6 }) {
  injectCSS('orbit-collage-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  stage.classList.add('orbit-stage')
  const plane = document.createElement('div')
  plane.className = 'orbit-plane'
  stage.append(plane)

  const cards = images.map(({ src, alt }, i) => {
    const card = document.createElement('figure')
    card.className = 'orbit-card'
    const img = new Image()
    img.src = src
    img.alt = alt
    img.draggable = false
    card.append(img)
    plane.append(card)
    return { card, shape: SHAPES[i % SHAPES.length], phase: (i / images.length) * Math.PI * 2 }
  })

  let size = { r: 0, base: 0 }
  const resize = () => {
    const min = Math.min(stage.clientWidth, stage.clientHeight)
    size = { r: min * (radius / 100), base: min * 0.2 }
    cards.forEach(({ card, shape }) => {
      card.style.width = `${size.base * shape[0]}px`
      card.style.height = `${size.base * shape[1]}px`
    })
  }
  const observer = new ResizeObserver(resize)
  observer.observe(stage)

  // Cards ride the circle but stay upright; a slow bob keeps the collage alive between laps.
  let angle = 0
  const render = (time, delta) => {
    if (!reduceMotion) angle += (speed * Math.PI / 180) * (delta / 1000)
    cards.forEach(({ card, phase }, i) => {
      const a = angle + phase
      const bob = reduceMotion ? 0 : Math.sin(time * 1.2 + i) * 4
      gsap.set(card, { x: Math.cos(a) * size.r, y: Math.sin(a) * size.r * 0.82 + bob, xPercent: -50, yPercent: -50, zIndex: Math.round(Math.sin(a) * 50) + 50 })
    })
  }
  gsap.ticker.add(render)

  const tiltX = gsap.quickTo(plane, 'rotationX', { duration: 0.8, ease: 'power3.out' })
  const tiltY = gsap.quickTo(plane, 'rotationY', { duration: 0.8, ease: 'power3.out' })
  const onMove = (e) => {
    if (reduceMotion) return
    const box = stage.getBoundingClientRect()
    tiltY(((e.clientX - box.left) / box.width - 0.5) * 16)
    tiltX(-((e.clientY - box.top) / box.height - 0.5) * 16)
  }
  const onLeave = () => { tiltX(0); tiltY(0) }
  stage.addEventListener('pointermove', onMove)
  stage.addEventListener('pointerleave', onLeave)

  return {
    destroy() {
      gsap.ticker.remove(render)
      gsap.killTweensOf(plane)
      observer.disconnect()
      stage.removeEventListener('pointermove', onMove)
      stage.removeEventListener('pointerleave', onLeave)
      plane.remove()
      stage.classList.remove('orbit-stage')
    },
  }
}
