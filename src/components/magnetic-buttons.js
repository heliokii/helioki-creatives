// Concept: "Metal effect" by Jakub Antalik (via inspora.design): elements lean toward a nearby pull. Original implementation.

import { gsap } from 'gsap'

export const params = [
  { id: 'strength', label: 'Strength', min: 0.1, max: 1, step: 0.05, default: 0.5 },
  { id: 'radius', label: 'Radius (px)', min: 60, max: 200, step: 5, default: 120 },
]

const W = 480
const H = 260
const ICONS = [
  ['Email', 'M4 6h16v12H4z M4 7l8 6 8-6'],
  ['Play', 'M9 7l8 5-8 5z'],
  ['Like', 'M12 19s-6-3.6-7.5-7.3C3.4 9 5.2 6.5 7.8 6.5c1.6 0 2.8.9 4.2 2.4 1.4-1.5 2.6-2.4 4.2-2.4 2.6 0 4.4 2.5 3.3 5.2C18 15.4 12 19 12 19z'],
  ['Open', 'M7 17L17 7M9 7h8v8'],
]

const CSS = `
.mg-stage { position: relative; width: 100%; height: 100%; overflow: hidden; }
.mg-root { position: absolute; left: 50%; top: 50%; width: ${W}px; height: ${H}px; margin: ${-H / 2}px 0 0 ${-W / 2}px; transform: scale(var(--s, 1)); font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
.mg-nav { position: absolute; left: 0; right: 0; top: 30px; width: max-content; margin: 0 auto; display: flex; gap: 4px; padding: 5px; border-radius: 999px; border: 1px solid var(--hc-line, #262626); background: var(--hc-surface, #141414); }
.mg { position: relative; display: inline-flex; align-items: center; justify-content: center; color: var(--hc-ink, #f2f2f2); text-decoration: none; }
.mg:focus-visible { outline: 2px solid var(--hc-accent, #9aa27c); outline-offset: 3px; }
.mg-pill { height: 36px; padding: 0 16px; border-radius: 999px; font-size: 13px; }
.mg-pill:hover { background: var(--hc-line, #262626); color: var(--hc-ink, #f2f2f2); }
.mg-cta { position: absolute; left: 0; right: 0; top: 104px; width: max-content; height: 52px; margin: 0 auto; padding: 0 26px; border-radius: 999px; background: var(--hc-ink, #f2f2f2); color: var(--hc-bg, #0b0b0b); font-size: 15px; font-weight: 600; }
.mg-icons { position: absolute; left: 0; right: 0; top: 188px; width: max-content; margin: 0 auto; display: flex; gap: 14px; }
.mg-icon { width: 46px; height: 46px; border-radius: 50%; border: 1px solid var(--hc-line-2, #2f2f2f); background: var(--hc-surface, #141414); }
.mg-icon svg { fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.mg-label { display: inline-flex; pointer-events: none; }
.mg-cursor { position: absolute; left: 0; top: 0; width: 14px; height: 14px; margin: -7px; border-radius: 50%; background: var(--hc-accent, #9aa27c); box-shadow: 0 0 0 6px rgb(154 162 124 / 0.2); pointer-events: none; visibility: hidden; }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

export function mount(stage, { strength = 0.5, radius = 120, preview = false }) {
  injectCSS('magnetic-buttons-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  stage.classList.add('mg-stage')
  const root = document.createElement('div')
  root.className = 'mg-root'
  root.innerHTML = `
    <nav class="mg-nav" aria-label="Demo navigation">${['Work', 'Studio', 'Journal', 'Contact'].map((l) => `<a class="mg mg-pill" href="#"><span class="mg-label">${l}</span></a>`).join('')}</nav>
    <a class="mg mg-cta" href="#"><span class="mg-label">Start a project →</span></a>
    <div class="mg-icons">${ICONS.map(([name, d]) => `<a class="mg mg-icon" href="#" aria-label="${name}"><span class="mg-label"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="${d}"/></svg></span></a>`).join('')}</div>
    <i class="mg-cursor"></i>`
  stage.append(root)

  // Layout centers in design coordinates; offsets ignore transforms, so the pull never feeds back into itself.
  const centerOf = (el) => {
    let x = el.offsetWidth / 2
    let y = el.offsetHeight / 2
    for (let n = el; n && n !== root; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop }
    return { x, y }
  }
  const quick = (el, prop) => gsap.quickTo(el, prop, { duration: 0.45, ease: 'power3.out' })
  const items = [...root.querySelectorAll('.mg')].map((el) => {
    const label = el.querySelector('.mg-label')
    return { el, c: { x: 0, y: 0 }, x: quick(el, 'x'), y: quick(el, 'y'), r: quick(el, 'rotation'), lx: quick(label, 'x'), ly: quick(label, 'y') }
  })

  const pointer = { x: -999, y: -999, on: false }
  let scale = 1
  let demo = null
  const cursor = root.querySelector('.mg-cursor')
  const resize = () => {
    scale = Math.min(stage.clientWidth / W, stage.clientHeight / H)
    root.style.setProperty('--s', scale)
    items.forEach((it) => { it.c = centerOf(it.el) })
    if (preview && !demo && !reduceMotion) startDemo()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(stage)

  const tick = () => {
    for (const it of items) {
      const dx = pointer.x - it.c.x
      const dy = pointer.y - it.c.y
      const pull = pointer.on ? Math.max(0, 1 - Math.hypot(dx, dy) / radius) * strength : 0
      it.x(dx * pull * 0.6)
      it.y(dy * pull * 0.6)
      it.r((dx / radius) * 12 * pull)
      it.lx(dx * pull * 0.25)
      it.ly(dy * pull * 0.25)
    }
  }
  if (!reduceMotion) gsap.ticker.add(tick)

  const onMove = (e) => {
    const box = root.getBoundingClientRect()
    pointer.x = (e.clientX - box.left) / scale
    pointer.y = (e.clientY - box.top) / scale
    pointer.on = true
  }
  const onLeave = () => { pointer.on = false }
  const onClick = (e) => { if (e.target.closest('a')) e.preventDefault() }
  root.addEventListener('pointermove', onMove)
  root.addEventListener('pointerleave', onLeave)
  root.addEventListener('click', onClick)

  // Preview: a visible cursor tours the buttons so the pull shows without a real pointer.
  const startDemo = () => {
    const stops = [items[4], items[1], items[3], items[6], items[8], items[5]].map((it) => it.c)
    pointer.on = true
    gsap.set(cursor, { autoAlpha: 1 })
    gsap.set(pointer, { x: W / 2, y: H + 20 })
    demo = gsap.timeline({ repeat: -1, onUpdate: () => gsap.set(cursor, { x: pointer.x, y: pointer.y }) })
    stops.forEach((s) => demo.to(pointer, { x: s.x + gsap.utils.random(-30, 30), y: s.y + gsap.utils.random(-14, 14), duration: 0.9, ease: 'sine.inOut' }).to({}, { duration: 0.3 }))
    demo.to(pointer, { x: W / 2, y: H + 20, duration: 0.9, ease: 'sine.inOut' })
  }

  return {
    destroy() {
      demo?.kill()
      gsap.ticker.remove(tick)
      gsap.killTweensOf(root.querySelectorAll('*'))
      observer.disconnect()
      root.remove()
      stage.classList.remove('mg-stage')
    },
  }
}
