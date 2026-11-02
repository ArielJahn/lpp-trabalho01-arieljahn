import { describe, expect, it } from 'vitest'
import { EVENTS, createInitialState } from '../../shared/arionion/contracts'
import { createAriOnionClient } from '../../composables/useAriOnionSocket'

class FakeClientSocket {
  handlers = new Map<string, (payload?: any) => void>()
  sent: Array<[string, unknown]> = []
  on(event: string, handler: (payload?: any) => void) { this.handlers.set(event, handler); return this }
  emit(event: string, payload?: unknown) { this.sent.push([event, payload]); return this }
  disconnect() {}
  trigger(event: string, payload?: unknown) { this.handlers.get(event)?.(payload) }
}

describe('AriOnion client projection', () => {
  it('records requests without changing resources before a server fact', () => {
    const socket = new FakeClientSocket()
    const client = createAriOnionClient(() => socket)
    client.connect('Ari', 'player')
    const initial = createInitialState()
    socket.trigger(EVENTS.stateSynchronized, { state: { ...initial, nextBuilding: 'bed', upgradeCost: 20 }, cause: 'conexao' })
    client.requestConstruction()
    expect(client.state.value.rawOnions).toBe(100)
    expect(socket.sent.at(-1)?.[0]).toBe(EVENTS.constructionRequested)
    expect(client.events.value.at(-1)).toMatchObject({ direction: 'emit', name: EVENTS.constructionRequested, kind: 'request' })
  })

  it('projects server snapshots and records cause and reaction', () => {
    const socket = new FakeClientSocket()
    const client = createAriOnionClient(() => socket)
    client.connect('Ari', 'player')
    const state = { ...createInitialState(), phase: 'open' as const, nextBuilding: 'bed' as const, upgradeCost: 20 }
    socket.trigger(EVENTS.seasonStarted, { state, cause: EVENTS.openingRequested })
    expect(client.state.value.phase).toBe('open')
    expect(client.events.value.at(-1)).toMatchObject({
      direction: 'on', name: EVENTS.seasonStarted, cause: EVENTS.openingRequested, kind: 'fact',
    })
    expect(client.events.value.at(-1)?.reaction).toContain('temporada')
  })

  it('requests a restart and projects the authoritative restarted season', () => {
    const socket = new FakeClientSocket()
    const client = createAriOnionClient(() => socket)
    client.connect('Mestre', 'master')

    client.restartSeason()
    expect(socket.sent.at(-1)?.[0]).toBe(EVENTS.restartRequested)
    expect(client.events.value.at(-1)).toMatchObject({
      direction: 'emit', name: EVENTS.restartRequested, kind: 'request',
    })

    const state = { ...createInitialState(), nextBuilding: 'bed' as const, upgradeCost: 20 }
    socket.trigger(EVENTS.seasonRestarted, { state, cause: EVENTS.restartRequested })

    expect(client.state.value.phase).toBe('waiting')
    expect(client.events.value.at(-1)).toMatchObject({
      direction: 'on', name: EVENTS.seasonRestarted, cause: EVENTS.restartRequested, kind: 'fact',
    })
    expect(client.events.value.at(-1)?.reaction).toContain('nova temporada')
  })

  it('records private rejections without replacing the state', () => {
    const socket = new FakeClientSocket()
    const client = createAriOnionClient(() => socket)
    client.connect('Ari', 'player')
    socket.trigger(EVENTS.operationRejected, { cause: EVENTS.constructionRequested, reason: 'Sem colhedor livre' })
    expect(client.state.value.phase).toBe('waiting')
    expect(client.events.value.at(-1)).toMatchObject({ kind: 'rejection', data: 'Sem colhedor livre' })
    expect(client.notices.value.at(-1)?.type).toBe('error')
  })
})
