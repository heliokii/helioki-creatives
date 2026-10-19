// Original concept: a wedding RSVP that lives in a sealed envelope.

import { gsap } from 'gsap'
import { Physics2DPlugin } from 'gsap/Physics2DPlugin'

gsap.registerPlugin(Physics2DPlugin)

export const params = [
  { id: 'petals', label: 'Petals', min: 0, max: 60, step: 1, default: 24 },
  { id: 'speed', label: 'Speed', min: 0.5, max: 2, step: 0.1, default: 1 },
  { id: 'wobble', label: 'Paper wobble', min: 0.5, max: 2, step: 0.1, default: 1 },
]

export const monogram = (a, b) => `${a[0]}&${b[0]}`
export const guestLabel = (n) => (n === 1 ? '1 guest' : `${n} guests`)

// One semi-implicit Euler step of a damped spring: stiffness k, damping c.
export function springStep(s, target, k, c, dt) {
  s.v += ((target - s.x) * k - s.v * c) * dt
  s.x += s.v * dt
  return s
}

const W = 560
const H = 420
const ENV = { left: 110, top: 150, width: 340, height: 224, flap: 140 }
const CARD = { left: 40 - ENV.left, top: 54 - ENV.top, width: 480, height: 312 }
const SEAL = 58
const DROP = 320
const COUPLE = ['Amara', 'Julian']
const MAX_GUESTS = 4

// Paper positions in screen space, relative to the reading position.
const IN_ENVELOPE = { y: 52, scale: 0.66 }
const PULLED = { y: -98, scale: 0.66 }

