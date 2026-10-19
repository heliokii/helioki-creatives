// Concept: "Dither and Ascii card" by Praveen Kumar (via inspora.design). Original implementation.

import { gsap } from 'gsap'

export const params = [
  { id: 'cell', label: 'Cell size (px)', min: 6, max: 16, step: 1, default: 9 },
]

export const RAMP = ' .:-=+*#%@'
export const charFor = (luma) => RAMP[Math.min(RAMP.length - 1, Math.max(0, Math.floor(luma * RAMP.length)))]

// 4×4 ordered-dither matrix: the reveal order looks dithered instead of random noise.
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]

const CSS = `
.ax-stage { position: relative; width: 100%; height: 100%; overflow: hidden; display: grid; place-items: center; cursor: pointer; outline: none; }
.ax-stage:focus-visible { box-shadow: inset 0 0 0 2px var(--hc-accent, #9aa27c); }
.ax-canvas { display: block; border-radius: 14px; background: var(--hc-bg, #0b0b0b); box-shadow: 0 20px 40px -20px var(--hc-bg, #0b0b0b); }
.ax-hint { position: absolute; bottom: 3%; font: 10px/1 ui-monospace, "JetBrains Mono", monospace; letter-spacing: 0.1em; text-transform: uppercase; color: var(--hc-faint, #5a5a5a); }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

export function mount(stage, { images, cell = 9, preview = false }) {
  injectCSS('ascii-reveal-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  stage.classList.add('ax-stage')
  stage.tabIndex = 0
  stage.setAttribute('role', 'button')
  stage.setAttribute('aria-label', 'ASCII image. Hover or focus to reveal it; press for the next image.')
  const canvas = document.createElement('canvas')
  canvas.className = 'ax-canvas'
  canvas.setAttribute('role', 'img')
  const hint = Object.assign(document.createElement('span'), { className: 'ax-hint', textContent: 'Hover to reveal' })
  stage.append(canvas, hint)
  const ctx = canvas.getContext('2d')
  const src = document.createElement('canvas')
  const sample = document.createElement('canvas')

  const state = { p: 0 }
  let index = 0
  let image = null
  let size = { w: 0, h: 0, dpr: 1, cw: cell, ch: cell * 1.25, cols: 0, rows: 0 }
  let cells = []

  // Rasterize the image at canvas size, then sample one color per character cell.
  const build = () => {
    if (!image) return
    const dpr = Math.min(2, devicePixelRatio || 1)
    let h = stage.clientHeight * 0.84
    let w = Math.min(h * 0.8, stage.clientWidth * 0.9)
    h = w / 0.8
    const cw = cell
    const ch = cell * 1.25
    size = { w, h, dpr, cw, ch, cols: Math.ceil(w / cw), rows: Math.ceil(h / ch) }
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    canvas.width = src.width = Math.round(w * dpr)
    canvas.height = src.height = Math.round(h * dpr)
    const sctx = src.getContext('2d')
    const k = Math.max(src.width / image.naturalWidth, src.height / image.naturalHeight)
    sctx.drawImage(image, (src.width - image.naturalWidth * k) / 2, (src.height - image.naturalHeight * k) / 2, image.naturalWidth * k, image.naturalHeight * k)
    sample.width = size.cols
    sample.height = size.rows
    const pctx = sample.getContext('2d', { willReadFrequently: true })
    pctx.drawImage(src, 0, 0, size.cols, size.rows)
    let data = null
    try { data = pctx.getImageData(0, 0, size.cols, size.rows).data } catch { /* cross-origin image: fall back to flat gray */ }
    cells = []
    for (let r = 0; r < size.rows; r++) {
      for (let c = 0; c < size.cols; c++) {
        const o = (r * size.cols + c) * 4
        const [red, green, blue] = data ? [data[o], data[o + 1], data[o + 2]] : [128, 128, 128]
        const lift = (v) => Math.round(Math.min(255, v * 0.6 + 90))
        cells.push({
          r, c,
          ch: charFor((0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255),
          color: `rgb(${lift(red)} ${lift(green)} ${lift(blue)})`,
          thr: ((BAYER[r % 4][c % 4] + 0.5) / 16) * 0.85 + Math.random() * 0.15,
        })
      }
    }
    canvas.setAttribute('aria-label', images[index].alt)
    draw()
  }

  const draw = () => {
    const { dpr, cw, ch, w, h } = size
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#0b0b0b'
    ctx.fillRect(0, 0, w, h)
    ctx.font = `${ch * 0.9}px ui-monospace, "JetBrains Mono", monospace`
    ctx.textBaseline = 'top'
    for (const k of cells) {
      const x = k.c * cw
      const y = k.r * ch
      if (k.thr < state.p) ctx.drawImage(src, x * dpr, y * dpr, cw * dpr, ch * dpr, x, y, cw, ch)
      else if (k.ch !== ' ') { ctx.fillStyle = k.color; ctx.fillText(k.ch, x, y) }
    }
  }

  const load = (i) => {
    index = i
    const img = new Image()
    img.onload = () => { image = img; build() }
    img.src = images[i].src
  }
  load(0)

  const observer = new ResizeObserver(build)
  observer.observe(stage)

  const reveal = (to) => gsap.to(state, { p: to ? 1.01 : 0, duration: reduceMotion ? 0 : 0.9, ease: 'power2.inOut', overwrite: true, onUpdate: draw, onComplete: draw })
  const onEnter = () => reveal(1)
  const onLeave = () => reveal(0)
  const onPress = () => load((index + 1) % images.length)
  const onKey = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    onPress()
  }
  stage.addEventListener('pointerenter', onEnter)
  stage.addEventListener('pointerleave', onLeave)
  stage.addEventListener('focus', onEnter)
  stage.addEventListener('blur', onLeave)
  stage.addEventListener('click', onPress)
  stage.addEventListener('keydown', onKey)

  const demo = preview && !reduceMotion
    ? gsap.to(state, { p: 1.01, duration: 1.1, ease: 'power2.inOut', yoyo: true, repeat: -1, repeatDelay: 1.2, delay: 0.8, onUpdate: draw })
    : null

  return {
    destroy() {
      demo?.kill()
      gsap.killTweensOf(state)
      observer.disconnect()
      stage.removeEventListener('pointerenter', onEnter)
      stage.removeEventListener('pointerleave', onLeave)
      stage.removeEventListener('focus', onEnter)
      stage.removeEventListener('blur', onLeave)
      stage.removeEventListener('click', onPress)
      stage.removeEventListener('keydown', onKey)
      canvas.remove()
      hint.remove()
      stage.classList.remove('ax-stage')
    },
  }
}
