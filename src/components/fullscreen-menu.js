// Concept: "Full Screen" navbars on navbar.gallery: the menu button floods the page with a circular reveal. Original implementation.

import { gsap } from 'gsap'

export const params = [
  { id: 'stagger', label: 'Link stagger (s)', min: 0.02, max: 0.15, step: 0.01, default: 0.07 },
]

const LINKS = ['Work', 'Studio', 'Journal', 'Contact']

let uid = 0

const CSS = `
.fm-stage { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--hc-bg, #0b0b0b); color: var(--hc-ink, #f2f2f2); font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: var(--fs, 13px); text-align: left; }
.fm-page { position: absolute; inset: 0; padding: 1.4em 1.8em; }
.fm-brand { display: inline-flex; align-items: center; gap: 0.5em; color: var(--hc-ink, #f2f2f2); font-weight: 600; letter-spacing: -0.02em; text-decoration: none; }
.fm-brand i { width: 0.9em; height: 0.9em; border-radius: 3px; background: var(--hc-accent, #9aa27c); }
.fm-h { margin: 2.2em 0 0.6em; font-size: 2.6em; line-height: 1; font-weight: 600; letter-spacing: -0.035em; }
.fm-p { max-width: 26em; margin: 0; line-height: 1.55; color: var(--hc-muted, #8a8a8a); }
.fm-tiles { display: flex; gap: 0.8em; margin-top: 1.6em; }
.fm-tiles img { width: 5.5em; aspect-ratio: 4 / 5; border-radius: 0.5em; object-fit: cover; }
.fm-overlay { position: absolute; inset: 0; display: grid; grid-template-columns: 1fr auto; align-content: center; gap: 1em 2em; padding: 3.6em 1.8em 1.4em; background: var(--hc-cream, #e9e5d6); color: var(--hc-bg, #0b0b0b); visibility: hidden; }
.fm-list { margin: 0; padding: 0; list-style: none; }
.fm-link { display: block; overflow: hidden; color: inherit; font-size: 3.4em; line-height: 1.08; font-weight: 600; letter-spacing: -0.04em; text-decoration: none; transition: opacity 0.3s, transform 0.3s; }
.fm-link span { display: inline-block; }
.fm-link small { margin-right: 0.6em; font: 0.22em/1 ui-monospace, monospace; letter-spacing: 0; vertical-align: 0.9em; color: var(--hc-accent-deep, #6b7350); }
.fm-list:hover .fm-link:not(:hover), .fm-list:has(:focus-visible) .fm-link:not(:focus-visible) { opacity: 0.3; }
.fm-link:hover, .fm-link:focus-visible { transform: translateX(0.12em); }
.fm-peek { align-self: center; width: 9em; aspect-ratio: 4 / 5; border-radius: 0.6em; object-fit: cover; visibility: hidden; }
.fm-meta { grid-column: 1 / -1; display: flex; gap: 1.4em; padding-top: 1em; border-top: 1px solid var(--hc-soft, #b3b3b3); font-size: 0.85em; }
.fm-meta a { color: inherit; text-decoration: none; }
.fm-meta a:first-child { margin-right: auto; }
.fm-btn { position: absolute; top: 1em; right: 1.4em; display: flex; align-items: center; gap: 0.6em; height: 2.6em; padding: 0 1.1em; border: 1px solid var(--hc-line-2, #2f2f2f); border-radius: 1.4em; background: var(--hc-surface, #141414); color: var(--hc-ink, #f2f2f2); font: inherit; font-size: 0.9em; cursor: pointer; transition: background-color 0.3s, color 0.3s, border-color 0.3s; }
.fm-open .fm-btn { border-color: var(--hc-bg, #0b0b0b); background: var(--hc-bg, #0b0b0b); }
.fm-lines { position: relative; width: 1.2em; height: 0.6em; }
.fm-lines i { position: absolute; left: 0; width: 100%; height: 1.5px; border-radius: 1px; background: currentColor; }
.fm-lines i:last-child { bottom: 0; }
.fm-stage :focus-visible { outline: 2px solid var(--hc-accent-deep, #6b7350); outline-offset: 3px; }
.fm-narrow .fm-peek { display: none; }
@media (prefers-reduced-motion: reduce) { .fm-link, .fm-btn { transition: none; } }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

export function mount(stage, { stagger = 0.07, images = [], preview = false }) {
  injectCSS('fullscreen-menu-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const id = `fm-overlay-${++uid}`
  stage.classList.add('fm-stage')
  stage.insertAdjacentHTML('beforeend', `
    <div class="fm-page">
      <a class="fm-brand" href="#"><i></i>Lumen</a>
      <h3 class="fm-h">Quiet work,<br>loudly made.</h3>
      <p class="fm-p">A studio of four making identities and the motion that carries them. Open the menu.</p>
      <div class="fm-tiles">${images.slice(0, 3).map((img) => `<img src="${img.src}" alt="${img.alt}">`).join('')}</div>
    </div>
    <nav class="fm-overlay" id="${id}" aria-label="Site menu">
      <ul class="fm-list">${LINKS.map((label, i) => `<li><a class="fm-link" href="#"><span><small>0${i + 1}</small>${label}</span></a></li>`).join('')}</ul>
      <img class="fm-peek" alt="">
      <div class="fm-meta"><a href="#">hello@lumen.studio</a><a href="#">Instagram</a><a href="#">Dribbble</a></div>
    </nav>
    <button type="button" class="fm-btn" aria-expanded="false" aria-controls="${id}"><span class="fm-lines" aria-hidden="true"><i></i><i></i></span><span class="fm-label">Menu</span></button>`)
  const page = stage.querySelector('.fm-page')
  const overlay = stage.querySelector('.fm-overlay')
  const btn = stage.querySelector('.fm-btn')
  const label = btn.querySelector('.fm-label')
  const lines = [...btn.querySelectorAll('.fm-lines i')]
  const links = [...stage.querySelectorAll('.fm-link')]
  const texts = links.map((l) => l.firstElementChild)
  const peek = stage.querySelector('.fm-peek')
  const meta = stage.querySelector('.fm-meta')

  let tl = null
  let isOpen = false
  const hide = () => {
    gsap.set(overlay, { visibility: 'hidden' })
    stage.classList.remove('fm-open')
  }

  // Rebuilt on every open so the circle starts from wherever the button sits now.
  const build = () => {
    const s = stage.getBoundingClientRect()
    const b = btn.getBoundingClientRect()
    const x = b.left + b.width / 2 - s.left
    const y = b.top + b.height / 2 - s.top
    const r = Math.hypot(Math.max(x, s.width - x), Math.max(y, s.height - y))
    const gap = lines[0].parentElement.offsetHeight / 2
    return gsap.timeline({ paused: true, onReverseComplete: hide })
      .fromTo(overlay, { clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${r}px at ${x}px ${y}px)`, duration: 0.7, ease: 'power3.inOut' }, 0)
      .to(lines[0], { y: gap, rotation: 45, duration: 0.4, ease: 'power2.inOut' }, 0)
      .to(lines[1], { y: -gap, rotation: -45, duration: 0.4, ease: 'power2.inOut' }, 0)
      .fromTo(texts, { yPercent: 110 }, { yPercent: 0, duration: 0.6, stagger, ease: 'power3.out' }, 0.35)
      .fromTo(meta, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.55)
  }

  const showPeek = (i) => {
    const img = images[i % images.length]
    if (!img) return
    peek.src = img.src
    gsap.fromTo(peek, { autoAlpha: 0, scale: 1.08, rotation: i % 2 ? 3 : -3 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: reduceMotion ? 0 : 0.4, ease: 'power3.out', overwrite: true })
  }

  const setOpen = (open, focus = true) => {
    if (open === isOpen) return
    isOpen = open
    btn.setAttribute('aria-expanded', String(open))
    label.textContent = open ? 'Close' : 'Menu'
    page.inert = open
    if (open) {
      // Reopening mid-close just turns the running reveal around.
      if (!tl?.isActive()) {
        tl?.kill()
        tl = build()
      }
      gsap.set(overlay, { visibility: 'visible' })
      stage.classList.add('fm-open')
      if (reduceMotion) tl.progress(1)
      else tl.timeScale(1).play()
      if (focus) links[0].focus()
    } else {
      gsap.to(peek, { autoAlpha: 0, duration: reduceMotion ? 0 : 0.2 })
      if (reduceMotion) { tl.progress(0); hide() } else tl.timeScale(1.5).reverse()
      if (focus) btn.focus()
    }
  }

  const onBtn = () => setOpen(!isOpen)
  // preventDefault keeps a surrounding <dialog> from closing on the same Esc.
  const onKey = (e) => {
    if (e.key !== 'Escape' || !isOpen) return
    e.preventDefault()
    setOpen(false)
  }
  const onClick = (e) => { if (e.target.closest('a')) e.preventDefault() }
  const onHover = (e) => {
    const i = links.indexOf(e.target.closest('.fm-link'))
    if (i >= 0) showPeek(i)
  }
  btn.addEventListener('click', onBtn)
  stage.addEventListener('keydown', onKey)
  stage.addEventListener('click', onClick)
  overlay.addEventListener('pointerover', onHover)
  overlay.addEventListener('focusin', onHover)

  const resize = () => {
    const w = stage.clientWidth
    stage.style.setProperty('--fs', `${Math.max(7, Math.min(14, w / 40))}px`)
    stage.classList.toggle('fm-narrow', w < 420)
  }
  const observer = new ResizeObserver(resize)
  observer.observe(stage)

  // Preview: open, walk the links so the peek image swaps, close.
  const demo = preview && !reduceMotion
    ? gsap.timeline({ repeat: -1, delay: 0.8 }).call(setOpen, [true, false])
    : null
  if (demo) {
    links.forEach((_, i) => demo.call(showPeek, [i], 1.1 + i * 0.55))
    demo.call(setOpen, [false, false], '+=1').to({}, { duration: 1.6 })
  }

  return {
    destroy() {
      demo?.kill()
      tl?.kill()
      gsap.killTweensOf(peek)
      observer.disconnect()
      page.remove()
      overlay.remove()
      btn.remove()
      stage.classList.remove('fm-stage', 'fm-open', 'fm-narrow')
    },
  }
}
