<script setup lang="ts">
import { computed } from 'vue'
import type { PublicGameState } from '~/shared/arionion/contracts'

const props = defineProps<{ state: PublicGameState }>()
const steps = computed(() => [
  { label: 'Canteiro I', icon: '🌱', complete: props.state.buildings.beds >= 1 },
  { label: 'Canteiro II', icon: '🌿', complete: props.state.buildings.beds >= 2 },
  { label: 'Galpão de cura', icon: '🏚️', complete: props.state.buildings.curingSheds >= 1 },
  { label: 'Conserveira', icon: '🏭', complete: props.state.buildings.canneries >= 1 },
])
</script>

<template>
  <section aria-labelledby="resources-title">
    <div class="section-heading"><div><p class="eyebrow">Estoque compartilhado</p><h2 id="resources-title">Produção do Cebolal</h2></div><span class="worker-pill">🧑‍🌾 {{ state.workers.busy }}/{{ state.workers.limit }} colhedores</span></div>
    <div class="resource-grid">
      <article><span class="resource-icon resource-icon--raw">🧅</span><div><small>Cebolas</small><strong>{{ state.rawOnions }}</strong></div></article>
      <article><span class="resource-icon resource-icon--cured">☀️</span><div><small>Cebolas curadas</small><strong>{{ state.curedOnions }}</strong></div></article>
      <article><span class="resource-icon resource-icon--jar">🫙</span><div><small>Conservas</small><strong>{{ state.preserves }}</strong></div></article>
    </div>
    <div class="progress-track" aria-label="Progresso da cadeia produtiva">
      <div v-for="step in steps" :key="step.label" :class="['progress-step', { 'progress-step--complete': step.complete }]">
        <span>{{ step.complete ? '✓' : step.icon }}</span><small>{{ step.label }}</small>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section-heading { display: flex; justify-content: space-between; gap: 1rem; align-items: start; }
.eyebrow { margin: 0 0 .3rem; color: #788147; font-size: .72rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
h2 { margin: 0; color: #263319; font: 700 1.55rem Georgia, serif; }
.worker-pill { padding: .55rem .8rem; border-radius: 99px; background: #edf1dc; color: #4d5931; font-size: .82rem; font-weight: 700; }
.resource-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: .8rem; margin-top: 1.25rem; }
article { display: flex; gap: .8rem; align-items: center; padding: 1rem; border: 1px solid #e1e3d2; border-radius: 1rem; background: #fff; }
.resource-icon { width: 2.8rem; height: 2.8rem; display: grid; place-items: center; border-radius: .8rem; background: #f1e8ba; font-size: 1.5rem; }
.resource-icon--cured { background: #ffedb4; }.resource-icon--jar { background: #e8d9c9; }
article small { display: block; color: #757b68; } article strong { color: #2c351f; font-size: 1.45rem; }
.progress-track { display: grid; grid-template-columns: repeat(4, 1fr); gap: .5rem; margin-top: 1rem; }
.progress-step { display: flex; gap: .4rem; align-items: center; padding: .65rem; border-radius: .7rem; background: #f0f1ea; color: #7a7d70; }
.progress-step--complete { background: #e3edbe; color: #40531f; }
.progress-step span { font-weight: 900; }.progress-step small { font-weight: 700; }
@media (max-width: 700px) { .resource-grid { grid-template-columns: 1fr; } .progress-track { grid-template-columns: repeat(2, 1fr); } }
</style>
