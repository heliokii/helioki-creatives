// Concept: "Folders UI" by David (via inspora.design). Original implementation.

import { gsap } from 'gsap'

export const params = [
  { id: 'count', label: 'Folders', min: 2, max: 4, step: 1, default: 3 },
]

const W = 600
const H = 280
const FOLDERS = [
  ['Brand assets', 24, 'var(--hc-accent-deep, #6b7350)'],
  ['Motion studies', 12, 'var(--hc-warm, #e9a14a)'],
  ['Client decks', 8, 'var(--hc-accent, #9aa27c)'],
  ['Archive', 61, 'var(--hc-accent-dark, #3c4230)'],
]

const CSS = `
.fd-stage { position: relative; width: 100%; height: 100%; overflow: hidden; }
.fd-root { position: absolute; left: 50%; top: 50%; width: ${W}px; height: ${H}px; margin: ${-H / 2}px 0 0 ${-W / 2}px; display: flex; align-items: center; justify-content: space-evenly; transform: scale(var(--s, 1)); font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: var(--hc-ink, #f2f2f2); }
.fd { width: 150px; outline: none; cursor: pointer; text-align: left; }
.fd:focus-visible .fd-body { box-shadow: 0 0 0 2px var(--hc-accent, #9aa27c); border-radius: 12px; }
.fd-body { position: relative; height: 120px; perspective: 500px; }
.fd-back { position: absolute; inset: 12px 0 0; border-radius: 4px 12px 12px 12px; background: color-mix(in srgb, var(--c) 60%, var(--hc-bg, #0b0b0b)); }
.fd-back::before { content: ""; position: absolute; left: 0; top: -12px; width: 58px; height: 14px; border-radius: 8px 8px 0 0; background: inherit; }
.fd-sheet { position: absolute; left: 16px; right: 16px; top: 22px; height: 80px; border-radius: 6px; background: var(--hc-cream, #e9e5d6) repeating-linear-gradient(transparent 0 9px, var(--hc-soft, #b3b3b3) 9px 10px) 0 14px / 100% calc(100% - 22px) no-repeat; box-shadow: 0 2px 6px rgb(0 0 0 / 0.25); }
.fd-front { position: absolute; left: 0; right: 0; bottom: 0; height: 84px; border-radius: 12px; background: linear-gradient(175deg, color-mix(in srgb, var(--c) 100%, var(--hc-ink, #f2f2f2) 12%), var(--c)); box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.18), 0 10px 20px -12px var(--hc-bg, #0b0b0b); transform-origin: 50% 100%; }
.fd-name { margin: 12px 0 0; font-size: 13px; font-weight: 500; }
.fd-meta { margin: 2px 0 0; font-size: 11px; color: var(--hc-muted, #8a8a8a); }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

export function mount(stage, { count = 3, preview = false }) {
  injectCSS('folder-cards-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  stage.classList.add('fd-stage')
  const root = document.createElement('div')
  root.className = 'fd-root'
  root.innerHTML = FOLDERS.slice(0, count).map(([name, files, color]) => `
    <div class="fd" tabindex="0" role="button" aria-label="${name}, ${files} files" style="--c:${color}">
      <div class="fd-body"><div class="fd-back"></div><div class="fd-sheet"></div><div class="fd-sheet"></div><div class="fd-sheet"></div><div class="fd-front"></div></div>
      <p class="fd-name">${name}</p><p class="fd-meta">${files} files</p>
    </div>`).join('')
  stage.append(root)

  const resize = () => root.style.setProperty('--s', Math.min(stage.clientWidth / W, stage.clientHeight / H))
  const observer = new ResizeObserver(resize)
  observer.observe(stage)

  const folders = [...root.querySelectorAll('.fd')]
  const t = reduceMotion ? 0 : 1
  // Front flap tips forward while the sheets fan up out of the pocket.
  const open = (fd) => {
    gsap.to(fd.querySelector('.fd-front'), { rotationX: -38, duration: 0.45 * t, ease: 'power3.out', overwrite: true })
    gsap.to(fd.querySelectorAll('.fd-sheet'), { y: (i) => -26 - i * 9, rotation: (i) => (i - 1) * 7, duration: 0.5 * t, ease: 'back.out(1.8)', stagger: 0.04 * t, overwrite: true })
  }
  const close = (fd) => {
    gsap.to(fd.querySelector('.fd-front'), { rotationX: 0, duration: 0.35 * t, ease: 'power2.out', overwrite: true })
    gsap.to(fd.querySelectorAll('.fd-sheet'), { y: 0, rotation: 0, duration: 0.35 * t, ease: 'power2.out', overwrite: true })
  }
  folders.forEach((fd) => {
    fd.addEventListener('pointerenter', () => open(fd))
    fd.addEventListener('pointerleave', () => close(fd))
    fd.addEventListener('focus', () => open(fd))
    fd.addEventListener('blur', () => close(fd))
  })

  let index = -1
  const demo = preview
    ? gsap.delayedCall(0.5, function cycle() {
      if (index >= 0) close(folders[index])
      index = (index + 1) % folders.length
      open(folders[index])
      demo.delay(1.6).restart(true)
    })
    : null

  return {
    destroy() {
      demo?.kill()
      gsap.killTweensOf(root.querySelectorAll('*'))
      observer.disconnect()
      root.remove()
      stage.classList.remove('fd-stage')
    },
  }
}
