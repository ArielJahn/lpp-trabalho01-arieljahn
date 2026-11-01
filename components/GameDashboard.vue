<script setup lang="ts">
import ActionPanel from './ActionPanel.vue'
import EventPanel from './EventPanel.vue'
import ResourcePanel from './ResourcePanel.vue'
import type { ClientEventRecord, ClientNotice } from '~/composables/useAriOnionSocket'
import type { PlayerRole, PublicGameState } from '~/shared/arionion/contracts'

defineProps<{ playerName: string; role: PlayerRole; state: PublicGameState; connected: boolean; notices: ClientNotice[]; events: ClientEventRecord[]; hideProduction: boolean }>()
const emit = defineEmits<{ open: []; close: []; construct: []; upgrade: []; 'update:hideProduction': [value: boolean] }>()
</script>

<template>
  <div class="dashboard-shell">
    <header class="topbar">
      <a class="brand" href="#" aria-label="AriOnion"><span>🧅</span>Ari<strong>Onion</strong></a>
      <div class="identity"><span :class="['status-dot', { 'status-dot--online': connected }]" />{{ connected ? 'Ao vivo' : 'Conectando' }}<b>{{ role === 'master' ? 'Mestre' : 'Jogador' }} · {{ playerName }}</b></div>
    </header>
    <main class="dashboard">
      <section class="hero">
        <div><p class="eyebrow">Temporada {{ state.phase === 'open' ? 'aberta' : state.phase === 'closed' ? 'encerrada' : 'aguardando' }}</p><h1>O Cebolal cresce<br><em>em tempo real.</em></h1><p>Cada canteiro, lote curado e conserva é decidido pelo servidor e compartilhado com toda a vila.</p></div>
        <div class="farm-preview" aria-label="Prévia do Cebolal">
          <span class="sun">☀️</span><div class="rows"><span v-for="n in 18" :key="n">🌱</span></div><div class="shed">🏚️</div><div class="preview-label">Mapa interativo na próxima etapa</div>
        </div>
      </section>
      <section class="panel"><ResourcePanel :state="state" /></section>
      <ActionPanel :role="role" :state="state" :connected="connected" @open="emit('open')" @close="emit('close')" @construct="emit('construct')" @upgrade="emit('upgrade')" />
      <ul v-if="notices.length" class="notices" aria-live="polite"><li v-for="(notice, index) in notices" :key="index" :class="`notice--${notice.type}`">{{ notice.text }}</li></ul>
      <EventPanel :events="events" :hide-production="hideProduction" @update:hide-production="emit('update:hideProduction', $event)" />
    </main>
    <footer>Desenvolvido por <strong>Ariel Jahn</strong> · Programação Orientada a Eventos · 2026</footer>
  </div>
</template>

<style scoped>
.dashboard-shell { min-height: 100vh; background: #f4f2e7; color: #2b3421; }
.topbar { height: 4.5rem; display: flex; justify-content: space-between; align-items: center; padding: 0 max(1rem, calc((100vw - 74rem) / 2)); border-bottom: 1px solid #daddc9; background: #fffdf7d9; backdrop-filter: blur(16px); }
.brand { display: flex; gap: .45rem; align-items: center; color: #2c381f; font: 700 1.35rem Georgia, serif; text-decoration: none; }.brand span { font-size: 1.5rem; }.brand strong { color: #849632; }
.identity { display: flex; gap: .5rem; align-items: center; color: #707763; font-size: .78rem; }.identity b { margin-left: .45rem; color: #3b4430; }.status-dot { width: .5rem; height: .5rem; border-radius: 50%; background: #c27964; }.status-dot--online { background: #6d983a; box-shadow: 0 0 0 4px #84a95322; }
.dashboard { width: min(74rem, calc(100% - 2rem)); display: grid; gap: 1rem; margin: 0 auto; padding: 2rem 0 3rem; }
.hero { display: grid; grid-template-columns: 1fr 1.2fr; gap: 2rem; align-items: center; padding: 1rem 0; }.eyebrow { margin: 0 0 .55rem; color: #778245; font-size: .75rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }.hero h1 { margin: 0; font: 700 clamp(2.6rem, 6vw, 4.8rem)/.98 Georgia, serif; letter-spacing: -.055em; }.hero h1 em { color: #82942f; font-style: normal; }.hero p:not(.eyebrow) { max-width: 32rem; color: #68705b; line-height: 1.6; }
.farm-preview { position: relative; min-height: 18rem; overflow: hidden; border: .5rem solid #fff; border-radius: 1.5rem; background: linear-gradient(#bcd983 0 55%, #98b760 55%); box-shadow: 0 1.5rem 3rem #52632920; }.sun { position: absolute; right: 2rem; top: 1.5rem; font-size: 2.5rem; }.rows { position: absolute; inset: 45% 5% 8%; display: grid; grid-template-columns: repeat(6, 1fr); gap: .45rem; padding: .8rem; transform: perspective(14rem) rotateX(12deg); border-radius: .8rem; background: repeating-linear-gradient(90deg, #795c36 0 12%, #9b7746 12% 16%); }.rows span { text-align: center; filter: drop-shadow(0 2px #4f692c); }.shed { position: absolute; left: 10%; top: 18%; font-size: 4rem; filter: drop-shadow(0 .5rem .4rem #53652a55); }.preview-label { position: absolute; right: 1rem; bottom: 1rem; padding: .4rem .65rem; border-radius: 99px; background: #26351dcc; color: white; font-size: .72rem; }
.panel { padding: 1.25rem; border: 1px solid #dfe1d0; border-radius: 1rem; background: #fffdf8; }.notices { display: grid; gap: .5rem; margin: 0; padding: 0; list-style: none; }.notices li { padding: .8rem 1rem; border-radius: .7rem; background: #edf2dc; }.notices .notice--error { background: #f8ded8; color: #853d35; }.notices .notice--success { background: #dfeecf; color: #3c672e; }
footer { padding: 1.5rem; border-top: 1px solid #daddc9; color: #777d6b; text-align: center; font-size: .8rem; }
@media (max-width: 800px) { .hero { grid-template-columns: 1fr; }.identity { font-size: 0; }.identity b { font-size: .75rem; }.farm-preview { min-height: 14rem; } }
</style>
