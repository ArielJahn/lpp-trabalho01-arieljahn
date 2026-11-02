import type { GamePhase } from '~/shared/arionion/contracts'

export function eventsAfterId<T extends { id: number }>(events: readonly T[], lastProcessedId: number): T[] {
  return events.filter(event => event.id > lastProcessedId)
}

export function shouldShowSeasonOverlay(phase: GamePhase): boolean {
  return phase === 'closed'
}
