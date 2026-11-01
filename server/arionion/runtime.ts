import {
  EVENTS,
  createInitialState,
  type EventName,
  type PlayerIdentity,
  type PublicGameState,
} from '../../shared/arionion/contracts'
import { upgradeCost } from '../../shared/arionion/rules'
import {
  closeSeason,
  nextBuilding,
  openSeason,
  requestNextConstruction,
  requestUpgrade,
  type ScheduledEffect,
  type Transition,
} from './domain'

export interface RuntimeEmission {
  scope: 'all' | 'socket'
  socketId?: string
  event: EventName
  payload: unknown
}

export interface SchedulerPort {
  schedule(effect: ScheduledEffect): void
  cancelSeason?(seasonId: number): void
}

export interface GameRuntime {
  connect(player: PlayerIdentity): RuntimeEmission[]
  disconnect(socketId: string): void
  dispatch(socketId: string, event: string, payload?: unknown): RuntimeEmission[]
  snapshot(): PublicGameState
  reset(): void
}

export function createGameRuntime(options: { now?: () => number; scheduler?: SchedulerPort } = {}): GameRuntime {
  const now = options.now ?? Date.now
  const players = new Map<string, PlayerIdentity>()
  let state = createInitialState()

  const snapshot = (): PublicGameState => ({
    ...structuredClone(state),
    nextBuilding: nextBuilding(state),
    upgradeCost: upgradeCost(state.upgradeLevel),
  })

  const reject = (socketId: string, cause: string, reason: string): RuntimeEmission[] => [{
    scope: 'socket', socketId, event: EVENTS.operationRejected, payload: { cause, reason },
  }]

  const apply = (socketId: string, cause: string, transition: Transition): RuntimeEmission[] => {
    if (transition.rejection) return reject(socketId, cause, transition.rejection.reason)
    state = transition.state
    for (const effect of transition.effects) options.scheduler?.schedule(effect)
    return transition.facts.map(fact => ({
      scope: 'all' as const,
      event: fact.event as EventName,
      payload: { state: snapshot(), cause: fact.cause, ...(fact.data ?? {}) },
    }))
  }

  return {
    connect(player) {
      if (!player.name.trim()) player = { ...player, name: 'Anônimo' }
      players.set(player.socketId, player)
      return [{ scope: 'socket', socketId: player.socketId, event: EVENTS.stateSynchronized, payload: { state: snapshot(), cause: 'conexao' } }]
    },
    disconnect(socketId) { players.delete(socketId) },
    dispatch(socketId, event, payload) {
      const actor = players.get(socketId)
      if (!actor) return reject(socketId, event, 'Participante não conectado')
      if (payload !== undefined && (typeof payload !== 'object' || payload === null || Object.keys(payload).length > 0)) {
        return reject(socketId, event, 'Dados do pedido inválidos')
      }
      if (event === EVENTS.openingRequested) return apply(socketId, event, openSeason(state, actor, now()))
      if (event === EVENTS.constructionRequested) return apply(socketId, event, requestNextConstruction(state, actor, now()))
      if (event === EVENTS.upgradeRequested) return apply(socketId, event, requestUpgrade(state, actor))
      if (event === EVENTS.closingRequested) return apply(socketId, event, closeSeason(state, actor))
      return reject(socketId, event, 'Evento desconhecido')
    },
    snapshot,
    reset() { state = createInitialState(); players.clear() },
  }
}
