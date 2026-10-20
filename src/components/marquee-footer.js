// Concept: "Typographic" and "Animated" footers on footer.design: a giant call-to-action marquee you can steer. Original implementation.

import { gsap } from 'gsap'

export const params = [
  { id: 'speed', label: 'Loop time (s)', min: 6, max: 40, step: 1, default: 18 },
]

const EMAIL = 'hello@lumen.studio'
const PHRASE = ['Let\'s talk', 'Start a project']

const CSS = `
.mf-stage { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--hc-surface, #141414); color: var(--hc-ink, #f2f2f2); font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: var(--fs, 13px); text-align: left; }
.mf-root { display: flex; flex-direction: column; justify-content: space-between; height: 100%; padding: 1.6em 0 1.2em; }
.mf-row { display: flex; align-items: center; justify-content: space-between; gap: 1em; padding: 0 2em; font-size: 0.8em; color: var(--hc-muted, #8a8a8a); }
.mf-live { display: inline-flex; align-items: center; gap: 0.6em; color: var(--hc-cream, #e9e5d6); }
.mf-live i { width: 0.6em; height: 0.6em; border-radius: 50%; background: var(--hc-accent, #9aa27c); animation: mf-pulse 1.8s ease-out infinite; }
@keyframes mf-pulse { from { box-shadow: 0 0 0 0 rgb(154 162 124 / 0.6); } to { box-shadow: 0 0 0 0.7em rgb(154 162 124 / 0); } }
.mf-clock { font-family: ui-monospace, monospace; font-variant-numeric: tabular-nums; }
.mf-band { overflow: hidden; padding: 0.3em 0; border-block: 1px solid var(--hc-line, #262626); cursor: default; }
.mf-track { display: flex; width: max-content; }
.mf-track span { display: inline-flex; align-items: center; gap: 0.4em; padding-right: 0.4em; font-size: 4.6em; line-height: 1.1; font-weight: 600; letter-spacing: -0.04em; white-space: nowrap; }
.mf-track span:nth-child(even) { color: transparent; -webkit-text-stroke: 1px var(--hc-cream, #e9e5d6); }
.mf-track b { color: var(--hc-warm, #e9a14a); font-size: 0.5em; -webkit-text-stroke: 0; }
.mf-grid { display: grid; grid-template-columns: 1.4fr repeat(2, 1fr); gap: 1.5em; padding: 0 2em; }
.mf-copy { display: inline-flex; align-items: center; gap: 0.6em; height: 2.6em; padding: 0 1.1em; overflow: hidden; border: 1px solid var(--hc-line-2, #2f2f2f); border-radius: 1.4em; background: var(--hc-bg, #0b0b0b); color: var(--hc-ink, #f2f2f2); font: inherit; font-size: 0.95em; cursor: pointer; }
.mf-copy:hover { border-color: var(--hc-accent, #9aa27c); }
.mf-swap { display: grid; height: 1.3em; overflow: hidden; line-height: 1.3em; text-align: left; }
.mf-swap > span { display: block; }
.mf-hint { margin: 0.6em 0 0; font-size: 0.75em; color: var(--hc-muted, #8a8a8a); }
.mf-colh { margin: 0 0 0.5em; font-size: 0.72em; letter-spacing: 0.08em; text-transform: uppercase; color: var(--hc-accent, #9aa27c); }
.mf-col a { display: block; width: max-content; color: var(--hc-cream, #e9e5d6); font-size: 0.9em; line-height: 1.8; text-decoration: none; background: linear-gradient(currentColor, currentColor) 0 90% / 0 1px no-repeat; transition: background-size 0.3s; }
.mf-col a:hover, .mf-col a:focus-visible { background-size: 100% 1px; }
.mf-stage :focus-visible { outline: 2px solid var(--hc-accent, #9aa27c); outline-offset: 2px; }
.mf-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
.mf-narrow .mf-grid { grid-template-columns: repeat(2, 1fr); }
.mf-narrow .mf-lead { grid-column: 1 / -1; }
@media (prefers-reduced-motion: reduce) { .mf-live i { animation: none; } .mf-col a { transition: none; } }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

const COLUMNS = [
  ['Studio', ['Work', 'About', 'Journal']],
  ['Social', ['Instagram', 'Dribbble', 'LinkedIn']],
]

export function mount(stage, { speed = 18, preview = false }) {
  injectCSS('marquee-footer-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  stage.classList.add('mf-stage')
  // Two identical halves, so shifting by -50% loops without a seam.
  const half = Array.from({ length: 3 }, () => PHRASE.map((p) => `<span>${p} <b>✺</b></span>`).join('')).join('')
  const root = document.createElement('footer')
  root.className = 'mf-root'
  root.innerHTML = `
    <div class="mf-row"><span class="mf-live"><i></i>Booking projects for spring</span><span class="mf-clock"></span></div>
    <div class="mf-band" aria-label="${PHRASE.join(', ')}" role="img"><div class="mf-track" aria-hidden="true">${half}${half}</div></div>
    <div class="mf-grid">
      <div class="mf-lead">
        <button type="button" class="mf-copy"><span class="mf-swap"><span>${EMAIL}</span><span>Copied to clipboard ✓</span></span></button>
        <p class="mf-hint">Hover the band to slow it. Scroll over it to steer.</p>
        <span class="mf-sr" role="status"></span>
      </div>
      ${COLUMNS.map(([title, links]) => `<nav class="mf-col" aria-label="${title}"><p class="mf-colh">${title}</p>${links.map((l) => `<a href="#">${l}</a>`).join('')}</nav>`).join('')}
    </div>
    <div class="mf-row"><span>© 2026 Lumen Studio</span><span>Made in Lisbon</span></div>`
  stage.append(root)
  const band = root.querySelector('.mf-band')
  const track = root.querySelector('.mf-track')
  const clock = root.querySelector('.mf-clock')
  const copy = root.querySelector('.mf-copy')
  const swap = [...copy.querySelectorAll('.mf-swap > span')]
  const status = root.querySelector('.mf-sr')

  // Velocity eases toward its cruise speed; wheel flicks add a burst and pick the direction.
  let pos = 0
  let vel = 1
  let dir = 1
  let cruise = 1
  const tick = (_, dt) => {
    vel += (dir * cruise - vel) * Math.min(1, dt / 250)
    pos = gsap.utils.wrap(0, 1, pos + (vel * dt) / 1000 / speed)
    gsap.set(track, { xPercent: -50 * pos })
  }
  if (!reduceMotion) gsap.ticker.add(tick)
  const onEnter = () => { cruise = 0.2 }
  const onLeave = () => { cruise = 1 }
  const onWheel = (e) => {
    if (!e.deltaY) return
    dir = Math.sign(e.deltaY)
    vel = gsap.utils.clamp(-6, 6, vel + dir * Math.min(3, Math.abs(e.deltaY) / 40))
  }
  band.addEventListener('pointerenter', onEnter)
  band.addEventListener('pointerleave', onLeave)
  band.addEventListener('wheel', onWheel, { passive: true })

  const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Lisbon' })
  const showTime = () => { clock.textContent = `Lisbon ${time.format(new Date())}` }
  showTime()
  const timer = setInterval(showTime, 1000)

  // The label rolls up to the confirmation, then back.
  const roll = (text) => {
    swap[1].textContent = text
    status.textContent = text
    gsap.killTweensOf(swap)
    gsap.timeline()
      .to(swap, { yPercent: -100, duration: reduceMotion ? 0 : 0.35, ease: 'power3.inOut' })
      .to(swap, { yPercent: 0, duration: reduceMotion ? 0 : 0.35, ease: 'power3.inOut' }, '+=1.6')
  }
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      roll('Copied to clipboard ✓')
    } catch {
      roll('Copy failed, select it instead')
    }
  }
  copy.addEventListener('click', onCopy)
  const onClick = (e) => { if (e.target.closest('a')) e.preventDefault() }
  root.addEventListener('click', onClick)

  const resize = () => {
    const w = stage.clientWidth
    stage.style.setProperty('--fs', `${Math.max(7, Math.min(14, w / 42))}px`)
    stage.classList.toggle('mf-narrow', w < 420)
  }
  const observer = new ResizeObserver(resize)
  observer.observe(stage)

  // Preview: a flick backwards every few seconds, and the copy label rolling once per loop.
  const demo = preview && !reduceMotion
    ? gsap.timeline({ repeat: -1, delay: 1.5 })
      .call(() => onWheel({ deltaY: -120 })).call(() => onWheel({ deltaY: 120 }), null, '+=2.5')
      .call(() => roll('Copied to clipboard ✓'), null, '+=1.5').to({}, { duration: 3 })
    : null

  return {
    destroy() {
      demo?.kill()
      gsap.ticker.remove(tick)
      clearInterval(timer)
      gsap.killTweensOf(swap)
      observer.disconnect()
      root.remove()
      stage.classList.remove('mf-stage', 'mf-narrow')
    },
  }
}
