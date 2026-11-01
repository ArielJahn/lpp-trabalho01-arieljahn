import { afterEach, describe, expect, it, vi } from 'vitest'
import { createInitialState } from '../../shared/arionion/contracts'
import {
  expireLots,
  processCannery,
  processCuring,
  produceOnions,
} from '../../server/arionion/domain'
import { createManualScheduler, createScheduler } from '../../server/arionion/scheduler'

afterEach(() => vi.useRealTimers())

describe('production chain', () => {
  it('produces expiring onion lots from every bed', () => {
    const state = createInitialState()
    state.phase = 'open'; state.seasonId = 1; state.buildings.beds = 2
    const transition = produceOnions(state, 5_000)
    expect(transition.state.rawOnions).toBe(120)
    expect(transition.state.rawOnionLots.at(-1)).toMatchObject({ quantity: 20, expiresAt: 25_000 })
  })

  it('cures the oldest onions and makes preserves', () => {
    const state = createInitialState()
    state.phase = 'open'; state.buildings.curingSheds = 1; state.buildings.canneries = 1
    state.rawOnionLots = [
      { id: 'later', quantity: 10, expiresAt: 30_000 },
      { id: 'first', quantity: 10, expiresAt: 20_000 },
    ]; state.rawOnions = 20
    const cured = processCuring(state)
    expect(cured.state.rawOnionLots).toEqual([{ id: 'later', quantity: 10, expiresAt: 30_000 }])
    expect(cured.state.curedOnions).toBe(10)
    const canned = processCannery(cured.state)
    expect(canned.state.curedOnions).toBe(2)
    expect(canned.state.preserves).toBe(4)
  })

  it('applies the linear upgrade multiplier with floor rounding', () => {
    const state = createInitialState()
    state.phase = 'open'; state.buildings.beds = 1; state.upgradeLevel = 1
    expect(produceOnions(state, 5_000).state.rawOnions).toBe(111)
  })

  it('removes only the remaining quantity from expired lots', () => {
    const state = createInitialState()
    state.phase = 'open'
    state.rawOnionLots = [
      { id: 'expired', quantity: 6, expiresAt: 20_000 },
      { id: 'safe', quantity: 4, expiresAt: 21_000 },
    ]; state.rawOnions = 10
    const transition = expireLots(state, 20_000)
    expect(transition.state.rawOnions).toBe(4)
    expect(transition.facts[0]?.event).toBe('cebola.brotada')
  })
})

describe('deterministic scheduler', () => {
  it('orders ties by sprouting, construction, beds, curing and cannery', () => {
    const scheduler = createManualScheduler(0)
    for (const type of ['cannery.process', 'beds.produce', 'construction.complete', 'curing.process', 'onions.expire']) {
      scheduler.schedule({ type, dueAt: 5_000, seasonId: 1 })
    }
    expect(scheduler.advanceTo(5_000).map(effect => effect.type)).toEqual([
      'onions.expire', 'construction.complete', 'beds.produce', 'curing.process', 'cannery.process',
    ])
  })

  it('cancels every pending effect from a closed season', () => {
    const scheduler = createManualScheduler(0)
    scheduler.schedule({ type: 'beds.produce', dueAt: 5_000, seasonId: 1 })
    scheduler.schedule({ type: 'beds.produce', dueAt: 5_000, seasonId: 2 })
    scheduler.cancelSeason(1)
    expect(scheduler.advanceTo(5_000).map(effect => effect.seasonId)).toEqual([2])
  })

  it('delivers real due effects and stops cleanly', () => {
    vi.useFakeTimers()
    const delivered: string[] = []
    const scheduler = createScheduler(effect => delivered.push(effect.type), () => Date.now())
    scheduler.schedule({ type: 'beds.produce', dueAt: 100, seasonId: 1 })
    scheduler.start()
    vi.advanceTimersByTime(100)
    expect(delivered).toEqual(['beds.produce'])
    scheduler.stop()
    expect(vi.getTimerCount()).toBe(0)
  })
})
