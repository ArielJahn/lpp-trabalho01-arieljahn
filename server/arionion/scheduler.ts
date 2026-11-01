import type { ScheduledEffect } from './domain'

const PRIORITY: Record<string, number> = {
  'onions.expire': 1,
  'construction.complete': 2,
  'beds.produce': 3,
  'curing.process': 4,
  'cannery.process': 5,
}

interface QueueItem { effect: ScheduledEffect; sequence: number }

export interface ManualScheduler {
  schedule(effect: ScheduledEffect): void
  cancelSeason(seasonId: number): void
  advanceTo(at: number): ScheduledEffect[]
  now(): number
}

export function createManualScheduler(startAt: number): ManualScheduler {
  let current = startAt
  let sequence = 0
  let queue: QueueItem[] = []
  return {
    schedule(effect) { queue.push({ effect: structuredClone(effect), sequence: sequence++ }) },
    cancelSeason(seasonId) { queue = queue.filter(item => item.effect.seasonId !== seasonId) },
    advanceTo(at) {
      if (at < current) throw new Error('O relógio não pode retroceder')
      current = at
      const due = queue.filter(item => item.effect.dueAt <= at)
      queue = queue.filter(item => item.effect.dueAt > at)
      due.sort((a, b) => a.effect.dueAt - b.effect.dueAt
        || (PRIORITY[a.effect.type] ?? 99) - (PRIORITY[b.effect.type] ?? 99)
        || a.sequence - b.sequence)
      return due.map(item => item.effect)
    },
    now: () => current,
  }
}

export interface Scheduler {
  schedule(effect: ScheduledEffect): void
  cancelSeason(seasonId: number): void
  start(): void
  stop(): void
}

export function createScheduler(
  deliver: (effect: ScheduledEffect) => void,
  now: () => number = Date.now,
): Scheduler {
  let queue: QueueItem[] = []
  let sequence = 0
  let running = false
  let timer: ReturnType<typeof setTimeout> | undefined

  const sortQueue = () => queue.sort((a, b) => a.effect.dueAt - b.effect.dueAt
    || (PRIORITY[a.effect.type] ?? 99) - (PRIORITY[b.effect.type] ?? 99)
    || a.sequence - b.sequence)

  const arm = () => {
    if (timer) clearTimeout(timer)
    timer = undefined
    if (!running || !queue.length) return
    sortQueue()
    timer = setTimeout(flush, Math.max(0, queue[0]!.effect.dueAt - now()))
  }

  const flush = () => {
    timer = undefined
    const current = now()
    sortQueue()
    const due = queue.filter(item => item.effect.dueAt <= current)
    queue = queue.filter(item => item.effect.dueAt > current)
    for (const item of due) deliver(item.effect)
    arm()
  }

  return {
    schedule(effect) { queue.push({ effect: structuredClone(effect), sequence: sequence++ }); arm() },
    cancelSeason(seasonId) { queue = queue.filter(item => item.effect.seasonId !== seasonId); arm() },
    start() { running = true; arm() },
    stop() { running = false; if (timer) clearTimeout(timer); timer = undefined; queue = [] },
  }
}
