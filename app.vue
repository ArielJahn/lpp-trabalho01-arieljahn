<script setup lang="ts">
import { ref } from 'vue'
import type { PlayerRole } from './shared/arionion/contracts'

const client = useAriOnionSocket()
const entered = ref(false)
const playerName = ref('')
const role = ref<PlayerRole>('player')

function enter(name: string, selectedRole: PlayerRole) {
  playerName.value = name
  role.value = selectedRole
  entered.value = true
  client.connect(name, selectedRole)
}
</script>

<template>
  <EntryScreen v-if="!entered" @enter="enter" />
  <GameDashboard
    v-else
    :player-name="playerName"
    :role="role"
    :state="client.state.value"
    :connected="client.connected.value"
    :notices="client.notices.value"
    :events="client.events.value"
    :hide-production="client.hideProduction.value"
    @open="client.requestOpen"
    @close="client.requestClose"
    @restart="client.restartSeason"
    @construct="client.requestConstruction"
    @upgrade="client.requestUpgrade"
    @update:hide-production="client.hideProduction.value = $event"
  />
</template>
