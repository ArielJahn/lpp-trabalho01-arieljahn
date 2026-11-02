import { describe, expect, it } from 'vitest'
import { EVENTS } from '../../shared/arionion/contracts'
import { createGameRuntime } from '../../server/arionion/runtime'

describe('authoritative runtime', () => {
  it('synchronizes only the newly connected socket', () => {
    const runtime = createGameRuntime({ now: () => 0 })
    const emissions = runtime.connect({ socketId: 'p1', name: 'Ari', role: 'player' })
    expect(emissions).toHaveLength(1)
    expect(emissions[0]).toMatchObject({ scope: 'socket', socketId: 'p1', event: EVENTS.stateSynchronized })
  })

  it('broadcasts accepted facts with state and cause', () => {
    const runtime = createGameRuntime({ now: () => 100 })
    runtime.connect({ socketId: 'm', name: 'Mestre', role: 'master' })
    const [emission] = runtime.dispatch('m', EVENTS.openingRequested)
    expect(emission).toMatchObject({ scope: 'all', event: EVENTS.seasonStarted })
    expect(emission!.payload).toMatchObject({ cause: EVENTS.openingRequested, state: { phase: 'open' } })
  })

  it('rejects malformed or unauthorized requests only to their socket', () => {
    const runtime = createGameRuntime({ now: () => 0 })
    runtime.connect({ socketId: 'p', name: 'Ari', role: 'player' })
    const [emission] = runtime.dispatch('p', EVENTS.openingRequested, { unexpected: true })
    expect(emission).toMatchObject({ scope: 'socket', socketId: 'p', event: EVENTS.operationRejected })
    expect(runtime.snapshot().phase).toBe('waiting')
  })

  it('lets one request take the last worker and privately rejects the next', () => {
    let now = 0
    const runtime = createGameRuntime({ now: () => ++now })
    runtime.connect({ socketId: 'm', name: 'Mestre', role: 'master' })
    runtime.connect({ socketId: 'a', name: 'A', role: 'player' })
    runtime.connect({ socketId: 'b', name: 'B', role: 'player' })
    runtime.dispatch('m', EVENTS.openingRequested)
    expect(runtime.dispatch('a', EVENTS.constructionRequested)[0]?.event).toBe(EVENTS.constructionStarted)
    expect(runtime.dispatch('b', EVENTS.constructionRequested)[0]?.event).toBe(EVENTS.constructionStarted)
    const [rejection] = runtime.dispatch('a', EVENTS.constructionRequested)
    expect(rejection).toMatchObject({ scope: 'socket', socketId: 'a', event: EVENTS.operationRejected })
    expect(runtime.snapshot().workers.busy).toBe(2)
    expect(runtime.snapshot().rawOnions).toBe(40)
  })

  it('applies scheduled construction and production effects on the authoritative state', () => {
    const scheduled: import('../../server/arionion/domain').ScheduledEffect[] = []
    const runtime = createGameRuntime({ now: () => 0, scheduler: { schedule: effect => scheduled.push(effect) } })
    runtime.connect({ socketId: 'm', name: 'Mestre', role: 'master' })
    runtime.connect({ socketId: 'p', name: 'Ari', role: 'player' })
    runtime.dispatch('m', EVENTS.openingRequested)
    runtime.dispatch('p', EVENTS.constructionRequested)
    const completion = scheduled.find(effect => effect.type === 'construction.complete')!
    expect(runtime.processEffect(completion)[0]?.event).toBe(EVENTS.constructionCompleted)
    const production = { type: 'beds.produce', dueAt: 13_000, seasonId: 1 }
    expect(runtime.processEffect(production)[0]?.event).toBe(EVENTS.resourceProduced)
    expect(runtime.snapshot().rawOnions).toBe(80)
  })

  it('restarts for the master, preserves connections and invalidates old effects', () => {
    const cancelled: number[] = []
    const runtime = createGameRuntime({ now: () => 1_000, scheduler: { schedule: () => {}, cancelSeason: id => cancelled.push(id) } })
    runtime.connect({ socketId: 'm', name: 'Mestre', role: 'master' })
    runtime.connect({ socketId: 'p', name: 'Ari', role: 'player' })
    runtime.dispatch('m', EVENTS.openingRequested)
    runtime.dispatch('m', EVENTS.closingRequested)

    const [restarted] = runtime.dispatch('m', EVENTS.restartRequested)
    expect(restarted).toMatchObject({ scope: 'all', event: EVENTS.seasonRestarted, payload: { state: { phase: 'waiting', rawOnions: 100 } } })
    expect(cancelled).toEqual([1, 1])
    expect(runtime.dispatch('p', EVENTS.openingRequested)[0]).toMatchObject({ socketId: 'p', event: EVENTS.operationRejected })
    expect(runtime.processEffect({ type: 'beds.produce', dueAt: 6_000, seasonId: 1 })).toEqual([])
    expect(runtime.dispatch('m', EVENTS.openingRequested)[0]?.event).toBe(EVENTS.seasonStarted)
  })

  it('never accepts an old production effect after the restarted season is reopened', () => {
    const scheduled: import('../../server/arionion/domain').ScheduledEffect[] = []
    const runtime = createGameRuntime({ now: () => 1_000, scheduler: { schedule: effect => scheduled.push(effect), cancelSeason: () => {} } })
    runtime.connect({ socketId: 'm', name: 'Mestre', role: 'master' })
    runtime.connect({ socketId: 'p', name: 'Ari', role: 'player' })
    runtime.dispatch('m', EVENTS.openingRequested)
    const oldProduction = scheduled.find(effect => effect.type === 'beds.produce')!
    runtime.dispatch('m', EVENTS.closingRequested)
    runtime.dispatch('m', EVENTS.restartRequested)
    runtime.dispatch('m', EVENTS.openingRequested)
    runtime.dispatch('p', EVENTS.constructionRequested)
    const newCompletion = scheduled.find(effect => effect.type === 'construction.complete' && effect.seasonId === runtime.snapshot().seasonId)!
    runtime.processEffect(newCompletion)
    const before = runtime.snapshot().rawOnions

    expect(runtime.processEffect(oldProduction)).toEqual([])
    expect(runtime.snapshot().rawOnions).toBe(before)
    expect(runtime.snapshot().seasonId).toBe(2)
  })
})
