// Concept: "beveled cards" by @RachitThakur146 (via inspora.design). Original implementation.

import { gsap } from 'gsap'

export const params = [
  { id: 'draw', label: 'Draw time (s)', min: 0.4, max: 3, step: 0.1, default: 1.2 },
]

const W = 600
const H = 280

const spiral = () => {
  const pts = []
  for (let t = 0; t <= Math.PI * 6; t += 0.12) pts.push(`${(50 + (2 + t * 2.1) * Math.cos(t)).toFixed(1)} ${(50 + (2 + t * 2.1) * Math.sin(t)).toFixed(1)}`)
  return `<path d="M${pts.join('L')}"/>`
}
const lattice = () => [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => `<circle cx="${25 + c * 25}" cy="${25 + r * 25}" r="9"/>`)).join('')
  + '<line x1="16" y1="16" x2="84" y2="84"/><line x1="84" y1="16" x2="16" y2="84"/>'
const target = () => [8, 16, 24, 32, 40].map((r) => `<circle cx="50" cy="50" r="${r}"/>`).join('')
  + '<line x1="50" y1="4" x2="50" y2="96"/><line x1="4" y1="50" x2="96" y2="50"/>'

const ART = [
  ['01', 'Lattice', lattice, 'var(--hc-cream, #e9e5d6)'],
  ['02', 'Drift', spiral, 'var(--hc-cream, #e9e5d6)'],
  ['03', 'Target', target, 'var(--hc-warm, #e9a14a)'],
]

const CSS = `
.bv-stage { position: relative; width: 100%; height: 100%; overflow: hidden; }
.bv-root { position: absolute; left: 50%; top: 50%; width: ${W}px; height: ${H}px; margin: ${-H / 2}px 0 0 ${-W / 2}px; display: flex; gap: 18px; padding: 20px 18px; transform: scale(var(--s, 1)); font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
.bv-card { flex: 1; display: flex; flex-direction: column; padding: 18px; border-radius: 20px; outline: none; color: var(--hc-cream, #e9e5d6); background: linear-gradient(145deg, var(--hc-accent-dark, #3c4230), var(--hc-surface-2, #1c1c1c));
  box-shadow: inset 1px 1px 0 rgb(255 255 255 / 0.14), inset -1px -1px 0 rgb(0 0 0 / 0.6), inset 8px 8px 16px rgb(255 255 255 / 0.04), inset -10px -10px 18px rgb(0 0 0 / 0.35), 0 24px 34px -22px var(--hc-bg, #0b0b0b); }
.bv-card:focus-visible { box-shadow: 0 0 0 2px var(--hc-accent, #9aa27c), 0 24px 34px -22px var(--hc-bg, #0b0b0b); }
.bv-art { flex: 1; display: grid; place-items: center; border-radius: 12px; background: rgb(0 0 0 / 0.18); box-shadow: inset 2px 2px 6px rgb(0 0 0 / 0.5), inset -1px -1px 0 rgb(255 255 255 / 0.06); }
.bv-art svg { width: 78%; height: 78%; fill: none; stroke-width: 1.4; stroke-linecap: round; }
.bv-meta { display: flex; justify-content: space-between; margin-top: 12px; font: 11px/1 ui-monospace, "JetBrains Mono", monospace; letter-spacing: 0.06em; text-transform: uppercase; color: var(--hc-muted, #8a8a8a); }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

export function mount(stage, { draw = 1.2, preview = false }) {
  injectCSS('beveled-cards-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  stage.classList.add('bv-stage')
  const root = document.createElement('div')
  root.className = 'bv-root'
  root.innerHTML = ART.map(([no, name, art, color]) => `
    <article class="bv-card" tabindex="0" aria-label="${name}, line drawing ${no}">
      <div class="bv-art"><svg viewBox="0 0 100 100" style="stroke: ${color}" aria-hidden="true">${art()}</svg></div>
      <div class="bv-meta"><span>No. ${no}</span><span>${name}</span></div>
    </article>`).join('')
  stage.append(root)

  const resize = () => root.style.setProperty('--s', Math.min(stage.clientWidth / W, stage.clientHeight / H))
  const observer = new ResizeObserver(resize)
  observer.observe(stage)

  const cards = [...root.querySelectorAll('.bv-card')]
  const strokes = (card) => [...card.querySelectorAll('path, circle, line')]
  cards.forEach((card) => strokes(card).forEach((el) => {
    const len = el.getTotalLength()
    el.style.strokeDasharray = len
    el.style.strokeDashoffset = 0
    el.dataset.len = len
  }))

  // Erase every stroke, then draw them back one after another.
  const redraw = (card) => {
    if (reduceMotion) return
    const els = strokes(card)
    gsap.killTweensOf(els)
    gsap.fromTo(els, { strokeDashoffset: (i, el) => el.dataset.len }, { strokeDashoffset: 0, duration: draw, ease: 'power2.inOut', stagger: (draw * 0.6) / els.length })
  }
  cards.forEach((card) => {
    card.addEventListener('pointerenter', () => redraw(card))
    card.addEventListener('focus', () => redraw(card))
  })

  let index = 0
  const demo = preview
    ? gsap.delayedCall(0.5, function cycle() {
      redraw(cards[index])
      index = (index + 1) % cards.length
      demo.delay(draw + 0.8).restart(true)
    })
    : null

  return {
    destroy() {
      demo?.kill()
      gsap.killTweensOf(root.querySelectorAll('*'))
      observer.disconnect()
      root.remove()
      stage.classList.remove('bv-stage')
    },
  }
}
