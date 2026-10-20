import { gsap } from 'gsap'
import { reduceMotion } from './ui.js'

// Page background: a dot grid that sags toward the cursor like a gravity well.

const GAP = 28
const RADIUS = 160
const SPRING = 0.08
const DAMP = 0.82

// One frame for one dot: spring toward a target dragged from home toward the pointer.
// The falloff stays below 1, so the target never passes the pointer. Returns the dot's speed.
export function stepDot(dot, px, py, pull) {
  const dx = px - dot.hx
  const dy = py - dot.hy
  const f = pull * (RADIUS * RADIUS / (dx * dx + dy * dy + RADIUS * RADIUS)) ** 2
  dot.vx = (dot.vx + (dot.hx + dx * f - dot.x) * SPRING) * DAMP
  dot.vy = (dot.vy + (dot.hy + dy * f - dot.y) * SPRING) * DAMP
  dot.x += dot.vx
  dot.y += dot.vy
  return Math.abs(dot.vx) + Math.abs(dot.vy)
}

export function dotField(canvas) {
  const ctx = canvas.getContext('2d')
  const css = getComputedStyle(document.documentElement)
  const base = css.getPropertyValue('--hc-line-2').trim() || '#2f2f2f'
  const glow = css.getPropertyValue('--hc-accent').trim() || '#9aa27c'
  const state = { pull: 0 }
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
  let dots = []
  let w = 0
  let h = 0
  let active = false
  let settled = false

  const draw = () => {
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = base
    for (const d of dots) ctx.fillRect(d.x - 1, d.y - 1, 2, 2)
    // Dots light up the further gravity has dragged them from home.
    ctx.fillStyle = glow
    for (const d of dots) {
      const a = Math.min(1, Math.hypot(d.x - d.hx, d.y - d.hy) / 24)
      if (a < 0.05) continue
      ctx.globalAlpha = a
      const s = 2 + a
      ctx.fillRect(d.x - s / 2, d.y - s / 2, s, s)
    }
    ctx.globalAlpha = 1
  }

  const build = () => {
    const dpr = Math.min(2, devicePixelRatio || 1)
    w = window.innerWidth
    h = window.innerHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const cols = Math.ceil(w / GAP) + 1
    const rows = Math.ceil(h / GAP) + 1
    const ox = (w - (cols - 1) * GAP) / 2
    const oy = (h - (rows - 1) * GAP) / 2
    dots = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const hx = ox + c * GAP
        const hy = oy + r * GAP
        dots.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0 })
      }
    }
    settled = false
    draw()
  }

  const tick = () => {
    // Nothing moves once the cursor is gone and every dot is home.
    if (settled && !state.pull) return
    pointer.x += (pointer.tx - pointer.x) * 0.25
    pointer.y += (pointer.ty - pointer.y) * 0.25
    let speed = 0
    for (const d of dots) speed += stepDot(d, pointer.x, pointer.y, state.pull)
    draw()
    settled = speed < 0.1
  }

  const setActive = (on) => {
    active = on
    gsap.to(state, { pull: on ? 1 : 0, duration: on ? 0.6 : 0.9, ease: 'power2.out', overwrite: true })
  }

  const onMove = (e) => {
    pointer.tx = e.clientX
    pointer.ty = e.clientY
    if (active) return
    // Entering fresh: start the well under the cursor instead of sliding it in from the last spot.
    if (!state.pull) {
      pointer.x = e.clientX
      pointer.y = e.clientY
    }
    setActive(true)
  }
  const onLeave = () => { if (active) setActive(false) }

  build()
  window.addEventListener('resize', build)
  if (reduceMotion()) return
  window.addEventListener('pointermove', onMove, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)
  window.addEventListener('blur', onLeave)
  gsap.ticker.add(tick)
}
