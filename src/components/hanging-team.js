// Concept: "Hanging Team component" by Hayriye (via inspora.design). Original implementation.

import { gsap } from 'gsap'

export const params = [
  { id: 'stiffness', label: 'Stiffness', min: 10, max: 120, step: 1, default: 40 },
  { id: 'damping', label: 'Damping', min: 0.5, max: 8, step: 0.1, default: 2.2 },
]

const TEAM = [
  { name: 'Mara Okafor', role: 'Design lead', bio: 'Shapes the visual system and keeps every pixel honest.' },
  { name: 'Theo Lind', role: 'Motion', bio: 'Turns static frames into timing that feels inevitable.' },
  { name: 'Ines Duarte', role: 'Engineering', bio: 'Ships the interactions and guards the frame budget.' },
  { name: 'Kenji Arai', role: 'Research', bio: 'Talks to users and brings back the hard questions.' },
]

const AVATARS = ['var(--hc-accent, #9aa27c)', 'var(--hc-cream, #e9e5d6)', 'var(--hc-warm, #e9a14a)', 'var(--hc-accent-light, #c5cc9f)']

const CSS = `
.hang-stage { position: relative; width: 100%; height: 100%; overflow: hidden; user-select: none; touch-action: none; font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: var(--hc-ink, #f2f2f2); }
.hang-rail { position: absolute; left: 5%; right: 5%; top: 9%; height: 2px; border-radius: 2px; background: var(--hc-line-2, #2f2f2f); }
.hang { position: absolute; top: 9%; width: var(--cw); margin-left: calc(var(--cw) / -2); transform-origin: 50% 0; }
.hang-pin { position: absolute; left: 50%; top: -3px; width: 7px; height: 7px; margin-left: -3.5px; border-radius: 50%; background: var(--hc-muted, #8a8a8a); }
.hang-string { width: 1px; height: var(--sl); margin: 0 auto; background: linear-gradient(var(--hc-faint, #5a5a5a), var(--hc-line-2, #2f2f2f)); }
.hang-card { display: block; width: 100%; height: calc(var(--cw) * 1.32); padding: 0; border: 0; background: none; color: inherit; font-family: inherit; font-size: calc(var(--cw) * 0.095); cursor: grab; perspective: 700px; }
.hang-card:active { cursor: grabbing; }
.hang-card:focus-visible { outline: 2px solid var(--hc-accent, #9aa27c); outline-offset: 4px; border-radius: 14px; }
.hang-flip { position: relative; display: block; width: 100%; height: 100%; transform-style: preserve-3d; }
.hang-face { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.45em; padding: 1em; border-radius: 14px; border: 1px solid var(--hc-line, #262626); background: linear-gradient(160deg, var(--hc-surface-2, #1c1c1c), var(--hc-surface, #141414)); box-shadow: 0 18px 30px -18px var(--hc-bg, #0b0b0b); backface-visibility: hidden; text-align: center; }
.hang-face::before { content: ""; position: absolute; top: 8px; left: 50%; width: 8px; height: 8px; margin-left: -4px; border-radius: 50%; background: var(--hc-bg, #0b0b0b); box-shadow: inset 0 1px 2px var(--hc-bg, #0b0b0b); }
.hang-back { transform: rotateY(180deg); color: var(--hc-soft, #b3b3b3); line-height: 1.45; }
.hang-avatar { display: grid; place-items: center; width: 2.8em; height: 2.8em; border-radius: 50%; font-weight: 600; color: var(--hc-bg, #0b0b0b); }
.hang-name { font-weight: 600; }
.hang-role { color: var(--hc-muted, #8a8a8a); }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

const initials = (name) => name.split(' ').map((w) => w[0]).join('')

export function mount(stage, { stiffness = 40, damping = 2.2, preview = false }) {
  injectCSS('hanging-team-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  stage.classList.add('hang-stage')
  const rail = document.createElement('div')
  rail.className = 'hang-rail'
  stage.append(rail)

  const people = TEAM.map((person, i) => {
    const hang = document.createElement('div')
    hang.className = 'hang'
    hang.style.left = `${((i + 1) / (TEAM.length + 1)) * 100}%`
    hang.innerHTML = `<i class="hang-pin"></i><div class="hang-string"></div>
      <button type="button" class="hang-card" aria-pressed="false" aria-label="${person.name}, ${person.role}. Press to flip.">
        <span class="hang-flip">
          <span class="hang-face"><span class="hang-avatar" style="background: ${AVATARS[i % AVATARS.length]}">${initials(person.name)}</span><span class="hang-name">${person.name}</span><span class="hang-role">${person.role}</span></span>
          <span class="hang-face hang-back">${person.bio}</span>
        </span>
      </button>`
    stage.append(hang)
    return { hang, card: hang.querySelector('.hang-card'), flip: hang.querySelector('.hang-flip'), theta: 0, omega: 0, held: false, flipped: false, dragged: false }
  })

  const resize = () => {
    const w = stage.clientWidth
    const h = stage.clientHeight
    stage.style.setProperty('--cw', `${Math.min(w / (people.length + 1.4), (h * 0.56) / 1.32, 170)}px`)
    stage.style.setProperty('--sl', `${h * 0.16}px`)
  }
  const observer = new ResizeObserver(resize)
  observer.observe(stage)

  // Damped pendulum per card: θ'' = -kθ - cθ'.
  const tick = (time, deltaMs) => {
    const dt = Math.min(deltaMs / 1000, 1 / 30)
    people.forEach((p) => {
      if (!p.held) {
        p.omega += (-stiffness * p.theta - damping * p.omega) * dt
        p.theta += p.omega * dt
      }
      gsap.set(p.hang, { rotation: (p.theta * 180) / Math.PI })
    })
  }
  if (!reduceMotion) gsap.ticker.add(tick)

  const flip = (p) => {
    p.flipped = !p.flipped
    p.card.setAttribute('aria-pressed', String(p.flipped))
    gsap.to(p.flip, { rotationY: p.flipped ? 180 : 0, duration: reduceMotion ? 0 : 0.6, ease: 'power3.inOut' })
    p.omega += 1.5
  }
  people.forEach((p) => p.card.addEventListener('click', () => {
    if (p.dragged) { p.dragged = false; return }
    flip(p)
  }))

  let drag = null
  const onDown = (e) => {
    const p = people.find((x) => x.card.contains(e.target))
    if (!p || reduceMotion) return
    const box = stage.getBoundingClientRect()
    drag = { p, pivotX: box.left + p.hang.offsetLeft + p.hang.offsetWidth / 2, pivotY: box.top + p.hang.offsetTop, x0: e.clientX, y0: e.clientY, moved: false, t: performance.now() }
    p.card.setPointerCapture(e.pointerId)
  }
  const onMove = (e) => {
    if (!drag) {
      // A pointer brushing past nudges the card it crosses.
      const p = people.find((x) => x.card.contains(e.target))
      if (p) p.omega -= e.movementX * 0.015
      return
    }
    if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 4) return
    drag.moved = true
    const { p } = drag
    p.held = true
    const now = performance.now()
    const theta = Math.max(-1.2, Math.min(1.2, -Math.atan2(e.clientX - drag.pivotX, e.clientY - drag.pivotY)))
    p.omega = (theta - p.theta) / Math.max(0.001, (now - drag.t) / 1000)
    p.theta = theta
    drag.t = now
  }
  const onUp = () => {
    if (!drag) return
    const { p, moved } = drag
    p.held = false
    p.dragged = moved
    p.omega = Math.max(-12, Math.min(12, p.omega))
    drag = null
  }
  stage.addEventListener('pointerdown', onDown)
  stage.addEventListener('pointermove', onMove)
  stage.addEventListener('pointerup', onUp)
  stage.addEventListener('pointercancel', onUp)

  let beat = 0
  const demo = preview && !reduceMotion
    ? gsap.delayedCall(1.4, function nudge() {
      const p = people[Math.floor(Math.random() * people.length)]
      p.omega += gsap.utils.random(-3, 3)
      if (++beat % 3 === 0) flip(p)
      demo.restart(true)
    })
    : null

  return {
    destroy() {
      demo?.kill()
      gsap.ticker.remove(tick)
      people.forEach((p) => gsap.killTweensOf([p.hang, p.flip]))
      observer.disconnect()
      stage.removeEventListener('pointerdown', onDown)
      stage.removeEventListener('pointermove', onMove)
      stage.removeEventListener('pointerup', onUp)
      stage.removeEventListener('pointercancel', onUp)
      rail.remove()
      people.forEach((p) => p.hang.remove())
      stage.classList.remove('hang-stage')
    },
  }
}
