// Concept: a sticker dog in a "Nacs" cap that watches your cursor. Pass your own pose images with `poses`.

import { gsap } from 'gsap'

export const params = [
  { id: 'turn', label: 'Head tilt (°)', min: 0, max: 12, step: 1, default: 6 },
  { id: 'deadZone', label: 'Dead zone (%)', min: 5, max: 40, step: 1, default: 18 },
]

export const POSE_NAMES = ['front', 'happy', 'up', 'down', 'down-right', 'left', 'right', 'up-left', 'up-right', 'back']
const DEFAULT_POSES = Object.fromEntries(POSE_NAMES.map((name) => [name, new URL(`../assets/dog/${name}.webp`, import.meta.url).href]))

// Pose for a cursor offset (screen px, y down): 8 sectors of 45° around the head, `front` inside the dead zone.
// The sheets have no down-left pose, so that sector shares `left`.
const SECTORS = ['left', 'up-left', 'up', 'up-right', 'right', 'down-right', 'down', 'left', 'left']
export function poseFor(dx, dy, deadZone) {
  if (Math.hypot(dx, dy) < deadZone) return 'front'
  return SECTORS[Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 4]
}

const IDLE_DEMO_MS = 2000
const IDLE_TURN_MS = 4000
const SWITCH_HOLD_MS = 60

