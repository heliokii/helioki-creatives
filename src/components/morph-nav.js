// Concept: "Dropdown / Flyout" navbars on navbar.gallery: one panel morphs between menus. Original implementation.

import { gsap } from 'gsap'

export const params = [
  { id: 'speed', label: 'Morph time (s)', min: 0.15, max: 0.7, step: 0.05, default: 0.35 },
]

const W = 560
const H = 340
const MENUS = [
  ['Product', 2, [['Motion kit', 'Drop-in components'], ['Timeline', 'Scrub every frame'], ['Export', 'MP4, GIF and Lottie'], ['Plugins', 'Figma and Framer']]],
  ['Studio', 1, [['About', 'Who we are'], ['Careers', 'Three open roles'], ['Press', 'Logos and photos']]],
  ['Learn', 3, [['Guides', 'First frame to launch'], ['Changelog', 'Shipped this week'], ['Community', '12k makers'], ['Templates', 'Start from a scene'], ['Docs', 'API reference'], ['Status', 'All systems normal']]],
]
const ICONS = ['var(--hc-accent, #9aa27c)', 'var(--hc-cream, #e9e5d6)', 'var(--hc-warm, #e9a14a)', 'var(--hc-accent-light, #c5cc9f)']
const CHEVRON = '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'

let uid = 0

