// Concept: "Fluid liquid card carousel" by Marcelo Design X (via inspora.design). Original implementation.

import { gsap } from 'gsap'

export const params = [
  { id: 'count', label: 'Slides', min: 3, max: 8, step: 1, default: 5 },
  { id: 'distortion', label: 'Distortion', min: 0, max: 120, step: 5, default: 60 },
  { id: 'interval', label: 'Interval (s)', min: 1.5, max: 8, step: 0.1, default: 3.5 },
]

const THEMES = [['Moss', 'var(--hc-accent, #9aa27c)'], ['Linen', 'var(--hc-cream, #e9e5d6)'], ['Amber', 'var(--hc-warm, #e9a14a)'], ['Sage', 'var(--hc-accent-light, #c5cc9f)']]
let uid = 0
const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')

const CSS = `
.lq-stage { position: relative; width: 100%; height: 100%; overflow: hidden; display: grid; place-items: center; outline: none; user-select: none; touch-action: pan-y; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
.lq-stage:focus-visible { box-shadow: inset 0 0 0 2px var(--hc-accent, #9aa27c); }
.lq-view { position: relative; width: var(--vw); aspect-ratio: 3 / 2; margin-top: -6%; font-size: calc(var(--vw) / 24); }
.lq-slide { position: absolute; inset: 0; overflow: hidden; border-radius: 18px; background: var(--c); visibility: hidden; }
.lq-slide::after { content: ""; position: absolute; inset: 0; background: radial-gradient(120% 90% at 10% 100%, rgb(0 0 0 / 0.28), transparent 60%); }
.lq-slide img { position: absolute; right: 6%; top: 10%; height: 80%; aspect-ratio: 4 / 5; border-radius: 12px; object-fit: cover; box-shadow: 0 20px 40px -20px rgb(0 0 0 / 0.6); }
.lq-text { position: absolute; left: 7%; bottom: 12%; z-index: 1; color: var(--hc-bg, #0b0b0b); text-align: left; }
.lq-no { font: 0.7em/1 ui-monospace, "JetBrains Mono", monospace; letter-spacing: 0.1em; opacity: 0.7; }
.lq-title { margin: 0.2em 0 0; font-size: 2.4em; font-weight: 700; letter-spacing: -0.03em; }
.lq-controls { position: absolute; left: 0; right: 0; bottom: 4%; display: flex; align-items: center; justify-content: center; gap: 10px; }
.lq-btn { width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--hc-line-2, #2f2f2f); background: var(--hc-surface, #141414); color: var(--hc-ink, #f2f2f2); font-size: 14px; cursor: pointer; }
.lq-btn:focus-visible { outline: 2px solid var(--hc-accent, #9aa27c); outline-offset: 2px; }
.lq-dots { display: flex; gap: 5px; }
.lq-dots i { width: 6px; height: 6px; border-radius: 3px; background: var(--hc-line-2, #2f2f2f); transition: width 0.3s, background 0.3s; }
.lq-dots i.is-on { width: 16px; background: var(--hc-ink, #f2f2f2); }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

export function mount(stage, { images, distortion = 60, interval = 3.5, label = 'Liquid carousel' }) {
  injectCSS('liquid-carousel-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const fid = `lq-filter-${++uid}`
  const count = images.length
  stage.classList.add('lq-stage')
  stage.tabIndex = 0
  stage.setAttribute('role', 'region')
  stage.setAttribute('aria-roledescription', 'carousel')
  stage.setAttribute('aria-label', `${label}. Use the arrow keys or swipe.`)
  stage.insertAdjacentHTML('beforeend', `
    <svg class="lq-defs" width="0" height="0" aria-hidden="true" style="position:absolute">
      <filter id="${fid}" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.03" numOctaves="2" seed="4" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" result="warp"/>
        <feGaussianBlur in="warp" stdDeviation="0 0"/>
      </filter>
    </svg>
    <div class="lq-view">${images.map(({ src, alt }, i) => {
      const [name, color] = THEMES[i % THEMES.length]
      return `<div class="lq-slide" style="--c:${color}" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${count}: ${name}">
        <img src="${attr(src)}" alt="${attr(alt)}" draggable="false"><div class="lq-text"><div class="lq-no">${String(i + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}</div><p class="lq-title">${name}</p></div></div>`
    }).join('')}</div>
    <div class="lq-controls"><button type="button" class="lq-btn" aria-label="Previous slide">←</button><span class="lq-dots">${'<i></i>'.repeat(count)}</span><button type="button" class="lq-btn" aria-label="Next slide">→</button></div>`)

  const defs = stage.querySelector('.lq-defs')
  const view = stage.querySelector('.lq-view')
  const controls = stage.querySelector('.lq-controls')
  const slides = [...view.children]
  const dots = [...controls.querySelectorAll('.lq-dots i')]
  const [prev, next] = controls.querySelectorAll('.lq-btn')
  const turb = defs.querySelector('feTurbulence')
  const disp = defs.querySelector('feDisplacementMap')
  const blur = defs.querySelector('feGaussianBlur')

  const resize = () => stage.style.setProperty('--vw', `${Math.min(stage.clientWidth * 0.82, stage.clientHeight * 0.66 * 1.5)}px`)
  const observer = new ResizeObserver(resize)
  observer.observe(stage)

  let index = 0
  let busy = false
  const mark = () => {
    dots.forEach((dot, i) => dot.classList.toggle('is-on', i === index))
    slides.forEach((slide, i) => slide.setAttribute('aria-hidden', String(i !== index)))
  }
  gsap.set(slides[0], { autoAlpha: 1 })
  mark()

  // The filter only exists for the length of a transition: it swells, then settles back to a clean image.
  const fx = { scale: 0, blur: 0, f: 0.008 }
  const applyFx = () => {
    disp.setAttribute('scale', fx.scale)
    blur.setAttribute('stdDeviation', `${fx.blur} 0`)
    turb.setAttribute('baseFrequency', `${fx.f} 0.03`)
  }

  const go = (dir) => {
    if (busy) return
    busy = true
    const from = slides[index]
    index = (index + dir + count) % count
    const to = slides[index]
    mark()
    if (!reduceMotion) loop.restart(true)
    if (reduceMotion) {
      gsap.timeline({ onComplete: () => { busy = false } })
        .set(to, { xPercent: 0 })
        .fromTo(to, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 })
        .to(from, { autoAlpha: 0, duration: 0.3 }, 0)
      return
    }
    view.style.filter = `url(#${fid})`
    gsap.timeline({ onComplete: () => { view.style.filter = ''; busy = false } })
      .set(to, { xPercent: dir * 100, autoAlpha: 1 })
      .to(from, { xPercent: -dir * 100, duration: 0.9, ease: 'power3.inOut' }, 0)
      .to(to, { xPercent: 0, duration: 0.9, ease: 'power3.inOut' }, 0)
      .to(fx, { scale: distortion, blur: 10, f: 0.02, duration: 0.45, ease: 'power2.in', yoyo: true, repeat: 1, onUpdate: applyFx }, 0)
      .set(from, { autoAlpha: 0 })
  }

  const loop = gsap.delayedCall(interval, () => go(1))
  if (reduceMotion) loop.pause()

  let downX = null
  const onDown = (e) => { downX = e.clientX }
  const onUp = (e) => {
    if (downX === null) return
    const dx = e.clientX - downX
    downX = null
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
  }
  const onKey = (e) => {
    const dir = { ArrowLeft: -1, ArrowRight: 1 }[e.key]
    if (!dir) return
    e.preventDefault()
    go(dir)
  }
  const onPrev = () => go(-1)
  const onNext = () => go(1)
  view.addEventListener('pointerdown', onDown)
  window.addEventListener('pointerup', onUp)
  stage.addEventListener('keydown', onKey)
  prev.addEventListener('click', onPrev)
  next.addEventListener('click', onNext)

  return {
    destroy() {
      loop.kill()
      gsap.killTweensOf([fx, ...slides])
      observer.disconnect()
      window.removeEventListener('pointerup', onUp)
      stage.removeEventListener('keydown', onKey)
      defs.remove()
      view.remove()
      controls.remove()
      stage.classList.remove('lq-stage')
    },
  }
}
