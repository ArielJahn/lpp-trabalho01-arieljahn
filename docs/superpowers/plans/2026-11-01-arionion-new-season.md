# AriOnion New Season Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que o Mestre reinicie uma temporada encerrada, zerando o estado compartilhado em memória e retornando todos à fase de espera.

**Architecture:** Um novo pedido Socket.IO passa pelo gateway e runtime autoritativo, cancela efeitos antigos, substitui o estado e publica um fato para todos. O composable expõe a ação e o painel do Mestre mostra o botão apenas na fase encerrada.

**Tech Stack:** Nuxt 4, TypeScript, Socket.IO, Vue 3, Vitest

**Spec:** `docs/superpowers/specs/2026-11-01-arionion-new-season-design.md`

## Global Constraints

- Somente o Mestre pode reiniciar e apenas quando `phase === 'closed'`.
- O fato público retorna todos para `waiting`; abrir permanece uma ação separada.
- Conexões atuais são preservadas; progresso e temporizadores anteriores são descartados.
- Nenhum salvamento é criado.
- Pedidos inválidos geram `operacao.recusada` somente ao solicitante.

## Review Focus

- Jogador envia o pedido manualmente: recebe recusa privada e o estado não muda — Task 1.
- Mestre tenta reiniciar antes do encerramento: recebe recusa privada — Task 1.
- Efeito antigo chega depois do reinício: não altera a nova temporada — Task 1.
- Todos os clientes recebem exatamente um fato de reinício — Task 2.
- Botão não aparece para Jogador nem antes do encerramento — Task 3.

---

### Task 1: Transição autoritativa de reinício

**Files:**
- Modify: `shared/arionion/contracts.ts`
- Modify: `server/arionion/domain.ts`
- Modify: `server/arionion/runtime.ts`
- Modify: `tests/unit/domain.test.ts`
- Modify: `tests/unit/runtime.test.ts`

**Interfaces:**
- Produces: `EVENTS.restartRequested`, `EVENTS.seasonRestarted`; `restartSeason(state, actor): Transition`.

- [ ] Escrever testes falhos para Mestre/fase válidos, recusas, estado inicial e invalidação de efeito antigo.
- [ ] Executar `npm test -- tests/unit/domain.test.ts tests/unit/runtime.test.ts` e confirmar falha pela ausência do recurso.
- [ ] Implementar os eventos, `restartSeason` e o ramo de dispatch que cancela a temporada encerrada antes de aplicar o novo estado.
- [ ] Executar os testes focados e confirmar aprovação.
- [ ] Commit: `feat: add authoritative season restart`.

### Task 2: Transporte Socket.IO e cliente

**Files:**
- Modify: `server/arionion/socket-gateway.ts`
- Modify: `composables/useAriOnionSocket.ts`
- Modify: `tests/unit/socket-gateway.test.ts`
- Modify: `tests/nuxt/socket-composable.test.ts`

**Interfaces:**
- Consumes: eventos da Task 1.
- Produces: `restartSeason(): void` no retorno de `useAriOnionSocket` e projeção pública do fato `cebolal.reiniciado`.

- [ ] Escrever testes falhos para encaminhamento do pedido, recepção do fato por todos e registro no Painel de Eventos.
- [ ] Executar `npm test -- tests/unit/socket-gateway.test.ts` e `npm run test:nuxt -- tests/nuxt/socket-composable.test.ts`.
- [ ] Adicionar o evento à lista aceita pelo gateway e expor `restartSeason()` no composable.
- [ ] Executar as duas suítes focadas e confirmar aprovação.
- [ ] Commit: `feat: transport season restart events`.

### Task 3: Botão do Mestre e integração

**Files:**
- Modify: `components/ActionPanel.vue`
- Modify: `components/GameDashboard.vue`
- Modify: `app.vue`
- Modify: `tests/nuxt/dashboard.test.ts`
- Create: `README.md`

**Interfaces:**
- Consumes: `restartSeason()` da Task 2.
- Produces: emit `restart` em `ActionPanel`/`GameDashboard`, visível somente para Mestre com fase encerrada.

- [ ] Escrever teste falho de visibilidade e emissão do botão **Nova temporada**.
- [ ] Executar `npm run test:nuxt -- tests/nuxt/dashboard.test.ts` e confirmar a falha esperada.
- [ ] Conectar o emit dos componentes até `restartSeason()` em `app.vue`.
- [ ] Atualizar o README com reinício, ausência de salvamento, execução multicliente, eventos, créditos e IA.
- [ ] Executar `npm test`, `npm run test:nuxt` e `npm run build`.
- [ ] Validar com Mestre e dois Jogadores: encerrar, reiniciar, todos em espera, abrir novamente.
- [ ] Commit: `feat: add new season control for master`.
