import { gsap } from 'gsap'

// Original takes on transitions.dev patterns: sliding tabs, like burst, toast.

export const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

// Toggle-button group whose highlight pill glides to the pressed button.
export function slidingTabs(group, onSelect) {
  const pill = group.querySelector('.tabs-pill')
  const tabs = [...group.querySelectorAll('.tab')]
  const pressed = () => tabs.find((t) => t.getAttribute('aria-pressed') === 'true')
  const moveTo = (tab, instant) => gsap.to(pill, {
    x: tab.offsetLeft,
    width: tab.offsetWidth,
    duration: instant || reduceMotion() ? 0 : 0.35,
    ease: 'power3.out',
  })
  tabs.forEach((tab) => tab.addEventListener('click', () => {
    tabs.forEach((t) => t.setAttribute('aria-pressed', String(t === tab)))
    moveTo(tab)
    onSelect(tab.dataset.filter)
  }))
  // Font loading and wrapping change tab widths, so re-measure on resize.
  new ResizeObserver(() => moveTo(pressed(), true)).observe(group)
}

const LIKES_KEY = 'helioki-likes'
const readLikes = () => {
  try { return new Set(JSON.parse(localStorage.getItem(LIKES_KEY)) || []) } catch { return new Set() }
}
const writeLikes = (likes) => {
  try { localStorage.setItem(LIKES_KEY, JSON.stringify([...likes])) } catch { /* private mode: like stays for this page view */ }
}

// Heart that pops and throws sparks when liked; remembered per browser.
export function likeButton(button, id) {
  button.setAttribute('aria-pressed', String(readLikes().has(id)))
  button.addEventListener('click', () => {
    const likes = readLikes()
    const on = button.getAttribute('aria-pressed') !== 'true'
    if (on) likes.add(id)
    else likes.delete(id)
    writeLikes(likes)
    button.setAttribute('aria-pressed', String(on))
    if (!on || reduceMotion()) return
    gsap.fromTo(button.querySelector('svg'), { scale: 0.6 }, { scale: 1, duration: 0.5, ease: 'back.out(4)' })
    for (let i = 0; i < 8; i++) {
      const spark = document.createElement('i')
      spark.className = 'like-spark'
      button.append(spark)
      const a = (i / 8) * Math.PI * 2
      gsap.to(spark, { x: Math.cos(a) * 16, y: Math.sin(a) * 16, scale: 0, duration: 0.5, ease: 'power2.out', onComplete: () => spark.remove() })
    }
  })
}

let hideToast
export function toast(el, message) {
  el.textContent = message
  hideToast?.kill()
  gsap.killTweensOf(el)
  gsap.fromTo(el,
    { autoAlpha: 0, y: 12, scale: 0.96, filter: 'blur(6px)' },
    { autoAlpha: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: reduceMotion() ? 0 : 0.35, ease: 'power3.out' })
  hideToast = gsap.delayedCall(1.8, () => gsap.to(el, { autoAlpha: 0, y: 6, filter: 'blur(4px)', duration: 0.25 }))
}
