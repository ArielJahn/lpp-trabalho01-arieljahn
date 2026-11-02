import { EVENTS, type PlayerRole } from '../../shared/arionion/contracts'
import type { GameRuntime, RuntimeEmission } from './runtime'

export interface SocketLike {
  id: string
  handshake: { auth?: Record<string, unknown> }
  on(event: string, handler: (...args: unknown[]) => void): void
  emit(event: string, payload: unknown): void
  disconnect(close?: boolean): void
}

export interface SocketServerLike {
  on(event: 'connection', handler: (socket: SocketLike) => void): void
  emit(event: string, payload: unknown): void
  to(socketId: string): { emit(event: string, payload: unknown): void }
}

export function emitRuntime(io: SocketServerLike, emissions: RuntimeEmission[]): void {
  // Fatos aceitos são emitidos para todos; recusas são direcionadas somente ao solicitante.
  for (const emission of emissions) {
    if (emission.scope === 'all') io.emit(emission.event, emission.payload)
    else if (emission.socketId) io.to(emission.socketId).emit(emission.event, emission.payload)
  }
}

function parseRole(value: unknown): PlayerRole | null {
  if (value === 'mestre' || value === 'master') return 'master'
  if (value === 'jogador' || value === 'player') return 'player'
  return null
}

export function attachGameSocket(io: SocketServerLike, runtime: GameRuntime): void {
  io.on('connection', (socket) => {
    const auth = socket.handshake.auth ?? {}
    const role = parseRole(auth.papel)
    if (!role) {
      socket.emit(EVENTS.operationRejected, { cause: 'conexao', reason: 'Papel inválido' })
      socket.disconnect(true)
      return
    }
    const rawName = typeof auth.nome === 'string' ? auth.nome.trim() : ''
    emitRuntime(io, runtime.connect({ socketId: socket.id, name: rawName || 'Anônimo', role }))

    // Cada pedido Socket.IO apenas encaminha a intenção; o runtime autoritativo decide e produz os fatos.
    for (const event of [
      EVENTS.openingRequested,
      EVENTS.constructionRequested,
      EVENTS.upgradeRequested,
      EVENTS.closingRequested,
      EVENTS.restartRequested,
    ]) {
      socket.on(event, (payload?: unknown) => emitRuntime(io, runtime.dispatch(socket.id, event, payload)))
    }
    socket.on('disconnect', () => runtime.disconnect(socket.id))
  })
}
