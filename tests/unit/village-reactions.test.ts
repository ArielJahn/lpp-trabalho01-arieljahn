import { describe, expect, it } from 'vitest'
import { EVENTS, createInitialState } from '../../shared/arionion/contracts'
import { createReactionQueue, reactionForEvent, reactionMessage } from '../../game/villageReactions'

describe('village reactions', () => {
  it.each([
    [EVENTS.seasonStarted, {}, { type: 'celebrate', message: 'Temporada aberta!' }],
    [EVENTS.constructionStarted, { kind: 'bed' }, { type: 'build', phase: 'started', kind: 'bed' }],
    [EVENTS.constructionCompleted, { kind: 'curing-shed' }, { type: 'build', phase: 'completed', kind: 'curing-shed' }],
    [EVENTS.resourceProduced, { resource: 'preserve', quantity: 4 }, { type: 'produce', resource: 'preserve', quantity: 4 }],
    [EVENTS.onionSprouted, { quantity: 6 }, { type: 'sprout', quantity: 6 }],
    [EVENTS.upgradeCompleted, {}, { type: 'upgrade' }],
    [EVENTS.operationRejected, { reason: 'Sem colhedor' }, { type: 'reject', reason: 'Sem colhedor' }],
    [EVENTS.seasonClosed, {}, { type: 'rest' }],
    ['desconhecido', {}, { type: 'none' }],
  ])('maps %s to one pure visual reaction', (event, payload, expected) => {
    expect(reactionForEvent(event, payload)).toEqual(expected)
  })

  it('shows the authoritative resulting stock in production and sprouting messages', () => {
    const state = { ...createInitialState(), rawOnions: 80 }
    const produced = reactionForEvent(EVENTS.resourceProduced, { resource: 'raw-onion', quantity: 20, state })
    const sprouted = reactionForEvent(EVENTS.onionSprouted, { quantity: 20, state: { ...state, rawOnions: 60 } })

    expect(reactionMessage(produced)).toBe('+20 cebolas · estoque: 80')
    expect(reactionMessage(sprouted)).toBe('20 cebolas brotaram · estoque: 60')
  })

  it('coalesces consecutive production of the same resource', () => {
    const queue = createReactionQueue()
    queue.enqueue({ type: 'produce', resource: 'onion', quantity: 4 })
    queue.enqueue({ type: 'produce', resource: 'onion', quantity: 6 })
    expect(queue.size()).toBe(1)
    expect(queue.dequeue()).toEqual({ type: 'produce', resource: 'onion', quantity: 10 })
  })

  it('combines simultaneous sprouting and raw production into one current-stock reaction', () => {
    const queue = createReactionQueue()
    queue.enqueue({ type: 'sprout', quantity: 20, stock: 60 })
    queue.enqueue({ type: 'produce', resource: 'raw-onion', quantity: 20, stock: 80 })

    expect(queue.size()).toBe(1)
    expect(reactionMessage(queue.dequeue()!)).toBe('20 brotaram · +20 novas · estoque: 80')
  })

  it('keeps at most six useful reactions and clears pending work', () => {
    const queue = createReactionQueue()
    queue.enqueue({ type: 'none' })
    for (let index = 1; index <= 8; index++) queue.enqueue({ type: 'sprout', quantity: index })
    expect(queue.size()).toBe(6)
    expect(queue.dequeue()).toEqual({ type: 'sprout', quantity: 3 })
    queue.clear()
    expect(queue.size()).toBe(0)
  })
})
