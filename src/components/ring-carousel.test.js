import test from 'node:test'
import assert from 'node:assert/strict'
import { tileOpacity, ringGeometry } from './ring-carousel.js'

test('tiles fade from front to back', () => {
  assert.equal(tileOpacity(0), 1)
  assert.ok(Math.abs(tileOpacity(180) - 0.45) < 1e-9)
  assert.ok(tileOpacity(90) > 0.45 && tileOpacity(90) < 1)
})

test('ring fits the stage without tiles overlapping', () => {
  const g = ringGeometry(600, 450, 12)
  assert.ok(g.radius * 2 <= 600)
  assert.ok(g.tileW * 12 < 2 * Math.PI * g.radius)
})
