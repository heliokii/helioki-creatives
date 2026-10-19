// Concept: "infinite faq" by @heyimgustavo (via inspora.design). Original implementation.
// Answers are canned: typed questions are matched to the closest FAQ entry by shared words. No AI is involved.

import { gsap } from 'gsap'

export const params = [
  { id: 'speed', label: 'Stream speed (words/s)', min: 6, max: 40, step: 1, default: 16 },
]

const W = 460
const H = 340

export const FAQ = [
  { q: 'How does pricing work?', a: 'Plans are billed monthly per workspace. Start free, then upgrade when you need more seats or storage. You can cancel any time from settings.' },
  { q: 'Can I export my work?', a: 'Yes. Every project exports to MP4, WebM or a ZIP of source files, and exports stay yours even after you cancel.' },
  { q: 'Is my data private?', a: 'Files stay in your workspace and are never used for training. Admins control sharing, and every link can expire.' },
  { q: 'Do you offer team plans?', a: 'Team plans add shared libraries, roles and single sign-on. Invite people and seats are prorated automatically.' },
]

const FALLBACK = "Good question. That one isn't in our FAQ yet, so our team will follow up by email within a day."
const STOP = new Set(['the', 'and', 'you', 'your', 'can', 'are', 'for', 'how', 'what', 'does', 'with', 'from', 'this', 'that', 'any', 'our', 'out', 'get', 'yes', 'when', 'into', 'stay', 'even'])
const words = (text) => new Set((text.toLowerCase().match(/[a-z]{3,}/g) ?? []).filter((w) => !STOP.has(w)))

// The FAQ entry sharing the most meaningful words with `query`, or null.
export function bestAnswer(query) {
  const asked = words(query)
  let best = null
  let top = 0
  for (const entry of FAQ) {
    const score = [...words(`${entry.q} ${entry.a}`)].filter((w) => asked.has(w)).length
    if (score > top) { top = score; best = entry }
  }
  return best
}

const CSS = `
.fq-stage { position: relative; width: 100%; height: 100%; overflow: hidden; }
.fq-root { position: absolute; left: 50%; top: 50%; width: ${W}px; height: ${H}px; margin: ${-H / 2}px 0 0 ${-W / 2}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px; padding: 24px; transform: scale(var(--s, 1)); font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: var(--hc-ink, #f2f2f2); text-align: left; }
.fq-title { margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.3px; }
.fq-title span { color: var(--hc-muted, #8a8a8a); }
.fq-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.fq-chip { height: 28px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--hc-line, #262626); background: var(--hc-surface, #141414); color: var(--hc-soft, #b3b3b3); font-family: inherit; font-size: 12px; cursor: pointer; transition: border-color 0.2s, color 0.2s; }
.fq-chip.is-active { border-color: var(--hc-accent, #9aa27c); color: var(--hc-ink, #f2f2f2); }
.fq-answer { flex: 1; min-height: 0; overflow: auto; padding: 14px 16px; border-radius: 16px; border: 1px solid var(--hc-line, #262626); background: var(--hc-surface, #141414); }
.fq-q { margin: 0 0 6px; font-size: 12px; color: var(--hc-accent, #9aa27c); }
.fq-a { margin: 0; font-size: 14px; line-height: 1.55; color: var(--hc-ink, #f2f2f2); }
.fq-a span { display: inline-block; margin-right: 0.27em; }
.fq-empty { color: var(--hc-faint, #5a5a5a); }
.fq-form { display: flex; gap: 8px; }
.fq-form input { flex: 1; min-width: 0; height: 40px; padding: 0 14px; border-radius: 12px; border: 1px solid var(--hc-line, #262626); background: var(--hc-surface, #141414); color: var(--hc-ink, #f2f2f2); font-family: inherit; font-size: 14px; }
.fq-send { width: 40px; height: 40px; border: 0; border-radius: 12px; background: var(--hc-ink, #f2f2f2); color: var(--hc-bg, #0b0b0b); font-size: 16px; cursor: pointer; }
.fq-chip:focus-visible, .fq-form input:focus-visible, .fq-send:focus-visible { outline: 2px solid var(--hc-accent, #9aa27c); outline-offset: 2px; }
`

// Inline so the copied module works on its own.
function injectCSS(id, css) {
  if (document.getElementById(id)) return
  document.head.append(Object.assign(document.createElement('style'), { id, textContent: css }))
}

export function mount(stage, { speed = 16, preview = false }) {
  injectCSS('infinite-faq-css', CSS)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  stage.classList.add('fq-stage')
  const root = document.createElement('div')
  root.className = 'fq-root'
  root.innerHTML = `
    <p class="fq-title">Questions? <span>Ask anything.</span></p>
    <div class="fq-chips">${FAQ.map((entry, i) => `<button type="button" class="fq-chip" data-i="${i}">${entry.q}</button>`).join('')}</div>
    <div class="fq-answer" aria-live="polite"><p class="fq-q"></p><p class="fq-a"><span class="fq-empty">Pick a question or ask your own.</span></p></div>
    <form class="fq-form"><input placeholder="Ask anything…" aria-label="Ask a question"><button class="fq-send" aria-label="Send">↑</button></form>`
  stage.append(root)

  const resize = () => root.style.setProperty('--s', Math.min(stage.clientWidth / W, stage.clientHeight / H))
  const observer = new ResizeObserver(resize)
  observer.observe(stage)

  const chips = [...root.querySelectorAll('.fq-chip')]
  const qEl = root.querySelector('.fq-q')
  const aEl = root.querySelector('.fq-a')
  const form = root.querySelector('.fq-form')
  const input = form.querySelector('input')
  let stream

  // Words resolve one after another from blurred to sharp.
  const ask = (question, answer, chip) => {
    stream?.kill()
    chips.forEach((c) => c.classList.toggle('is-active', c === chip))
    qEl.textContent = question
    aEl.replaceChildren(...answer.split(' ').map((w) => Object.assign(document.createElement('span'), { textContent: w })))
    stream = reduceMotion ? null : gsap.fromTo(aEl.children, { opacity: 0, filter: 'blur(6px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.35, ease: 'power2.out', stagger: 1 / speed })
  }
  chips.forEach((chip) => chip.addEventListener('click', () => {
    const entry = FAQ[Number(chip.dataset.i)]
    ask(entry.q, entry.a, chip)
  }))
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const question = input.value.trim()
    if (!question) return
    const entry = bestAnswer(question)
    ask(question, entry ? entry.a : FALLBACK, entry ? chips[FAQ.indexOf(entry)] : null)
    input.value = ''
  })

  let index = 0
  const demo = preview
    ? gsap.delayedCall(0.6, function cycle() {
      const entry = FAQ[index]
      ask(entry.q, entry.a, chips[index])
      index = (index + 1) % FAQ.length
      demo.delay(entry.a.split(' ').length / speed + 2.2).restart(true)
    })
    : null

  return {
    destroy() {
      demo?.kill()
      stream?.kill()
      observer.disconnect()
      root.remove()
      stage.classList.remove('fq-stage')
    },
  }
}
