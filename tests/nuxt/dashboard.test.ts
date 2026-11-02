import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import EntryScreen from '../../components/EntryScreen.vue'
import ResourcePanel from '../../components/ResourcePanel.vue'
import ActionPanel from '../../components/ActionPanel.vue'
import EventSummary from '../../components/EventSummary.vue'
import GameDashboard from '../../components/GameDashboard.vue'
import { createInitialState, type PublicGameState } from '../../shared/arionion/contracts'

function state(overrides: Partial<PublicGameState> = {}): PublicGameState {
  return { ...createInitialState(), nextBuilding: 'bed', upgradeCost: 20, ...overrides }
}

const events = Array.from({ length: 4 }, (_, index) => ({
  id: index + 1, direction: 'on' as const, name: `evento.${index + 1}`, time: `10:00:0${index}`,
  reaction: `reação ${index + 1}`, kind: 'fact' as const,
}))

function dashboardProps() {
  return {
    playerName: 'Ariel', role: 'player' as const, state: state({ phase: 'open' }), connected: true,
    notices: [{ text: 'Obra concluída!', type: 'success' as const }], events, hideProduction: false,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  delete (HTMLElement.prototype as { requestFullscreen?: unknown }).requestFullscreen
  document.body.innerHTML = ''
})

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

  it('offers a new season only to the master after closing and forwards the action', async () => {
    const closed = state({ phase: 'closed' })
    const master = mount(ActionPanel, { props: { role: 'master', state: closed } })
    const restart = master.get('[data-restart-season]')
    expect(restart.text()).toContain('Nova temporada')
    await restart.trigger('click')
    expect(master.emitted('restart')).toHaveLength(1)

    const player = mount(ActionPanel, { props: { role: 'player', state: closed } })
    expect(player.find('[data-restart-season]').exists()).toBe(false)

    const dashboard = mount(GameDashboard, {
      global: { stubs: { OnionVillage: true } },
      props: { ...dashboardProps(), role: 'master', state: closed },
    })
    await dashboard.get('[data-restart-season]').trigger('click')
    expect(dashboard.emitted('restart')).toHaveLength(1)
  })

  it('limits the activity preview to the three newest events', () => {
    const wrapper = mount(EventSummary, { props: { events } })
    expect(wrapper.findAll('[data-event-summary-item]')).toHaveLength(3)
    expect(wrapper.text()).toContain('evento.4')
    expect(wrapper.text()).not.toContain('evento.1')
  })

  it('renders the five stable game regions and preserves required content', () => {
    const wrapper = mount(GameDashboard, { global: { stubs: { OnionVillage: true } }, props: dashboardProps() })
    for (const region of ['game-header', 'resources', 'world', 'activity', 'actions']) {
      expect(wrapper.find(`[data-region="${region}"]`).exists()).toBe(true)
    }
    expect(wrapper.text()).toContain('Obra concluída!')
    expect(wrapper.text()).toContain('Construir canteiro')
    expect(wrapper.text()).toContain('Ariel Jahn')
  })

  it('opens the complete event drawer from the activity region', async () => {
    const wrapper = mount(GameDashboard, { attachTo: document.body, global: { stubs: { OnionVillage: true } }, props: dashboardProps() })
    await wrapper.get('[data-open-events]').trigger('click')
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
    wrapper.unmount()
  })

  it('does not add a fullscreen control and exposes reduced-motion state', async () => {
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { configurable: true, value: vi.fn() })
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList)
    const supported = mount(GameDashboard, { global: { stubs: { OnionVillage: true } }, props: dashboardProps() })
    await supported.vm.$nextTick()
    expect(supported.find('[data-fullscreen-toggle]').exists()).toBe(false)
    expect(supported.classes()).toContain('game-shell--reduced-motion')
  })
})
