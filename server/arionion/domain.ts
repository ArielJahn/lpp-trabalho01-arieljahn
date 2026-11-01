import type { BuildingKind, GameState, PlayerIdentity } from '../../shared/arionion/contracts'
import { RULES, upgradeCost, yieldMultiplier } from '../../shared/arionion/rules'

export interface DomainRejection { reason: string }
export interface DomainFact { event: string; cause: string; data?: Record<string, unknown> }
export interface ScheduledEffect { type: string; dueAt: number; seasonId: number; data?: Record<string, unknown> }
export interface Transition { state: GameState; facts: DomainFact[]; effects: ScheduledEffect[]; rejection?: DomainRejection }

const result = (state: GameState, extra: Partial<Transition> = {}): Transition => ({ state, facts: [], effects: [], ...extra })
const reject = (state: GameState, reason: string): Transition => result(state, { rejection: { reason } })

export function openSeason(state: GameState, actor: PlayerIdentity, now: number): Transition {
  if (actor.role !== 'master') return reject(state, 'Somente o Mestre pode abrir a temporada')
  if (state.phase !== 'waiting') return reject(state, 'A temporada já foi aberta')
  const next = structuredClone(state)
  next.phase = 'open'; next.seasonId += 1
  next.rawOnionLots = next.rawOnionLots.map(lot => ({ ...lot, expiresAt: now + RULES.sproutingDurationMs }))
  return result(next, { facts: [{ event: 'cebolal.iniciado', cause: 'cebolal.abertura_solicitada' }] })
}

export function closeSeason(state: GameState, actor: PlayerIdentity): Transition {
  if (actor.role !== 'master') return reject(state, 'Somente o Mestre pode encerrar a temporada')
  if (state.phase !== 'open') return reject(state, 'A temporada não está aberta')
  const next = structuredClone(state); next.phase = 'closed'
  return result(next, { facts: [{ event: 'cebolal.encerrado', cause: 'cebolal.encerramento_solicitado' }] })
}

export function nextBuilding(state: GameState): BuildingKind | null {
  const plannedBeds = state.buildings.beds + state.constructions.filter(item => item.kind === 'bed').length
  if (plannedBeds < 2) return 'bed'
  if (state.buildings.curingSheds < 1) return 'curing-shed'
  if (state.buildings.canneries < 1) return 'cannery'
  return null
}

export function consumeRawOnions(state: GameState, amount: number): { state: GameState; consumed: number } {
  const next = structuredClone(state); let remaining = amount
  next.rawOnionLots.sort((a, b) => (a.expiresAt ?? Infinity) - (b.expiresAt ?? Infinity))
  for (const lot of next.rawOnionLots) { const used = Math.min(lot.quantity, remaining); lot.quantity -= used; remaining -= used; if (!remaining) break }
  next.rawOnionLots = next.rawOnionLots.filter(lot => lot.quantity > 0)
  const consumed = amount - remaining; next.rawOnions -= consumed
  return { state: next, consumed }
}

export function requestNextConstruction(state: GameState, actor: PlayerIdentity, now: number): Transition {
  if (actor.role !== 'player') return reject(state, 'Somente Jogadores podem construir')
  if (state.phase !== 'open') return reject(state, 'A temporada não está aberta')
  if (state.workers.busy >= state.workers.limit) return reject(state, 'Sem colhedor livre')
  const kind = nextBuilding(state); if (!kind) return reject(state, 'A cadeia já está completa')
  if (kind === 'curing-shed' && state.buildings.beds < 2) return reject(state, 'Aguarde a conclusão dos dois canteiros')
  const cost = kind === 'bed' ? RULES.bedCost : kind === 'curing-shed' ? RULES.curingShedCost : RULES.canneryCost
  if (kind === 'cannery') {
    if (state.curedOnions < cost) return reject(state, 'Cebolas curadas insuficientes')
  } else if (state.rawOnions < cost) return reject(state, 'Cebolas insuficientes')
  let next = structuredClone(state)
  if (kind === 'cannery') next.curedOnions -= cost; else next = consumeRawOnions(next, cost).state
  const id = `obra-${state.seasonId}-${now}`
  const construction = { id, kind, requestedBy: actor.name, completesAt: now + RULES.constructionDurationMs }
  next.workers.busy += 1; next.constructions.push(construction)
  return result(next, { facts: [{ event: 'construcao.iniciada', cause: 'construcao.solicitada', data: { kind, by: actor.name } }], effects: [{ type: 'construction.complete', dueAt: construction.completesAt, seasonId: next.seasonId, data: { id } }] })
}

