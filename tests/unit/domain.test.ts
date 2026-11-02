import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../shared/arionion/contracts'
import {
  closeSeason,
  completeConstruction,
  consumeRawOnions,
  openSeason,
  requestNextConstruction,
  requestUpgrade,
  restartSeason,
} from '../../server/arionion/domain'

const master = { socketId: 'm', name: 'Mestre', role: 'master' as const }
const player = { socketId: 'p', name: 'Ari', role: 'player' as const }

describe('domain progression', () => {
  it('opens only for the master', () => {
    expect(openSeason(createInitialState(), player, 0).rejection?.reason).toContain('Mestre')
    expect(openSeason(createInitialState(), master, 0).state.phase).toBe('open')
  })

  it('starts with two beds and charges resources while occupying a worker', () => {
    const opened = openSeason(createInitialState(), master, 0).state
    const first = requestNextConstruction(opened, player, 1_000)
    expect(first.state.rawOnions).toBe(70)
    expect(first.state.workers.busy).toBe(1)
    expect(first.state.constructions[0]?.kind).toBe('bed')
    const completed = completeConstruction(first.state, first.state.constructions[0]!.id)
    expect(completed.state.buildings.beds).toBe(1)
    expect(completed.state.workers.busy).toBe(0)
  })

  it('consumes raw onions by earliest expiry', () => {
    const state = createInitialState()
    state.rawOnionLots = [
      { id: 'late', quantity: 10, expiresAt: 50 },
      { id: 'early', quantity: 8, expiresAt: 20 },
    ]
    state.rawOnions = 18
    const result = consumeRawOnions(state, 12)
    expect(result.state.rawOnionLots).toEqual([{ id: 'late', quantity: 6, expiresAt: 50 }])
    expect(result.state.rawOnions).toBe(6)
  })

  it('does not mutate state when the season is closed', () => {
    const state = createInitialState()
    const before = structuredClone(state)
    expect(requestNextConstruction(state, player, 0).rejection).toBeDefined()
    expect(state).toEqual(before)
  })

  it('progresses through two beds, curing shed and cannery in order', () => {
    let state = openSeason(createInitialState(), master, 0).state
    const expected = ['bed', 'bed', 'curing-shed', 'cannery'] as const
    for (const [index, kind] of expected.entries()) {
      if (kind === 'curing-shed') {
        state.rawOnionLots.push({ id: 'earned', quantity: 60, expiresAt: 100_000 })
        state.rawOnions += 60
      }
      if (kind === 'cannery') state.curedOnions = 40
      const started = requestNextConstruction(state, player, 1_000 + index)
      expect(started.state.constructions.at(-1)?.kind).toBe(kind)
      state = completeConstruction(started.state, started.state.constructions.at(-1)!.id).state
    }
    expect(state.buildings).toEqual({ beds: 2, curingSheds: 1, canneries: 1 })
  })

  it.each([
    ['there is no free worker', (state: ReturnType<typeof createInitialState>) => { state.workers.busy = 2 }],
    ['there are not enough onions', (state: ReturnType<typeof createInitialState>) => { state.rawOnions = 0; state.rawOnionLots = [] }],
  ])('rejects without mutation when %s', (_label, arrange) => {
    const state = openSeason(createInitialState(), master, 0).state
    arrange(state)
    const before = structuredClone(state)
    expect(requestNextConstruction(state, player, 1).rejection).toBeDefined()
    expect(state).toEqual(before)
  })

  it('allows two simultaneous works when two workers are free', () => {
    const state = openSeason(createInitialState(), master, 0).state
    const first = requestNextConstruction(state, player, 1)
    const second = requestNextConstruction(first.state, player, 2)
    expect(second.state.constructions).toHaveLength(2)
    expect(second.state.workers.busy).toBe(2)
  })

  it('gives simultaneous works unique ids so both timers can complete', () => {
    const state = openSeason(createInitialState(), master, 0).state
    const first = requestNextConstruction(state, player, 1_000)
    const second = requestNextConstruction(first.state, player, 1_000)
    const [firstWork, secondWork] = second.state.constructions
    expect(firstWork?.id).not.toBe(secondWork?.id)
    const afterFirst = completeConstruction(second.state, firstWork!.id).state
    const afterSecond = completeConstruction(afterFirst, secondWork!.id).state
    expect(afterSecond.buildings.beds).toBe(2)
    expect(afterSecond.workers.busy).toBe(0)
    expect(afterSecond.constructions).toEqual([])
  })

  it('allows only players to buy upgrades after the chain is complete', () => {
    const state = openSeason(createInitialState(), master, 0).state
    state.buildings = { beds: 2, curingSheds: 1, canneries: 1 }
    state.preserves = 60
    expect(requestUpgrade(state, master).rejection?.reason).toContain('Jogadores')
    const first = requestUpgrade(state, player)
    expect(first.state.upgradeLevel).toBe(1)
    expect(first.state.preserves).toBe(40)
    const second = requestUpgrade(first.state, player)
    expect(second.state.upgradeLevel).toBe(2)
    expect(second.state.preserves).toBe(8)
  })

  it('refuses an upgrade without a cannery or enough preserves', () => {
    const state = openSeason(createInitialState(), master, 0).state
    expect(requestUpgrade(state, player).rejection).toBeDefined()
    state.buildings.canneries = 1
    const before = structuredClone(state)
    expect(requestUpgrade(state, player).rejection).toBeDefined()
    expect(state).toEqual(before)
  })

  it('closes only by master and blocks later actions', () => {
    const state = openSeason(createInitialState(), master, 0).state
    expect(closeSeason(state, player).rejection).toBeDefined()
    const closed = closeSeason(state, master).state
    expect(closed.phase).toBe('closed')
    expect(requestNextConstruction(closed, player, 1).rejection).toBeDefined()
  })

  it('lets only the master reset a closed season to the initial waiting state', () => {
    const open = openSeason(createInitialState(), master, 0).state
    open.rawOnions = 7
    const closed = closeSeason(open, master).state
    expect(restartSeason(closed, player).rejection?.reason).toContain('Mestre')
    expect(restartSeason(open, master).rejection?.reason).toContain('encerrada')
    const restarted = restartSeason(closed, master)
    expect(restarted.state).toEqual({ ...createInitialState(), seasonId: closed.seasonId })
    expect(restarted.facts[0]).toMatchObject({ event: 'cebolal.reiniciado', cause: 'cebolal.reinicio_solicitado' })
  })
})
