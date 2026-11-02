<script setup lang="ts">
import { computed } from 'vue'
import { RULES } from '~/shared/arionion/rules'
import type { PlayerRole, PublicGameState } from '~/shared/arionion/contracts'

const props = withDefaults(defineProps<{ role: PlayerRole; state: PublicGameState; connected?: boolean }>(), { connected: true })
const emit = defineEmits<{ open: []; close: []; construct: []; upgrade: [] }>()
const building = computed(() => ({
  bed: { label: 'Construir canteiro', cost: `${RULES.bedCost} cebolas`, icon: '🌱' },
  'curing-shed': { label: 'Construir galpão de cura', cost: `${RULES.curingShedCost} cebolas`, icon: '🏚️' },
  cannery: { label: 'Construir conserveira', cost: `${RULES.canneryCost} cebolas curadas`, icon: '🏭' },
})[props.state.nextBuilding ?? 'bed'])
</script>

<template>
  <section class="action-panel" aria-labelledby="action-title">
    <div><p class="eyebrow">Próxima decisão</p><h2 id="action-title">{{ role === 'master' ? 'Controle da temporada' : 'Desenvolva a produção' }}</h2></div>
    <div v-if="role === 'master'" class="actions">
      <button v-if="state.phase === 'waiting'" :disabled="!connected" @click="emit('open')">🌤️ Abrir temporada</button>
      <button v-else-if="state.phase === 'open'" class="button--danger" :disabled="!connected" @click="emit('close')">🌙 Encerrar temporada</button>
      <span v-else class="closed-label">Temporada encerrada</span>
    </div>
    <div v-else class="actions">
      <button v-if="state.nextBuilding" :disabled="!connected || state.phase !== 'open'" @click="emit('construct')">
        <span>{{ building.icon }}</span><span><strong>{{ building.label }}</strong><small>Custo: {{ building.cost }}</small></span>
      </button>
      <button v-else :disabled="!connected || state.phase !== 'open'" @click="emit('upgrade')">
        <span>⚙️</span><span><strong>Melhorar Cebolal · Nível {{ state.upgradeLevel + 1 }}</strong><small>Custo: {{ state.upgradeCost }} conservas</small></span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.action-panel { min-width: 0; display: flex; justify-content: space-between; gap: 1rem; align-items: center; padding: .9rem 1.1rem; border: 3px solid #68461f; border-radius: 1.15rem; background: #3f5729; color: white; box-shadow: 0 .45rem 0 #50361f33; }
.eyebrow { margin: 0 0 .25rem; color: #afbd7a; font-size: .7rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
h2 { margin: 0; font: 700 1.25rem Georgia, serif; }
button { min-height: 4rem; display: flex; gap: .7rem; align-items: center; justify-content: center; padding: .75rem 1.1rem; border: 2px solid #fff3b5; border-radius: .85rem; background: #f2c85d; color: #3e2d12; box-shadow: 0 .32rem 0 #ad7028; cursor: pointer; }
button strong, button small { display: block; text-align: left; } button small { margin-top: .15rem; color: #58642f; }
button:disabled { opacity: .45; box-shadow: none; cursor: not-allowed; }.button--danger { background: #e6aa82; }.closed-label { color: #f0e8c8; }
@media (max-width: 650px) { .action-panel { align-items: stretch; flex-direction: column; } button { width: 100%; } }
</style>
