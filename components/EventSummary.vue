<script setup lang="ts">
import { computed } from 'vue'
import type { ClientEventRecord } from '~/composables/useAriOnionSocket'

const props = withDefaults(defineProps<{ events: ClientEventRecord[]; limit?: number }>(), { limit: 3 })
const recent = computed(() => props.events.slice(-Math.max(0, props.limit)).reverse())
</script>

<template>
  <div class="event-summary">
    <ol v-if="recent.length">
      <li v-for="event in recent" :key="event.id" data-event-summary-item>
        <span :class="['event-summary__dot', `event-summary__dot--${event.kind}`]" />
        <div><strong>{{ event.name }}</strong><small>{{ event.reaction || event.cause || 'Estado sincronizado' }}</small></div>
        <time>{{ event.time }}</time>
      </li>
    </ol>
    <p v-else>Os acontecimentos da temporada aparecerão aqui.</p>
  </div>
</template>

<style scoped>
.event-summary ol { display: grid; gap: .6rem; margin: 0; padding: 0; list-style: none; }
.event-summary li { display: grid; grid-template-columns: .55rem minmax(0, 1fr) auto; gap: .55rem; align-items: start; padding-bottom: .6rem; border-bottom: 1px dashed #d7bd7a; }
.event-summary li:last-child { padding-bottom: 0; border: 0; }.event-summary__dot { width: .55rem; height: .55rem; margin-top: .25rem; border-radius: 50%; background: #78a53b; }.event-summary__dot--request { background: #3d86b3; }.event-summary__dot--rejection { background: #bf5744; }
.event-summary strong, .event-summary small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.event-summary strong { font-size: .76rem; }.event-summary small { margin-top: .15rem; color: #766b55; font-size: .7rem; }.event-summary time { color: #887a60; font-size: .66rem; }
.event-summary p { color: #766b55; font-size: .78rem; line-height: 1.45; }
</style>
