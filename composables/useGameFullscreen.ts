import { computed, onScopeDispose, ref, type Ref } from 'vue'

export function useGameFullscreen(target: Ref<HTMLElement | null>) {
  const isFullscreen = ref(false)
  const hasDocument = typeof document !== 'undefined'
  const isSupported = computed(() => Boolean(hasDocument && target.value?.requestFullscreen))

  const synchronize = () => {
    isFullscreen.value = Boolean(target.value && document.fullscreenElement === target.value)
  }

  if (hasDocument) document.addEventListener('fullscreenchange', synchronize)
  onScopeDispose(() => {
    if (hasDocument) document.removeEventListener('fullscreenchange', synchronize)
  })

  async function toggleFullscreen(): Promise<void> {
    if (!hasDocument || !target.value) return
    try {
      if (document.fullscreenElement === target.value) await document.exitFullscreen?.()
      else if (target.value.requestFullscreen) await target.value.requestFullscreen()
    }
    catch {
      synchronize()
    }
  }

  return { isSupported, isFullscreen, toggleFullscreen }
}
