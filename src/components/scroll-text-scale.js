// Concept: "Subtle text scale effect" by shawn (via inspora.design). Original implementation.

import { gsap } from 'gsap'

export const params = [
  { id: 'minScale', label: 'Min scale', min: 0.6, max: 1, step: 0.01, default: 0.88 },
  { id: 'fade', label: 'Fade', min: 0, max: 1, step: 0.05, default: 0.7 },
]

const COPY = [
  'Good motion is mostly invisible. You notice it only when it is missing: a panel that snaps, a list that jumps, a button that ignores you.',
  'Easing is how an interface admits it has weight. Things that start fast and settle slowly feel like they arrived on purpose.',
  'Distance should change timing. A tooltip travels a few pixels and deserves a few frames; a sheet crossing the screen can take its time.',
  'Exits are quieter than entrances. Leave quickly, without ceremony, so the next thing can have the room.',
  'And when in doubt, shorten it. Nobody has ever complained that a transition was too fast.',
]

const CSS = `
.ts-stage { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--hc-bg, #0b0b0b); color: var(--hc-cream, #e9e5d6); font-family: Georgia, "Times New Roman", serif; font-size: var(--fs, 16px); text-align: left; }
.ts-scroll { position: absolute; inset: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; }
.ts-scroll::-webkit-scrollbar { display: none; }
.ts-article { max-width: 30em; margin: 0 auto; padding: var(--pad, 120px) 1.6em 70%; }
.ts-kicker { margin: 0 0 1em; font: 0.7em/1 ui-monospace, "JetBrains Mono", monospace; letter-spacing: 0.12em; text-transform: uppercase; color: var(--hc-accent, #9aa27c); }
.ts-block { margin: 0 0 1em; line-height: 1.55; transform-origin: 50% 100%; }
.ts-title { font-size: 1.9em; line-height: 1.1; letter-spacing: -0.02em; margin-bottom: 0.6em; }
.ts-edge { position: absolute; left: 0; right: 0; top: 0; height: 12%; background: linear-gradient(var(--hc-bg, #0b0b0b), transparent); pointer-events: none; }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

export function mount(stage, { minScale = 0.88, fade = 0.7, preview = false }) {
  injectCSS('scroll-text-scale-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  stage.classList.add('ts-stage')
  stage.insertAdjacentHTML('beforeend', `
    <div class="ts-scroll" tabindex="0" aria-label="Article, scroll to read">
      <article class="ts-article">
        <p class="ts-kicker">Essay · 3 min</p>
        <h3 class="ts-block ts-title">On easing.</h3>
        ${COPY.map((text) => `<p class="ts-block">${text}</p>`).join('')}
      </article>
    </div>
    <div class="ts-edge"></div>`)
  const scroller = stage.querySelector('.ts-scroll')
  const edge = stage.querySelector('.ts-edge')
  const blocks = [...stage.querySelectorAll('.ts-block')]

  // A block starts shrinking once its top enters the upper third, and is fully scaled when half of it has left.
  const update = () => {
    if (reduceMotion) return
    const zone = scroller.clientHeight * 0.32
    for (const block of blocks) {
      const top = block.offsetTop - scroller.scrollTop
      const p = Math.max(0, Math.min(1, (zone - top) / (zone + block.offsetHeight * 0.6)))
      gsap.set(block, { scale: 1 - (1 - minScale) * p, opacity: 1 - fade * p })
    }
  }
  const resize = () => {
    const w = stage.clientWidth
    stage.style.setProperty('--fs', `${Math.max(11, Math.min(19, w / 26))}px`)
    stage.style.setProperty('--pad', `${stage.clientHeight * 0.36}px`)
    update()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(stage)
  scroller.addEventListener('scroll', update, { passive: true })

  const tour = preview && !reduceMotion
    ? gsap.to(scroller, { scrollTop: () => scroller.scrollHeight - scroller.clientHeight, duration: 7, ease: 'sine.inOut', yoyo: true, repeat: -1, repeatDelay: 1, delay: 0.6 })
    : null

  return {
    destroy() {
      tour?.kill()
      observer.disconnect()
      scroller.remove()
      edge.remove()
      stage.classList.remove('ts-stage')
    },
  }
}
