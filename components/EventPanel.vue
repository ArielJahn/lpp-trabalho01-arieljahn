<script setup lang="ts">
import { computed } from 'vue'
import { EVENTS } from '~/shared/arionion/contracts'
import type { ClientEventRecord } from '~/composables/useAriOnionSocket'

const props = defineProps<{ events: ClientEventRecord[]; hideProduction: boolean }>()
const emit = defineEmits<{ 'update:hideProduction': [value: boolean] }>()
const visible = computed(() => props.events.filter(event => !(props.hideProduction && event.name === EVENTS.resourceProduced)))
</script>

<template>
  <section class="event-panel" aria-labelledby="event-panel-title">
    <div class="event-panel__header">
      <div>
        <p class="eyebrow">Programação orientada a eventos</p>
        <h2 id="event-panel-title">Painel de eventos</h2>
      </div>
      <label class="event-panel__filter">
        <input :checked="hideProduction" type="checkbox" @change="emit('update:hideProduction', ($event.target as HTMLInputElement).checked)">
        Ocultar produção frequente
      </label>
    </div>

    <p class="event-panel__legend"><span>⬆ emit</span> pedido deste cliente · <span>⬇ on</span> fato recebido do servidor</p>
    <ol v-if="visible.length" class="event-list">
      <li v-for="event in [...visible].reverse()" :key="event.id" :class="['event-card', `event-card--${event.kind}`]">
        <div class="event-card__title">
          <span class="event-card__direction">{{ event.direction === 'emit' ? '⬆ emit' : '⬇ on' }}</span>
          <strong>{{ event.name }}</strong><time>{{ event.time }}</time>
        </div>
        <p v-if="event.cause">causa: {{ event.cause }}</p>
        <p v-if="event.data">dados: {{ event.data }}</p>
        <p v-if="event.reaction" class="event-card__reaction">reação: {{ event.reaction }}</p>
      </li>
    </ol>
    <p v-else class="event-panel__empty">Nenhum evento ainda. Entre no Cebolal para começar.</p>
  </section>
</template>

<style scoped>
.event-panel { min-width: 0; }
.event-panel__header { display: flex; justify-content: space-between; gap: 1rem; align-items: start; }
.event-panel h2, .event-panel p { margin-top: 0; }
.eyebrow { color: #667044; font-size: .75rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.event-panel__filter { font-size: .85rem; }
.event-panel__legend { color: #5d6648; font-size: .85rem; }
.event-list { display: grid; gap: .6rem; max-height: 24rem; margin: 0; padding: 0; overflow: auto; list-style: none; }
.event-card { padding: .75rem; border-left: 4px solid #718b3b; border-radius: .5rem; background: white; }
.event-card--request { border-color: #3977a8; }
.event-card--rejection { border-color: #b5473c; }
.event-card__title { display: flex; gap: .55rem; align-items: baseline; }
.event-card__direction { color: #4d6530; font-weight: 700; }
.event-card time { margin-left: auto; color: #747b68; font-size: .75rem; }
.event-card p { margin: .35rem 0 0; color: #656b5a; font-size: .82rem; }
.event-card__reaction { color: #426427 !important; }
.event-panel__empty { color: #747b68; }
</style>
