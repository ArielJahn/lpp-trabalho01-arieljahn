import { describe, expect, it } from 'vitest'
import { EVENTS, createInitialState } from '../../shared/arionion/contracts'
import { createOnionVillageAdapter, type VillageDriver } from '../../game/createOnionVillage'

function driver() {
  const calls: string[] = []
  const instance: VillageDriver = {
    sync: () => calls.push('sync'),
    seasonStarted: () => calls.push('seasonStarted'),
    constructionStarted: () => calls.push('constructionStarted'),
    constructionCompleted: () => calls.push('constructionCompleted'),
    resourceProduced: () => calls.push('resourceProduced'),
    onionSprouted: () => calls.push('onionSprouted'),
    upgradeCompleted: () => calls.push('upgradeCompleted'),
    rejected: () => calls.push('rejected'),
    seasonClosed: () => calls.push('seasonClosed'),
    destroy: () => calls.push('destroy'),
  }
  return { instance, calls }
}

describe('OnionVillageAdapter', () => {
  it('queues events before ready and flushes each exactly once', () => {
    const fake = driver()
    const adapter = createOnionVillageAdapter()
    adapter.handle(EVENTS.constructionStarted, { state: createInitialState() })
    adapter.handle(EVENTS.resourceProduced, { state: createInitialState() })
    expect(fake.calls).toEqual([])
    adapter.ready(fake.instance)
    expect(fake.calls).toEqual(['constructionStarted', 'resourceProduced'])
    adapter.ready(fake.instance)
    expect(fake.calls).toEqual(['constructionStarted', 'resourceProduced'])
  })

  it('maps every visual fact to the matching driver reaction', () => {
    const fake = driver()
    const adapter = createOnionVillageAdapter()
    adapter.ready(fake.instance)
    const payload = { state: createInitialState(), reason: 'Sem colhedor' }
    for (const event of [EVENTS.stateSynchronized, EVENTS.seasonStarted, EVENTS.constructionStarted,
      EVENTS.constructionCompleted, EVENTS.resourceProduced, EVENTS.onionSprouted,
      EVENTS.upgradeCompleted, EVENTS.operationRejected, EVENTS.seasonClosed]) adapter.handle(event, payload)
    expect(fake.calls).toEqual(['sync', 'seasonStarted', 'constructionStarted', 'constructionCompleted',
      'resourceProduced', 'onionSprouted', 'upgradeCompleted', 'rejected', 'seasonClosed'])
  })

  it('destroys the driver and ignores later events', () => {
    const fake = driver()
    const adapter = createOnionVillageAdapter()
    adapter.ready(fake.instance)
    adapter.destroy()
    adapter.destroy()
    adapter.handle(EVENTS.seasonStarted, { state: createInitialState() })
    expect(fake.calls).toEqual(['destroy'])
  })

  it('immediately destroys a driver that becomes ready after adapter teardown', () => {
    const fake = driver()
    const adapter = createOnionVillageAdapter()
    adapter.destroy()

    adapter.ready(fake.instance)

    expect(fake.calls).toEqual(['destroy'])
  })
})
