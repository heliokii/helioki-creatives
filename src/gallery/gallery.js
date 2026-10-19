import { gsap } from 'gsap'
import { components, groups } from '../components/registry.js'
import { makeTiles } from '../placeholders.js'
import { createDetail } from './detail.js'
import { likeButton, reduceMotion, slidingTabs } from './ui.js'

const HEART = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/></svg>'

const imagesFor = (values) => makeTiles(values.count ?? 12)
const defaults = (mod) => Object.fromEntries(mod.params.map((p) => [p.id, p.default]))

export function createGallery(page) {
  const grid = page.querySelector('.grid')
  const tabs = page.querySelector('.tabs')
  const detail = createDetail(document.querySelector('.detail'), {
    imagesFor,
    entries: () => items.filter((i) => !i.card.hidden).map((i) => i.entry),
  })

  for (const [filter, label] of [['all', 'All'], ...Object.entries(groups)]) {
    const tab = Object.assign(document.createElement('button'), { type: 'button', className: 'tab', textContent: label })
    tab.dataset.filter = filter
    tab.setAttribute('aria-pressed', String(filter === 'all'))
    tabs.append(tab)
  }

  const items = components.map((entry) => {
    const card = document.createElement('article')
    card.className = entry.group === 'featured' ? 'card is-featured' : 'card'
    card.innerHTML = `
      <div class="card-preview"><div class="card-stage" inert></div></div>
      <footer class="card-foot">
        <div><h2 class="card-title"><button type="button" class="card-open"></button></h2><p class="card-credit"></p></div>
        <button type="button" class="like">${HEART}</button>
      </footer>`
    card.querySelector('.card-open').textContent = entry.title
    card.querySelector('.card-credit').textContent = groups[entry.group]
    const like = card.querySelector('.like')
    like.setAttribute('aria-label', `Like ${entry.title}`)
    likeButton(like, entry.id)
    card.querySelector('.card-open').addEventListener('click', () => detail.open(entry, card))
    grid.append(card)
    return { entry, card, stage: card.querySelector('.card-stage'), instance: null, visible: false }
  })

  // Only previews on screen run their loops.
  const observer = new IntersectionObserver((entries) => entries.forEach(async ({ target, isIntersecting }) => {
    const item = items.find((i) => i.stage === target)
    item.visible = isIntersecting
    if (isIntersecting && !item.instance) {
      const mod = await item.entry.load()
      if (!item.visible || item.instance) return
      const values = defaults(mod)
      item.instance = mod.mount(item.stage, { ...values, images: imagesFor(values), preview: true })
    } else if (!isIntersecting && item.instance) {
      item.instance.destroy()
      item.instance = null
    }
  }), { rootMargin: '120px' })
  items.forEach((item) => observer.observe(item.stage))

  slidingTabs(tabs, (filter) => {
    const shown = items.filter(({ entry, card }) => {
      card.hidden = filter !== 'all' && entry.group !== filter
      return !card.hidden
    })
    if (!reduceMotion()) gsap.fromTo(shown.map((i) => i.card), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.04, ease: 'power3.out' })
  })

  const openFromHash = () => {
    const item = items.find((i) => i.entry.id === location.hash.slice(1))
    if (item) detail.open(item.entry, item.card)
  }
  window.addEventListener('hashchange', openFromHash)
  openFromHash()
}
