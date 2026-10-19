// Concept: animos "Ticker Tilt" template (animos.app). Original implementation.

import { gsap } from 'gsap'

export const params = [
  { id: 'rows', label: 'Rows', min: 1, max: 4, step: 1, default: 3 },
  { id: 'speed', label: 'Speed (px/s)', min: 10, max: 120, step: 5, default: 40 },
  { id: 'tilt', label: 'Tilt (°)', min: 0, max: 60, step: 1, default: 30 },
]

const CSS = `
.ticker-stage { position: relative; width: 100%; height: 100%; overflow: hidden; perspective: 900px; user-select: none; }
.ticker-plane { position: absolute; left: -30%; right: -30%; top: 50%; display: grid; gap: 12px; }
.ticker-row { display: flex; gap: 12px; width: max-content; }
.ticker-card { flex: none; height: var(--ch); aspect-ratio: 4 / 5; margin: 0; border-radius: 8px; overflow: hidden; background: var(--hc-surface, #141414); }
.ticker-card img { display: block; width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

export function mount(stage, { images, rows = 3, speed = 40, tilt = 30 }) {
  injectCSS('ticker-tilt-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  stage.classList.add('ticker-stage')
  const plane = document.createElement('div')
  plane.className = 'ticker-plane'
  stage.append(plane)

  // Each row holds the list twice; sliding by half its width loops seamlessly.
  const tracks = Array.from({ length: rows }, (_, r) => {
    const row = document.createElement('div')
    row.className = 'ticker-row'
    const shift = r * 2
    const list = [...images.slice(shift), ...images.slice(0, shift)]
    const copies = [...list, ...list, ...list, ...list]
    copies.forEach(({ src, alt }, i) => {
      const card = document.createElement('figure')
      card.className = 'ticker-card'
      const img = new Image()
      img.src = src
      img.alt = i < list.length ? alt : ''
      img.draggable = false
      card.append(img)
      row.append(card)
    })
    plane.append(row)
    return { row, dir: r % 2 ? 1 : -1, x: 0, half: 0 }
  })

  const resize = () => {
    stage.style.setProperty('--ch', `${Math.min(stage.clientHeight / (rows + 0.6), 200)}px`)
    gsap.set(plane, { yPercent: -50, rotationX: tilt, rotationZ: -tilt * 0.35 })
    tracks.forEach((track) => { track.half = track.row.scrollWidth / 2 })
  }
  const observer = new ResizeObserver(resize)
  observer.observe(stage)

  const pace = { scale: reduceMotion ? 0 : 1 }
  const render = (time, delta) => {
    tracks.forEach((track) => {
      if (!track.half) return
      track.x = gsap.utils.wrap(-track.half, 0, track.x + track.dir * speed * pace.scale * (delta / 1000))
      gsap.set(track.row, { x: track.x })
    })
  }
  gsap.ticker.add(render)

  const slow = () => !reduceMotion && gsap.to(pace, { scale: 0.25, duration: 0.6 })
  const resume = () => !reduceMotion && gsap.to(pace, { scale: 1, duration: 0.6 })
  stage.addEventListener('pointerenter', slow)
  stage.addEventListener('pointerleave', resume)

  return {
    destroy() {
      gsap.ticker.remove(render)
      gsap.killTweensOf(pace)
      observer.disconnect()
      stage.removeEventListener('pointerenter', slow)
      stage.removeEventListener('pointerleave', resume)
      plane.remove()
      stage.classList.remove('ticker-stage')
    },
  }
}