// Palette fallbacks; set any --hc-* custom property to re-theme.
const HC = {
  bg: '#0b0b0b', 'surface-2': '#1c1c1c', soft: '#b3b3b3', muted: '#8a8a8a', faint: '#5a5a5a',
  accent: '#9aa27c', 'accent-light': '#c5cc9f', 'accent-deep': '#6b7350', 'accent-dark': '#3c4230', cream: '#e9e5d6', warm: '#e9a14a',
}
const c = (name) => `var(--hc-${name}, ${HC[name]})`
const PETALS = ['accent-light', 'cream', 'warm', 'accent'].map(c)
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.09 0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23g)'/%3E%3C/svg%3E")`
const svgUrl = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
// Long, faint fibers on top of the fine grain: together they read as uncoated paper stock.
const FIBERS = svgUrl("<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='0.012 0.35' numOctaves='3' seed='7'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.07 0'/></filter><rect width='300' height='300' filter='url(#f)'/></svg>")
const PAPER = `${FIBERS}, ${GRAIN}`
// A torn (deckled) card edge: a rectangle roughened by displacement, used as the card's mask.
const DECKLE = svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${CARD.width} ${CARD.height}' preserveAspectRatio='none'><filter id='d' x='-5%' y='-5%' width='110%' height='110%'><feTurbulence type='fractalNoise' baseFrequency='0.08' numOctaves='3' seed='3'/><feDisplacementMap in='SourceGraphic' scale='7'/></filter><rect x='5' y='5' width='${CARD.width - 10}' height='${CARD.height - 10}' rx='3' filter='url(#d)'/></svg>`)
const LINER = `${c('accent-deep')} repeating-linear-gradient(45deg, rgb(255 255 255 / 0.07) 0 6px, transparent 6px 12px)`
const SANS = 'Inter, ui-sans-serif, system-ui, sans-serif'
const TRIANGLE = 'polygon(0 0, 100% 0, 50% 100%)'

const CSS = `
.wr-stage { position: relative; width: 100%; height: 100%; overflow: hidden; background: ${c('bg')}; }
.wr-root { position: absolute; left: 50%; top: 50%; width: ${W}px; height: ${H}px; margin: ${-H / 2}px 0 0 ${-W / 2}px; transform: scale(var(--s, 1)); font-family: ${SANS}; }
.wr-ground { position: absolute; left: ${ENV.left + 15}px; top: ${ENV.top + ENV.height - 14}px; width: ${ENV.width - 30}px; height: 30px; border-radius: 50%; background: radial-gradient(closest-side, rgb(0 0 0 / 0.75), transparent); filter: blur(6px); pointer-events: none; }
.wr-env { position: absolute; left: ${ENV.left}px; top: ${ENV.top}px; width: ${ENV.width}px; height: ${ENV.height}px; }
.wr-body { position: absolute; inset: 0; }
.wr-part { position: absolute; inset: 0; border-radius: 8px; }
.wr-back { z-index: 0; overflow: hidden; background: ${PAPER}, color-mix(in srgb, ${c('cream')} 78%, ${c('accent-dark')}); box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.06); }
.wr-liner { position: absolute; left: 10px; right: 10px; top: 0; height: ${ENV.flap - 16}px; clip-path: ${TRIANGLE}; background: ${LINER}; }
.wr-card { position: absolute; left: ${CARD.left}px; top: ${CARD.top}px; z-index: 2; width: ${CARD.width}px; height: ${CARD.height}px; filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.3)) drop-shadow(0 14px 18px rgb(0 0 0 / 0.35)); }
.wr-paper { position: absolute; inset: 0; box-sizing: border-box; padding: 30px 36px; background: ${PAPER}, ${c('cream')}; color: ${c('accent-dark')}; text-align: center; font-family: Georgia, "Times New Roman", serif; text-shadow: 0 1px 0 rgb(255 255 255 / 0.55); cursor: grab; touch-action: none; -webkit-mask: ${DECKLE} center / 100% 100% no-repeat; mask: ${DECKLE} center / 100% 100% no-repeat; --gx: 50%; --gy: 30%; }
.wr-curl { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(180deg, rgb(0 0 0 / var(--td, 0)), transparent 45%), linear-gradient(180deg, rgb(255 255 255 / var(--tl, 0)), transparent 45%), linear-gradient(0deg, rgb(0 0 0 / var(--bd, 0)), transparent 45%), linear-gradient(0deg, rgb(255 255 255 / var(--bl, 0)), transparent 45%); }
.wr-paper:active { cursor: grabbing; }
.wr-paper::before { content: ""; position: absolute; inset: 10px; border: 1px solid color-mix(in srgb, ${c('accent-deep')} 55%, transparent); border-radius: 3px; pointer-events: none; }
.wr-paper::after { content: ""; position: absolute; inset: 0; border-radius: inherit; background: radial-gradient(circle at var(--gx) var(--gy), rgb(255 255 255 / 0.5), transparent 55%); mix-blend-mode: soft-light; pointer-events: none; }
.wr-pocket { z-index: 3; overflow: hidden; }
.wr-fold { position: absolute; inset: 0; }
.wr-fold i { position: absolute; inset: 0; }
.wr-fold-l { filter: drop-shadow(1px 0 1.5px rgb(0 0 0 / 0.16)); }
.wr-fold-l i { clip-path: polygon(0 0, 52% 54%, 0 100%); background: ${PAPER}, linear-gradient(100deg, ${c('cream')}, color-mix(in srgb, ${c('cream')} 88%, ${c('accent-dark')})); }
.wr-fold-r { filter: drop-shadow(-1px 0 1.5px rgb(0 0 0 / 0.16)); }
.wr-fold-r i { clip-path: polygon(100% 0, 48% 54%, 100% 100%); background: ${PAPER}, linear-gradient(260deg, ${c('cream')}, color-mix(in srgb, ${c('cream')} 88%, ${c('accent-dark')})); }
.wr-fold-b { filter: drop-shadow(0 -1px 1.5px rgb(0 0 0 / 0.2)); }
.wr-fold-b i { clip-path: polygon(0 100%, 50% 46%, 100% 100%); background: ${PAPER}, linear-gradient(0deg, color-mix(in srgb, ${c('cream')} 90%, ${c('accent-dark')}), ${c('cream')}); }
.wr-shade { position: absolute; left: 0; top: 0; z-index: 3; width: ${ENV.width}px; height: ${ENV.flap}px; filter: blur(4px); pointer-events: none; }
.wr-shade i { position: absolute; inset: 0; clip-path: ${TRIANGLE}; background: rgb(0 0 0 / 0.3); }
.wr-flap { position: absolute; left: 0; top: 0; z-index: 4; width: ${ENV.width}px; height: ${ENV.flap}px; clip-path: ${TRIANGLE}; background: ${PAPER}, linear-gradient(180deg, color-mix(in srgb, ${c('cream')} 94%, ${c('accent-dark')}), color-mix(in srgb, ${c('cream')} 82%, ${c('accent-dark')})); }
.wr-flap.is-open { background: ${LINER}; }
.wr-seal { position: absolute; left: ${ENV.width / 2 - SEAL / 2}px; top: ${ENV.flap - SEAL / 2}px; z-index: 6; width: ${SEAL}px; height: ${SEAL}px; padding: 0; border: 0; border-radius: 50%; background: none; cursor: pointer; filter: drop-shadow(0 4px 6px rgb(0 0 0 / 0.45)); }
.wr-seal:focus-visible { outline: 2px solid ${c('accent')}; outline-offset: 4px; }
.wr-seal:hover .wr-half { filter: brightness(1.08); }
.wr-half { position: absolute; inset: 0; display: grid; place-items: center; border-radius: 47% 53% 50% 50% / 52% 48% 52% 48%; background: radial-gradient(circle at 35% 30%, color-mix(in srgb, ${c('warm')} 60%, ${c('cream')}), ${c('warm')} 45%, color-mix(in srgb, ${c('warm')} 55%, ${c('bg')})); box-shadow: inset 0 2px 3px rgb(255 255 255 / 0.35), inset 0 -3px 6px rgb(0 0 0 / 0.35); font: italic 600 17px/1 Georgia, "Times New Roman", serif; color: color-mix(in srgb, ${c('warm')} 45%, ${c('bg')}); text-shadow: 0 1px 0 rgb(255 255 255 / 0.35); }
.wr-half-l { clip-path: inset(0 50% 0 0); }
.wr-half-r { clip-path: inset(0 0 0 50%); }
.is-declined .wr-half { background: radial-gradient(circle at 35% 30%, ${c('soft')}, ${c('muted')} 50%, ${c('faint')}); color: ${c('surface-2')}; }
.wr-crumb { position: absolute; left: ${ENV.width / 2 - 3}px; top: ${ENV.flap - 3}px; z-index: 7; width: 6px; height: 5px; border-radius: 40% 60% 50% 45%; background: color-mix(in srgb, ${c('warm')} 80%, ${c('bg')}); pointer-events: none; }
.wr-ring { position: absolute; left: ${ENV.width / 2 - SEAL / 2}px; top: ${ENV.flap - SEAL / 2}px; z-index: 5; width: ${SEAL}px; height: ${SEAL}px; box-sizing: border-box; border: 2px solid ${c('warm')}; border-radius: 50%; pointer-events: none; visibility: hidden; }
.is-declined .wr-ring { border-color: ${c('muted')}; }
.wr-hint { position: absolute; left: 0; right: 0; top: 392px; margin: 0; font-size: 12px; text-align: center; color: ${c('muted')}; }
.wr-hint b { font-weight: 600; color: ${c('accent-light')}; }
.wr-kicker { margin: 0; font: 10px/1.4 ${SANS}; letter-spacing: 0.2em; text-transform: uppercase; color: ${c('accent-deep')}; }
.wr-names { margin: 10px 0 6px; font-size: 38px; font-style: italic; font-weight: 400; line-height: 1.05; text-shadow: 0 1px 0 rgb(255 255 255 / 0.6), 0 -1px 0 rgb(0 0 0 / 0.12); }
.wr-names span { font-size: 0.75em; color: ${c('warm')}; }
.wr-when, .wr-where { margin: 2px 0; font-size: 13px; }
.wr-where { color: ${c('accent-deep')}; }
.wr-form { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-top: 18px; font-family: ${SANS}; text-shadow: none; }
.wr-choices { display: flex; gap: 8px; margin: 0; padding: 0; border: 0; }
.wr-choice { position: relative; cursor: pointer; }
.wr-choice input { position: absolute; inset: 0; margin: 0; opacity: 0; cursor: pointer; }
.wr-choice span { display: block; padding: 8px 15px; border-radius: 999px; border: 1px solid color-mix(in srgb, ${c('accent-deep')} 50%, transparent); font-size: 12px; transition: background 0.2s, color 0.2s; }
.wr-choice input:checked + span { background: ${c('accent-dark')}; border-color: ${c('accent-dark')}; color: ${c('cream')}; }
.wr-choice input:focus-visible + span, .wr-step:focus-visible, .wr-send:focus-visible { outline: 2px solid ${c('accent-deep')}; outline-offset: 2px; }
.wr-row { display: flex; align-items: center; gap: 16px; }
.wr-guests { display: flex; align-items: center; gap: 6px; font-size: 12px; color: ${c('accent-deep')}; }
.wr-form[data-choice="no"] .wr-guests { visibility: hidden; }
.wr-step { width: 24px; height: 24px; padding: 0; border-radius: 50%; border: 1px solid color-mix(in srgb, ${c('accent-deep')} 50%, transparent); background: none; color: ${c('accent-dark')}; font-size: 14px; line-height: 1; cursor: pointer; }
.wr-step:disabled { opacity: 0.35; cursor: default; }
.wr-guests output { min-width: 14px; font-weight: 600; color: ${c('accent-dark')}; }
.wr-send { height: 32px; padding: 0 18px; border: 0; border-radius: 999px; background: ${c('warm')}; color: ${c('bg')}; font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
.wr-send:disabled { opacity: 0.4; cursor: default; }
.wr-reply { position: absolute; left: 0; right: 0; bottom: 58px; margin: 0; font-size: 17px; font-style: italic; visibility: hidden; }
.wr-petal { position: absolute; left: 0; top: 0; z-index: 10; width: 10px; height: 14px; border-radius: 0 80% 0 80%; pointer-events: none; }
.wr-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
`

const html = (name) => {
  const mono = monogram(...COUPLE)
  return `
<div class="wr-ground"></div>
<div class="wr-env"><div class="wr-body">
  <div class="wr-part wr-back"><div class="wr-liner"></div></div>
  <article class="wr-card" aria-label="Wedding invitation"><div class="wr-paper">
    <i class="wr-curl" aria-hidden="true"></i>
    <p class="wr-kicker">Together with their families</p>
    <h3 class="wr-names">${COUPLE[0]} <span>&amp;</span> ${COUPLE[1]}</h3>
    <p class="wr-when">Saturday, the fourteenth of June · four in the afternoon</p>
    <p class="wr-where">The Glasshouse, Hollow Lane</p>
    <form class="wr-form">
      <fieldset class="wr-choices"><legend class="wr-sr">Your reply</legend>
        <label class="wr-choice"><input type="radio" name="${name}" value="yes"><span>Joyfully accepts</span></label>
        <label class="wr-choice"><input type="radio" name="${name}" value="no"><span>Regretfully declines</span></label>
      </fieldset>
      <div class="wr-row">
        <div class="wr-guests"><span>Guests</span><button type="button" class="wr-step" data-d="-1" aria-label="Fewer guests">−</button><output aria-live="polite">2</output><button type="button" class="wr-step" data-d="1" aria-label="More guests">+</button></div>
        <button class="wr-send" disabled>Send reply</button>
      </div>
    </form>
    <p class="wr-reply" aria-live="polite"></p>
  </div></article>
  <div class="wr-part wr-pocket"><div class="wr-fold wr-fold-l"><i></i></div><div class="wr-fold wr-fold-r"><i></i></div><div class="wr-fold wr-fold-b"><i></i></div></div>
  <div class="wr-shade"><i></i></div>
  <div class="wr-flap"></div>
  <i class="wr-ring"></i>
  <button type="button" class="wr-seal" aria-label="Open the invitation"><i class="wr-half wr-half-l">${mono}</i><i class="wr-half wr-half-r">${mono}</i></button>
</div></div>
<p class="wr-hint" aria-live="polite">Tap the seal to open</p>`
}

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

const clamp = (v, max) => Math.max(-max, Math.min(max, v))
const spring = () => ({ x: 0, v: 0 })
const RAD = Math.PI / 180
let uid = 0

export function mount(stage, { petals = 24, speed = 1, wobble = 1, preview = false }) {
  injectCSS('wedding-rsvp-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  stage.classList.add('wr-stage')
  const root = document.createElement('div')
  root.className = 'wr-root'
  root.innerHTML = html(`wr-reply-${++uid}`)
  stage.append(root)

  let scale = 1
  const resize = () => {
    scale = Math.min(stage.clientWidth / W, stage.clientHeight / H)
    root.style.setProperty('--s', scale)
  }
  const observer = new ResizeObserver(resize)
  observer.observe(stage)

  const $ = (sel) => root.querySelector(sel)
  const ground = $('.wr-ground')
  const envEl = $('.wr-env')
  const body = $('.wr-body')
  const cardEl = $('.wr-card')
  const paperEl = $('.wr-paper')
  const flapEl = $('.wr-flap')
  const shade = $('.wr-shade')
  const seal = $('.wr-seal')
  const halves = [...root.querySelectorAll('.wr-half')]
  const ring = $('.wr-ring')
  const hint = $('.wr-hint')
  const form = $('.wr-form')
  const reply = $('.wr-reply')
  const send = $('.wr-send')
  const out = $('.wr-guests output')
  const steps = [...root.querySelectorAll('.wr-step')]
  const radios = [...root.querySelectorAll('input[type="radio"]')]

  gsap.set(body, { transformPerspective: 1000 })
  gsap.set(flapEl, { transformPerspective: 900, transformOrigin: '50% 0%' })
  gsap.set(paperEl, { transformPerspective: 800 })

  // Timelines tween these plain values; the render step turns them into transforms.
  const paper = { ...IN_ENVELOPE }
  const env = { y: 0 }
  const flap = { a: 0 }

  // Secondary motion: damped springs advanced every frame.
  const bodyS = { y: spring(), rx: spring(), ry: spring(), rz: spring() }
  const tilt = { rx: spring(), ry: spring(), rz: spring() }
  const drag = { x: spring(), y: spring() }
  const vel = { x: 0, y: 0 }
  const last = { x: 0, y: paper.y }
  const pointer = { nx: 0, ny: 0, over: false }
  let grabbing = null

  let phase = 'sealed'
  let seq
  let pending
  let choice = null
  let guests = 2
  let loops = 0

  const render = (time, deltaMs) => {
    const dt = Math.min(deltaMs / 1000, 1 / 30) || 1 / 60
    const idle = phase === 'sealed' || phase === 'replied'
    const reading = phase === 'open'
    if (!reduceMotion) {
      const hover = idle && pointer.over
      springStep(bodyS.y, (idle ? Math.sin(time * 1.6) * 3 : 0) - (hover ? 6 : 0), 90, 12, dt)
      springStep(bodyS.rx, hover ? -pointer.ny * 8 : 0, 70, 10, dt)
      springStep(bodyS.ry, hover ? pointer.nx * 8 : 0, 70, 10, dt)
      springStep(bodyS.rz, idle ? Math.sin(time * 1.1) * 0.5 : 0, 60, 9, dt)
      if (!grabbing) {
        springStep(drag.x, 0, 70 * wobble, 7, dt)
        springStep(drag.y, 0, 70 * wobble, 7, dt)
      }
      // The paper leans against its own motion and wobbles back to flat.
      const sx = drag.x.x
      const sy = paper.y + drag.y.x
      vel.x += ((sx - last.x) / dt - vel.x) * 0.3
      vel.y += ((sy - last.y) / dt - vel.y) * 0.3
      last.x = sx
      last.y = sy
      const look = reading && pointer.over
      springStep(tilt.rx, clamp(-vel.y * 0.025, 18) + (look ? -pointer.ny * 6 : 0), 140 * wobble, 9, dt)
      springStep(tilt.ry, look ? pointer.nx * 6 : 0, 140 * wobble, 9, dt)
      springStep(tilt.rz, clamp(vel.x * 0.02, 10), 140 * wobble, 9, dt)
    }

    const lift = -bodyS.y.x
    gsap.set(envEl, { y: env.y })
    gsap.set(body, { y: bodyS.y.x, rotationX: bodyS.rx.x, rotationY: bodyS.ry.x, rotation: bodyS.rz.x })
    gsap.set(ground, { y: env.y, scaleX: 1 + lift * 0.012, opacity: Math.max(0, (0.8 - lift * 0.03) * (1 - env.y / DROP)) })

    const outOfPocket = paper.y < PULLED.y + 10 || env.y > 20
    gsap.set(cardEl, { x: drag.x.x, y: paper.y - env.y + drag.y.x, scale: paper.scale, zIndex: outOfPocket ? 5 : 2 })
    gsap.set(paperEl, { rotationX: tilt.rx.x, rotationY: tilt.ry.x, rotation: tilt.rz.x })
    paperEl.style.setProperty('--gx', `${50 - tilt.ry.x * 4}%`)
    paperEl.style.setProperty('--gy', `${30 + tilt.rx.x * 3}%`)
    // Bend light: the edge tipping away darkens, the edge tipping toward you catches light.
    const bend = Math.max(-1, Math.min(1, tilt.rx.x / 18))
    paperEl.style.setProperty('--td', Math.max(0, bend) * 0.16)
    paperEl.style.setProperty('--bl', Math.max(0, bend) * 0.2)
    paperEl.style.setProperty('--bd', Math.max(0, -bend) * 0.16)
    paperEl.style.setProperty('--tl', Math.max(0, -bend) * 0.2)

    // The flap darkens as it turns edge-on and stops shading the pocket once it is past vertical.
    const open = flap.a > 90
    flapEl.classList.toggle('is-open', open)
    // Paper flexes a little mid-swing instead of turning like a rigid plate.
    gsap.set(flapEl, { rotationX: flap.a, scaleY: 1 - 0.05 * Math.abs(Math.sin(flap.a * RAD)), zIndex: open ? 1 : 4, filter: `brightness(${1 - 0.3 * Math.abs(Math.sin(flap.a * RAD))})` })
    gsap.set(shade, { opacity: Math.max(0, Math.cos(flap.a * RAD)), y: 4 + Math.sin(flap.a * RAD) * 10 })
  }
  gsap.ticker.add(render)

  const kick = (vy, vrz) => {
    bodyS.y.v += vy
    bodyS.rz.v += vrz
  }
  const later = (seconds, fn) => { pending = gsap.delayedCall(seconds, fn) }
  const focus = (el) => !preview && el.focus({ preventScroll: true })
  // Reduced motion: every sequence jumps straight to its end state.
  const play = (tl) => {
    tl.timeScale(speed)
    if (reduceMotion) tl.progress(1)
    return tl
  }

  const setGuests = (n) => {
    guests = Math.max(1, Math.min(MAX_GUESTS, n))
    out.value = guests
    steps[0].disabled = guests === 1
    steps[1].disabled = guests === MAX_GUESTS
  }
  const setChoice = (value) => {
    choice = value
    form.dataset.choice = value
    send.disabled = false
    radios.forEach((r) => { r.checked = r.value === value })
  }
  const resetCard = () => {
    choice = null
    delete form.dataset.choice
    radios.forEach((r) => { r.checked = false })
    send.disabled = true
    setGuests(2)
    gsap.set(form, { autoAlpha: 1, y: 0 })
    gsap.set(reply, { autoAlpha: 0 })
  }
  setGuests(2)

  // Seal halves fly off on ballistic arcs and a few wax crumbs scatter.
  const crack = () => {
    if (reduceMotion) { gsap.set(halves, { autoAlpha: 0 }); return }
    halves.forEach((half, i) => {
      const dir = i ? 1 : -1
      gsap.to(half, { physics2D: { velocity: gsap.utils.random(240, 300), angle: dir > 0 ? -65 : -115, gravity: 1400 }, rotation: dir * gsap.utils.random(180, 300), duration: 0.9 })
      gsap.to(half, { autoAlpha: 0, duration: 0.25, delay: 0.65 })
    })
    for (let i = 0; i < 8; i++) {
      const crumb = document.createElement('i')
      crumb.className = 'wr-crumb'
      body.append(crumb)
      gsap.to(crumb, { physics2D: { velocity: gsap.utils.random(120, 260), angle: gsap.utils.random(-160, -20), gravity: 1300 }, rotation: gsap.utils.random(-360, 360), duration: 0.8, onComplete: () => crumb.remove() })
      gsap.to(crumb, { opacity: 0, duration: 0.2, delay: 0.6 })
    }
  }

  // Petals burst out of the envelope mouth, tumble in 3D and drift down against air drag.
  const bloom = () => {
    if (reduceMotion) return
    for (let i = 0; i < petals; i++) {
      const petal = document.createElement('i')
      petal.className = 'wr-petal'
      petal.style.background = gsap.utils.random(PETALS)
      root.append(petal)
      const life = gsap.utils.random(2.6, 3.8)
      gsap.set(petal, { x: W / 2 + gsap.utils.random(-50, 50), y: ENV.top + 20, scale: gsap.utils.random(0.7, 1.2), transformPerspective: 400 })
      gsap.to(petal, { physics2D: { velocity: gsap.utils.random(300, 520), angle: gsap.utils.random(-120, -60), gravity: 260, friction: 0.02 }, duration: life, ease: 'none', onComplete: () => petal.remove() })
      gsap.to(petal, { rotationX: gsap.utils.random(-360, 360), rotationY: gsap.utils.random(-360, 360), rotation: gsap.utils.random(-180, 180), duration: life, ease: 'none' })
      gsap.to(petal, { opacity: 0, duration: 0.5, delay: life - 0.5 })
    }
  }

  // Crack the seal, flop the flap open, tug the card loose, then let the envelope fall away.
  const open = () => {
    if (phase !== 'sealed' && phase !== 'replied') return
    phase = 'opening'
    resetCard()
    hint.textContent = 'Choose your reply'
    seq = play(gsap.timeline({
      onComplete: () => {
        phase = 'open'
        focus(radios[0])
        if (preview) later(1.1, demoReply)
      },
    })
      .to(seal, { scale: 1.1, duration: 0.1 })
      .add(crack)
      .set(seal, { autoAlpha: 0, scale: 1 }, 1)
      .to(flap, { a: 100, duration: 0.35, ease: 'power2.in' }, 0.25)
      .to(flap, { a: 180, duration: 0.6, ease: 'back.out(2.2)' }, '>')
      .to(paper, { y: IN_ENVELOPE.y - 8, duration: 0.16, ease: 'power2.out' }, '-=0.3')
      .to(paper, { y: IN_ENVELOPE.y - 4, duration: 0.12, ease: 'power1.inOut' })
      .to(paper, { y: PULLED.y, duration: 0.7, ease: 'power3.out' })
      .to(env, { y: DROP, duration: 0.7, ease: 'power2.in' }, '+=0.05')
      .to(paper, { y: 0, scale: 1, duration: 0.8, ease: 'power3.inOut' }, '<')
      .fromTo(form.children, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.08 }))
  }

  // Show the reply, slide the card home, let the flap fall shut and stamp a fresh seal.
  const submit = (e) => {
    e?.preventDefault()
    if (phase !== 'open' || !choice) return
    phase = 'sending'
    grabbing = null
    const yes = choice === 'yes'
    reply.textContent = yes ? `Can't wait · ${guestLabel(guests)}` : "We'll miss you. Thank you for letting us know."
    seq = play(gsap.timeline({
      onComplete: () => {
        phase = 'replied'
        seal.setAttribute('aria-label', 'Open the invitation to change your reply')
        focus(seal)
        if (preview) later(2.6, open)
      },
    })
      .to(form, { autoAlpha: 0, y: -6, duration: 0.25 })
      .fromTo(reply, { autoAlpha: 0, y: 8, filter: 'blur(4px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.45 })
      .to(env, { y: 0, duration: 0.6, ease: 'power3.out' }, '+=0.9')
      .to(paper, { ...PULLED, duration: 0.6, ease: 'power3.inOut' }, '<')
      .to(paper, { y: IN_ENVELOPE.y, duration: 0.45, ease: 'power2.in' })
      .add(() => kick(90, gsap.utils.random(-20, 20)))
      .to(flap, { a: 0, duration: 0.5, ease: 'power2.in' }, '+=0.05')
      .to(flap, { a: 8, duration: 0.09, ease: 'power1.out' })
      .to(flap, { a: 0, duration: 0.12, ease: 'power1.in' })
      .add(() => {
        kick(40, 0)
        root.classList.toggle('is-declined', !yes)
        gsap.set(halves, { x: 0, y: 0, rotation: 0, autoAlpha: 1 })
      })
      .fromTo(seal, { autoAlpha: 0, scale: 1.8 }, { autoAlpha: 1, scale: 1, duration: 0.32, ease: 'power4.in', immediateRender: false })
      .add(() => kick(120, 0))
      .to(seal, { scaleX: 1.15, scaleY: 0.85, duration: 0.07 })
      .to(seal, { scaleX: 1, scaleY: 1, duration: 0.6, ease: 'elastic.out(1, 0.35)' })
      .fromTo(ring, { autoAlpha: 0.8, scale: 0.7 }, { autoAlpha: 0, scale: 2.2, duration: 0.6, ease: 'power2.out', immediateRender: false }, '<')
      .add(() => {
        hint.innerHTML = yes ? `<b>Accepted</b> · ${guestLabel(guests)}` : 'Declined · tap the seal to change'
        if (yes) bloom()
      }))
  }

  const demoReply = () => {
    const decline = ++loops % 3 === 0
    setChoice(decline ? 'no' : 'yes')
    if (decline) later(0.8, submit)
    else later(0.5, () => { setGuests(guests + 1); later(0.6, submit) })
  }

  // Pointer: tilt the envelope while idle, tilt and toss the paper while reading.
  const onMove = (e) => {
    if (reduceMotion) return
    const box = (phase === 'open' ? paperEl : body).getBoundingClientRect()
    pointer.nx = ((e.clientX - box.left) / box.width) * 2 - 1
    pointer.ny = ((e.clientY - box.top) / box.height) * 2 - 1
    pointer.over = Math.abs(pointer.nx) <= 1.1 && Math.abs(pointer.ny) <= 1.1
    if (!grabbing) return
    const now = performance.now()
    const step = Math.max(1, now - grabbing.t) / 1000
    const x = grabbing.x + (e.clientX - grabbing.cx) / scale
    const y = grabbing.y + (e.clientY - grabbing.cy) / scale
    drag.x.v = (x - drag.x.x) / step
    drag.y.v = (y - drag.y.x) / step
    drag.x.x = x
    drag.y.x = y
    grabbing.t = now
  }
  const onDown = (e) => {
    if (phase !== 'open' || reduceMotion || e.target.closest('input, label, button, output')) return
    grabbing = { cx: e.clientX, cy: e.clientY, x: drag.x.x, y: drag.y.x, t: performance.now() }
    paperEl.setPointerCapture(e.pointerId)
  }
  const onUp = () => { grabbing = null }
  const onLeave = () => { pointer.over = false }
  stage.addEventListener('pointermove', onMove)
  stage.addEventListener('pointerleave', onLeave)
  paperEl.addEventListener('pointerdown', onDown)
  paperEl.addEventListener('pointerup', onUp)
  paperEl.addEventListener('pointercancel', onUp)

  seal.addEventListener('click', open)
  radios.forEach((r) => r.addEventListener('change', () => setChoice(r.value)))
  steps.forEach((b) => b.addEventListener('click', () => setGuests(guests + Number(b.dataset.d))))
  form.addEventListener('submit', submit)
  if (preview) later(1, open)

  return {
    destroy() {
      seq?.kill()
      pending?.kill()
      gsap.ticker.remove(render)
      gsap.killTweensOf([paper, env, flap])
      gsap.killTweensOf(root.querySelectorAll('*'))
      observer.disconnect()
      stage.removeEventListener('pointermove', onMove)
      stage.removeEventListener('pointerleave', onLeave)
      root.remove()
      stage.classList.remove('wr-stage')
    },
  }
}
