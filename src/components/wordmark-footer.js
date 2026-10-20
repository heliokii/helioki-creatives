// Concept: "Large Type" footers on footer.design: an edge-to-edge wordmark that rises as you arrive. Original implementation.

import { gsap } from 'gsap'

export const params = [
  { id: 'lift', label: 'Hover lift (%)', min: 0, max: 30, step: 1, default: 18 },
]

const WORD = 'LUMEN'

// 0 = letter still below its mask, 1 = in place. Letters to the right start later.
export function riseFor(progress, i, n) {
  return Math.max(0, Math.min(1, progress * 1.5 - (i / n) * 0.5))
}

const CSS = `
.wf-stage { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--hc-bg, #0b0b0b); color: var(--hc-ink, #f2f2f2); font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: var(--fs, 13px); text-align: left; }
.wf-scroll { position: absolute; inset: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; }
.wf-scroll::-webkit-scrollbar { display: none; }
.wf-page { box-sizing: border-box; min-height: 100%; padding: 2.4em 2em 4em; }
.wf-kicker { margin: 0; font: 0.75em/1 ui-monospace, monospace; letter-spacing: 0.1em; text-transform: uppercase; color: var(--hc-accent, #9aa27c); }
.wf-h { margin: 0.4em 0 0.6em; font-size: 2.2em; line-height: 1.05; font-weight: 600; letter-spacing: -0.03em; }
.wf-p { max-width: 32em; margin: 0 0 1em; line-height: 1.55; color: var(--hc-soft, #b3b3b3); }
.wf-footer { padding: 2em 2em 0; background: var(--hc-surface, #141414); }
.wf-top { display: grid; grid-template-columns: 1.6fr repeat(2, 1fr); gap: 1.5em; padding-bottom: 1.6em; }
.wf-ask { margin: 0 0 0.5em; font-size: 1.3em; font-weight: 600; letter-spacing: -0.02em; }
.wf-mail { color: var(--hc-accent-light, #c5cc9f); text-decoration: none; background: linear-gradient(currentColor, currentColor) 0 100% / 0 1px no-repeat; transition: background-size 0.35s; }
.wf-mail:hover, .wf-mail:focus-visible { background-size: 100% 1px; }
.wf-colh { margin: 0 0 0.6em; font-size: 0.72em; letter-spacing: 0.08em; text-transform: uppercase; color: var(--hc-muted, #8a8a8a); }
.wf-col a { display: block; color: var(--hc-cream, #e9e5d6); font-size: 0.9em; line-height: 1.9; text-decoration: none; opacity: 0.8; }
.wf-col a:hover { opacity: 1; }
.wf-legal { display: flex; justify-content: space-between; padding: 0.9em 0; border-top: 1px solid var(--hc-line, #262626); font-size: 0.75em; color: var(--hc-muted, #8a8a8a); }
.wf-word { position: relative; display: flex; justify-content: space-between; overflow: hidden; margin: 0 -0.02em; padding-top: 0.3em; font-weight: 700; line-height: 0.8; letter-spacing: -0.04em; color: var(--hc-cream, #e9e5d6); white-space: nowrap; user-select: none; }
.wf-word span { display: inline-block; padding-top: 0.06em; will-change: transform; }
.wf-stage :focus-visible { outline: 2px solid var(--hc-accent, #9aa27c); outline-offset: 2px; }
.wf-narrow .wf-top { grid-template-columns: repeat(2, 1fr); }
.wf-narrow .wf-lead { grid-column: 1 / -1; }
@media (prefers-reduced-motion: reduce) { .wf-mail { transition: none; } }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

const COLUMNS = [
  ['Studio', ['Work', 'About', 'Careers']],
  ['Social', ['Instagram', 'LinkedIn', 'Are.na']],
]

export function mount(stage, { lift = 18, preview = false }) {
  injectCSS('wordmark-footer-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  stage.classList.add('wf-stage')
  stage.insertAdjacentHTML('beforeend', `
    <div class="wf-scroll">
      <div class="wf-page">
        <p class="wf-kicker">Journal · No. 31</p>
        <h3 class="wf-h">The last frame<br>should feel earned.</h3>
        <p class="wf-p">Endings are where most sites shrug: a grey strip, a copyright line, done. We think the footer is the one place everyone who read to the end will see.</p>
        <p class="wf-p">So make it big. Scroll down.</p>
      </div>
      <footer class="wf-footer">
        <div class="wf-top">
          <div class="wf-lead"><p class="wf-ask">Have a project in mind?</p><a class="wf-mail" href="#">hello@lumen.studio</a></div>
          ${COLUMNS.map(([title, links]) => `<nav class="wf-col" aria-label="${title}"><p class="wf-colh">${title}</p>${links.map((l) => `<a href="#">${l}</a>`).join('')}</nav>`).join('')}
        </div>
        <div class="wf-legal"><span>© 2026 Lumen Studio</span><span>Lisbon · Remote</span></div>
        <p class="wf-word" aria-label="${WORD}">${[...WORD].map((ch) => `<span aria-hidden="true">${ch}</span>`).join('')}</p>
      </footer>
    </div>`)
  const scroller = stage.querySelector('.wf-scroll')
  const footer = stage.querySelector('.wf-footer')
  const word = stage.querySelector('.wf-word')
  const letters = [...word.children]
  const moveY = letters.map((l) => gsap.quickTo(l, 'yPercent', { duration: reduceMotion ? 0 : 0.5, ease: 'power3.out' }))

  const ease = gsap.parseEase('power3.out')
  let centers = []
  const pointer = { x: 0, on: false }
  const update = () => {
    const progress = reduceMotion ? 1 : gsap.utils.clamp(0, 1, (scroller.scrollTop + scroller.clientHeight - footer.offsetTop) / footer.offsetHeight)
    const reach = word.offsetWidth * 0.22
    letters.forEach((_, i) => {
      const rise = ease(riseFor(progress, i, letters.length))
      const near = pointer.on ? Math.max(0, 1 - Math.abs(centers[i] - pointer.x) / reach) : 0
      moveY[i]((1 - rise) * 100 - near * lift)
    })
  }
  // Fit the wordmark to the footer's full width whatever the font renders at; the top padding is room to lift into.
  const resize = () => {
    const w = stage.clientWidth
    stage.style.setProperty('--fs', `${Math.max(8, Math.min(14, w / 42))}px`)
    stage.classList.toggle('wf-narrow', w < 420)
    word.style.fontSize = '100px'
    word.style.fontSize = `${(99 * word.clientWidth) / letters.reduce((sum, l) => sum + l.offsetWidth, 0)}px`
    centers = letters.map((l) => l.offsetLeft + l.offsetWidth / 2)
    update()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(stage)
  scroller.addEventListener('scroll', update, { passive: true })

  const onMove = (e) => {
    pointer.x = e.clientX - word.getBoundingClientRect().left
    pointer.on = true
    update()
  }
  const onLeave = () => { pointer.on = false; update() }
  const onClick = (e) => { if (e.target.closest('a')) e.preventDefault() }
  word.addEventListener('pointermove', onMove)
  word.addEventListener('pointerleave', onLeave)
  stage.addEventListener('click', onClick)

  // Preview: scroll to the footer, sweep a phantom pointer across the letters, scroll back.
  const tour = preview && !reduceMotion
    ? gsap.timeline({ repeat: -1, delay: 0.8 })
      .to(scroller, { scrollTop: () => scroller.scrollHeight - scroller.clientHeight, duration: 2.6, ease: 'sine.inOut' })
      .set(pointer, { on: true, x: 0 })
      .to(pointer, { x: () => word.offsetWidth, duration: 2.2, ease: 'sine.inOut', onUpdate: update })
      .set(pointer, { on: false }).call(update)
      .to(scroller, { scrollTop: 0, duration: 2.2, ease: 'sine.inOut' }, '+=0.6')
      .to({}, { duration: 1 })
    : null

  return {
    destroy() {
      tour?.kill()
      gsap.killTweensOf([scroller, pointer, ...letters])
      observer.disconnect()
      stage.removeEventListener('click', onClick)
      scroller.remove()
      stage.classList.remove('wf-stage', 'wf-narrow')
    },
  }
}
