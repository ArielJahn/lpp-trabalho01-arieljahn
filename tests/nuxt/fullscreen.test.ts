import { effectScope, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useGameFullscreen } from '../../composables/useGameFullscreen'

const originalExitFullscreen = document.exitFullscreen

function setFullscreenElement(value: Element | null) {
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, value })
  document.dispatchEvent(new Event('fullscreenchange'))
}

afterEach(() => {
  vi.restoreAllMocks()
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: null })
  Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: originalExitFullscreen })
})

describe('useGameFullscreen', () => {
  it('enters and exits fullscreen using the actual document state', async () => {
    const element = document.createElement('section')
    Object.defineProperty(element, 'requestFullscreen', { configurable: true, value: vi.fn(async () => setFullscreenElement(element)) })
    Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: vi.fn(async () => setFullscreenElement(null)) })
    const controller = effectScope().run(() => useGameFullscreen(ref(element)))!

    expect(controller.isSupported.value).toBe(true)
    await controller.toggleFullscreen()
    expect(controller.isFullscreen.value).toBe(true)
    await controller.toggleFullscreen()
    expect(controller.isFullscreen.value).toBe(false)
  })

  it('reports unsupported when the target has no fullscreen method', () => {
    const controller = effectScope().run(() => useGameFullscreen(ref(document.createElement('section'))))!
    expect(controller.isSupported.value).toBe(false)
  })

  it('keeps fullscreen false when the browser rejects the request', async () => {
    const element = document.createElement('section')
    Object.defineProperty(element, 'requestFullscreen', { configurable: true, value: vi.fn().mockRejectedValue(new Error('denied')) })
    const controller = effectScope().run(() => useGameFullscreen(ref(element)))!

    await expect(controller.toggleFullscreen()).resolves.toBeUndefined()
    expect(controller.isFullscreen.value).toBe(false)
  })

  it('synchronizes external fullscreen changes and removes its listener on disposal', () => {
    const element = document.createElement('section')
    Object.defineProperty(element, 'requestFullscreen', { configurable: true, value: vi.fn() })
    const remove = vi.spyOn(document, 'removeEventListener')
    const scope = effectScope()
    const controller = scope.run(() => useGameFullscreen(ref(element)))!

    setFullscreenElement(element)
    expect(controller.isFullscreen.value).toBe(true)
    setFullscreenElement(null)
    expect(controller.isFullscreen.value).toBe(false)
    scope.stop()
    expect(remove).toHaveBeenCalledWith('fullscreenchange', expect.any(Function))
  })
})
