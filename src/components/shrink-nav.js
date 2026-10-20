// Concept: "Static / Sticky" navbars on navbar.gallery: a full-width bar that tucks into a floating pill. Original implementation.

import { gsap } from 'gsap'

export const params = [
  { id: 'threshold', label: 'Morph after (px)', min: 10, max: 160, step: 10, default: 40 },
]

// Floats past the threshold; hides while scrolling down, comes back on any scroll up or near the top.
export function navState(y, lastY, threshold, hidden) {
  if (y < lastY || y <= threshold * 3) hidden = false
  else if (y > lastY) hidden = true
  return { floating: y > threshold, hidden }
}

const SECTIONS = [
  ['Intro', 'Quiet tools for loud ideas.', 'Lumen is a small studio making motion systems for product teams. We sit between design and engineering and leave both a little faster.'],
  ['Process', 'Sketch, block, polish.', 'Every project starts with ugly boxes moving on a grid. Timing gets locked before a single color is picked, so nothing pretty hides a slow beat.'],
  ['Work', 'Forty launches and counting.', 'Onboarding flows, dashboards that breathe, a checkout that shaved a second off every order. Most of it you have used without noticing.'],
  ['Contact', 'Say hello.', 'Tell us what feels stiff. We reply within a day, usually with a quick sketch of how it could move instead.'],
]

