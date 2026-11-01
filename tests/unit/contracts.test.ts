import { describe, expect, it } from 'vitest'

import { EVENTS, createInitialState } from '../../shared/arionion/contracts'
import { RULES, upgradeCost } from '../../shared/arionion/rules'

describe('AriOnion contracts', () => {
  it('creates the documented initial state', () => {
    const state = createInitialState()

    expect(state.phase).toBe('waiting')
    expect(state.rawOnions).toBe(100)
    expect(state.curedOnions).toBe(0)
    expect(state.preserves).toBe(0)
    expect(state.workers).toEqual({ busy: 0, limit: 2 })
    expect(state.buildings).toEqual({ beds: 0, curingSheds: 0, canneries: 0 })
    expect(state.upgradeLevel).toBe(0)
    expect(state.rawOnionLots).toHaveLength(1)
    expect(state.rawOnionLots[0]?.quantity).toBe(100)
  })

  it('exposes every documented request and fact name', () => {
    expect(Object.values(EVENTS)).toEqual(expect.arrayContaining([
      'estado.sincronizado',
      'cebolal.abertura_solicitada',
      'cebolal.iniciado',
      'construcao.solicitada',
      'construcao.iniciada',
      'construcao.concluida',
      'recurso.produzido',
      'cebola.brotada',
      'etapa.desbloqueada',
      'melhoria.solicitada',
      'melhoria.concluida',
      'operacao.recusada',
      'cebolal.encerramento_solicitado',
      'cebolal.encerrado',
    ]))
  })

  it('computes the documented linear upgrade costs', () => {
    expect(upgradeCost(0)).toBe(20)
    expect(upgradeCost(1)).toBe(32)
    expect(upgradeCost(2)).toBe(51)
    expect(RULES.productionIntervalMs).toBe(5_000)
  })
})
