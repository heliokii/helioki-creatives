// Concept: the softstory hero (softstorymedia.com): a particle wordmark that scatters on click. Original implementation.

import { gsap } from 'gsap'

export const params = [
  { id: 'gap', label: 'Particle spacing (px)', min: 2, max: 5, step: 0.5, default: 3 },
  { id: 'radius', label: 'Cursor radius (px)', min: 60, max: 200, step: 5, default: 120 },
  { id: 'burst', label: 'Burst strength', min: 4, max: 30, step: 1, default: 18 },
]

const WORD = 'helioki'
const LETTER = 0
const DUST = 1

// Helioki mark, a framed K with a middle bar. Geometry from public/helioki-logo.svg (1804 × 2285 units).
const MARK_W = 1804
const MARK_H = 2285
function drawMark(c, x, y, height) {
  const stroke = (clip, width, x1, y1, x2, y2) => {
    c.save()
    c.beginPath()
    c.rect(...clip)
    c.clip()
    c.lineWidth = width
    c.beginPath()
    c.moveTo(x1, y1)
    c.lineTo(x2, y2)
    c.stroke()
    c.restore()
  }
  c.save()
  c.translate(x, y)
  c.scale(height / MARK_H, height / MARK_H)
  c.beginPath()
  c.rect(0, 0, MARK_W, MARK_H)
  c.rect(230, 200, 1352, 1885)
  c.fill('evenodd')
  c.fillRect(230, 1016, 1352, 200)
  stroke([230, 200, 1352, 1885], 185, 1800, -200, -577, 2300)
  stroke([230, 1116, 1352, 969], 200, 595, 900, 1740, 2400)
  c.restore()
}

// One frame for one particle: spring home (off while energy ≥ 1), wobble, cursor push, damping. Returns speed.
export function stepParticle(p, time, energy, px, py, radius) {
  const dust = p.kind === DUST
  const hold = Math.max(0, 1 - energy)
  if (dust) {
    const k = 0.006 * Math.max(0.3, hold)
    p.vx += (p.hx + Math.sin(time * p.ds + p.ph) * p.dr - p.x) * k
    p.vy += (p.hy + Math.cos(time * p.ds * 0.8 + p.ph) * p.dr - p.y) * k
  } else {
    p.vx += (p.hx + 1.2 * Math.sin(0.8 * time + p.ph) - p.x) * 0.012 * hold
    p.vy += (p.hy + 1.2 * Math.cos(0.6 * time + p.ph) - p.y) * 0.012 * hold
    if (energy > 0) {
      p.vx += (Math.random() - 0.5) * 0.3
      p.vy += (Math.random() - 0.5) * 0.3
    }
  }
  const dx = p.x - px
  const dy = p.y - py
  const d2 = dx * dx + dy * dy
  const r2 = radius * radius
  if (d2 < r2) {
    const f = (1 - d2 / r2) * (dust ? 0.4 : 1.6)
    const d = Math.sqrt(d2) + 0.01
    p.vx += (dx / d) * f
    p.vy += (dy / d) * f
  }
  p.vx *= 0.9
  p.vy *= 0.9
  p.x += p.vx
  p.y += p.vy
  return Math.hypot(p.vx, p.vy)
}

// Blend two #rrggbb colors; t = 0 gives a, 1 gives b.
export function mixColor(a, b, t) {
  const ch = (hex, i) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  const [r, g, bl] = [0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t))
  return `rgb(${r} ${g} ${bl})`
}

