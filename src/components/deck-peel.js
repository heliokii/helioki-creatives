// Concept: animos "Deck Peel" template (animos.app). Original implementation.

import { gsap } from 'gsap'

export const params = [
  { id: 'count', label: 'Cards', min: 3, max: 8, step: 1, default: 5 },
  { id: 'offset', label: 'Offset (px)', min: 8, max: 40, step: 1, default: 22 },
  { id: 'interval', label: 'Interval (s)', min: 1, max: 5, step: 0.1, default: 2.4 },
]

const CSS = `
.deck-stage { position: relative; width: 100%; height: 100%; overflow: hidden; cursor: pointer; outline: none; user-select: none; }
.deck-stage:focus-visible { box-shadow: inset 0 0 0 2px var(--hc-accent, #9aa27c); }
.deck-card { position: absolute; left: 50%; top: 50%; width: var(--cw); aspect-ratio: 4 / 5; margin: calc(var(--cw) * -0.625) 0 0 calc(var(--cw) / -2); border-radius: 10px; overflow: hidden; background: var(--hc-surface, #141414); box-shadow: 0 18px 40px -18px rgb(0 0 0 / 0.9); }
.deck-card img { display: block; width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

// Position of the card `depth` steps behind the top one; the stack recedes up and to the right.
const slot = (depth, offset) => ({
  x: depth * offset,
  y: -depth * offset * 0.7,
  scale: 1 - depth * 0.05,
  filter: `brightness(${1 - depth * 0.12})`,
  zIndex: 100 - depth,
})

export function mount(stage, { images, offset = 22, interval = 2.4, label = 'Card deck' }) {
  injectCSS('deck-peel-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  stage.classList.add('deck-stage')
  stage.tabIndex = 0
  stage.setAttribute('role', 'button')
  stage.setAttribute('aria-label', `${label}. Press to show the next card.`)

  const cards = images.map(({ src, alt }) => {
    const card = document.createElement('figure')
    card.className = 'deck-card'
    const img = new Image()
    img.src = src
    img.alt = alt
    img.draggable = false
    card.append(img)
    stage.append(card)
    return card
  })
  let order = [...cards]
  order.forEach((card, depth) => gsap.set(card, slot(depth, offset)))

  const resize = () => stage.style.setProperty('--cw', `${Math.min(stage.clientWidth * 0.42, (stage.clientHeight * 0.66) / 1.25)}px`)
  const observer = new ResizeObserver(resize)
  observer.observe(stage)

  let busy = false
  const peel = () => {
    if (busy) return
    busy = true
    const [top, ...rest] = order
    order = [...rest, top]
    const tl = gsap.timeline({ onComplete: () => { busy = false } })
    if (reduceMotion) {
      tl.to(top, { opacity: 0, duration: 0.2 })
        .add(() => order.forEach((card, depth) => gsap.set(card, slot(depth, offset))))
        .to(top, { opacity: 1, duration: 0.2 })
      return
    }
    // Lift the top card off to the left, then tuck it in at the back while the rest move up.
    tl.to(top, { xPercent: -70, yPercent: -12, rotation: -14, scale: 1.04, duration: 0.42, ease: 'power2.in' })
      .add(() => gsap.set(top, { zIndex: 0 }))
      .add(() => rest.forEach((card, depth) => gsap.to(card, { ...slot(depth, offset), duration: 0.5, ease: 'power3.out' })))
      .to(top, { ...slot(order.length - 1, offset), zIndex: 0, xPercent: 0, yPercent: 0, rotation: 0, duration: 0.55, ease: 'power3.out' })
      .add(() => gsap.set(top, { zIndex: slot(order.length - 1, offset).zIndex }))
  }

  const loop = gsap.delayedCall(interval, () => { peel(); loop.restart(true) })
  if (reduceMotion) loop.pause()
  const onClick = () => { peel(); if (!reduceMotion) loop.restart(true) }
  const onKey = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'ArrowRight') return
    e.preventDefault()
    onClick()
  }
  stage.addEventListener('click', onClick)
  stage.addEventListener('keydown', onKey)

  return {
    destroy() {
      loop.kill()
      gsap.killTweensOf(cards)
      observer.disconnect()
      stage.removeEventListener('click', onClick)
      stage.removeEventListener('keydown', onKey)
      cards.forEach((card) => card.remove())
      stage.classList.remove('deck-stage')
    },
  }
}
