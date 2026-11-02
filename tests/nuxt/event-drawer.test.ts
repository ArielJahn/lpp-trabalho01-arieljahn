import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import EventDrawer from '../../components/EventDrawer.vue'

const records = [{ id: 1, direction: 'on' as const, name: 'cebolal.iniciado', time: '10:00:01', kind: 'fact' as const }]

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})

function mountDrawer(open = true) {
  const trigger = document.createElement('button')
  trigger.textContent = 'Abrir eventos'
  document.body.appendChild(trigger)
  trigger.focus()
  const host = document.createElement('div')
  document.body.appendChild(host)
  const wrapper = mount(EventDrawer, { attachTo: host, props: { open, events: records, hideProduction: false } })
  return { wrapper, trigger }
}

describe('EventDrawer', () => {
  it('does not expose dialog content while closed', () => {
    const { wrapper } = mountDrawer(false)
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    wrapper.unmount()
  })

  it('opens as a modal, locks scrolling and moves focus inside', async () => {
    const { wrapper } = mountDrawer()
    await wrapper.vm.$nextTick()
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(document.body.style.overflow).toBe('hidden')
    expect(dialog.contains(document.activeElement)).toBe(true)
    wrapper.unmount()
  })

  it('closes from its button or Escape and restores focus to the trigger', async () => {
    const { wrapper, trigger } = mountDrawer()
    await wrapper.vm.$nextTick()
    document.querySelector<HTMLButtonElement>('[data-event-drawer-close]')!.click()
    expect(wrapper.emitted('close')).toHaveLength(1)
    await wrapper.setProps({ open: false })
    expect(document.activeElement).toBe(trigger)
    await wrapper.setProps({ open: true })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('close')).toHaveLength(2)
    wrapper.unmount()
  })

  it('wraps keyboard focus between the first and last controls', async () => {
    const { wrapper } = mountDrawer()
    await wrapper.vm.$nextTick()
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!
    const controls = [...dialog.querySelectorAll<HTMLElement>('button, input')]
    controls.at(-1)!.focus()
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    expect(document.activeElement).toBe(controls[0])
    controls[0]!.focus()
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }))
    expect(document.activeElement).toBe(controls.at(-1))
    wrapper.unmount()
  })
})
