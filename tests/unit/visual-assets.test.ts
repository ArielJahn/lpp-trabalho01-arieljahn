import { describe, expect, it } from 'vitest'
import { BUILDING_FRAMES, ONION_FRAMES, VISUAL_ASSETS } from '../../game/visualAssets'

describe('visual asset catalogue', () => {
  it('keeps every runtime asset local to the project', () => {
    expect(VISUAL_ASSETS).toEqual({
      mascots: '/assets/visual/onion-mascots.png',
      buildings: '/assets/visual/onion-buildings.png',
      field: '/assets/visual/onion-field.png',
    })
  })

  it('provides equally sized frames for every onion emotion', () => {
    expect(Object.keys(ONION_FRAMES)).toEqual(['idle', 'work', 'cry', 'sprout', 'celebrate'])
    const frames = Object.values(ONION_FRAMES)
    expect(new Set(frames.map(frame => `${frame.width}x${frame.height}`))).toEqual(new Set(['512x512']))
    expect(frames.every(frame => [frame.x, frame.y, frame.width, frame.height]
      .every(value => Number.isInteger(value) && value >= 0))).toBe(true)
  })

  it('provides one positive frame for every production building', () => {
    expect(Object.keys(BUILDING_FRAMES)).toEqual(['bed', 'curingShed', 'cannery'])
    expect(Object.values(BUILDING_FRAMES).every(frame => frame.width > 0 && frame.height > 0)).toBe(true)
  })
})