const CSS = `
.sn-stage { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--hc-bg, #0b0b0b); color: var(--hc-ink, #f2f2f2); font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: var(--fs, 13px); text-align: left; }
.sn-scroll { position: absolute; inset: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; }
.sn-scroll::-webkit-scrollbar { display: none; }
.sn-sec { min-height: 24em; padding: 2em 2em 1em; border-bottom: 1px solid var(--hc-line, #262626); }
.sn-sec:first-child { padding-top: 6em; }
.sn-kicker { margin: 0; font: 0.75em/1 ui-monospace, monospace; letter-spacing: 0.1em; text-transform: uppercase; color: var(--hc-accent, #9aa27c); }
.sn-h { margin: 0.4em 0 0.5em; font-size: 2.2em; line-height: 1.05; font-weight: 600; letter-spacing: -0.03em; }
.sn-p { max-width: 32em; margin: 0; line-height: 1.6; color: var(--hc-soft, #b3b3b3); }
.sn-nav { position: absolute; left: 0; right: 0; top: 0; z-index: 1; display: flex; align-items: center; gap: 1em; height: 3.8em; padding: 0 1.6em; overflow: hidden; border: 1px solid transparent; border-bottom-color: var(--hc-line, #262626); border-radius: 0; background: rgb(11 11 11 / 0); transition: left 0.5s, right 0.5s, top 0.5s, height 0.5s, padding 0.5s, border-radius 0.5s, background-color 0.5s, border-color 0.5s, backdrop-filter 0.5s, transform 0.4s; transition-timing-function: cubic-bezier(0.65, 0, 0.35, 1); }
.sn-nav.sn-float { left: 12%; right: 12%; top: 0.8em; height: 3em; padding: 0 0.5em 0 1.2em; border-color: var(--hc-line-2, #2f2f2f); border-radius: 1.6em; background: rgb(28 28 28 / 0.72); backdrop-filter: blur(10px); }
.sn-nav.sn-hidden { transform: translateY(-160%); }
.sn-brand { display: flex; align-items: center; gap: 0.5em; margin-right: auto; color: var(--hc-ink, #f2f2f2); font-weight: 600; letter-spacing: -0.02em; text-decoration: none; }
.sn-brand i { width: 0.9em; height: 0.9em; border-radius: 50%; background: var(--hc-warm, #e9a14a); }
.sn-links { position: relative; display: flex; }
.sn-link { position: relative; z-index: 1; padding: 0.45em 0.8em; color: var(--hc-soft, #b3b3b3); font-size: 0.9em; text-decoration: none; transition: color 0.3s; }
.sn-link[aria-current="true"] { color: var(--hc-ink, #f2f2f2); }
.sn-dot { position: absolute; left: 0; top: 0; height: 100%; border-radius: 1em; background: var(--hc-line-2, #2f2f2f); }
.sn-cta { margin-left: 0.6em; padding: 0.6em 1em; border-radius: 1.4em; background: var(--hc-ink, #f2f2f2); color: var(--hc-bg, #0b0b0b); font-size: 0.85em; font-weight: 600; white-space: nowrap; text-decoration: none; }
.sn-progress { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: var(--hc-accent, #9aa27c); transform: scaleX(0); transform-origin: 0 50%; }
.sn-stage :focus-visible { outline: 2px solid var(--hc-accent, #9aa27c); outline-offset: 2px; }
.sn-narrow .sn-links { display: none; }
@media (prefers-reduced-motion: reduce) { .sn-nav, .sn-link { transition: none; } }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

export function mount(stage, { threshold = 40, preview = false }) {
  injectCSS('shrink-nav-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  stage.classList.add('sn-stage')
  stage.insertAdjacentHTML('beforeend', `
    <div class="sn-scroll">${SECTIONS.map(([kicker, title, body]) => `
      <section class="sn-sec"><p class="sn-kicker">${kicker}</p><h3 class="sn-h">${title}</h3><p class="sn-p">${body}</p></section>`).join('')}
    </div>
    <nav class="sn-nav" aria-label="Demo navigation">
      <a class="sn-brand" href="#"><i></i>Lumen</a>
      <div class="sn-links"><span class="sn-dot" aria-hidden="true"></span>${SECTIONS.map(([label]) => `<a class="sn-link" href="#">${label}</a>`).join('')}</div>
      <a class="sn-cta" href="#">Book a call</a>
      <i class="sn-progress" aria-hidden="true"></i>
    </nav>`)
  const scroller = stage.querySelector('.sn-scroll')
  const nav = stage.querySelector('.sn-nav')
  const dot = stage.querySelector('.sn-dot')
  const progress = stage.querySelector('.sn-progress')
  const sections = [...stage.querySelectorAll('.sn-sec')]
  const links = [...stage.querySelectorAll('.sn-link')]

  let state = { floating: false, hidden: false }
  let lastY = 0
  let active = -1
  const moveDot = (instant) => {
    const link = links[active]
    links.forEach((l) => l.setAttribute('aria-current', String(l === link)))
    gsap.to(dot, { x: link.offsetLeft, width: link.offsetWidth, duration: instant || reduceMotion ? 0 : 0.4, ease: 'power3.out' })
  }
  const update = () => {
    const y = scroller.scrollTop
    state = navState(y, lastY, threshold, state.hidden)
    lastY = y
    nav.classList.toggle('sn-float', state.floating)
    nav.classList.toggle('sn-hidden', state.hidden)
    const max = scroller.scrollHeight - scroller.clientHeight
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`
    const next = y >= max - 2 ? sections.length - 1 : Math.max(0, sections.findLastIndex((s) => s.offsetTop <= y + scroller.clientHeight / 3))
    if (next !== active) { active = next; moveDot() }
  }
  const resize = () => {
    const w = stage.clientWidth
    stage.style.setProperty('--fs', `${Math.max(8, Math.min(14, w / 42))}px`)
    stage.classList.toggle('sn-narrow', w < 360)
    update()
    moveDot(true)
  }
  const observer = new ResizeObserver(resize)
  observer.observe(stage)
  scroller.addEventListener('scroll', update, { passive: true })

  const onClick = (e) => {
    const link = e.target.closest('a')
    if (!link) return
    e.preventDefault()
    const i = links.indexOf(link)
    if (i >= 0) gsap.to(scroller, { scrollTop: sections[i].offsetTop, duration: reduceMotion ? 0 : 0.8, ease: 'power3.inOut' })
  }
  // A keyboard user tabbing into a hidden bar gets it back.
  const onFocus = () => { state.hidden = false; nav.classList.remove('sn-hidden') }
  nav.addEventListener('click', onClick)
  nav.addEventListener('focusin', onFocus)

  // Preview: scroll down (bar hides), nudge up (pill returns), repeat, then back to the top.
  const max = () => scroller.scrollHeight - scroller.clientHeight
  const tour = preview && !reduceMotion
    ? gsap.timeline({ repeat: -1, delay: 0.8, defaults: { ease: 'sine.inOut' } })
      .to(scroller, { scrollTop: () => max() * 0.4, duration: 1.6 })
      .to(scroller, { scrollTop: () => max() * 0.32, duration: 0.6 }, '+=0.3')
      .to(scroller, { scrollTop: () => max() * 0.85, duration: 1.6 }, '+=1.2')
      .to(scroller, { scrollTop: () => max() * 0.77, duration: 0.6 }, '+=0.3')
      .to(scroller, { scrollTop: 0, duration: 1.8 }, '+=1.2')
      .to({}, { duration: 1.2 })
    : null

  return {
    destroy() {
      tour?.kill()
      gsap.killTweensOf([scroller, dot])
      observer.disconnect()
      scroller.remove()
      nav.remove()
      stage.classList.remove('sn-stage', 'sn-narrow')
    },
  }
}
