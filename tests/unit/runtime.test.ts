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
})
