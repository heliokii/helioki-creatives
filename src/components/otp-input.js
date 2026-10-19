// Concept: "Animated code input" by sucodee (via inspora.design). Original implementation.

import { gsap } from 'gsap'

export const params = [
  { id: 'length', label: 'Digits', min: 4, max: 8, step: 1, default: 6 },
  { id: 'verify', label: 'Verify time (s)', min: 0.6, max: 3, step: 0.1, default: 1.4 },
]

const W = 480
const H = 280
const BOX = 44
const GAP = 10

export const sanitizeCode = (value, length) => value.replace(/\D/g, '').slice(0, length)

const CSS = `
.otp-stage { position: relative; width: 100%; height: 100%; overflow: hidden; }
.otp-root { position: absolute; left: 50%; top: 50%; width: ${W}px; height: ${H}px; margin: ${-H / 2}px 0 0 ${-W / 2}px; display: flex; flex-direction: column; align-items: center; justify-content: center; transform: scale(var(--s, 1)); font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: var(--hc-ink, #f2f2f2); text-align: center; }
.otp-title { margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.3px; }
.otp-sub { margin: 6px 0 22px; font-size: 13px; color: var(--hc-muted, #8a8a8a); }
.otp-field { position: relative; height: 56px; }
.otp-row { position: absolute; inset: 0; display: flex; gap: ${GAP}px; }
.otp-box { display: grid; place-items: center; width: ${BOX}px; height: 100%; flex: none; border-radius: 12px; border: 1px solid var(--hc-line, #262626); background: var(--hc-surface, #141414); font-size: 22px; font-weight: 600; }
.otp-box b { display: block; font-weight: inherit; }
.otp-ring { position: absolute; left: 0; top: 0; width: ${BOX}px; height: 100%; border-radius: 12px; border: 2px solid var(--hc-accent, #9aa27c); box-shadow: 0 0 0 4px rgb(154 162 124 / 0.18); pointer-events: none; visibility: hidden; }
.otp-pill { position: absolute; left: 50%; top: 6px; display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 18px; border-radius: 999px; border: 1px solid var(--hc-line, #262626); background: var(--hc-surface, #141414); font-size: 14px; white-space: nowrap; visibility: hidden; }
.otp-spin { display: grid; place-items: center; width: 16px; height: 16px; box-sizing: border-box; border-radius: 50%; border: 2px solid var(--hc-line-2, #2f2f2f); border-top-color: var(--hc-accent, #9aa27c); animation: otp-spin 0.8s linear infinite; }
.otp-pill.is-ok { color: var(--hc-accent-light, #c5cc9f); }
.otp-pill.is-ok .otp-spin { animation: none; border: 0; background: var(--hc-accent-dark, #3c4230); }
.otp-pill.is-ok .otp-spin::after { content: "✓"; font-size: 10px; color: var(--hc-accent-light, #c5cc9f); }
.otp-input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; padding: 0; border: 0; opacity: 0; font-size: 16px; cursor: text; }
.otp-help { margin: 18px 0 0; font-size: 12px; color: var(--hc-faint, #5a5a5a); }
@keyframes otp-spin { to { transform: rotate(360deg); } }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

export function mount(stage, { length = 6, verify = 1.4, preview = false }) {
  injectCSS('otp-input-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const t = reduceMotion ? 0 : 1
  const rowW = length * BOX + (length - 1) * GAP
  stage.classList.add('otp-stage')
  const root = document.createElement('div')
  root.className = 'otp-root'
  root.innerHTML = `
    <p class="otp-title">Check your email</p>
    <p class="otp-sub">Enter the ${length}-digit code we sent to you@studio.com</p>
    <div class="otp-field" style="width:${rowW}px">
      <div class="otp-row" aria-hidden="true">${'<span class="otp-box"><b></b></span>'.repeat(length)}<i class="otp-ring"></i></div>
      <div class="otp-pill" aria-hidden="true"><i class="otp-spin"></i><span class="otp-pill-text">Verifying…</span></div>
      <input class="otp-input" inputmode="numeric" autocomplete="one-time-code" maxlength="${length}" aria-label="${length}-digit verification code">
    </div>
    <p class="otp-help" role="status">Didn't get a code? Resend</p>`
  stage.append(root)

  const resize = () => root.style.setProperty('--s', Math.min(stage.clientWidth / W, stage.clientHeight / H))
  const observer = new ResizeObserver(resize)
  observer.observe(stage)

  const $ = (sel) => root.querySelector(sel)
  const boxes = [...root.querySelectorAll('.otp-box')]
  const ring = $('.otp-ring')
  const pill = $('.otp-pill')
  const pillText = $('.otp-pill-text')
  const spin = $('.otp-spin')
  const input = $('.otp-input')
  const help = $('.otp-help')
  gsap.set(pill, { xPercent: -50 })
  if (preview) gsap.set(ring, { autoAlpha: 1 })

  let busy = false
  let seq
  let pending

  const update = () => {
    if (busy) return
    const value = sanitizeCode(input.value, length)
    input.value = value
    boxes.forEach((box, i) => {
      const digit = box.firstChild
      const ch = value[i] ?? ''
      if (digit.textContent === ch) return
      digit.textContent = ch
      if (ch && t) gsap.fromTo(digit, { y: 10, opacity: 0, filter: 'blur(4px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.25, ease: 'power3.out' })
    })
    gsap.to(ring, { x: Math.min(value.length, length - 1) * (BOX + GAP), duration: 0.25 * t, ease: 'power3.out' })
    if (value.length === length) check()
  }

  // Boxes collapse toward the middle and become one pill while the code "verifies".
  const check = () => {
    busy = true
    input.blur()
    input.disabled = true
    help.textContent = 'Verifying code…'
    const mid = rowW / 2 - BOX / 2
    seq = gsap.timeline()
      .to(ring, { autoAlpha: 0, duration: 0.15 * t })
      .to(boxes, { x: (i) => (mid - i * (BOX + GAP)) * 0.9, scale: 0.5, autoAlpha: 0, duration: 0.4 * t, ease: 'power3.in', stagger: { each: 0.02 * t, from: 'edges' } })
      .fromTo(pill, { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.35 * t, ease: 'back.out(2)' }, '-=0.1')
      .add(() => {
        pill.classList.add('is-ok')
        pillText.textContent = 'Verified'
        help.textContent = 'Code verified'
      }, `+=${verify}`)
      .fromTo(spin, { scale: 0.4 }, { scale: 1, duration: 0.35 * t, ease: 'back.out(3)' })
      .add(reset, '+=1.6')
  }

  const reset = () => {
    gsap.to(pill, { autoAlpha: 0, duration: 0.2 * t })
    boxes.forEach((box) => { box.firstChild.textContent = '' })
    gsap.to(boxes, { x: 0, scale: 1, autoAlpha: 1, duration: 0.35 * t, ease: 'power3.out', stagger: 0.02 * t, delay: 0.1 * t })
    gsap.set(ring, { x: 0, autoAlpha: preview ? 1 : 0 })
    pill.classList.remove('is-ok')
    pillText.textContent = 'Verifying…'
    help.textContent = "Didn't get a code? Resend"
    input.value = ''
    input.disabled = false
    busy = false
    if (preview) typeDemo()
  }

  const typeDemo = () => {
    const code = Array.from({ length }, () => Math.floor(Math.random() * 10)).join('')
    let typed = 0
    const step = () => {
      input.value = code.slice(0, ++typed)
      update()
      if (typed < length) pending = gsap.delayedCall(0.22, step)
    }
    pending = gsap.delayedCall(0.9, step)
  }

  const onFocus = () => !busy && gsap.to(ring, { autoAlpha: 1, duration: 0.2 * t })
  const onBlur = () => !busy && !preview && gsap.to(ring, { autoAlpha: 0, duration: 0.2 * t })
  input.addEventListener('input', update)
  input.addEventListener('focus', onFocus)
  input.addEventListener('blur', onBlur)
  if (preview) typeDemo()

  return {
    destroy() {
      seq?.kill()
      pending?.kill()
      gsap.killTweensOf(root.querySelectorAll('*'))
      observer.disconnect()
      root.remove()
      stage.classList.remove('otp-stage')
    },
  }
}
