import test from 'node:test'
import assert from 'node:assert/strict'
import { stepDot } from './dot-field.js'

const dot = (x = 0, y = 0) => ({ hx: 0, hy: 0, x, y, vx: 0, vy: 0 })
const run = (d, px, py, pull, frames = 120) => {
  for (let i = 0; i < frames; i++) stepDot(d, px, py, pull)
}

test('dots near the pointer sag toward it without passing it', () => {
  const d = dot()
  run(d, 60, 0, 1)
  assert.ok(d.x > 10 && d.x < 60)
  assert.ok(Math.abs(d.y) < 1e-9)
})

test('dots far from the pointer barely move', () => {
  const d = dot()
  run(d, 3000, 0, 1)
  assert.ok(Math.abs(d.x) < 0.5)
})

test('dots spring home once gravity is released', () => {
  const d = dot(40, -30)
  run(d, 0, 0, 0)
  assert.ok(Math.hypot(d.x, d.y) < 0.01)
})
