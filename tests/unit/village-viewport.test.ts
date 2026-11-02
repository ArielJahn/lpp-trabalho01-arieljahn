import { describe, expect, it } from 'vitest'
import { VILLAGE_FRAME_STYLE, calculateVillageViewport } from '../../game/villageViewport'

describe('village viewport', () => {
  it('caps canvas height to a stable 16:9 viewport instead of following growing content', () => {
    expect(calculateVillageViewport(800, 100_000)).toEqual({ width: 800, height: 450 })
  })

  it('keeps a usable minimum without producing invalid dimensions', () => {
    expect(calculateVillageViewport(0, Number.NaN)).toEqual({ width: 320, height: 180 })
  })

  it('keeps the mobile frame border inside its width without overriding 16:9', () => {
    expect(VILLAGE_FRAME_STYLE).toEqual({ aspectRatio: '16 / 9', boxSizing: 'border-box', minHeight: '0' })
  })
})
