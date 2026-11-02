<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import ActionPanel from './ActionPanel.vue'
import EventDrawer from './EventDrawer.vue'
import EventSummary from './EventSummary.vue'
import OnionVillage from './OnionVillage.client.vue'
import ResourcePanel from './ResourcePanel.vue'
import { useGameFullscreen } from '~/composables/useGameFullscreen'
import type { ClientEventRecord, ClientNotice } from '~/composables/useAriOnionSocket'
import type { PlayerRole, PublicGameState } from '~/shared/arionion/contracts'

defineProps<{ playerName: string; role: PlayerRole; state: PublicGameState; connected: boolean; notices: ClientNotice[]; events: ClientEventRecord[]; hideProduction: boolean }>()
const emit = defineEmits<{ open: []; close: []; construct: []; upgrade: []; 'update:hideProduction': [value: boolean] }>()
const gameShell = ref<HTMLElement | null>(null)
const eventDrawerOpen = ref(false)
const reducedMotion = ref(false)
const { isSupported, isFullscreen, toggleFullscreen } = useGameFullscreen(gameShell)
let motionQuery: MediaQueryList | null = null

function synchronizeMotion(event: MediaQueryListEvent | MediaQueryList) {
  reducedMotion.value = event.matches
}

onMounted(() => {
  motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null
  if (!motionQuery) return
  synchronizeMotion(motionQuery)
  motionQuery.addEventListener?.('change', synchronizeMotion)
})

onBeforeUnmount(() => motionQuery?.removeEventListener?.('change', synchronizeMotion))
</script>

<template>
  <div ref="gameShell" :class="['game-shell', { 'game-shell--fullscreen': isFullscreen, 'game-shell--reduced-motion': reducedMotion }]">
    <header class="game-header" data-region="game-header">
      <a class="brand" href="#" aria-label="AriOnion"><span aria-hidden="true">🧅</span>Ari<strong>Onion</strong></a>
      <div class="season-chip">{{ state.phase === 'open' ? '☀ Temporada aberta' : state.phase === 'closed' ? '🌙 Temporada encerrada' : '⏳ Aguardando o Mestre' }}</div>
      <div class="game-header__tools">
        <div class="identity"><span :class="['status-dot', { 'status-dot--online': connected }]" />{{ connected ? 'Ao vivo' : 'Conectando' }}<b>{{ role === 'master' ? 'Mestre' : 'Jogador' }} · {{ playerName }}</b></div>
        <button v-if="isSupported" data-fullscreen-toggle type="button" :aria-pressed="isFullscreen" @click="toggleFullscreen">{{ isFullscreen ? '↙ Sair da tela cheia' : '⛶ Tela cheia' }}</button>
      </div>
    </header>

    <main class="game-grid">
      <aside class="storybook-panel resources-region" data-region="resources"><ResourcePanel :state="state" /></aside>
      <section class="world-region" data-region="world">
        <OnionVillage :state="state" :events="events" />
        <ul v-if="notices.length" class="notices" aria-live="polite"><li v-for="(notice, index) in notices" :key="index" :class="`notice--${notice.type}`">{{ notice.text }}</li></ul>
      </section>
      <aside class="storybook-panel activity-region" data-region="activity">
        <div class="panel-heading"><div><p>Em tempo real</p><h2>O que aconteceu</h2></div><span>{{ events.length }}</span></div>
        <EventSummary :events="events" />
        <button data-open-events type="button" class="open-events" @click="eventDrawerOpen = true">📜 Abrir painel de eventos</button>
      </aside>
      <div class="actions-region" data-region="actions"><ActionPanel :role="role" :state="state" :connected="connected" @open="emit('open')" @close="emit('close')" @construct="emit('construct')" @upgrade="emit('upgrade')" /></div>
    </main>

    <footer>Desenvolvido por <strong>Ariel Jahn</strong> · Programação Orientada a Eventos · 2026</footer>
    <EventDrawer :open="eventDrawerOpen" :events="events" :hide-production="hideProduction" @close="eventDrawerOpen = false" @update:hide-production="emit('update:hideProduction', $event)" />
  </div>
</template>