const CSS = `
.pw-stage { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--hc-bg, #0b0b0b); touch-action: none; cursor: crosshair; outline: none; }
.pw-stage:focus-visible { box-shadow: inset 0 0 0 2px var(--hc-accent, #9aa27c); }
.pw-canvas { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.pw-hint { position: absolute; left: 0; right: 0; bottom: 4%; font: 10px/1 ui-monospace, "JetBrains Mono", monospace; letter-spacing: 0.1em; text-align: center; text-transform: uppercase; color: var(--hc-faint, #5a5a5a); pointer-events: none; }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

// Canvas needs real hex values for blending, so fall back when a token is missing or not hex.
function token(el, name, fallback) {
  const v = getComputedStyle(el).getPropertyValue(`--hc-${name}`).trim()
  return /^#[0-9a-f]{6}$/i.test(v) ? v : fallback
}

export function mount(stage, { gap = 3, radius = 120, burst = 18, preview = false }) {
  injectCSS('particle-wordmark-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  stage.classList.add('pw-stage')
  stage.tabIndex = 0
  stage.setAttribute('role', 'button')
  stage.setAttribute('aria-label', 'Helioki logo and wordmark, drawn in particles. Press to scatter it.')
  const canvas = Object.assign(document.createElement('canvas'), { className: 'pw-canvas' })
  const hint = Object.assign(document.createElement('span'), { className: 'pw-hint', textContent: reduceMotion ? WORD : 'Click to scatter' })
  stage.append(canvas, hint)
  const ctx = canvas.getContext('2d')

  const bg = token(stage, 'bg', '#0b0b0b')
  const cream = token(stage, 'cream', '#e9e5d6')
  const warm = token(stage, 'warm', '#e9a14a')
  const tint = token(stage, 'accent', '#9aa27c')
  // Letters run cream → warm with speed; nine steps is smooth enough and avoids a string per particle per frame.
  const ramp = Array.from({ length: 9 }, (_, i) => mixColor(cream, warm, i / 8))

  let w = 0
  let h = 0
  let parts = []
  let time = 0
  let energy = 0
  const pointer = { x: -1e4, y: -1e4 }

  const particle = (hx, hy, s, kind) => ({ hx, hy, x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0, s, kind, ph: Math.random() * Math.PI * 2, a: 1, dr: 0, ds: 0, tint: false })

  // Rasterize the mark and word offscreen and turn every lit sample into a particle with that spot as home.
  const build = () => {
    w = stage.clientWidth
    h = stage.clientHeight
    if (!w || !h) return
    const dpr = Math.min(2, devicePixelRatio || 1)
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const off = Object.assign(document.createElement('canvas'), { width: w, height: h })
    const octx = off.getContext('2d', { willReadFrequently: true })
    const family = 'Inter, ui-sans-serif, system-ui, sans-serif'
    // Lockup: the mark as tall as the word's ink, then the word; measured at 100px and scaled to fit.
    octx.font = `600 100px ${family}`
    const m = octx.measureText(WORD)
    const ink100 = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
    const markW100 = (ink100 * MARK_W) / MARK_H
    const size = Math.min((100 * 0.8 * w) / (markW100 + 22 + m.width), 0.5 * h)
    const k = size / 100
    const ink = ink100 * k
    const markW = markW100 * k
    const left = (w - (markW100 + 22 + m.width) * k) / 2
    const top = h / 2 - 0.03 * h - ink / 2
    octx.font = `600 ${size}px ${family}`
    octx.fillStyle = octx.strokeStyle = '#e9e5d6'
    drawMark(octx, left, top, ink)
    octx.fillText(WORD, left + markW + 22 * k, top + m.actualBoundingBoxAscent * k)
    const data = octx.getImageData(0, 0, w, h).data

    const next = []
    const scale = gap / 3
    for (let y = 0; y < h; y += gap) {
      for (let x = 0; x < w; x += gap) {
        if (data[(Math.min(h - 1, Math.round(y)) * w + Math.min(w - 1, Math.round(x))) * 4 + 3] > 128) {
          next.push(particle(x + (Math.random() - 0.5) * gap, y + (Math.random() - 0.5) * gap, (0.6 + 1.1 * Math.random()) * scale, LETTER))
        }
      }
    }
    // Ambient dust, scaled to the stage area.
    for (let i = 0, n = Math.min(250, Math.round((w * h) / 3000)); i < n; i++) {
      const p = particle(Math.random() * w, Math.random() * h, 0.3 + 0.7 * Math.random(), DUST)
      p.x = p.hx
      p.y = p.hy
      p.a = 0.12 + 0.18 * Math.random()
      p.dr = 4 + 10 * Math.random()
      p.ds = 0.08 + 0.17 * Math.random()
      p.tint = Math.random() < 0.08
      next.push(p)
    }
    parts = next
    if (reduceMotion) drawStill()
  }

  const dotAt = (x, y, s) => {
    ctx.beginPath()
    ctx.arc(x, y, s, 0, Math.PI * 2)
    ctx.fill()
  }

  const drawStill = () => {
    ctx.globalAlpha = 1
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
    for (const p of parts) {
      ctx.globalAlpha = p.kind === DUST ? p.a : 0.85
      ctx.fillStyle = p.kind === DUST && p.tint ? tint : cream
      dotAt(p.hx, p.hy, p.s)
    }
    ctx.globalAlpha = 1
  }

  // Physics constants are per 60 Hz frame: fixed steps keep the same pace on fast and slow displays.
  const STEP = 1000 / 60
  let lag = 0
  const tick = (_, dt) => {
    lag += dt
    let steps = 0
    for (; lag >= STEP && steps < 3; steps++, lag -= STEP) {
      time += 0.016
      for (const p of parts) p.sp = stepParticle(p, time, energy, pointer.x, pointer.y, radius)
      if (energy > 0) energy = Math.max(0, energy - 0.004)
    }
    if (!steps) return
    if (lag >= STEP) lag = 0
    // Paint the background translucently instead of clearing, so fast particles leave trails.
    ctx.globalAlpha = 0.35
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
    for (const p of parts) {
      const speed = p.sp
      if (p.kind === DUST) {
        ctx.globalAlpha = p.a * (0.7 + 0.3 * Math.sin(0.9 * time + 3 * p.ph))
        ctx.fillStyle = p.tint ? tint : cream
      } else {
        const e = Math.min(1, speed / 4)
        ctx.globalAlpha = 0.55 + 0.45 * e
        ctx.fillStyle = ramp[Math.round(e * 8)]
      }
      dotAt(p.x, p.y, p.s)
    }
    if (preview) {
      ctx.globalAlpha = 0.8
      ctx.strokeStyle = tint
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(pointer.x, pointer.y, 7, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  // Throw every particle and switch the home spring off for a couple of seconds.
  const scatter = () => {
    if (reduceMotion) return
    energy = 1.6
    for (const p of parts) {
      const kick = p.kind === DUST ? burst * 0.22 : burst
      p.vx += (Math.random() - 0.5) * kick
      p.vy += (Math.random() - 0.5) * kick
    }
  }

  // Mouse scatters on press; touch only on a short tap, so a drag can push particles around instead.
  let tap = null
  const moveTo = (e) => {
    const box = stage.getBoundingClientRect()
    pointer.x = e.clientX - box.left
    pointer.y = e.clientY - box.top
  }
  const away = () => { pointer.x = -1e4; pointer.y = -1e4 }
  const onDown = (e) => {
    moveTo(e)
    if (e.pointerType === 'mouse') scatter()
    else tap = { x: e.clientX, y: e.clientY, t: performance.now() }
  }
  const onUp = (e) => {
    if (e.pointerType === 'mouse') return
    const start = tap
    tap = null
    away()
    if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 12 && performance.now() - start.t < 400) scatter()
  }
  const onCancel = () => { tap = null; away() }
  const onKey = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    scatter()
  }
  if (!preview) {
    stage.addEventListener('pointermove', moveTo)
    stage.addEventListener('pointerleave', away)
    stage.addEventListener('pointerdown', onDown)
    stage.addEventListener('pointerup', onUp)
    stage.addEventListener('pointercancel', onCancel)
    stage.addEventListener('keydown', onKey)
  }

  // Preview: a visible cursor loops through the word; one burst per loop, leaving time to re-form (~7s) before the next.
  let demo = null
  const startDemo = () => {
    const path = { t: 0 }
    demo = gsap.timeline({ repeat: -1 })
      .to(path, {
        t: Math.PI * 2,
        duration: 11,
        ease: 'none',
        onUpdate: () => {
          pointer.x = w / 2 + Math.sin(path.t) * w * 0.36
          pointer.y = h / 2 + Math.sin(path.t * 2) * h * 0.12
        },
      })
      .call(scatter, null, 4)
  }

  let ready = false
  let dead = false
  const observer = new ResizeObserver(() => { if (ready) build() })
  observer.observe(stage)
  // Sample only once the webfont is in, or the particles would trace the fallback font.
  Promise.race([document.fonts?.load('600 100px Inter'), new Promise((r) => setTimeout(r, 1500))])
    .catch(() => {})
    .then(() => {
      if (dead) return
      ready = true
      build()
      if (reduceMotion) return
      gsap.ticker.add(tick)
      if (preview) startDemo()
    })

  return {
    destroy() {
      dead = true
      demo?.kill()
      gsap.ticker.remove(tick)
      observer.disconnect()
      stage.removeEventListener('pointermove', moveTo)
      stage.removeEventListener('pointerleave', away)
      stage.removeEventListener('pointerdown', onDown)
      stage.removeEventListener('pointerup', onUp)
      stage.removeEventListener('pointercancel', onCancel)
      stage.removeEventListener('keydown', onKey)
      canvas.remove()
      hint.remove()
      stage.classList.remove('pw-stage')
      stage.removeAttribute('tabindex')
      stage.removeAttribute('role')
      stage.removeAttribute('aria-label')
    },
  }
}
