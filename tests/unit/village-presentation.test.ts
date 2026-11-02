import { describe, expect, it } from 'vitest'
import { eventsAfterId, shouldRunVillageEffects, shouldShowSeasonOverlay } from '../../game/villagePresentation'

describe('village presentation state', () => {
  it('continues after a capped 100-event history replaces its oldest record', () => {
    const capped = Array.from({ length: 100 }, (_, index) => ({ id: index + 2 }))
    expect(eventsAfterId(capped, 100).map(event => event.id)).toEqual([101])
  })

  it('shows the closing overlay only while the authoritative phase is closed', () => {
    expect(shouldShowSeasonOverlay('closed')).toBe(true)
    expect(shouldShowSeasonOverlay('waiting')).toBe(false)
    expect(shouldShowSeasonOverlay('open')).toBe(false)
  })

  it('runs visual effects only during an open season', () => {
    expect(shouldRunVillageEffects('open')).toBe(true)
    expect(shouldRunVillageEffects('closed')).toBe(false)
    expect(shouldRunVillageEffects('waiting')).toBe(false)
  })
})
