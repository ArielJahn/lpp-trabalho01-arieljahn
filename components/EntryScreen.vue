<script setup lang="ts">
import { ref } from 'vue'
import type { PlayerRole } from '../shared/arionion/contracts'

const emit = defineEmits<{ enter: [name: string, role: PlayerRole] }>()
const name = ref('')
const enter = (role: PlayerRole) => emit('enter', name.value.trim() || 'Anônimo', role)
</script>

<template>
  <main class="entry-shell">
    <section class="entry-card">
      <div class="entry-card__brand" aria-hidden="true">🧅</div>
      <p class="eyebrow">Cebolal cooperativo em tempo real</p>
      <h1>Ari<span>Onion</span></h1>
      <p class="entry-card__lead">Cultive, cure e transforme cebolas em conservas. Cada decisão acontece para todos, no mesmo instante.</p>
      <label for="player-name">Como devemos chamar você?</label>
      <input id="player-name" v-model="name" name="player-name" autocomplete="name" placeholder="Seu nome" @keyup.enter="enter('player')">
      <div class="role-grid">
        <button data-role="master" class="role-card role-card--master" type="button" @click="enter('master')">
          <span class="role-card__icon">🌤️</span><strong>Entrar como Mestre</strong><small>Abre e encerra a temporada</small>
        </button>
        <button data-role="player" class="role-card" type="button" @click="enter('player')">
          <span class="role-card__icon">🧑‍🌾</span><strong>Entrar como Jogador</strong><small>Constrói e melhora o Cebolal</small>
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.entry-shell { min-height: 100vh; display: grid; place-items: center; padding: 2rem; background: radial-gradient(circle at 15% 10%, #edf3bf, transparent 32%), linear-gradient(145deg, #f8f5df, #dce8b3); }
.entry-card { width: min(42rem, 100%); padding: clamp(2rem, 5vw, 4rem); border: 1px solid #d5d0a9; border-radius: 2rem; background: #fffdf3e8; box-shadow: 0 2rem 5rem #3d4c1b24; }
.entry-card__brand { width: 4.5rem; height: 4.5rem; display: grid; place-items: center; border-radius: 1.4rem; background: #dce87d; font-size: 2.5rem; transform: rotate(-4deg); }
.eyebrow { margin: 1.5rem 0 .5rem; color: #6e763d; font-size: .78rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
h1 { margin: 0; color: #263319; font-family: Georgia, serif; font-size: clamp(3rem, 9vw, 5.5rem); line-height: .95; letter-spacing: -.06em; }
h1 span { color: #8a9d2f; }
.entry-card__lead { max-width: 34rem; margin: 1.25rem 0 2rem; color: #586048; font-size: 1.05rem; line-height: 1.65; }
label { display: block; margin-bottom: .5rem; color: #343c28; font-weight: 750; }
input { width: 100%; box-sizing: border-box; padding: 1rem 1.1rem; border: 1px solid #bdc59b; border-radius: .85rem; background: white; color: #273019; font: inherit; outline: none; }
input:focus { border-color: #718631; box-shadow: 0 0 0 4px #aabd4a2b; }
.role-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: .8rem; margin-top: 1rem; }
.role-card { display: grid; grid-template-columns: auto 1fr; gap: .15rem .75rem; padding: 1rem; border: 1px solid #b8c28e; border-radius: 1rem; background: #eff5d7; color: #303d1e; text-align: left; cursor: pointer; transition: .2s ease; }
.role-card:hover, .role-card:focus-visible { transform: translateY(-2px); border-color: #7e9139; box-shadow: 0 .7rem 1.5rem #51621f20; }
.role-card--master { background: #fff2cc; border-color: #e1cb86; }
.role-card__icon { grid-row: span 2; font-size: 1.7rem; }
.role-card small { color: #697052; }
@media (max-width: 580px) { .entry-shell { padding: 1rem; } .role-grid { grid-template-columns: 1fr; } }
</style>
