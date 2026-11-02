import { EVENTS } from '~/shared/arionion/contracts'
import type { VillagePayload } from './createOnionVillage'

export type VisualReaction =
  | { type: 'celebrate'; message: string }
  | { type: 'build'; phase: 'started' | 'completed'; kind: string }
  | { type: 'produce'; resource: string; quantity: number; stock?: number }
  | { type: 'sprout'; quantity: number; stock?: number }
  | { type: 'turnover'; sprouted: number; produced: number; stock: number }
  | { type: 'upgrade' }
  | { type: 'reject'; reason: string }
  | { type: 'rest' }
  | { type: 'none' }

export function reactionForEvent(event: string, payload: VillagePayload): VisualReaction {
  switch (event) {
    case EVENTS.seasonStarted: return { type: 'celebrate', message: 'Temporada aberta!' }
    case EVENTS.constructionStarted: return { type: 'build', phase: 'started', kind: payload.kind ?? 'bed' }
    case EVENTS.constructionCompleted: return { type: 'build', phase: 'completed', kind: payload.kind ?? 'bed' }
    case EVENTS.resourceProduced: {
      const resource = payload.resource ?? 'onion'
      const stock = resource === 'preserve' ? payload.state?.preserves
        : resource === 'cured-onion' ? payload.state?.curedOnions : payload.state?.rawOnions
      return { type: 'produce', resource, quantity: payload.quantity ?? 0, ...(stock === undefined ? {} : { stock }) }
    }
    case EVENTS.onionSprouted: return {
      type: 'sprout', quantity: payload.quantity ?? 0,
      ...(payload.state?.rawOnions === undefined ? {} : { stock: payload.state.rawOnions }),
    }
    case EVENTS.upgradeCompleted: return { type: 'upgrade' }
    case EVENTS.operationRejected: return { type: 'reject', reason: payload.reason ?? 'Operação recusada' }
    case EVENTS.seasonClosed: return { type: 'rest' }
    default: return { type: 'none' }
  }
}

export function reactionMessage(reaction: VisualReaction): string {
  if (reaction.type === 'celebrate') return reaction.message
  if (reaction.type === 'build') return reaction.phase === 'started' ? 'Nova obra iniciada!' : 'Construção concluída!'
  if (reaction.type === 'turnover') return `${reaction.sprouted} brotaram · +${reaction.produced} novas · estoque: ${reaction.stock}`
  if (reaction.type === 'produce') {
    const resource = reaction.resource === 'preserve' ? 'conservas' : reaction.resource === 'cured-onion' ? 'cebolas curadas' : 'cebolas'
    return `+${reaction.quantity} ${resource}${reaction.stock === undefined ? '' : ` · estoque: ${reaction.stock}`}`
  }
  if (reaction.type === 'sprout') return `${reaction.quantity} cebolas brotaram${reaction.stock === undefined ? '!' : ` · estoque: ${reaction.stock}`}`
  if (reaction.type === 'upgrade') return 'Cebolal melhorado!'
  if (reaction.type === 'reject') return reaction.reason
  if (reaction.type === 'rest') return 'Hora de descansar'
  return ''
}

export function createReactionQueue(maxSize = 6) {
  const reactions: VisualReaction[] = []
  return {
    enqueue(reaction: VisualReaction) {
      if (reaction.type === 'none') return
      const last = reactions.at(-1)
      if (reaction.type === 'produce' && reaction.resource === 'raw-onion' && reaction.stock !== undefined && last?.type === 'sprout') {
        reactions[reactions.length - 1] = { type: 'turnover', sprouted: last.quantity, produced: reaction.quantity, stock: reaction.stock }
        return
      }
      if (reaction.type === 'produce' && last?.type === 'produce' && last.resource === reaction.resource) {
        reactions[reactions.length - 1] = { ...last, quantity: last.quantity + reaction.quantity, stock: reaction.stock ?? last.stock }
        return
      }
      reactions.push(reaction)
      while (reactions.length > Math.max(1, maxSize)) reactions.shift()
    },
    dequeue() { return reactions.shift() },
    size() { return reactions.length },
    clear() { reactions.length = 0 },
  }
}
