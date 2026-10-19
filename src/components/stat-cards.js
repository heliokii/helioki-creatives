// Concept: "Interactive cards" by @kaolti (via inspora.design). Original implementation.

import { gsap } from 'gsap'

export const params = [
  { id: 'duration', label: 'Count-up time (s)', min: 0.4, max: 2.5, step: 0.1, default: 1.1 },
]

const W = 600
const H = 280
const BARS = [0.4, 0.7, 0.55, 0.9, 0.65, 0.3, 0.5]
const SPEND = [['Studio', 0.45, 'var(--hc-accent, #9aa27c)'], ['Software', 0.3, 'var(--hc-warm, #e9a14a)'], ['Travel', 0.25, 'var(--hc-cream, #e9e5d6)']]
const BUSY = [0.35, 0.6, 1, 0.75, 0.45]
const C = 2 * Math.PI * 38

const CSS = `
.st-stage { position: relative; width: 100%; height: 100%; overflow: hidden; }
.st-root { position: absolute; left: 50%; top: 50%; width: ${W}px; height: ${H}px; margin: ${-H / 2}px 0 0 ${-W / 2}px; display: flex; gap: 16px; padding: 16px; transform: scale(var(--s, 1)); font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: var(--hc-ink, #f2f2f2); text-align: left; }
.st-card { position: relative; flex: 1; display: flex; flex-direction: column; padding: 16px; border-radius: 18px; border: 1px solid var(--hc-line, #262626); background: linear-gradient(170deg, var(--hc-surface-2, #1c1c1c), var(--hc-surface, #141414)); outline: none; transition: border-color 0.3s; }
.st-card.is-on { border-color: var(--hc-accent-dark, #3c4230); }
.st-card:focus-visible { box-shadow: 0 0 0 2px var(--hc-accent, #9aa27c); }
.st-label { margin: 0; font-size: 12px; color: var(--hc-muted, #8a8a8a); }
.st-value { margin: 4px 0 0; font-size: 26px; font-weight: 600; letter-spacing: -0.5px; }
.st-sub { margin: 2px 0 0; font-size: 11px; color: var(--hc-accent, #9aa27c); }
.st-chart { position: relative; flex: 1; display: flex; align-items: flex-end; gap: 6px; margin-top: 12px; }
.st-bar { flex: 1; height: calc(var(--h) * 100%); border-radius: 4px; background: linear-gradient(var(--hc-accent-light, #c5cc9f), var(--hc-accent-deep, #6b7350)); transform-origin: bottom; }
.st-days { display: flex; justify-content: space-between; margin-top: 6px; font-size: 9px; color: var(--hc-faint, #5a5a5a); }
.st-donut { position: absolute; inset: 0; margin: auto; width: 110px; height: 110px; }
.st-donut circle { fill: none; stroke-width: 12; }
.st-legend { display: flex; justify-content: space-between; margin-top: 6px; font-size: 9px; color: var(--hc-muted, #8a8a8a); }
.st-legend i { display: inline-block; width: 6px; height: 6px; margin-right: 4px; border-radius: 50%; }
.st-cyl { position: relative; flex: 1; height: calc(var(--h) * 100%); border-radius: 0 0 50% 50% / 0 0 7px 7px; background: linear-gradient(90deg, var(--hc-accent-dark, #3c4230), var(--hc-accent, #9aa27c) 55%, var(--hc-accent-dark, #3c4230)); transform-origin: bottom; }
.st-cyl::before { content: ""; position: absolute; left: 0; right: 0; top: -6px; height: 12px; border-radius: 50%; background: var(--hc-accent-light, #c5cc9f); }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

const HTML = `
<article class="st-card" tabindex="0" aria-label="Focus hours: 32.5 this week">
  <p class="st-label">Focus hours</p><p class="st-value"><span data-to="32.5" data-dec="1">32.5</span>h</p><p class="st-sub">+12% vs last week</p>
  <div class="st-chart">${BARS.map((h) => `<i class="st-bar" style="--h:${h}"></i>`).join('')}</div>
  <div class="st-days"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