const CSS = `
.dog-stage { position: relative; width: 100%; height: 100%; overflow: hidden; display: grid; place-items: center; background: radial-gradient(60% 55% at 50% 62%, var(--hc-surface-2, #1c1c1c), var(--hc-bg, #0b0b0b)); }
.dog-root { position: relative; width: var(--w, 260px); height: var(--h, 300px); }
.dog-shadow { position: absolute; left: 14%; right: 14%; bottom: -5%; height: 10%; border-radius: 50%; background: radial-gradient(closest-side, rgb(0 0 0 / 0.75), transparent); filter: blur(5px); }
.dog-btn { position: absolute; inset: 0; padding: 0; border: 0; border-radius: 28px; background: none; cursor: pointer; }
.dog-btn:focus-visible { outline: 2px solid var(--hc-accent, #9aa27c); outline-offset: 8px; }
.dog-head, .dog-face { position: absolute; inset: 0; display: block; }
.dog-face { transform-origin: 50% 100%; filter: drop-shadow(0 12px 18px rgb(0 0 0 / 0.45)); }
.dog-pose { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; object-position: 50% 100%; opacity: 0; pointer-events: none; user-select: none; }
.dog-heart { position: absolute; left: 50%; top: 6%; font-size: 22px; line-height: 1; pointer-events: none; }
.dog-cursor { position: absolute; left: 0; top: 0; width: 14px; height: 14px; margin: -7px; border-radius: 50%; background: var(--hc-accent, #9aa27c); box-shadow: 0 0 0 6px rgb(154 162 124 / 0.2); pointer-events: none; visibility: hidden; }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
const clamp = (v, max) => Math.max(-max, Math.min(max, v))
const springStep = (s, target, k, c, dt) => {
  s.v += ((target - s.x) * k - s.v * c) * dt
  s.x += s.v * dt
}

export function mount(stage, { turn = 6, deadZone = 18, poses = DEFAULT_POSES, preview = false }) {
  injectCSS('cursor-dog-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  stage.classList.add('dog-stage')
  stage.insertAdjacentHTML('beforeend', `
    <div class="dog-root">
      <div class="dog-shadow"></div>
      <button type="button" class="dog-btn" aria-label="Pet the dog">
        <span class="dog-head"><span class="dog-face" role="img" aria-label="A white dog in a black cap, watching your cursor">
          ${POSE_NAMES.map((name) => `<img class="dog-pose" data-pose="${name}" src="${attr(poses[name])}" alt="" draggable="false">`).join('')}
        </span></span>
      </button>
    </div>
    <i class="dog-cursor" aria-hidden="true"></i>`)

  const root = stage.querySelector('.dog-root')
  const shadow = stage.querySelector('.dog-shadow')
  const button = stage.querySelector('.dog-btn')
  const head = stage.querySelector('.dog-head')
  const face = stage.querySelector('.dog-face')
  const cursor = stage.querySelector('.dog-cursor')
  const imgs = Object.fromEntries([...stage.querySelectorAll('.dog-pose')].map((img) => [img.dataset.pose, img]))

  const resize = () => {
    const h = Math.min(stage.clientHeight * 0.78, (stage.clientWidth * 0.62) / 0.86, 380)
    stage.style.setProperty('--h', `${h}px`)
    stage.style.setProperty('--w', `${h * 0.86}px`)
  }
  const observer = new ResizeObserver(resize)
  observer.observe(stage)

  let pose = 'front'
  imgs.front.style.opacity = 1
  let candidate = pose
  let since = 0
  let hopping = false
  const setPose = (name) => {
    if (name === pose) return
    const prev = imgs[pose]
    const next = imgs[name]
    pose = name
    if (reduceMotion) {
      prev.style.opacity = 0
      next.style.opacity = 1
      return
    }
    // A quick crossfade plus a tiny squash so the turn reads as motion rather than a cut.
    gsap.to(prev, { opacity: 0, duration: 0.09, overwrite: true })
    gsap.to(next, { opacity: 1, duration: 0.09, overwrite: true })
    if (!hopping) gsap.fromTo(face, { scaleX: 0.97 }, { scaleX: 1, duration: 0.2, ease: 'power2.out', overwrite: 'auto' })
  }

  const pointer = { x: 0, y: 0, at: 0 }
  const onMove = (e) => {
    pointer.x = e.clientX
    pointer.y = e.clientY
    pointer.at = performance.now()
  }
  window.addEventListener('pointermove', onMove, { passive: true })

  const motion = { x: { x: 0, v: 0 }, y: { x: 0, v: 0 }, r: { x: 0, v: 0 } }
  const tick = (time, deltaMs) => {
    const now = performance.now()
    const dt = Math.min(deltaMs / 1000, 1 / 30) || 1 / 60
    const box = root.getBoundingClientRect()
    const stageBox = stage.getBoundingClientRect()
    const cx = box.left + box.width / 2
    const cy = box.top + box.height * 0.42
    const idleFor = pointer.at ? now - pointer.at : Infinity

    // Preview with no real pointer around: a demo cursor traces a figure 8 for the dog to follow.
    const demo = preview && idleFor > IDLE_DEMO_MS && !reduceMotion
    let tx = pointer.x
    let ty = pointer.y
    if (demo) {
      tx = cx + Math.sin(time * 0.9) * box.width * 0.9
      ty = cy + Math.sin(time * 1.8) * box.height * 0.45
    }
    cursor.style.visibility = demo ? 'visible' : 'hidden'
    if (demo) gsap.set(cursor, { x: tx - stageBox.left, y: ty - stageBox.top })

    const dx = tx - cx
    const dy = ty - cy
    let want = pointer.at || demo ? poseFor(dx, dy, (deadZone / 100) * box.width) : 'front'
    if (!preview && idleFor > IDLE_TURN_MS && pointer.at) want = 'back'
    if (hopping) want = 'happy'
    // Hysteresis: a new pose must hold briefly before switching, so sector edges don't flicker.
    if (want !== candidate) {
      candidate = want
      since = now
    } else if (want !== pose && now - since > SWITCH_HOLD_MS) {
      setPose(want)
    }

    if (reduceMotion) return
    const looking = pointer.at || demo
    // The head leans and drifts toward the cursor on springs, and breathes a little.
    springStep(motion.x, looking ? clamp(dx * 0.04, 10) : 0, 80, 11, dt)
    springStep(motion.y, looking ? clamp(dy * 0.04, 8) : 0, 80, 11, dt)
    springStep(motion.r, looking ? clamp(dx / (box.width * 2), 1) * turn : 0, 70, 9, dt)
    gsap.set(head, { x: motion.x.x, y: motion.y.x, rotation: motion.r.x, scale: 1 + Math.sin(time * 2.2) * 0.01, transformOrigin: '50% 100%' })
    gsap.set(shadow, { x: motion.x.x * 0.5, scaleX: 1 - motion.y.x * 0.01 })
  }
  gsap.ticker.add(tick)

  // Pet: the happy pose, a squash-and-stretch hop and a few hearts.
  const hop = () => {
    if (hopping) return
    hopping = true
    setPose('happy')
    if (reduceMotion) {
      gsap.delayedCall(0.8, () => { hopping = false })
      return
    }
    gsap.timeline({ onComplete: () => { hopping = false } })
      .to(face, { scaleY: 0.9, scaleX: 1.06, duration: 0.1, ease: 'power2.in' })
      .to(face, { y: -36, scaleY: 1.06, scaleX: 0.96, duration: 0.25, ease: 'power2.out' })
      .to(face, { y: 0, scaleY: 1, scaleX: 1, duration: 0.45, ease: 'bounce.out' })
    for (let i = 0; i < 3; i++) {
      const heart = Object.assign(document.createElement('span'), { className: 'dog-heart', textContent: '♥' })
      heart.setAttribute('aria-hidden', 'true')
      heart.style.color = i % 2 ? 'var(--hc-warm, #e9a14a)' : 'var(--hc-danger, #e07a5f)'
      root.append(heart)
      gsap.fromTo(heart, { x: (i - 1) * 26, y: 0, scale: 0.4, opacity: 1 }, { x: (i - 1) * 46 + gsap.utils.random(-8, 8), y: -90 - i * 12, scale: 1, opacity: 0, duration: 1.1, delay: i * 0.08, ease: 'power2.out', onComplete: () => heart.remove() })
    }
  }
  button.addEventListener('click', hop)
  const demoHop = preview ? gsap.delayedCall(5, function again() { hop(); demoHop.restart(true) }) : null

  return {
    destroy() {
      demoHop?.kill()
      gsap.ticker.remove(tick)
      gsap.killTweensOf([head, face, shadow, cursor, ...Object.values(imgs)])
      window.removeEventListener('pointermove', onMove)
      observer.disconnect()
      root.remove()
      cursor.remove()
      stage.classList.remove('dog-stage')
    },
  }
}
