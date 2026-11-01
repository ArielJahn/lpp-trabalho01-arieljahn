import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EntryScreen from '../../components/EntryScreen.vue'
import ResourcePanel from '../../components/ResourcePanel.vue'
import ActionPanel from '../../components/ActionPanel.vue'
import GameDashboard from '../../components/GameDashboard.vue'
import { createInitialState, type PublicGameState } from '../../shared/arionion/contracts'

function state(overrides: Partial<PublicGameState> = {}): PublicGameState {
  return { ...createInitialState(), nextBuilding: 'bed', upgradeCost: 20, ...overrides }
}

describe('AriOnion dashboard', () => {
  it('enters with a name and selected role', async () => {
    const wrapper = mount(EntryScreen)
    await wrapper.get('input[name="player-name"]').setValue('Ariel')
    await wrapper.get('button[data-role="master"]').trigger('click')
    expect(wrapper.emitted('enter')?.[0]).toEqual(['Ariel', 'master'])
  })

  it('shows resources, workers and linear progress', () => {
    const wrapper = mount(ResourcePanel, { props: { state: state({ rawOnions: 73, curedOnions: 22, preserves: 9,
      workers: { busy: 1, limit: 2 }, buildings: { beds: 2, curingSheds: 1, canneries: 0 } }) } })
    expect(wrapper.text()).toContain('73')
    expect(wrapper.text()).toContain('22')
    expect(wrapper.text()).toContain('9')
    expect(wrapper.text()).toContain('1/2')
    expect(wrapper.findAll('.progress-step--complete')).toHaveLength(3)
  })

  it('shows role-specific actions and the contextual next step', async () => {
    const master = mount(ActionPanel, { props: { role: 'master', state: state() } })
    expect(master.text()).toContain('Abrir temporada')
    expect(master.text()).not.toContain('Construir canteiro')

    const player = mount(ActionPanel, { props: { role: 'player', state: state({ phase: 'open' }) } })
    expect(player.text()).toContain('Construir canteiro')
    expect(player.text()).toContain('30 cebolas')
    await player.get('button').trigger('click')
    expect(player.emitted('construct')).toHaveLength(1)
  })

  it('renders notices, event panel and student footer', () => {
    const wrapper = mount(GameDashboard, { props: {
      playerName: 'Ariel', role: 'player', state: state({ phase: 'open' }), connected: true,
      notices: [{ text: 'Obra concluída!', type: 'success' }], events: [], hideProduction: false,
    } })
    expect(wrapper.text()).toContain('Obra concluída!')
    expect(wrapper.text()).toContain('Painel de eventos')
    expect(wrapper.text()).toContain('Ariel Jahn')
  })
})