</article>
<article class="st-card" tabindex="0" aria-label="Spending: $2,480 this month">
  <p class="st-label">Spending</p><p class="st-value">$<span data-to="2480" data-dec="0">2,480</span></p><p class="st-sub">On budget</p>
  <div class="st-chart"><svg class="st-donut" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="38" style="stroke: var(--hc-surface-2, #1c1c1c)"/>${SPEND.map(([, , color]) => `<circle class="st-seg" cx="50" cy="50" r="38" style="stroke: ${color}" transform="rotate(-90 50 50)"/>`).join('')}</svg></div>
  <div class="st-legend">${SPEND.map(([name, , color]) => `<span><i style="background:${color}"></i>${name}</span>`).join('')}</div>
</article>
<article class="st-card" tabindex="0" aria-label="Busy hours: peak 86% at 2 PM">
  <p class="st-label">Busy hours</p><p class="st-value"><span data-to="86" data-dec="0">86</span>%</p><p class="st-sub">Peak at 2 PM</p>
  <div class="st-chart" style="gap:10px;padding:0 4px">${BUSY.map((h) => `<i class="st-cyl" style="--h:${h}"></i>`).join('')}</div>
  <div class="st-days"><span>10a</span><span>12p</span><span>2p</span><span>4p</span><span>6p</span></div>
</article>`

export function mount(stage, { duration = 1.1, preview = false }) {
  injectCSS('stat-cards-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  stage.classList.add('st-stage')
  const root = document.createElement('div')
  root.className = 'st-root'
  root.innerHTML = HTML
  stage.append(root)

  const resize = () => root.style.setProperty('--s', Math.min(stage.clientWidth / W, stage.clientHeight / H))
  const observer = new ResizeObserver(resize)
  observer.observe(stage)

  const cards = [...root.querySelectorAll('.st-card')]
  const segs = [...root.querySelectorAll('.st-seg')]
  let offset = 0
  segs.forEach((seg, i) => {
    seg.dataset.len = SPEND[i][1] * C
    seg.style.strokeDashoffset = -offset
    seg.style.strokeDasharray = `0 ${C}`
    offset += SPEND[i][1] * C
  })
  const parts = (card) => [...card.querySelectorAll('.st-bar, .st-cyl')]
  // The donut card has no bars; skip it so GSAP doesn't warn about an empty target.
  const tweenParts = (card, vars) => parts(card).length && gsap.to(parts(card), vars)
  gsap.set(root.querySelectorAll('.st-bar, .st-cyl'), { scaleY: 0.25, opacity: 0.5 })

  const t = reduceMotion ? 0 : 1
  const activate = (card) => {
    card.classList.add('is-on')
    const num = card.querySelector('[data-to]')
    const to = Number(num.dataset.to)
    const dec = Number(num.dataset.dec)
    const counter = { v: 0 }
    gsap.to(counter, { v: to, duration: duration * t, ease: 'power2.out', onUpdate: () => { num.textContent = counter.v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) } })
    tweenParts(card, { scaleY: 1, opacity: 1, duration: 0.6 * t, ease: 'back.out(1.6)', stagger: 0.05 * t, overwrite: true })
    if (card === cards[1]) gsap.to(segs, { strokeDasharray: (i, seg) => `${seg.dataset.len - 2} ${C}`, duration: duration * t, ease: 'power3.out', stagger: 0.12 * t, overwrite: true })
    if (card === cards[2]) tweenParts(card, { filter: 'drop-shadow(0 0 8px rgb(154 162 124 / 0.7))', duration: 0.4 * t })
  }
  const deactivate = (card) => {
    card.classList.remove('is-on')
    tweenParts(card, { scaleY: 0.25, opacity: 0.5, filter: 'drop-shadow(0 0 0px rgb(154 162 124 / 0))', duration: 0.4 * t, overwrite: true })
    if (card === cards[1]) gsap.to(segs, { strokeDasharray: `0 ${C}`, duration: 0.4 * t, overwrite: true })
  }
  cards.forEach((card) => {
    card.addEventListener('pointerenter', () => activate(card))
    card.addEventListener('pointerleave', () => deactivate(card))
    card.addEventListener('focus', () => activate(card))
    card.addEventListener('blur', () => deactivate(card))
  })

  let index = -1
  const demo = preview
    ? gsap.delayedCall(0.6, function cycle() {
      if (index >= 0) deactivate(cards[index])
      index = (index + 1) % cards.length
      activate(cards[index])
      demo.delay(2.4).restart(true)
    })
    : null

  return {
    destroy() {
      demo?.kill()
      gsap.killTweensOf(root.querySelectorAll('*'))
      observer.disconnect()
      root.remove()
      stage.classList.remove('st-stage')
    },
  }
}
