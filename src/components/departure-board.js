// Concept: "Airport matrix time" by HASSCO© (via inspora.design). Original implementation.

import { gsap } from 'gsap'

export const params = [
  { id: 'interval', label: 'Update every (s)', min: 1, max: 8, step: 0.5, default: 3 },
  { id: 'frames', label: 'Scramble frames', min: 4, max: 24, step: 1, default: 12 },
]

const W = 600
const H = 320
const PITCH = 4.5

// 5×7 LED digits for the clock.
export const DIGITS = {
  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  3: ['#####', '...#.', '..#..', '...#.', '....#', '#...#', '.###.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
  7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  9: ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
  ':': ['.', '.', '#', '.', '#', '.', '.'],
}

const COLUMNS = [['time', 'Time', 5], ['dest', 'Destination', 10], ['code', 'Flight', 6], ['gate', 'Gate', 3], ['status', 'Status', 9]]
const PLACES = ['Lisbon', 'Reykjavik', 'Kyoto', 'Marrakesh', 'Oslo', 'Lima', 'Seoul', 'Nairobi', 'Hobart', 'Quebec', 'Tbilisi', 'Valparaiso']
const NEXT_STATUS = { 'ON TIME': 'GATE OPEN', 'GATE OPEN': 'BOARDING', BOARDING: 'DEPARTED', DELAYED: 'GATE OPEN', DEPARTED: 'DEPARTED' }
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

const CSS = `
.db-stage { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--hc-bg, #0b0b0b); }
.db-root { position: absolute; left: 50%; top: 50%; width: ${W}px; height: ${H}px; margin: ${-H / 2}px 0 0 ${-W / 2}px; box-sizing: border-box; padding: 26px 22px; transform: scale(var(--s, 1)); font-family: ui-monospace, "JetBrains Mono", monospace; text-align: left; }
.db-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
.db-title { font-size: 14px; font-weight: 600; letter-spacing: 0.24em; text-transform: uppercase; color: var(--hc-warm, #e9a14a); }
.db-th, .db-row { display: flex; gap: 16px; }
.db-th span { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--hc-faint, #5a5a5a); }
.db-row { margin-top: 9px; }
.db-cell { display: flex; gap: 2px; }
.db-cell i { display: grid; place-items: center; width: 13px; height: 22px; border-radius: 2px; background: linear-gradient(var(--hc-surface-2, #1c1c1c) 0 50%, var(--hc-surface, #141414) 50%); box-shadow: inset 0 -1px 0 rgb(255 255 255 / 0.04); font-size: 13px; font-style: normal; font-weight: 600; color: var(--hc-warm, #e9a14a); }
.db-row[data-status="BOARDING"] .db-status i { color: var(--hc-accent-light, #c5cc9f); }
.db-row[data-status="DELAYED"] .db-status i { color: var(--hc-danger, #e07a5f); }
.db-row[data-status="DEPARTED"] i { color: var(--hc-faint, #5a5a5a); }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

// Reads a palette token for canvas drawing; the fallback keeps the module working on its own.
const token = (el, name, fallback) => getComputedStyle(el).getPropertyValue(`--hc-${name}`).trim() || fallback

const pick = (list) => list[Math.floor(Math.random() * list.length)]

export function mount(stage, { interval = 3, frames = 12 }) {
  injectCSS('departure-board-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  stage.classList.add('db-stage')
  const root = document.createElement('div')
  root.className = 'db-root'
  const clockCols = 6 * 5 + 2 + 7
  root.innerHTML = `
    <div class="db-head"><span class="db-title">Departures</span><canvas class="db-clock" width="${clockCols * PITCH * 2}" height="${7 * PITCH * 2}" style="width:${clockCols * PITCH}px;height:${7 * PITCH}px" role="img"></canvas></div>
    <div role="table" aria-label="Departures">
      <div class="db-th" role="row">${COLUMNS.map(([, label, w]) => `<span role="columnheader" style="width:${w * 15 - 2}px">${label}</span>`).join('')}</div>
      <div class="db-rows"></div>
    </div>`
  stage.append(root)

  const resize = () => root.style.setProperty('--s', Math.min(stage.clientWidth / W, stage.clientHeight / H))
  const observer = new ResizeObserver(resize)
  observer.observe(stage)

  let clock = 8 * 60 + 20
  const makeFlight = () => {
    clock += 10 + Math.floor(Math.random() * 25)
    const hh = String(Math.floor(clock / 60) % 24).padStart(2, '0')
    const mm = String(clock % 60).padStart(2, '0')
    return {
      time: `${hh}:${mm}`,
      dest: pick(PLACES),
      code: `${pick(['HK', 'AV', 'NX', 'LR'])} ${100 + Math.floor(Math.random() * 899)}`,
      gate: `${pick(['A', 'B', 'C'])}${1 + Math.floor(Math.random() * 30)}`,
      status: Math.random() < 0.2 ? 'DELAYED' : 'ON TIME',
    }
  }

  const rowsEl = root.querySelector('.db-rows')
  const rows = Array.from({ length: 5 }, () => {
    const el = document.createElement('div')
    el.className = 'db-row'
    el.setAttribute('role', 'row')
    const cells = {}
    for (const [key, , width] of COLUMNS) {
      const cell = document.createElement('span')
      cell.className = `db-cell db-${key}`
      cell.setAttribute('role', 'cell')
      const tiles = Array.from({ length: width }, () => document.createElement('i'))
      tiles.forEach((tile) => tile.setAttribute('aria-hidden', 'true'))
      cell.append(...tiles)
      el.append(cell)
      cells[key] = { cell, tiles }
    }
    rowsEl.append(el)
    return { el, cells }
  })

  // Each changed tile flickers through random characters for a few frames before landing.
  const jobs = new Map()
  const setText = ({ cell, tiles }, text) => {
    const target = text.toUpperCase().padEnd(tiles.length).slice(0, tiles.length)
    cell.setAttribute('aria-label', text)
    tiles.forEach((tile, i) => {
      if (tile.textContent === target[i] && !jobs.has(tile)) return
      if (reduceMotion) { tile.textContent = target[i]; return }
      jobs.set(tile, { to: target[i], left: Math.round(frames * (0.5 + Math.random() * 0.5)) + i })
    })
  }
  const show = (row, flight) => {
    row.flight = flight
    for (const [key] of COLUMNS) setText(row.cells[key], flight[key])
    row.el.dataset.status = flight.status
  }
  let flights = Array.from({ length: rows.length }, makeFlight)
  rows.forEach((row, i) => show(row, flights[i]))

  const ctx = root.querySelector('.db-clock').getContext('2d')
  ctx.setTransform(2, 0, 0, 2, 0, 0)
  const led = token(stage, 'warm', '#e9a14a')
  let shown = ''
  const drawClock = () => {
    const now = new Date().toTimeString().slice(0, 8)
    if (now === shown) return
    shown = now
    ctx.canvas.setAttribute('aria-label', `Time ${now.slice(0, 5)}`)
    ctx.clearRect(0, 0, clockCols * PITCH, 7 * PITCH)
    ctx.fillStyle = led
    const lit = new Set()
    let col = 0
    for (const ch of now) {
      const glyph = DIGITS[ch]
      glyph.forEach((line, r) => [...line].forEach((px, c) => { if (px === '#') lit.add(`${col + c},${r}`) }))
      col += glyph[0].length + 1
    }
    for (let c = 0; c < clockCols; c++) {
      for (let r = 0; r < 7; r++) {
        ctx.globalAlpha = lit.has(`${c},${r}`) ? 1 : 0.14
        ctx.beginPath()
        ctx.arc(c * PITCH + PITCH / 2, r * PITCH + PITCH / 2, PITCH * 0.38, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  }

  let acc = 0
  const tick = (time, delta) => {
    acc += delta
    if (acc < 33) return
    acc = 0
    for (const [tile, job] of jobs) {
      if (job.left-- > 0) tile.textContent = CHARSET[Math.floor(Math.random() * CHARSET.length)]
      else { tile.textContent = job.to; jobs.delete(tile) }
    }
    drawClock()
  }
  gsap.ticker.add(tick)
  drawClock()

  // Every third update the board rolls: the top flight leaves and a new one joins at the bottom.
  let beat = 0
  const loop = gsap.delayedCall(interval, () => {
    if (++beat % 3 === 0) {
      flights = [...flights.slice(1), makeFlight()]
      rows.forEach((row, i) => show(row, flights[i]))
    } else {
      const row = pick(rows)
      show(row, { ...row.flight, status: NEXT_STATUS[row.flight.status] })
    }
    loop.restart(true)
  })

  return {
    destroy() {
      loop.kill()
      gsap.ticker.remove(tick)
      observer.disconnect()
      root.remove()
      stage.classList.remove('db-stage')
    },
  }
}
