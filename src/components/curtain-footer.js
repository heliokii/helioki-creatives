// Concept: "Animated" footers on footer.design: the page lifts like a curtain off a footer pinned underneath. Original implementation.

import { gsap } from 'gsap'

export const params = [
  { id: 'scale', label: 'Start scale', min: 0.7, max: 1, step: 0.01, default: 0.9 },
]

// Shift that keeps the footer pinned to the bottom of the view until its own spot scrolls in.
export function curtainOffset(scrollTop, viewH, footerTop, footerH) {
  return Math.min(0, scrollTop + viewH - footerH - footerTop)
}

const CSS = `
.cf-stage { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--hc-accent, #9aa27c); color: var(--hc-ink, #f2f2f2); font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: var(--fs, 13px); text-align: left; }
.cf-scroll { position: absolute; inset: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; }
.cf-scroll::-webkit-scrollbar { display: none; }
.cf-sheet { position: relative; z-index: 1; box-sizing: border-box; min-height: 100%; padding: 2.4em 2em 3em; border-radius: 0 0 1.8em 1.8em; background: var(--hc-bg, #0b0b0b); box-shadow: 0 1.2em 2em -1em var(--hc-bg, #0b0b0b); }
.cf-kicker { margin: 0; font: 0.75em/1 ui-monospace, monospace; letter-spacing: 0.1em; text-transform: uppercase; color: var(--hc-accent, #9aa27c); }
.cf-h { margin: 0.4em 0 0.6em; font-size: 2.2em; line-height: 1.05; font-weight: 600; letter-spacing: -0.03em; }
.cf-p { max-width: 32em; margin: 0 0 1em; line-height: 1.55; color: var(--hc-soft, #b3b3b3); }
.cf-footer { position: relative; z-index: 0; color: var(--hc-bg, #0b0b0b); }
.cf-inner { display: grid; grid-template-columns: 1fr auto; gap: 1.4em 2em; padding: 2.2em 2em 1.2em; transform-origin: 50% 100%; }
.cf-ask { grid-column: 1 / -1; margin: 0; font-size: 0.8em; letter-spacing: 0.08em; text-transform: uppercase; }
.cf-cta { grid-column: 1 / -1; display: inline-flex; align-items: center; gap: 0.3em; width: max-content; color: inherit; font-size: 2.8em; line-height: 1; font-weight: 600; letter-spacing: -0.04em; text-decoration: none; }
.cf-arrow { display: inline-grid; place-items: center; width: 1em; height: 1em; border-radius: 50%; background: var(--hc-bg, #0b0b0b); color: var(--hc-accent, #9aa27c); font-size: 0.6em; transition: transform 0.35s cubic-bezier(0.3, 1.6, 0.5, 1); }
.cf-cta:hover .cf-arrow, .cf-cta:focus-visible .cf-arrow { transform: rotate(-45deg) scale(1.15); }
.cf-links { display: flex; flex-wrap: wrap; gap: 0.4em 1.4em; }
.cf-links a { color: inherit; font-size: 0.9em; text-decoration: none; }
.cf-links a:hover { text-decoration: underline; }
.cf-top { align-self: end; padding: 0.5em 1em; border: 1px solid currentColor; border-radius: 1.4em; background: none; color: inherit; font: inherit; font-size: 0.85em; cursor: pointer; }
.cf-top:hover { background: var(--hc-bg, #0b0b0b); color: var(--hc-accent, #9aa27c); }
.cf-legal { grid-column: 1 / -1; display: flex; justify-content: space-between; padding-top: 0.9em; border-top: 1px solid var(--hc-accent-deep, #6b7350); font-size: 0.75em; }
.cf-stage :focus-visible { outline: 2px solid var(--hc-bg, #0b0b0b); outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) { .cf-arrow { transition: none; } }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

export function mount(stage, { scale = 0.9, preview = false }) {
  injectCSS('curtain-footer-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  stage.classList.add('cf-stage')
  stage.insertAdjacentHTML('beforeend', `
    <div class="cf-scroll">
      <article class="cf-sheet">
        <p class="cf-kicker">Case study · Harbor</p>
        <h3 class="cf-h">A booking flow<br>that waits for you.</h3>
        <p class="cf-p">Harbor rents small boats by the hour. Their old checkout timed out mid-payment; the new one holds your slot, shows the tide and lets you leave halfway.</p>
        <p class="cf-p">Bookings finished went from 61% to 84% in the first month, and support emails about lost slots stopped.</p>
        <p class="cf-p">Keep scrolling. The page lifts off what is underneath.</p>
      </article>
      <footer class="cf-footer">
        <div class="cf-inner">
          <p class="cf-ask">Next project</p>
          <a class="cf-cta" href="#">Let's talk <span class="cf-arrow" aria-hidden="true">→</span></a>
          <nav class="cf-links" aria-label="Footer">${['Work', 'Studio', 'Journal', 'Instagram', 'LinkedIn'].map((l) => `<a href="#">${l}</a>`).join('')}</nav>
          <button type="button" class="cf-top">Back to top ↑</button>
          <div class="cf-legal"><span>© 2026 Lumen Studio</span><span>hello@lumen.studio</span></div>
        </div>
      </footer>
    </div>`)
  const scroller = stage.querySelector('.cf-scroll')
  const footer = stage.querySelector('.cf-footer')
  const inner = stage.querySelector('.cf-inner')

  const update = () => {
    const { scrollTop, clientHeight } = scroller
    const h = footer.offsetHeight
    const shown = gsap.utils.clamp(0, 1, (scrollTop + clientHeight - footer.offsetTop) / h)
    gsap.set(footer, { y: curtainOffset(scrollTop, clientHeight, footer.offsetTop, h) })
    gsap.set(inner, reduceMotion ? {} : { scale: scale + (1 - scale) * shown, opacity: 0.35 + 0.65 * shown })
  }
  const resize = () => {
    stage.style.setProperty('--fs', `${Math.max(8, Math.min(14, stage.clientWidth / 42))}px`)
    update()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(stage)
  scroller.addEventListener('scroll', update, { passive: true })

  const onClick = (e) => {
    if (e.target.closest('a')) e.preventDefault()
    if (e.target.closest('.cf-top')) gsap.to(scroller, { scrollTop: 0, duration: reduceMotion ? 0 : 1.1, ease: 'power3.inOut' })
  }
  stage.addEventListener('click', onClick)

  const tour = preview && !reduceMotion
    ? gsap.to(scroller, { scrollTop: () => scroller.scrollHeight - scroller.clientHeight, duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: -1, repeatDelay: 1.4, delay: 0.8 })
    : null

  return {
    destroy() {
      tour?.kill()
      gsap.killTweensOf(scroller)
      observer.disconnect()
      stage.removeEventListener('click', onClick)
      scroller.remove()
      stage.classList.remove('cf-stage')
    },
  }
}