export function completeConstruction(state: GameState, constructionId: string): Transition {
  const construction = state.constructions.find(item => item.id === constructionId)
  if (!construction) return result(state)
  const next = structuredClone(state); const kind = construction.kind
  if (kind === 'bed') next.buildings.beds += 1
  if (kind === 'curing-shed') next.buildings.curingSheds += 1
  if (kind === 'cannery') next.buildings.canneries += 1
  next.constructions = next.constructions.filter(item => item.id !== constructionId); next.workers.busy -= 1
  return result(next, { facts: [{ event: 'construcao.concluida', cause: 'construcao.iniciada (temporizador)', data: { kind } }] })
}

export function requestUpgrade(state: GameState, actor: PlayerIdentity): Transition {
  if (actor.role !== 'player') return reject(state, 'Somente Jogadores podem solicitar melhorias')
  if (state.phase !== 'open') return reject(state, 'A temporada não está aberta')
  if (state.buildings.canneries < 1) return reject(state, 'Construa a conserveira antes de melhorar o Cebolal')
  if (!Number.isInteger(state.upgradeLevel) || state.upgradeLevel < 0) return reject(state, 'Nível de melhoria inválido')
  const cost = upgradeCost(state.upgradeLevel)
  if (state.preserves < cost) return reject(state, 'Conservas insuficientes')
  const next = structuredClone(state)
  next.preserves -= cost
  next.upgradeLevel += 1
  return result(next, {
    facts: [{ event: 'melhoria.concluida', cause: 'melhoria.solicitada', data: { level: next.upgradeLevel, cost } }],
  })
}

export function expireLots(state: GameState, at: number): Transition {
  if (state.phase !== 'open') return result(state)
  const expired = state.rawOnionLots.filter(lot => lot.expiresAt !== null && lot.expiresAt <= at)
  const quantity = expired.reduce((total, lot) => total + lot.quantity, 0)
  if (!quantity) return result(state)
  const next = structuredClone(state)
  const ids = new Set(expired.map(lot => lot.id))
  next.rawOnionLots = next.rawOnionLots.filter(lot => !ids.has(lot.id))
  next.rawOnions -= quantity
  return result(next, { facts: [{ event: 'cebola.brotada', cause: 'temporizador', data: { quantity } }] })
}

export function produceOnions(state: GameState, at: number): Transition {
  if (state.phase !== 'open' || state.buildings.beds < 1) return result(state)
  const quantity = Math.floor(state.buildings.beds * RULES.bedProduction * yieldMultiplier(state.upgradeLevel))
  const next = structuredClone(state)
  next.rawOnions += quantity
  next.rawOnionLots.push({ id: `lote-${state.seasonId}-${at}`, quantity, expiresAt: at + RULES.sproutingDurationMs })
  return result(next, { facts: [{ event: 'recurso.produzido', cause: 'temporizador', data: { resource: 'raw-onion', quantity, origin: 'beds' } }] })
}

export function processCuring(state: GameState): Transition {
  if (state.phase !== 'open' || state.buildings.curingSheds < 1 || state.rawOnions < 1) return result(state)
  const capacity = Math.floor(RULES.curingCapacity * yieldMultiplier(state.upgradeLevel))
  const consumed = consumeRawOnions(state, Math.min(capacity, state.rawOnions))
  const next = consumed.state
  next.curedOnions += consumed.consumed
  return result(next, { facts: [{ event: 'recurso.produzido', cause: 'temporizador', data: { resource: 'cured-onion', quantity: consumed.consumed, origin: 'curing-shed' } }] })
}

export function processCannery(state: GameState): Transition {
  if (state.phase !== 'open' || state.buildings.canneries < 1 || state.curedOnions < RULES.canneryInput) return result(state)
  const next = structuredClone(state)
  const quantity = Math.floor(RULES.canneryOutput * yieldMultiplier(state.upgradeLevel))
  next.curedOnions -= RULES.canneryInput
  next.preserves += quantity
  return result(next, { facts: [{ event: 'recurso.produzido', cause: 'temporizador', data: { resource: 'preserve', quantity, consumed: RULES.canneryInput, origin: 'cannery' } }] })
}
