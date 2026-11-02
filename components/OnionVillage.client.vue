<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { EVENTS, type PublicGameState } from '~/shared/arionion/contracts'
import type { ClientEventRecord } from '~/composables/useAriOnionSocket'
import { createOnionVillage, createOnionVillageAdapter } from '~/game/createOnionVillage'

const props = defineProps<{ state: PublicGameState; events: ClientEventRecord[] }>()
const container = ref<HTMLElement | null>(null)
const adapter = createOnionVillageAdapter()
let processed = props.events.length

watch(() => props.events.length, () => {
  for (const event of props.events.slice(processed)) {
    if (event.direction === 'on') adapter.handle(event.name, { ...(event.payload ?? {}), state: props.state })
  }
  processed = props.events.length
})

watch(() => props.state, state => adapter.handle(EVENTS.stateSynchronized, { state }), { deep: true })

onMounted(async () => {
  if (!container.value) return
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  const driver = await createOnionVillage(container.value, { reducedMotion })
  adapter.ready(driver)
  adapter.handle(EVENTS.stateSynchronized, { state: props.state })
})

onBeforeUnmount(() => adapter.destroy())
</script>

<template>
  <div class="village-frame">
    <div ref="container" class="village-canvas" aria-label="Mapa animado do Cebolal" />
    <span class="village-frame__badge">Phaser · ao vivo</span>
  </div>
</template>

<style scoped>
.village-frame { position: relative; width: 100%; aspect-ratio: 16 / 9; min-height: 0; overflow: hidden; border: .4rem solid #fff8df; border-radius: 1.5rem; background: #8ed6ef; box-shadow: 0 .8rem 0 #4e6f3530, 0 1.5rem 3rem #52632920; }
.village-canvas { position: absolute; inset: 0; min-width: 0; min-height: 0; display: grid; place-items: center; }
.village-canvas :deep(canvas) { display: block; width: 100% !important; height: 100% !important; object-fit: cover; }
.village-frame__badge { position: absolute; right: .8rem; bottom: .8rem; z-index: 2; padding: .35rem .6rem; border: 2px solid #fff3b5; border-radius: 99px; background: #3f5729dd; color: white; font-size: .65rem; font-weight: 800; pointer-events: none; }
@media (max-width: 800px) { .village-frame { min-height: 18rem; } }
</style>
