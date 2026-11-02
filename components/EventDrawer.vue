<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import EventPanel from './EventPanel.vue'
import type { ClientEventRecord } from '~/composables/useAriOnionSocket'

const props = defineProps<{ open: boolean; events: ClientEventRecord[]; hideProduction: boolean }>()
const emit = defineEmits<{ close: []; 'update:hideProduction': [value: boolean] }>()
const dialog = ref<HTMLElement | null>(null)
let previousFocus: HTMLElement | null = null
let previousOverflow = ''

const focusableSelector = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

function requestClose() {
  emit('close')
}

function handleDocumentKey(event: KeyboardEvent) {
  if (props.open && event.key === 'Escape') requestClose()
}

function trapFocus(event: KeyboardEvent) {
  if (event.key !== 'Tab' || !dialog.value) return
  const controls = [...dialog.value.querySelectorAll<HTMLElement>(focusableSelector)]
  if (!controls.length) return
  const first = controls[0]!
  const last = controls.at(-1)!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  }
  else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(() => props.open, async (open) => {
  if (open) {
    previousFocus = document.activeElement as HTMLElement | null
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    await nextTick()
    dialog.value?.querySelector<HTMLElement>(focusableSelector)?.focus()
  }
  else {
    document.body.style.overflow = previousOverflow
    previousFocus?.focus()
  }
}, { immediate: true })

onMounted(() => document.addEventListener('keydown', handleDocumentKey))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleDocumentKey)
  document.body.style.overflow = previousOverflow
  if (props.open) previousFocus?.focus()
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="event-drawer" @mousedown.self="requestClose">
      <aside ref="dialog" class="event-drawer__dialog" role="dialog" aria-modal="true" aria-labelledby="event-drawer-title" @keydown="trapFocus">
        <header class="event-drawer__topbar">
          <div>
            <p>Registro completo</p>
            <h2 id="event-drawer-title">Eventos do Cebolal</h2>
          </div>
          <button data-event-drawer-close type="button" aria-label="Fechar painel de eventos" @click="requestClose">✕</button>
        </header>
        <EventPanel :events="events" :hide-production="hideProduction" @update:hide-production="emit('update:hideProduction', $event)" />
      </aside>
    </div>
  </Teleport>
</template>

<style scoped>
.event-drawer { position: fixed; inset: 0; z-index: 100; display: flex; justify-content: flex-end; background: #26351d80; backdrop-filter: blur(4px); }
.event-drawer__dialog { width: min(42rem, 92vw); height: 100%; padding: 1rem; overflow: auto; background: #fff8df; box-shadow: -1rem 0 3rem #26351d40; }
.event-drawer__topbar { position: sticky; top: -1rem; z-index: 2; display: flex; justify-content: space-between; align-items: center; margin: -1rem -1rem 1rem; padding: 1rem 1.25rem; border-bottom: 3px solid #d99d45; background: #fff8df; }
.event-drawer__topbar p, .event-drawer__topbar h2 { margin: 0; }.event-drawer__topbar p { color: #71813c; font-size: .72rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
.event-drawer__topbar button { width: 2.75rem; height: 2.75rem; border: 0; border-radius: 50%; background: #f1d58d; color: #533a1e; font-weight: 900; cursor: pointer; }
@media (max-width: 600px) { .event-drawer__dialog { width: 100%; } }
</style>