const CSS = `
.mn-stage { position: relative; width: 100%; height: 100%; overflow: hidden; }
.mn-root { position: absolute; left: 50%; top: 50%; width: ${W}px; height: ${H}px; margin: ${-H / 2}px 0 0 ${-W / 2}px; transform: scale(var(--s, 1)); font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: var(--hc-ink, #f2f2f2); text-align: left; }
.mn-bar { position: absolute; left: 20px; right: 20px; top: 20px; height: 52px; display: flex; align-items: center; gap: 2px; padding: 0 8px 0 18px; border: 1px solid var(--hc-line, #262626); border-radius: 14px; background: var(--hc-surface, #141414); }
.mn-brand { display: flex; align-items: center; gap: 8px; margin-right: auto; color: var(--hc-ink, #f2f2f2); font-size: 15px; font-weight: 600; letter-spacing: -0.02em; text-decoration: none; }
.mn-brand i { width: 14px; height: 14px; border-radius: 4px; background: var(--hc-accent, #9aa27c); }
.mn-trigger, .mn-link { display: inline-flex; align-items: center; gap: 4px; height: 34px; padding: 0 12px; border: 0; border-radius: 8px; background: none; color: var(--hc-soft, #b3b3b3); font: inherit; font-size: 13px; text-decoration: none; cursor: pointer; }
.mn-trigger:hover, .mn-link:hover, .mn-trigger[aria-expanded="true"] { color: var(--hc-ink, #f2f2f2); }
.mn-trigger svg { fill: none; stroke: currentColor; stroke-width: 2; transition: transform 0.25s; }
.mn-trigger[aria-expanded="true"] svg { transform: rotate(180deg); }
.mn-cta { display: inline-flex; align-items: center; height: 34px; margin-left: 6px; padding: 0 14px; border-radius: 8px; background: var(--hc-ink, #f2f2f2); color: var(--hc-bg, #0b0b0b); font-size: 13px; font-weight: 600; white-space: nowrap; text-decoration: none; }
.mn-root :focus-visible { outline: 2px solid var(--hc-accent, #9aa27c); outline-offset: 2px; }
.mn-caret { position: absolute; left: 0; top: 79px; z-index: 3; width: 12px; height: 12px; margin-left: -6px; border-left: 1px solid var(--hc-line-2, #2f2f2f); border-top: 1px solid var(--hc-line-2, #2f2f2f); background: var(--hc-surface-2, #1c1c1c); visibility: hidden; }
.mn-panel { position: absolute; left: 0; top: 85px; z-index: 2; width: 200px; height: 100px; overflow: hidden; border: 1px solid var(--hc-line-2, #2f2f2f); border-radius: 14px; background: var(--hc-surface-2, #1c1c1c); box-shadow: 0 24px 40px -20px var(--hc-bg, #0b0b0b); visibility: hidden; }
.mn-menu { position: absolute; left: 0; top: 0; display: grid; grid-template-columns: repeat(var(--cols), 160px); gap: 2px; padding: 8px; visibility: hidden; }
.mn-item { display: flex; gap: 10px; padding: 9px 10px; border-radius: 10px; color: var(--hc-ink, #f2f2f2); text-decoration: none; }
.mn-item:hover, .mn-item:focus-visible { background: var(--hc-line, #262626); }
.mn-item i { flex: none; width: 26px; height: 26px; border-radius: 7px; opacity: 0.85; }
.mn-item b { display: block; font-size: 13px; font-weight: 500; }
.mn-item small { display: block; margin-top: 2px; font-size: 11px; color: var(--hc-muted, #8a8a8a); }
.mn-hero { position: absolute; left: 40px; right: 40px; top: 150px; }
.mn-hero h3 { margin: 0 0 10px; font-size: 34px; line-height: 1.05; font-weight: 600; letter-spacing: -0.03em; }
.mn-hero p { max-width: 340px; margin: 0; font-size: 13px; line-height: 1.55; color: var(--hc-muted, #8a8a8a); }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

export function mount(stage, { speed = 0.35, preview = false }) {
  injectCSS('morph-nav-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const id = `mn-${++uid}`
  stage.classList.add('mn-stage')
  const root = document.createElement('div')
  root.className = 'mn-root'
  root.innerHTML = `
    <nav class="mn-bar" aria-label="Demo navigation">
      <a class="mn-brand" href="#"><i></i>Lumen</a>
      ${MENUS.map(([label], i) => `<button type="button" class="mn-trigger" aria-expanded="false" aria-controls="${id}-${i}">${label}${CHEVRON}</button>`).join('')}
      <a class="mn-link" href="#">Pricing</a>
      <a class="mn-cta" href="#">Get started</a>
    </nav>
    <i class="mn-caret"></i>
    <div class="mn-panel">${MENUS.map(([label, cols, items], i) => `
      <div class="mn-menu" id="${id}-${i}" role="region" aria-label="${label}" style="--cols: ${cols}">
        ${items.map(([title, desc], j) => `<a class="mn-item" href="#"><i style="background: ${ICONS[(i + j) % ICONS.length]}"></i><span><b>${title}</b><small>${desc}</small></span></a>`).join('')}
      </div>`).join('')}
    </div>
    <div class="mn-hero"><h3>Motion that feels<br>inevitable.</h3><p>Hover the menu: one panel stretches, slides and swaps its contents instead of three dropdowns popping in and out.</p></div>`
  stage.append(root)

  const bar = root.querySelector('.mn-bar')
  const panel = root.querySelector('.mn-panel')
  const caret = root.querySelector('.mn-caret')
  const triggers = [...root.querySelectorAll('.mn-trigger')]
  const menus = [...root.querySelectorAll('.mn-menu')]
  gsap.set(caret, { rotation: 45 })

  let open = -1
  let hideCall = null
  const t = reduceMotion ? 0 : speed

  const show = (i) => {
    hideCall?.kill()
    if (i === open) return
    const menu = menus[i]
    const w = menu.offsetWidth
    const h = menu.offsetHeight
    const trigger = triggers[i]
    const cx = bar.offsetLeft + trigger.offsetLeft + trigger.offsetWidth / 2
    const x = gsap.utils.clamp(20, W - 20 - w, cx - w / 2)
    gsap.killTweensOf([panel, caret, ...menus])
    menus.forEach((m, j) => { if (j !== i && j !== open) gsap.set(m, { autoAlpha: 0 }) })
    if (open >= 0) {
      // Old contents leave the way the pointer came from; the panel resizes to the new menu.
      const dir = i > open ? 1 : -1
      triggers[open].setAttribute('aria-expanded', 'false')
      gsap.to(menus[open], { autoAlpha: 0, x: -dir * 30, duration: t * 0.6, ease: 'power2.out' })
      gsap.fromTo(menu, { autoAlpha: 0, x: dir * 30 }, { autoAlpha: 1, x: 0, duration: t, ease: 'power3.out' })
      gsap.to(panel, { autoAlpha: 1, y: 0, scale: 1, x, width: w, height: h, duration: t, ease: 'power3.out' })
      gsap.to(caret, { autoAlpha: 1, y: 0, x: cx, duration: t, ease: 'power3.out' })
    } else {
      gsap.set(panel, { x, width: w, height: h })
      gsap.set(caret, { x: cx })
      gsap.set(menu, { autoAlpha: 1, x: 0 })
      gsap.fromTo(panel, { autoAlpha: 0, y: -8, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: t * 0.8, ease: 'power3.out' })
      gsap.fromTo(caret, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: t * 0.8, ease: 'power3.out' })
    }
    trigger.setAttribute('aria-expanded', 'true')
    open = i
  }

  const close = () => {
    hideCall?.kill()
    if (open < 0) return
    const menu = menus[open]
    triggers[open].setAttribute('aria-expanded', 'false')
    open = -1
    gsap.killTweensOf([panel, caret, ...menus])
    gsap.to([panel, caret], { autoAlpha: 0, y: -6, duration: reduceMotion ? 0 : 0.18, ease: 'power2.in', onComplete: () => gsap.set(menu, { autoAlpha: 0 }) })
  }

  // Mouse opens on hover; touch and keyboard toggle on click.
  let pointerType = ''
  const later = () => { hideCall?.kill(); hideCall = gsap.delayedCall(0.2, close) }
  triggers.forEach((trigger, i) => {
    trigger.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') show(i) })
    trigger.addEventListener('click', () => (open === i && pointerType !== 'mouse' ? close() : show(i)))
  })
  root.querySelectorAll('.mn-brand, .mn-link, .mn-cta').forEach((el) => el.addEventListener('pointerenter', close))
  const hover = [bar, panel, caret]
  hover.forEach((el) => {
    el.addEventListener('pointerleave', (e) => { if (!hover.some((h) => h.contains(e.relatedTarget))) later() })
    el.addEventListener('pointerenter', () => hideCall?.kill())
  })
  const onPointerDown = (e) => { pointerType = e.pointerType }
  const onKey = (e) => {
    pointerType = 'key'
    if (e.key === 'Escape' && open >= 0) {
      e.preventDefault()
      const trigger = triggers[open]
      close()
      trigger.focus()
      return
    }
    // The shared panel sits after the bar in the DOM, so step focus in and out of it by hand.
    const trigger = e.target.closest('.mn-trigger')
    const i = triggers.indexOf(trigger)
    if (trigger && (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey && i === open))) {
      e.preventDefault()
      show(i)
      menus[i].querySelector('a').focus()
      return
    }
    const menu = e.target.closest('.mn-menu')
    if (menu && e.key === 'Tab') {
      const links = [...menu.querySelectorAll('a')]
      if (e.target !== (e.shiftKey ? links[0] : links.at(-1))) return
      e.preventDefault()
      const m = menus.indexOf(menu)
      const next = e.shiftKey ? triggers[m] : triggers[m + 1] ?? root.querySelector('.mn-link')
      next.focus()
    }
  }
  const onFocusOut = (e) => { if (!root.contains(e.relatedTarget)) close() }
  const onClick = (e) => { if (e.target.closest('a')) e.preventDefault() }
  root.addEventListener('pointerdown', onPointerDown)
  root.addEventListener('keydown', onKey)
  root.addEventListener('focusout', onFocusOut)
  root.addEventListener('click', onClick)

  const resize = () => root.style.setProperty('--s', Math.min(stage.clientWidth / W, stage.clientHeight / H))
  const observer = new ResizeObserver(resize)
  observer.observe(stage)

  const demo = preview && !reduceMotion
    ? gsap.timeline({ repeat: -1, delay: 0.6 })
      .call(show, [0]).call(show, [1], null, '+=1.4').call(show, [2], null, '+=1.4').call(show, [0], null, '+=1.4')
      .call(close, null, '+=1.4').to({}, { duration: 1 })
    : null

  return {
    destroy() {
      demo?.kill()
      hideCall?.kill()
      gsap.killTweensOf([panel, caret, ...menus])
      observer.disconnect()
      root.remove()
      stage.classList.remove('mn-stage')
    },
  }
}
