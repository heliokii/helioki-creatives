// Concept: "Galaxy Brain Effort Slider" by ozzy (via inspora.design). Original implementation.

import { gsap } from 'gsap'

export const params = [
  { id: 'density', label: 'Star density', min: 0.2, max: 2, step: 0.1, default: 1 },
]

const W = 480
const H = 220
const TW = 400
const TH = 52
const STOPS = [[0, 'Quick'], [25, 'Balanced'], [50, 'Deep'], [80, 'Galaxy brain']]

export const labelFor = (value) => STOPS.filter(([at]) => value >= at).pop()[1]

const CSS = `
.ef-stage { position: relative; width: 100%; height: 100%; overflow: hidden; }
.ef-root { position: absolute; left: 50%; top: 50%; width: ${W}px; height: ${H}px; margin: ${-H / 2}px 0 0 ${-W / 2}px; transform: scale(var(--s, 1)); font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: var(--hc-ink, #f2f2f2); }
.ef-head { position: absolute; left: 40px; right: 40px; top: 40px; display: flex; justify-content: space-between; font-size: 14px; color: var(--hc-muted, #8a8a8a); }
.ef-label { color: var(--hc-ink, #f2f2f2); font-weight: 600; }
.ef-track { position: absolute; left: 40px; top: 78px; width: ${TW}px; height: ${TH}px; border-radius: 999px; border: 1px solid var(--hc-line, #262626); background: var(--hc-surface, #141414); box-sizing: border-box; }
.ef-track:has(.ef-input:focus-visible) { outline: 2px solid var(--hc-accent, #9aa27c); outline-offset: 3px; }
.ef-fill { position: absolute; left: 0; top: 0; bottom: 0; overflow: hidden; border-radius: inherit; background: linear-gradient(90deg, var(--hc-accent-dark, #3c4230), var(--hc-accent-deep, #6b7350) 60%, var(--hc-accent, #9aa27c)) 0 0 / ${TW}px 100%; }
.ef-stars { position: absolute; left: 0; top: 0; width: ${TW}px; height: ${TH}px; }
.ef-thumb { position: absolute; top: 3px; left: 0; display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; background: var(--hc-cream, #e9e5d6); color: var(--hc-accent-dark, #3c4230); pointer-events: none; }
.ef-input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
.ef-stops { position: absolute; left: 40px; top: 146px; width: ${TW}px; display: flex; justify-content: space-between; font-size: 11px; color: var(--hc-faint, #5a5a5a); }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

// Reads a palette token for canvas drawing; the fallback keeps the module working on its own.
const token = (el, name, fallback) => getComputedStyle(el).getPropertyValue(`--hc-${name}`).trim() || fallback

export function mount(stage, { density = 1, preview = false }) {
  injectCSS('effort-slider-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  stage.classList.add('ef-stage')
  const root = document.createElement('div')
  root.className = 'ef-root'
  root.innerHTML = `
    <div class="ef-head"><span>Thinking effort</span><span class="ef-label">Balanced</span></div>
    <div class="ef-track">
      <div class="ef-fill"><canvas class="ef-stars" width="${TW * 2}" height="${TH * 2}"></canvas></div>
      <div class="ef-thumb"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z"/></svg></div>
      <input class="ef-input" type="range" min="0" max="100" step="1" value="40" aria-label="Thinking effort">
    </div>
    <div class="ef-stops" aria-hidden="true">${STOPS.map(([, name]) => `<span>${name.split(' ')[0]}</span>`).join('')}</div>`
  stage.append(root)

  const resize = () => root.style.setProperty('--s', Math.min(stage.clientWidth / W, stage.clientHeight / H))
  const observer = new ResizeObserver(resize)
  observer.observe(stage)

  const $ = (sel) => root.querySelector(sel)
  const fill = $('.ef-fill')
  const thumb = $('.ef-thumb')
  const input = $('.ef-input')
  const labelEl = $('.ef-label')
  const ctx = $('.ef-stars').getContext('2d')
  ctx.setTransform(2, 0, 0, 2, 0, 0)
  const starA = token(stage, 'cream', '#e9e5d6')
  const starB = token(stage, 'warm', '#e9a14a')

  // Each star has a threshold `k`; raising the value lights up more of them.
  const stars = Array.from({ length: Math.round(140 * density) }, () => ({
    x: Math.random() * TW, y: 4 + Math.random() * (TH - 8), k: Math.random(), ph: Math.random() * 6.28, sp: 1.5 + Math.random() * 3, s: Math.random() < 0.2 ? 2 : 1.4,
  }))
  const state = { v: Number(input.value) }
  let label = ''

  const drawStars = (time = 0) => {
    ctx.clearRect(0, 0, TW, TH)
    const level = state.v / 100
    for (const star of stars) {
      if (star.k > level) continue
      ctx.globalAlpha = reduceMotion ? 0.8 : 0.25 + 0.75 * Math.abs(Math.sin(time * star.sp + star.ph))
      ctx.fillStyle = star.k < 0.5 ? starA : starB
      ctx.fillRect(star.x, star.y, star.s, star.s)
    }
    ctx.globalAlpha = 1
  }

  const render = () => {
    const x = 3 + (state.v / 100) * (TW - 52)
    thumb.style.left = `${x}px`
    thumb.style.boxShadow = `0 0 ${4 + state.v * 0.3}px rgb(154 162 124 / 0.75)`
    fill.style.width = `${x + 47}px`
    const next = labelFor(state.v)
    input.setAttribute('aria-valuetext', `${next}, ${Math.round(state.v)}`)
    if (next !== label) {
      label = next
      gsap.fromTo(labelEl, { opacity: 0, y: 4, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: reduceMotion ? 0 : 0.3, onStart: () => { labelEl.textContent = next } })
    }
    if (reduceMotion) drawStars()
  }
  const onInput = () => { state.v = Number(input.value); render() }
  input.addEventListener('input', onInput)
  render()

  const twinkle = (time) => drawStars(time)
  if (!reduceMotion) gsap.ticker.add(twinkle)

  const sweep = preview
    ? gsap.fromTo(state, { v: 8 }, { v: 100, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1, repeatDelay: 0.6, onUpdate: () => { input.value = state.v; render() } })
    : null

  return {
    destroy() {
      sweep?.kill()
      gsap.ticker.remove(twinkle)
      gsap.killTweensOf(labelEl)
      observer.disconnect()
      root.remove()
      stage.classList.remove('ef-stage')
    },
  }
}
