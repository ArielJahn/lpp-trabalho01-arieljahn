export type GamePhase = 'waiting' | 'open' | 'closed'
export type PlayerRole = 'master' | 'player'
export type BuildingKind = 'bed' | 'curing-shed' | 'cannery'

export interface PlayerIdentity {
  socketId: string
  name: string
  role: PlayerRole
}

export interface RawOnionLot {
  id: string
  quantity: number
  expiresAt: number | null
}

export interface Construction {
  id: string
  kind: BuildingKind
  requestedBy: string
  completesAt: number
}

export interface GameState {
  seasonId: number
  phase: GamePhase
  rawOnions: number
  curedOnions: number
  preserves: number
  rawOnionLots: RawOnionLot[]
  workers: {
    busy: number
    limit: number
  }
  buildings: {
    beds: number
    curingSheds: number
    canneries: number
  }
  constructions: Construction[]
  upgradeLevel: number
}

export interface PublicGameState extends GameState {
  nextBuilding: BuildingKind | null
  upgradeCost: number
}

export interface FactPayload<TData extends Record<string, unknown> = Record<string, unknown>> {
  state: PublicGameState
  cause: string
  data?: TData
}

export interface RejectionPayload {
  cause: string
  reason: string
}

export const EVENTS = {
  stateSynchronized: 'estado.sincronizado',
  openingRequested: 'cebolal.abertura_solicitada',
  seasonStarted: 'cebolal.iniciado',
  constructionRequested: 'construcao.solicitada',
  constructionStarted: 'construcao.iniciada',
  constructionCompleted: 'construcao.concluida',
  resourceProduced: 'recurso.produzido',
  onionSprouted: 'cebola.brotada',
  stageUnlocked: 'etapa.desbloqueada',
  upgradeRequested: 'melhoria.solicitada',
  upgradeCompleted: 'melhoria.concluida',
  operationRejected: 'operacao.recusada',
  closingRequested: 'cebolal.encerramento_solicitado',
  seasonClosed: 'cebolal.encerrado',
  restartRequested: 'cebolal.reinicio_solicitado',
  seasonRestarted: 'cebolal.reiniciado',
} as const

export type EventName = (typeof EVENTS)[keyof typeof EVENTS]

export function createInitialState(): GameState {
  return {
    seasonId: 0,
    phase: 'waiting',
    rawOnions: 100,
    curedOnions: 0,
    preserves: 0,
    rawOnionLots: [{ id: 'initial', quantity: 100, expiresAt: null }],
    workers: { busy: 0, limit: 2 },
    buildings: { beds: 0, curingSheds: 0, canneries: 0 },
    constructions: [],
    upgradeLevel: 0,
  }
}
