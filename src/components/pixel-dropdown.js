// Concept: "Flying dropdown menu" by George (via inspora.design). Original implementation.

import { gsap } from 'gsap'

export const params = [
  { id: 'pixel', label: 'Pixel size', min: 4, max: 10, step: 1, default: 6 },
  { id: 'duration', label: 'Duration (s)', min: 0.3, max: 1.5, step: 0.05, default: 0.8 },
]

const W = 420
const H = 300
const MENU = { left: 40, top: 80, width: 220, height: 196, radius: 14 }
const TILE_TOKENS = [['accent', '#9aa27c'], ['accent-light', '#c5cc9f'], ['accent-deep', '#6b7350'], ['cream', '#e9e5d6'], ['warm', '#e9a14a']]
const ITEMS = ['Profile', 'Settings', 'Billing', 'Team', 'Sign out']

const CSS = `
.pd-stage { position: relative; width: 100%; height: 100%; overflow: hidden; }
.pd-root { position: absolute; left: 50%; top: 50%; width: ${W}px; height: ${H}px; margin: ${-H / 2}px 0 0 ${-W / 2}px; transform: scale(var(--s, 1)); font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: var(--hc-ink, #f2f2f2); text-align: left; }
.pd-button { position: absolute; left: ${MENU.left}px; top: 28px; display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 14px 0 16px; border-radius: 12px; border: 1px solid var(--hc-line, #262626); background: var(--hc-surface, #141414); color: inherit; font-family: inherit; font-size: 14px; font-weight: 500; cursor: pointer; }
.pd-button svg { fill: none; stroke: currentColor; stroke-width: 2; transition: transform 0.3s; }
.pd-button[aria-expanded="true"] svg { transform: rotate(180deg); }
.pd-button:focus-visible, .pd-item:focus-visible { outline: 2px solid var(--hc-accent, #9aa27c); outline-offset: 2px; }
.pd-canvas { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; pointer-events: none; }
.pd-menu { position: absolute; left: ${MENU.left}px; top: ${MENU.top}px; width: ${MENU.width}px; height: ${MENU.height}px; box-sizing: border-box; display: flex; flex-direction: column; padding: 13px 8px; border-radius: ${MENU.radius}px; border: 1px solid var(--hc-line, #262626); background: var(--hc-surface-2, #1c1c1c); visibility: hidden; }
.pd-item { height: 34px; flex: none; padding: 0 10px; border: 0; border-radius: 8px; background: none; color: var(--hc-ink, #f2f2f2); font-family: inherit; font-size: 13px; text-align: left; cursor: pointer; }
.pd-item:hover, .pd-item:focus-visible { background: var(--hc-line, #262626); color: var(--hc-ink, #f2f2f2); }
.pd-item:last-child { color: var(--hc-danger, #e07a5f); }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

// Reads a palette token for canvas drawing; the fallback keeps the module working on its own.
const token = (el, name, fallback) => getComputedStyle(el).getPropertyValue(`--hc-${name}`).trim() || fallback

const clamp01 = (v) => Math.max(0, Math.min(1, v))

// True when (x, y) inside the menu box falls in a cut-off rounded corner.
const outsideCorner = (x, y) => {
  const r = MENU.radius
  const cx = Math.max(r, Math.min(MENU.width - r, x))
  const cy = Math.max(r, Math.min(MENU.height - r, y))
  return Math.hypot(x - cx, y - cy) > r
}

export function mount(stage, { pixel = 6, duration = 0.8, preview = false }) {
  injectCSS('pixel-dropdown-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  stage.classList.add('pd-stage')
  const root = document.createElement('div')
  root.className = 'pd-root'
  root.innerHTML = `
    <button type="button" class="pd-button" aria-haspopup="menu" aria-expanded="false">Workspace <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
    <canvas class="pd-canvas" width="${W * 2}" height="${H * 2}"></canvas>
    <div class="pd-menu" role="menu" aria-label="Workspace">${ITEMS.map((item) => `<button type="button" class="pd-item" role="menuitem" tabindex="-1">${item}</button>`).join('')}</div>`
  stage.append(root)

  const resize = () => root.style.setProperty('--s', Math.min(stage.clientWidth / W, stage.clientHeight / H))
  const observer = new ResizeObserver(resize)
  observer.observe(stage)

  const button = root.querySelector('.pd-button')
  const menu = root.querySelector('.pd-menu')
  const items = [...menu.children]
  const ctx = root.querySelector('.pd-canvas').getContext('2d')
  ctx.setTransform(2, 0, 0, 2, 0, 0)
  const colors = TILE_TOKENS.map(([name, fallback]) => token(stage, name, fallback))
  const surface = token(stage, 'surface-2', '#1c1c1c')

  let state = 'closed'
  let tiles = []
  let anim = null

  const buildTiles = () => {
    const cols = Math.ceil(MENU.width / pixel)
    const rows = Math.ceil(MENU.height / pixel)
    const list = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (outsideCorner(c * pixel + pixel / 2, r * pixel + pixel / 2)) continue
        list.push({
          tx: MENU.left + c * pixel, ty: MENU.top + r * pixel, row: r / rows, k: Math.random(),
          ox: gsap.utils.random(-30, 30), oy: gsap.utils.random(-30, 30), color: colors[Math.floor(Math.random() * colors.length)],
        })
      }
    }
    return list
  }

  // Opening: tiles fly from the button and land row by row, turning into the menu surface.
  // Closing: the same tiles burst outward and fade.
  const tick = () => {
    const elapsed = gsap.ticker.time - anim.start
    const sx = button.offsetLeft + button.offsetWidth / 2
    const sy = button.offsetTop + button.offsetHeight / 2
    ctx.clearRect(0, 0, W, H)
    let done = true
    for (const tile of tiles) {
      if (anim.mode === 'open') {
        const p = clamp01((elapsed - (tile.k * 0.35 + tile.row * 0.25) * duration) / (duration * 0.4))
        if (p < 1) done = false
        if (p === 0) continue
        const e = 1 - (1 - p) ** 3
        ctx.fillStyle = p === 1 ? surface : tile.color
        ctx.fillRect(sx + tile.ox * (1 - e) + (tile.tx - sx) * e, sy + tile.oy * (1 - e) + (tile.ty - sy) * e, p === 1 ? pixel : pixel - 1, p === 1 ? pixel : pixel - 1)
      } else {
        const p = clamp01((elapsed - tile.k * 0.3 * duration) / (duration * 0.5))
        if (p < 1) done = false
        if (p === 1) continue
        ctx.globalAlpha = 1 - p
        ctx.fillStyle = tile.color
        ctx.fillRect(tile.tx + tile.ox * 3 * p * p, tile.ty + (tile.oy * 3 + 40) * p * p, pixel - 1, pixel - 1)
        ctx.globalAlpha = 1
      }
    }
    if (done) finish()
  }

  const run = (mode) => {
    anim = { mode, start: gsap.ticker.time }
    gsap.ticker.remove(tick)
    gsap.ticker.add(tick)
  }

  const finish = () => {
    gsap.ticker.remove(tick)
    ctx.clearRect(0, 0, W, H)
    if (anim.mode !== 'open') { state = 'closed'; return }
    state = 'open'
    gsap.set(menu, { autoAlpha: 1 })
    gsap.fromTo(items, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.2, stagger: 0.03 })
    if (!preview && root.contains(document.activeElement)) items[0].focus()
  }

  const open = () => {
    if (state === 'open' || state === 'opening') return
    state = 'opening'
    button.setAttribute('aria-expanded', 'true')
    if (reduceMotion) { anim = { mode: 'open' }; finish(); return }
    tiles = buildTiles()
    run('open')
  }

  const close = () => {
    if (state === 'closed' || state === 'closing') return
    state = 'closing'
    button.setAttribute('aria-expanded', 'false')
    gsap.set(menu, { autoAlpha: 0 })
    if (reduceMotion || !tiles.length) { anim = { mode: 'close' }; finish(); return }
    run('close')
  }

  const onButton = () => (state === 'open' || state === 'opening' ? close() : open())
  const onMenuKey = (e) => {
    const i = items.indexOf(document.activeElement)
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus()
    } else if (e.key === 'Escape') {
      close()
      button.focus()
    }
  }
  const onOutside = (e) => { if (state === 'open' && !root.contains(e.target)) close() }
  button.addEventListener('click', onButton)
  menu.addEventListener('keydown', onMenuKey)
  items.forEach((item) => item.addEventListener('click', () => { close(); button.focus() }))
  document.addEventListener('pointerdown', onOutside)

  const demo = preview
    ? gsap.timeline({ repeat: -1, delay: 0.6 }).call(open).call(close, null, duration + 1.8).to({}, { duration: duration * 0.8 + 1 })
    : null

  return {
    destroy() {
      demo?.kill()
      gsap.ticker.remove(tick)
      gsap.killTweensOf([menu, ...items])
      document.removeEventListener('pointerdown', onOutside)
      observer.disconnect()
      root.remove()
      stage.classList.remove('pd-stage')
    },
  }
}
