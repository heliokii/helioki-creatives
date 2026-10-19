import { gsap } from 'gsap'
import { groups } from '../components/registry.js'
import { reduceMotion, toast } from './ui.js'

const sources = import.meta.glob(
  ['../components/*.js', '!../components/*.test.js', '!../components/registry.js'],
  { query: '?raw', import: 'default' },
)

const defaults = (mod) => Object.fromEntries(mod.params.map((p) => [p.id, p.default]))

// `entries()` returns the components currently visible in the grid, in order; prev/next walks that list.
export function createDetail(dialog, { imagesFor, entries }) {
  const $ = (sel) => dialog.querySelector(sel)
  const host = $('.detail-stage')
  const form = $('.detail-params')
  const toastEl = $('.toast')
  let current = null
  let swapping = false

  // Fresh element per mount so one component's attributes never leak into the next.
  const remount = () => {
    current.instance?.destroy()
    const el = document.createElement('div')
    el.className = 'detail-mount'
    host.replaceChildren(el)
    current.instance = current.mod.mount(el, { ...current.values, images: imagesFor(current.values) })
  }

  const renderParams = () => {
    form.replaceChildren(...current.mod.params.map((p) => {
      const label = document.createElement('label')
      label.className = 'param'
      const name = Object.assign(document.createElement('span'), { textContent: p.label })
      const out = Object.assign(document.createElement('output'), { value: current.values[p.id] })
      const input = Object.assign(document.createElement('input'), { type: 'range', name: p.id, min: p.min, max: p.max, step: p.step, value: current.values[p.id] })
      input.addEventListener('input', () => { out.value = input.value })
      input.addEventListener('change', () => { current.values[p.id] = Number(input.value); remount() })
      label.append(name, out, input)
      return label
    }))
  }

  const setEntry = (entry, mod) => {
    current = { entry, mod, values: defaults(mod), instance: null }
    $('.detail-group').textContent = groups[entry.group]
    $('.detail-title').textContent = entry.title
    $('.detail-desc').textContent = entry.description
    renderParams()
    history.replaceState(null, '', `#${entry.id}`)
    const list = entries()
    const position = list.indexOf(entry) + 1
    $('.detail-count').textContent = `${position} / ${list.length}`
    $('.detail-status').textContent = `${entry.title}, ${position} of ${list.length}`
    dialog.querySelectorAll('.detail-prev, .detail-next').forEach((b) => { b.disabled = list.length < 2 })
  }

  // Slide the old component out and the next one in, keeping the dialog open.
  async function swap(entry, dir) {
    if (swapping || entry === current?.entry) return
    swapping = true
    const mod = await entry.load()
    const parts = [host, $('.detail-group'), $('.detail-title'), $('.detail-desc'), form]
    const t = reduceMotion() ? 0 : 1
    gsap.timeline({ onComplete: () => { swapping = false } })
      .to(parts, { opacity: 0, x: -dir * 16, duration: 0.16 * t, ease: 'power2.in' })
      .add(() => {
        current.instance?.destroy()
        setEntry(entry, mod)
        remount()
      })
      .fromTo(parts, { opacity: 0, x: dir * 16 }, { opacity: 1, x: 0, duration: 0.28 * t, ease: 'power3.out', stagger: 0.03 * t, clearProps: 'transform,opacity' })
  }

  const go = (dir) => {
    const list = entries()
    if (!current || list.length < 2) return
    swap(list[(list.indexOf(current.entry) + dir + list.length) % list.length], dir)
  }

  async function open(entry, fromEl) {
    if (current && dialog.open) return swap(entry, 1)
    const mod = await entry.load()
    setEntry(entry, mod)
    dialog.showModal()
    remount()
    if (reduceMotion()) return
    // Grow out of the card that was clicked.
    const from = fromEl?.getBoundingClientRect()
    const to = dialog.getBoundingClientRect()
    const start = from
      ? { x: from.left + from.width / 2 - (to.left + to.width / 2), y: from.top + from.height / 2 - (to.top + to.height / 2), scale: from.width / to.width }
      : { scale: 0.96 }
    gsap.fromTo(dialog, { ...start, opacity: 0, filter: 'blur(10px)' }, { x: 0, y: 0, scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.45, ease: 'power3.out', clearProps: 'filter' })
  }

  function close(instant) {
    const closing = current
    if (!closing) return
    const finish = () => {
      closing.instance?.destroy()
      host.replaceChildren()
      if (current === closing) current = null
      dialog.close()
      history.replaceState(null, '', location.pathname + location.search)
    }
    if (instant || reduceMotion()) return finish()
    gsap.to(dialog, { opacity: 0, scale: 0.97, filter: 'blur(6px)', duration: 0.2, ease: 'power2.in', onComplete: finish })
  }

  dialog.addEventListener('cancel', (e) => { e.preventDefault(); close() })
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close() })
  $('.detail-close').addEventListener('click', () => close())
  $('.detail-prev').addEventListener('click', () => go(-1))
  $('.detail-next').addEventListener('click', () => go(1))
  // Arrow keys belong to the component while focus is inside the preview, and to sliders in the params.
  dialog.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    if (host.contains(e.target) || e.target.closest('input, textarea, select, [contenteditable]')) return
    e.preventDefault()
    go(e.key === 'ArrowRight' ? 1 : -1)
  })
  form.addEventListener('submit', (e) => e.preventDefault())
  $('.detail-copy').addEventListener('click', async () => {
    try {
      const code = await sources[`../components/${current.entry.id}.js`]()
      await navigator.clipboard.writeText(code)
      toast(toastEl, 'Code copied')
    } catch {
      toast(toastEl, 'Copy failed')
    }
  })

  return { open, close }
}
