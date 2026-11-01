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
  completeConstruction,
  expireLots,
  nextBuilding,
  openSeason,
  processCannery,
  processCuring,
  produceOnions,
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
  processEffect(effect: ScheduledEffect): RuntimeEmission[]
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
      if (event === EVENTS.openingRequested) {
        const at = now()
        const emissions = apply(socketId, event, openSeason(state, actor, at))
        if (state.phase === 'open') {
          for (const type of ['beds.produce', 'curing.process', 'cannery.process']) {
            options.scheduler?.schedule({ type, dueAt: at + 5_000, seasonId: state.seasonId })
          }
          options.scheduler?.schedule({ type: 'onions.expire', dueAt: at + 20_000, seasonId: state.seasonId })
        }
        return emissions
      }
      if (event === EVENTS.constructionRequested) return apply(socketId, event, requestNextConstruction(state, actor, now()))
      if (event === EVENTS.upgradeRequested) return apply(socketId, event, requestUpgrade(state, actor))
      if (event === EVENTS.closingRequested) {
        const seasonId = state.seasonId
        const emissions = apply(socketId, event, closeSeason(state, actor))
        if (state.phase === 'closed') options.scheduler?.cancelSeason?.(seasonId)
        return emissions
      }
      return reject(socketId, event, 'Evento desconhecido')
    },
    processEffect(effect) {
      if (state.phase !== 'open' || effect.seasonId !== state.seasonId) return []
      let transition: Transition
      if (effect.type === 'construction.complete') {
        transition = completeConstruction(state, String(effect.data?.id ?? ''))
      } else if (effect.type === 'onions.expire') {
        transition = expireLots(state, effect.dueAt)
      } else if (effect.type === 'beds.produce') {
        transition = produceOnions(state, effect.dueAt)
        options.scheduler?.schedule({ type: 'onions.expire', dueAt: effect.dueAt + 20_000, seasonId: state.seasonId })
      } else if (effect.type === 'curing.process') {
        transition = processCuring(state)
      } else if (effect.type === 'cannery.process') {
        transition = processCannery(state)
      } else return []
      if (effect.type !== 'construction.complete' && effect.type !== 'onions.expire') {
        options.scheduler?.schedule({ ...effect, dueAt: effect.dueAt + 5_000 })
      }
      return apply('scheduler', effect.type, transition)
    },
    snapshot,
    reset() { state = createInitialState(); players.clear() },
  }
}
