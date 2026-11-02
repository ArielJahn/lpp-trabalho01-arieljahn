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
  const driver = await createOnionVillage(container.value)
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
.village-frame { position: relative; min-height: 18rem; overflow: hidden; border: .5rem solid #fff; border-radius: 1.5rem; background: #9abd68; box-shadow: 0 1.5rem 3rem #52632920; }
.village-canvas { width: 100%; height: 100%; min-height: 18rem; display: grid; place-items: center; }
.village-canvas :deep(canvas) { width: 100% !important; height: 100% !important; object-fit: cover; image-rendering: pixelated; }
.village-frame__badge { position: absolute; right: 1rem; bottom: 1rem; z-index: 2; padding: .4rem .65rem; border-radius: 99px; background: #26351dcc; color: white; font-size: .72rem; pointer-events: none; }
@media (max-width: 800px) { .village-frame, .village-canvas { min-height: 14rem; } }
</style>
