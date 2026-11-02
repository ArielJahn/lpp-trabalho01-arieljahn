import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EventPanel from '../../components/EventPanel.vue'

const records = [
  { id: 1, direction: 'emit' as const, name: 'construcao.solicitada', time: '10:00:00', kind: 'request' as const },
  { id: 2, direction: 'on' as const, name: 'cebolal.iniciado', time: '10:00:01', cause: 'cebolal.abertura_solicitada', data: 'fase: aberta', reaction: 'abre a temporada', kind: 'fact' as const },
  { id: 3, direction: 'on' as const, name: 'recurso.produzido', time: '10:00:02', cause: 'temporizador', data: 'cebola +10', reaction: 'atualiza o estoque', kind: 'fact' as const },
]

describe('EventPanel', () => {
  it('shows every academic event field and the production filter', () => {
    const wrapper = mount(EventPanel, { props: { events: records, hideProduction: false } })
    expect(wrapper.text()).toContain('⬆ emit')
    expect(wrapper.text()).toContain('⬇ on')
    expect(wrapper.text()).toContain('10:00:01')
    expect(wrapper.text()).toContain('cebolal.iniciado')
    expect(wrapper.text()).toContain('causa: cebolal.abertura_solicitada')
    expect(wrapper.text()).toContain('dados: fase: aberta')
    expect(wrapper.text()).toContain('reação: abre a temporada')
    expect(wrapper.text()).toContain('Ocultar produção frequente')
  })

  it('filters only resource production events', () => {
    const wrapper = mount(EventPanel, { props: { events: records, hideProduction: true } })
    expect(wrapper.text()).not.toContain('recurso.produzido')
    expect(wrapper.text()).toContain('cebolal.iniciado')
  })
})
