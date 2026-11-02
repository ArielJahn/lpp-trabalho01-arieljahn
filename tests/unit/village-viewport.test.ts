import { describe, expect, it } from 'vitest'
import { calculateVillageViewport } from '../../game/villageViewport'

describe('village viewport', () => {
  it('caps canvas height to a stable 16:9 viewport instead of following growing content', () => {
    expect(calculateVillageViewport(800, 100_000)).toEqual({ width: 800, height: 450 })
  })

  it('keeps a usable minimum without producing invalid dimensions', () => {
    expect(calculateVillageViewport(0, Number.NaN)).toEqual({ width: 320, height: 180 })
  })
})
