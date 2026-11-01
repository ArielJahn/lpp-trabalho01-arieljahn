import { describe, expect, it } from 'vitest'
import { EVENTS } from '../../shared/arionion/contracts'
import { createGameRuntime } from '../../server/arionion/runtime'
import { attachGameSocket, emitRuntime } from '../../server/arionion/socket-gateway'

class FakeSocket {
  handlers = new Map<string, (...args: unknown[]) => void>()
  emitted: Array<[string, unknown]> = []
  disconnected = false
  constructor(public id: string, public handshake: { auth: Record<string, unknown> }) {}
  on(event: string, handler: (...args: unknown[]) => void) { this.handlers.set(event, handler) }
  emit(event: string, payload: unknown) { this.emitted.push([event, payload]) }
  disconnect() { this.disconnected = true }
  trigger(event: string, payload?: unknown) { this.handlers.get(event)?.(payload) }
}

class FakeIO {
  connection?: (socket: FakeSocket) => void
  broadcasts: Array<[string, unknown]> = []
  targeted: Array<[string, string, unknown]> = []
  on(event: 'connection', handler: (socket: FakeSocket) => void) { this.connection = handler }
  emit(event: string, payload: unknown) { this.broadcasts.push([event, payload]) }
  to(socketId: string) { return { emit: (event: string, payload: unknown) => this.targeted.push([socketId, event, payload]) } }
}

describe('Socket.IO gateway', () => {
  it('connects, normalizes an empty name and synchronizes only that socket', () => {
    const io = new FakeIO()
    const runtime = createGameRuntime()
    attachGameSocket(io, runtime)
    const socket = new FakeSocket('p', { auth: { nome: '   ', papel: 'jogador' } })
    io.connection!(socket)
    expect(io.targeted[0]?.slice(0, 2)).toEqual(['p', EVENTS.stateSynchronized])
  })

  it('maps client requests and broadcasts accepted server facts', () => {
    const io = new FakeIO()
    const runtime = createGameRuntime({ now: () => 0 })
    attachGameSocket(io, runtime)
    const socket = new FakeSocket('m', { auth: { nome: 'Mestre', papel: 'mestre' } })
    io.connection!(socket)
    socket.trigger(EVENTS.openingRequested)
    expect(io.broadcasts.at(-1)?.[0]).toBe(EVENTS.seasonStarted)
  })

  it('privately rejects and disconnects an invalid role', () => {
    const io = new FakeIO()
    attachGameSocket(io, createGameRuntime())
    const socket = new FakeSocket('x', { auth: { nome: 'Intruso', papel: 'admin' } })
    io.connection!(socket)
    expect(socket.emitted[0]?.[0]).toBe(EVENTS.operationRejected)
    expect(socket.disconnected).toBe(true)
  })

  it('routes runtime emissions by their declared scope', () => {
    const io = new FakeIO()
    emitRuntime(io, [
      { scope: 'all', event: EVENTS.seasonStarted, payload: { ok: true } },
      { scope: 'socket', socketId: 'p', event: EVENTS.operationRejected, payload: { reason: 'não' } },
    ])
    expect(io.broadcasts).toHaveLength(1)
    expect(io.targeted[0]?.slice(0, 2)).toEqual(['p', EVENTS.operationRejected])
  })

  it('reconnects with a snapshot without opening another season', () => {
    const io = new FakeIO()
    const scheduled: unknown[] = []
    const runtime = createGameRuntime({ now: () => 0, scheduler: { schedule: effect => scheduled.push(effect) } })
    attachGameSocket(io, runtime)
    const master = new FakeSocket('m', { auth: { nome: 'Mestre', papel: 'mestre' } })
    io.connection!(master); master.trigger(EVENTS.openingRequested)
    const before = scheduled.length
    io.connection!(new FakeSocket('p', { auth: { nome: 'Ari', papel: 'jogador' } }))
    expect(scheduled).toHaveLength(before)
    expect(runtime.snapshot().phase).toBe('open')
  })
})
