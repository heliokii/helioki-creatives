// Concept: "Scenic Footer Section" by elaya and "footer section" by Pranav (via inspora.design). Original implementation.

import { gsap } from 'gsap'

export const params = [
  { id: 'depth', label: 'Parallax depth', min: 20, max: 120, step: 5, default: 60 },
]

let uid = 0

const CSS = `
.sf-stage { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--hc-bg, #0b0b0b); color: var(--hc-cream, #e9e5d6); font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: var(--fs, 13px); text-align: left; }
.sf-scroll { position: absolute; inset: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; }
.sf-scroll::-webkit-scrollbar { display: none; }
.sf-page { padding: 2.4em 2em 3em; }
.sf-kicker { margin: 0; font: 0.75em/1 ui-monospace, monospace; letter-spacing: 0.1em; text-transform: uppercase; color: var(--hc-accent, #9aa27c); }
.sf-h { margin: 0.4em 0 0.6em; font-size: 2.2em; line-height: 1.05; font-weight: 600; letter-spacing: -0.03em; }
.sf-p { max-width: 34em; margin: 0 0 1em; line-height: 1.55; color: var(--hc-soft, #b3b3b3); }
.sf-footer { position: relative; }
.sf-scene { display: block; width: 100%; height: 14em; }
.sf-bar { display: grid; grid-template-columns: 1.4fr repeat(3, 1fr); gap: 1.5em; padding: 1.6em 2em 1.4em; background: var(--hc-surface, #141414); color: var(--hc-cream, #e9e5d6); }
.sf-narrow .sf-bar { grid-template-columns: repeat(3, 1fr); }
.sf-narrow .sf-brandcol { grid-column: 1 / -1; }
.sf-brand { margin: 0; font-size: 1.2em; font-weight: 600; }
.sf-tag { margin: 0.3em 0 0; font-size: 0.85em; color: var(--hc-muted, #8a8a8a); }
.sf-colh { margin: 0 0 0.6em; font-size: 0.72em; letter-spacing: 0.08em; text-transform: uppercase; color: var(--hc-accent, #9aa27c); }
.sf-col a { display: block; color: var(--hc-cream, #e9e5d6); text-decoration: none; font-size: 0.88em; line-height: 1.9; opacity: 0.8; }
.sf-col a:hover { opacity: 1; }
.sf-form { display: flex; gap: 0.4em; margin-top: 0.9em; }
.sf-form input { flex: 1; min-width: 0; height: 2.4em; padding: 0 0.9em; border: 1px solid var(--hc-line-2, #2f2f2f); border-radius: 999px; background: var(--hc-bg, #0b0b0b); color: var(--hc-ink, #f2f2f2); font-family: inherit; font-size: 0.9em; }
.sf-join { height: 2.4em; padding: 0 1.1em; border: 0; border-radius: 999px; background: var(--hc-warm, #e9a14a); color: var(--hc-bg, #0b0b0b); font-family: inherit; font-size: 0.9em; font-weight: 600; white-space: nowrap; cursor: pointer; }
.sf-join:focus-visible, .sf-form input:focus-visible { outline: 2px solid var(--hc-warm, #e9a14a); outline-offset: 2px; }
.sf-legal { grid-column: 1 / -1; display: flex; justify-content: space-between; padding-top: 1em; border-top: 1px solid var(--hc-line, #262626); font-size: 0.75em; color: var(--hc-muted, #8a8a8a); }
.sf-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

const COLUMNS = [
  ['Read', ['Latest', 'Archive', 'Maps']],
  ['Studio', ['About', 'Contributors', 'Contact']],
  ['Follow', ['Newsletter', 'Instagram', 'RSS']],
]

const html = (id) => `
<div class="sf-scroll">
  <div class="sf-page">
    <p class="sf-kicker">Field Notes · Issue 12</p>
    <h3 class="sf-h">Slow places,<br>well documented.</h3>
    <p class="sf-p">A monthly letter about towns at the end of the line: the bakery that opens at five, the ferry that waits for latecomers, the hill everyone climbs once.</p>
    <p class="sf-p">This issue follows the coast road north for nine days, with field sketches, a few bad photos and one very good soup.</p>
    <p class="sf-p">Scroll on. The footer is where the walk ends.</p>
  </div>
  <footer class="sf-footer">
    <svg class="sf-scene" viewBox="0 0 400 160" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color: var(--hc-bg, #0b0b0b)"/><stop offset="1" style="stop-color: var(--hc-accent-dark, #3c4230)"/></linearGradient></defs>
      <rect width="400" height="160" fill="url(#${id})"/>
      <circle class="sf-l" data-d="1.6" cx="300" cy="72" r="22" style="fill: var(--hc-warm, #e9a14a)"/>
      <path class="sf-l" data-d="1" d="M0 110 C60 80 120 95 180 85 S300 70 400 95 V260 H0Z" style="fill: var(--hc-accent-light, #c5cc9f)"/>
      <path class="sf-l" data-d="0.6" d="M0 125 C70 100 140 120 210 105 S330 100 400 118 V260 H0Z" style="fill: var(--hc-accent, #9aa27c)"/>
      <path class="sf-l" data-d="0.3" d="M0 140 C80 120 160 145 240 128 S350 130 400 140 V260 H0Z" style="fill: var(--hc-accent-deep, #6b7350)"/>
      <path d="M0 152 C100 146 300 156 400 150 V160 H0Z" style="fill: var(--hc-surface, #141414)"/>
    </svg>
    <div class="sf-bar">
      <div class="sf-brandcol">
        <p class="sf-brand">Field Notes</p>
        <p class="sf-tag">Postcards from quiet corners, once a month.</p>
        <form class="sf-form"><input type="email" required placeholder="you@email.com" aria-label="Email address"><button class="sf-join">Join</button></form>
        <span class="sf-sr" role="status"></span>
      </div>
      ${COLUMNS.map(([title, links]) => `<nav class="sf-col" aria-label="${title}"><p class="sf-colh">${title}</p>${links.map((l) => `<a href="#">${l}</a>`).join('')}</nav>`).join('')}
      <div class="sf-legal"><span>© 2026 Field Notes</span><span>Made slowly.</span></div>
    </div>
  </footer>
</div>`

export function mount(stage, { depth = 60, preview = false }) {
  injectCSS('scenic-footer-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  stage.classList.add('sf-stage')
  stage.insertAdjacentHTML('beforeend', html(`sf-sky-${++uid}`))
  const scroller = stage.querySelector('.sf-scroll')
  const footer = stage.querySelector('.sf-footer')
  const layers = [...stage.querySelectorAll('.sf-l')]
  const form = stage.querySelector('.sf-form')
  const input = form.querySelector('input')
  const join = form.querySelector('.sf-join')
  const status = stage.querySelector('.sf-sr')

  const resize = () => {
    const w = stage.clientWidth
    stage.style.setProperty('--fs', `${Math.max(8, Math.min(14, w / 42))}px`)
    stage.classList.toggle('sf-narrow', w < 520)
    update()
  }
  // Each layer sinks by its depth factor until the footer is fully in view, so the hills rise as you arrive.
  const update = () => {
    const progress = Math.max(0, Math.min(1, (scroller.scrollTop + scroller.clientHeight - footer.offsetTop) / footer.offsetHeight))
    layers.forEach((layer) => gsap.set(layer, { y: reduceMotion ? 0 : (1 - progress) * depth * 0.6 * Number(layer.dataset.d) }))
  }
  const observer = new ResizeObserver(resize)
  observer.observe(stage)
  scroller.addEventListener('scroll', update, { passive: true })

  const onLink = (e) => { if (e.target.closest('a')) e.preventDefault() }
  stage.addEventListener('click', onLink)

  let joined = false
  const onSubmit = (e) => {
    e.preventDefault()
    if (joined) return
    joined = true
    input.disabled = true
    status.textContent = "Thanks, you're on the list."
    gsap.timeline()
      .to(join, { width: join.offsetHeight, paddingLeft: 0, paddingRight: 0, duration: reduceMotion ? 0 : 0.3, ease: 'power2.inOut', onStart: () => { join.textContent = '' } })
      .add(() => { join.textContent = '✓' })
      .fromTo(join, { scale: 0.6 }, { scale: 1, duration: reduceMotion ? 0 : 0.4, ease: 'back.out(3)' })
      .add(() => {
        join.textContent = 'Join'
        input.value = ''
        input.disabled = false
        joined = false
        gsap.set(join, { clearProps: 'width,paddingLeft,paddingRight' })
      }, '+=2.2')
  }
  form.addEventListener('submit', onSubmit)

  const tour = preview && !reduceMotion
    ? gsap.to(scroller, { scrollTop: () => scroller.scrollHeight - scroller.clientHeight, duration: 4.5, ease: 'sine.inOut', yoyo: true, repeat: -1, repeatDelay: 1.4, delay: 0.8 })
    : null

  return {
    destroy() {
      tour?.kill()
      gsap.killTweensOf([join, ...layers])
      observer.disconnect()
      stage.removeEventListener('click', onLink)
      scroller.remove()
      stage.classList.remove('sf-stage', 'sf-narrow')
    },
  }
}