<style scoped>
.game-shell { min-height: 100dvh; display: grid; grid-template-rows: auto minmax(0, 1fr) auto; overflow-x: hidden; background: #f8edc9; color: #392d1b; }
.game-shell--fullscreen { height: 100dvh; }.game-header { min-width: 0; display: grid; grid-template-columns: 1fr auto 1fr; gap: 1rem; align-items: center; padding: .8rem clamp(1rem, 3vw, 2rem); border-bottom: 4px solid #d99d45; background: #fff8df; box-shadow: 0 .3rem 0 #8c5d2620; }
.brand { display: flex; gap: .45rem; align-items: center; color: #392d1b; font: 900 1.45rem Georgia, serif; text-decoration: none; }.brand strong { color: #75952d; }.season-chip { justify-self: center; padding: .55rem .9rem; border-radius: 99px; background: #dff0a2; color: #466022; font-size: .72rem; font-weight: 900; letter-spacing: .05em; text-transform: uppercase; }
.game-header__tools { min-width: 0; display: flex; justify-content: flex-end; gap: .8rem; align-items: center; }.game-header button { padding: .55rem .75rem; border: 2px solid #d8bc73; border-radius: .7rem; background: #fffdf2; color: #513b20; font-weight: 800; cursor: pointer; }.identity { min-width: 0; color: #71664f; font-size: .72rem; text-align: right; }.identity b { display: block; overflow: hidden; color: #41351f; text-overflow: ellipsis; white-space: nowrap; }.status-dot { display: inline-block; width: .5rem; height: .5rem; margin-right: .3rem; border-radius: 50%; background: #c66f58; }.status-dot--online { background: #70a63a; box-shadow: 0 0 0 4px #70a63a22; }
.game-grid { min-width: 0; display: grid; grid-template: "resources world activity" minmax(25rem, 1fr) "actions actions actions" auto / minmax(15rem, 19rem) minmax(25rem, 1fr) minmax(14rem, 18rem); gap: 1rem; padding: 1rem; }.storybook-panel { min-width: 0; align-self: start; padding: 1rem; border: 3px solid #d5a653; border-radius: 1.25rem; background: #fff8dfe8; box-shadow: 0 .55rem 0 #75512620; }.resources-region { grid-area: resources; }.world-region { position: relative; min-width: 0; grid-area: world; }.activity-region { grid-area: activity; }.actions-region { min-width: 0; grid-area: actions; }
.panel-heading { display: flex; justify-content: space-between; gap: .5rem; align-items: start; margin-bottom: .9rem; }.panel-heading p, .panel-heading h2 { margin: 0; }.panel-heading p { color: #71813c; font-size: .65rem; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }.panel-heading h2 { margin-top: .15rem; font: 800 1.15rem Georgia, serif; }.panel-heading > span { min-width: 1.8rem; padding: .25rem; border-radius: 99px; background: #e8d48f; text-align: center; font-size: .72rem; font-weight: 900; }.open-events { width: 100%; margin-top: 1rem; padding: .7rem; border: 0; border-radius: .75rem; background: #f1c256; color: #51380d; font-weight: 900; box-shadow: 0 .28rem 0 #b97c2d; cursor: pointer; }
.notices { position: absolute; right: 1rem; bottom: 1rem; z-index: 5; display: grid; gap: .4rem; max-width: min(22rem, calc(100% - 2rem)); margin: 0; padding: 0; list-style: none; }.notices li { padding: .65rem .85rem; border: 2px solid #759a3a; border-radius: .8rem; background: #f6ffd9; box-shadow: 0 .35rem 1rem #27351d30; font-size: .78rem; font-weight: 800; }.notices .notice--error { border-color: #bd5b48; background: #ffe3d9; color: #803d32; }
footer { padding: .55rem 1rem; border-top: 1px solid #ddc98f; color: #796e58; text-align: center; font-size: .7rem; }
@media (max-width: 1050px) { .game-grid { grid-template: "world world" minmax(24rem, auto) "resources activity" auto "actions actions" auto / minmax(0, 1fr) minmax(0, 1fr); }.game-header { grid-template-columns: 1fr 1fr; }.season-chip { display: none; } }
@media (max-width: 680px) { .game-header { grid-template-columns: auto minmax(0, 1fr); padding: .7rem; }.game-header__tools { gap: .35rem; }.identity { font-size: 0; }.identity b { font-size: .65rem; }.game-header button { font-size: .68rem; }.game-grid { grid-template: "world" minmax(20rem, auto) "resources" auto "activity" auto "actions" auto / minmax(0, 1fr); gap: .7rem; padding: .7rem; }.storybook-panel { padding: .8rem; } }
@media (prefers-reduced-motion: reduce) { .game-shell *, .game-shell *::before, .game-shell *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; } }
</style>
