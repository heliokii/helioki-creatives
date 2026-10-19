import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { components, groups } from './registry.js'
import { monogram, guestLabel, springStep } from './wedding-rsvp.js'
import { poseFor } from './cursor-dog.js'

test('dog pose follows the cursor direction', () => {
  assert.equal(poseFor(100, 0, 20), 'right')
  assert.equal(poseFor(0, 100, 20), 'down')
  assert.equal(poseFor(-100, 0, 20), 'left')
  assert.equal(poseFor(0, -100, 20), 'up')
  assert.equal(poseFor(70, -70, 20), 'up-right')
  assert.equal(poseFor(-70, -70, 20), 'up-left')
  assert.equal(poseFor(70, 70, 20), 'down-right')
  assert.equal(poseFor(5, 5, 20), 'front')
})
import { loopDistance } from './cover-flow.js'
import { wrapCentered } from './column-drift.js'
import { sanitizeCode } from './otp-input.js'
import { labelFor } from './effort-slider.js'
import { bestAnswer, FAQ } from './infinite-faq.js'
import { charFor, RAMP } from './ascii-reveal.js'
import { DIGITS } from './departure-board.js'

test('components only use the shared palette, with matching fallbacks', () => {
  const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8')
  const palette = Object.fromEntries([...css.matchAll(/--hc-([a-z0-9-]+):\s*(#[0-9a-f]{6})/g)].map((m) => [m[1], m[2]]))
  const allowed = new Set(Object.values(palette))
  assert.equal(allowed.size, 16)
  const dir = new URL('./', import.meta.url)
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.js') && !f.endsWith('.test.js'))) {
    const src = readFileSync(new URL(file, dir), 'utf8')
    const named = [
      ...src.matchAll(/var\(--hc-([a-z0-9-]+), (#[0-9a-f]{6})\)/g),
      ...src.matchAll(/token\(stage, '([a-z0-9-]+)', '(#[0-9a-f]{6})'\)/g),
      ...src.matchAll(/\['([a-z0-9-]+)', '(#[0-9a-f]{6})'\]/g),
      ...src.matchAll(/'?([a-z0-9-]+)'?: '(#[0-9a-f]{6})'/g),
    ]
    for (const [, name, hex] of named) assert.equal(hex, palette[name], `${file}: --hc-${name} fallback`)
    for (const [hex] of src.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)) assert.ok(allowed.has(hex.toLowerCase()), `${file}: ${hex} is not a palette color`)
    assert.ok(!/hsl\(/.test(src), `${file}: uses hsl()`)
  }
})

test('code input keeps digits only, up to the length', () => {
  assert.equal(sanitizeCode('12a3-45', 6), '12345')
  assert.equal(sanitizeCode('123456789', 6), '123456')
})

test('effort label follows the stops', () => {
  assert.equal(labelFor(0), 'Quick')
  assert.equal(labelFor(30), 'Balanced')
  assert.equal(labelFor(79), 'Deep')
  assert.equal(labelFor(100), 'Galaxy brain')
})

test('FAQ matches typed questions by shared words', () => {
  assert.equal(bestAnswer('can I export to mp4?'), FAQ[1])
  assert.equal(bestAnswer('what about pricing'), FAQ[0])
  assert.equal(bestAnswer('weather in paris'), null)
})

test('ASCII ramp maps dark to blank and light to dense', () => {
  assert.equal(charFor(0), ' ')
  assert.equal(charFor(1), RAMP.at(-1))
  assert.equal(charFor(0.5), RAMP[5])
})

test('clock glyphs are 7 rows, digits 5 wide', () => {
  for (const [ch, glyph] of Object.entries(DIGITS)) {
    assert.equal(glyph.length, 7, ch)
    assert.ok(glyph.every((row) => row.length === (ch === ':' ? 1 : 5)), ch)
  }
})

test('every component loads and exposes a valid contract', async () => {
  const ids = new Set()
  for (const entry of components) {
    assert.ok(!ids.has(entry.id), `duplicate id ${entry.id}`)
    ids.add(entry.id)
    assert.ok(groups[entry.group], `${entry.id} has unknown group`)
    const mod = await entry.load()
    assert.equal(typeof mod.mount, 'function', `${entry.id} mount`)
    assert.ok(Array.isArray(mod.params), `${entry.id} params`)
    for (const p of mod.params) assert.ok(p.min <= p.default && p.default <= p.max, `${entry.id}.${p.id} default out of range`)
  }
})

test('wedding RSVP monogram and guest wording', () => {
  assert.equal(monogram('Amara', 'Julian'), 'A&J')
  assert.equal(guestLabel(1), '1 guest')
  assert.equal(guestLabel(3), '3 guests')
})

test('paper spring settles on its target, and overshoots when underdamped', () => {
  const settled = { x: 0, v: 0 }
  for (let i = 0; i < 300; i++) springStep(settled, 1, 120, 14, 1 / 60)
  assert.ok(Math.abs(settled.x - 1) < 1e-3)
  const bouncy = { x: 0, v: 0 }
  let peak = 0
  for (let i = 0; i < 120; i++) peak = Math.max(peak, springStep(bouncy, 1, 120, 4, 1 / 60).x)
  assert.ok(peak > 1.2)
})

test('cover flow distance takes the short way around the loop', () => {
  assert.equal(loopDistance(0, 8, 9), 1)
  assert.equal(loopDistance(8, 0, 9), -1)
  assert.equal(loopDistance(3, 3, 9), 0)
})

test('column wrap stays centered on the stage', () => {
  assert.equal(wrapCentered(0, 100), 0)
  assert.equal(wrapCentered(60, 100), -40)
  assert.equal(wrapCentered(-60, 100), 40)
})
