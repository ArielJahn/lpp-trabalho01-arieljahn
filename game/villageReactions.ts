import { EVENTS } from '~/shared/arionion/contracts'
import type { VillagePayload } from './createOnionVillage'

export type VisualReaction =
  | { type: 'celebrate'; message: string }
  | { type: 'build'; phase: 'started' | 'completed'; kind: string }
  | { type: 'produce'; resource: string; quantity: number }
  | { type: 'sprout'; quantity: number }
  | { type: 'upgrade' }
  | { type: 'reject'; reason: string }
  | { type: 'rest' }
  | { type: 'none' }

export function reactionForEvent(event: string, payload: VillagePayload): VisualReaction {
  switch (event) {
    case EVENTS.seasonStarted: return { type: 'celebrate', message: 'Temporada aberta!' }
    case EVENTS.constructionStarted: return { type: 'build', phase: 'started', kind: payload.kind ?? 'bed' }
    case EVENTS.constructionCompleted: return { type: 'build', phase: 'completed', kind: payload.kind ?? 'bed' }
    case EVENTS.resourceProduced: return { type: 'produce', resource: payload.resource ?? 'onion', quantity: payload.quantity ?? 0 }
    case EVENTS.onionSprouted: return { type: 'sprout', quantity: payload.quantity ?? 0 }
    case EVENTS.upgradeCompleted: return { type: 'upgrade' }
    case EVENTS.operationRejected: return { type: 'reject', reason: payload.reason ?? 'Operação recusada' }
    case EVENTS.seasonClosed: return { type: 'rest' }
    default: return { type: 'none' }
  }
}

export function createReactionQueue(maxSize = 6) {
  const reactions: VisualReaction[] = []
  return {
    enqueue(reaction: VisualReaction) {
      if (reaction.type === 'none') return
      const last = reactions.at(-1)
      if (reaction.type === 'produce' && last?.type === 'produce' && last.resource === reaction.resource) {
        reactions[reactions.length - 1] = { ...last, quantity: last.quantity + reaction.quantity }
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
