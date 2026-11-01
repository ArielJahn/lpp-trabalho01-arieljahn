# AriOnion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir um tycoon cooperativo em tempo real no qual jogadores desenvolvem linearmente um cebolal de cebolas cruas até conservas, com toda decisão e passagem do tempo controladas pelo servidor.

**Architecture:** Uma aplicação Nuxt/TypeScript única servirá a interface e hospedará um servidor Socket.IO ligado ao processo Node. O domínio será funcional e independente do transporte; um runtime autoritativo serializará comandos, controlará o relógio e emitirá fatos, enquanto o cliente apenas solicitará ações e projetará o estado recebido.

**Tech Stack:** Nuxt, Vue 3, TypeScript, Socket.IO, Phaser 3, Vitest e Nuxt Test Utils.

**Spec:** `docs/superpowers/specs/2026-11-01-arionion-design.md`

## Global Constraints

- Todo estado da temporada permanece somente em memória e reiniciar o processo restaura o estado inicial.
- O servidor é a única fonte da verdade; clientes não calculam estoques, desbloqueios, conclusões ou expirações.
- Pedidos usam nomes `objeto.acao_solicitada`; confirmações do servidor são fatos no passado.
- `operacao.recusada` é enviada somente ao socket solicitante; fatos aceitos são enviados a todos.
- O painel mostra direção, horário, nome, causa, dados e reação de cada evento pertinente.
- Cadeia fixa: `cebola → cebola curada → conserva de cebola`.
- Progressão fixa: dois canteiros, galpão de cura, conserveira e melhorias globais repetíveis.
- Parâmetros iniciais: 100 cebolas, 2 colhedores, obra de 8 s, ciclo de 5 s e brotamento em 20 s.
- Custos: canteiro 30 cebolas, galpão 60 cebolas, conserveira 40 cebolas curadas e primeira melhoria 20 conservas.
- A melhoria usa multiplicador `1 + nível × 0,10`; quantidades são arredondadas para baixo.
- Consumo de cebolas cruas é FIFO pelo prazo de expiração.
- No mesmo instante lógico, processar: brotamento, conclusão de obras, canteiros, cura e conserva.
- Mestre abre e encerra; Jogador constrói e melhora.
- Contadores por evento não são obrigatórios porque a entrega é individual.
- Ativos de terceiros precisam de licença permissiva e crédito no README.

## Review Focus

- Dois pedidos pelo último colhedor: exatamente um inicia e o outro recebe recusa privada — Task 3.
- Cura e brotamento no mesmo instante: o lote brota antes de poder ser curado — Task 4.
- Reconexão durante obra ou cadeia ativa: o novo cliente recebe o estado atual sem duplicar ciclos — Task 5.
- Payload malformado, papel inválido ou evento fora da fase aberta: nenhuma mutação e recusa privada — Tasks 3 e 5.
- Encerramento com timers pendentes: nenhum timer posterior altera estoques ou conclui obra — Task 4.

---

## File Structure

```text
app.vue                                      # shell principal
assets/css/main.css                         # tema e layout responsivo
components/EntryScreen.vue                  # entrada e escolha de papel
components/GameDashboard.vue                # composição da tela do jogo
components/ResourcePanel.vue                # estoques, colhedores e progresso
components/ActionPanel.vue                  # ação contextual e controles do Mestre
components/EventPanel.vue                   # histórico emit/on e filtro
components/OnionVillage.client.vue          # integração exclusiva do browser com Phaser
composables/useAriOnionSocket.ts             # conexão, pedidos e projeção dos fatos
game/createOnionVillage.ts                   # cena e adaptador visual Phaser
shared/arionion/contracts.ts                 # estado, comandos, fatos e nomes dos eventos
shared/arionion/rules.ts                     # parâmetros fixos e progressão
server/arionion/domain.ts                    # transições puras e consumo FIFO
server/arionion/scheduler.ts                 # fila determinística do relógio
server/arionion/runtime.ts                   # estado em memória e orquestração
server/plugins/socket.io.ts                  # gateway Socket.IO no servidor Nuxt
tests/unit/domain.test.ts                    # regras e concorrência do domínio
tests/unit/scheduler.test.ts                 # tempo, cadeia e expiração
tests/unit/runtime.test.ts                   # pedidos, fatos e destinatários
tests/nuxt/dashboard.test.ts                 # projeção e interface
docs/especificacao.md                        # especificação acadêmica sem tecnologia
README.md                                    # entrega e instruções
nuxt.config.ts                               # módulos, CSS e configuração Nitro
package.json                                 # comandos e dependências
tsconfig.json                                # configuração herdada do Nuxt
```

### Task 1: Base Nuxt e contratos do domínio

**Files:**
- Create: `package.json`
- Create: `nuxt.config.ts`
- Create: `tsconfig.json`
- Create: `app.vue`
- Create: `shared/arionion/contracts.ts`
- Create: `shared/arionion/rules.ts`
- Create: `tests/unit/contracts.test.ts`

**Interfaces:**
- Produces: `GameState`, `RawOnionLot`, `BuildingKind`, `PlayerRole`, `FactPayload`, `RejectionPayload`, `EVENTS`, `RULES`, `createInitialState()`.

- [ ] **Step 1: Escrever o teste dos contratos e estado inicial**

Criar testes `creates_the_documented_initial_state`, `exposes_every_request_and_fact_name` e `computes_linear_upgrade_cost`, verificando 100 cebolas, 2 colhedores, fase `aguardando`, níveis zerados, eventos do catálogo e custos 20, 32 e 51 para níveis 0, 1 e 2.

- [ ] **Step 2: Executar o teste e confirmar a falha**

Run: `npm test -- tests/unit/contracts.test.ts`
Expected: FAIL porque os módulos compartilhados ainda não existem.

- [ ] **Step 3: Criar contratos e regras imutáveis**

Definir os tipos discriminados, constantes dos eventos, `RULES` com todos os valores globais e funções `createInitialState(): GameState` e `upgradeCost(level: number): number`. Representar cebola crua por `rawOnionLots`, expondo também o total derivado nos snapshots públicos.

- [ ] **Step 4: Criar o esqueleto executável do Nuxt**

Adicionar scripts `dev`, `build`, `preview`, `test` e `test:nuxt`; configurar TypeScript estrito, CSS global e ambiente Node do Nitro. `app.vue` deve renderizar apenas “AriOnion” nesta etapa.

- [ ] **Step 5: Instalar dependências e executar as verificações**

Run: `npm install && npm test -- tests/unit/contracts.test.ts && npm run build`
Expected: testes PASS e build concluído sem erros de tipo.

- [ ] **Step 6: Commit sugerido**

```bash
git add package.json package-lock.json nuxt.config.ts tsconfig.json app.vue shared tests/unit/contracts.test.ts
git commit -m "feat: scaffold Nuxt and AriOnion contracts"
```

### Task 2: Transições puras e progressão linear

**Files:**
- Create: `server/arionion/domain.ts`
- Create: `tests/unit/domain.test.ts`
- Modify: `shared/arionion/contracts.ts`

**Interfaces:**
- Consumes: `GameState`, `BuildingKind`, `RULES`, `upgradeCost()`.
- Produces: `openSeason(state): Transition`, `closeSeason(state): Transition`, `requestNextConstruction(state, actor): Transition`, `completeConstruction(state, constructionId): Transition`, `requestUpgrade(state, actor): Transition`, `consumeRawOnions(state, amount): ConsumptionResult`.
- `Transition` is `{ state: GameState; facts: DomainFact[]; rejection?: DomainRejection; effects: ScheduledEffect[] }`.

- [ ] **Step 1: Escrever os testes de progressão e FIFO**

Cobrir: abertura apenas por Mestre; próxima construção na ordem canteiro, canteiro, galpão e conserveira; custos corretos; colhedor ocupado durante obra; conclusão libera colhedor; galpão só desbloqueia após dois canteiros; conserveira só após galpão e 40 curadas; consumo de lotes pelo menor `expiresAt`.

- [ ] **Step 2: Escrever testes para entradas inválidas**

Cobrir fase fechada, papel desconhecido, recursos insuficientes, colhedor indisponível, construção duplicada/em andamento e nível de melhoria negativo ou não inteiro. Em todos, o estado de entrada deve permanecer estruturalmente igual.

- [ ] **Step 3: Executar os testes e confirmar a falha**

Run: `npm test -- tests/unit/domain.test.ts`
Expected: FAIL por ausência de `server/arionion/domain.ts`.

- [ ] **Step 4: Implementar as transições puras**

Não usar relógio, Socket.IO nem estado global. Clonar somente as estruturas alteradas. Retornar efeitos como `construction.complete` com `dueAt` relativo; o runtime agendará esses efeitos.

- [ ] **Step 5: Executar testes do domínio**

Run: `npm test -- tests/unit/domain.test.ts`
Expected: todos PASS, incluindo imutabilidade e FIFO.

- [ ] **Step 6: Commit sugerido**

```bash
git add server/arionion/domain.ts shared/arionion/contracts.ts tests/unit/domain.test.ts
git commit -m "feat: add linear production progression rules"
```

### Task 3: Runtime autoritativo e concorrência

**Files:**
- Create: `server/arionion/runtime.ts`
- Create: `tests/unit/runtime.test.ts`

**Interfaces:**
- Consumes: transições da Task 2 e `Scheduler` da Task 4 por porta injetada.
- Produces: `createGameRuntime(options): GameRuntime` com `connect(player): Snapshot`, `disconnect(socketId): void`, `dispatch(socketId, event, payload): RuntimeEmission[]`, `snapshot(): PublicGameState`, `reset(): void`.
- `RuntimeEmission` é `{ scope: 'all' | 'socket'; socketId?: string; event: ServerEventName; payload: unknown }`.

- [ ] **Step 1: Escrever testes de destinatário e causa**

Verificar que conexão produz `estado.sincronizado` só para o socket; sucesso produz fato público com estado e causa; recusa produz `operacao.recusada` só para o solicitante; payload desconhecido ou papel inválido não altera o estado.

- [ ] **Step 2: Escrever o teste de disputa pelo último colhedor**

Despachar dois `construcao.solicitada` em sequência sem avançar o relógio. Assertar uma única `construcao.iniciada`, uma recusa privada, ocupação 2/2 e estoque debitado uma vez.

- [ ] **Step 3: Executar e confirmar a falha**

Run: `npm test -- tests/unit/runtime.test.ts`
Expected: FAIL porque `createGameRuntime` não existe.

- [ ] **Step 4: Implementar o runtime**

Serializar `dispatch` no mesmo turno, mapear sockets para `{ nome, papel }`, validar payloads em runtime e converter `DomainFact` em payload público `{ estado, causa, ...dados }`. Nenhum `await` entre validação e aplicação da transição.

- [ ] **Step 5: Executar testes do runtime e domínio**

Run: `npm test -- tests/unit/domain.test.ts tests/unit/runtime.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit sugerido**

```bash
git add server/arionion/runtime.ts tests/unit/runtime.test.ts
git commit -m "feat: add authoritative in-memory runtime"
```

### Task 4: Relógio, produção, cura, conserva e brotamento

**Files:**
- Create: `server/arionion/scheduler.ts`
- Create: `tests/unit/scheduler.test.ts`
- Modify: `server/arionion/domain.ts`
- Modify: `server/arionion/runtime.ts`

**Interfaces:**
- Produces: `Scheduler` com `schedule(effect): string`, `cancelSeason(seasonId): void`, `start(): void`, `stop(): void`; `createManualScheduler(startAt): ManualScheduler` para testes; transições `processTick(state, at): Transition` e `expireLots(state, at): Transition`.

- [ ] **Step 1: Escrever os testes do ciclo completo**

Com relógio manual, comprovar: canteiro produz 10 a cada 5 s; lote expira em 20 s; galpão cura até 10 do lote mais antigo; conserveira consome até 8 curadas e produz 4 conservas; nível 1 aplica multiplicador 1,10 com arredondamento para baixo.

- [ ] **Step 2: Escrever os testes de ordem e cancelamento**

Cobrir brotamento antes da cura no mesmo `dueAt`, conclusão antes da produção e encerramento impedindo qualquer efeito pendente. Confirmar que uma temporada antiga não afeta o `seasonId` atual.

- [ ] **Step 3: Executar e confirmar a falha**

Run: `npm test -- tests/unit/scheduler.test.ts`
Expected: FAIL porque o scheduler ainda não existe.

- [ ] **Step 4: Implementar uma fila única determinística**

Ordenar por `dueAt`, depois prioridade numérica fixa: expiração 1, obra 2, canteiro 3, cura 4, conserva 5; desempatar por sequência crescente. O scheduler real usa um único próximo timer, não um intervalo por lote.

- [ ] **Step 5: Integrar os efeitos ao runtime**

Ao abrir, agendar o primeiro ciclo. Cada ciclo aceito agenda o próximo com o mesmo `seasonId`. Cada fato do relógio vira `RuntimeEmission` público com causa `temporizador` ou `construcao.iniciada (temporizador)`.

- [ ] **Step 6: Executar toda a suíte unitária**

Run: `npm test -- tests/unit`
Expected: PASS sem timers abertos após os testes.

- [ ] **Step 7: Commit sugerido**

```bash
git add server/arionion/scheduler.ts server/arionion/domain.ts server/arionion/runtime.ts tests/unit/scheduler.test.ts
git commit -m "feat: add deterministic production scheduler"
```

### Task 5: Gateway Socket.IO no Nuxt

**Files:**
- Create: `server/plugins/socket.io.ts`
- Create: `server/arionion/game-instance.ts`
- Create: `tests/unit/socket-gateway.test.ts`
- Modify: `nuxt.config.ts`

**Interfaces:**
- Consumes: `createGameRuntime()` e `EVENTS`.
- Produces: singleton `gameRuntime`; servidor Socket.IO anexado ao servidor Node do Nitro; auth `{ nome: string; papel: PlayerRole }`.

- [ ] **Step 1: Escrever testes do adaptador de transporte**

Usar um emissor fake para verificar mapeamento de conexão, desconexão, abertura, construção, melhoria e encerramento. Cobrir nome vazio normalizado para “Anônimo”, papel fora da enumeração recusado e reconexão recebendo snapshot sem reiniciar scheduler.

- [ ] **Step 2: Executar e confirmar a falha**

Run: `npm test -- tests/unit/socket-gateway.test.ts`
Expected: FAIL por ausência do plugin/gateway.

- [ ] **Step 3: Criar singleton e gateway Socket.IO**

Instanciar runtime uma vez por processo. No hook de inicialização do servidor Node, anexar Socket.IO, registrar handlers com os nomes de `EVENTS` e encaminhar `RuntimeEmission.scope === 'all'` por broadcast ou `scope === 'socket'` por socket alvo. Parar scheduler no hook de fechamento.

- [ ] **Step 4: Executar testes e build de produção**

Run: `npm test -- tests/unit/socket-gateway.test.ts && npm run build`
Expected: PASS e bundle Nitro Node criado.

- [ ] **Step 5: Smoke test com duas conexões**

Run: `npm run dev`
Expected: dois clientes locais recebem o mesmo `cebolal.iniciado`; reconectar um deles produz somente um `estado.sincronizado` e não duplica produção.

- [ ] **Step 6: Commit sugerido**

```bash
git add server/plugins/socket.io.ts server/arionion/game-instance.ts tests/unit/socket-gateway.test.ts nuxt.config.ts
git commit -m "feat: expose AriOnion events through Socket.IO"
```

### Task 6: Composable do cliente e Painel de Eventos

**Files:**
- Create: `composables/useAriOnionSocket.ts`
- Create: `components/EventPanel.vue`
- Create: `tests/nuxt/socket-composable.test.ts`
- Create: `tests/nuxt/event-panel.test.ts`

**Interfaces:**
- Produces: singleton client state com `connect(nome, papel)`, `disconnect()`, `requestOpen()`, `requestConstruction()`, `requestUpgrade()`, `requestClose()`, `state`, `connected`, `notices`, `events`, `hideProduction`.
- `ClientEventRecord` é `{ id, direction, name, time, cause?, data?, reaction?, kind }`.

- [ ] **Step 1: Escrever testes da projeção dos fatos**

Com socket fake, provar que pedidos são registrados como `emit`, fatos como `on`, todo snapshot substitui a projeção local e nenhum pedido altera recursos antes do fato do servidor.

- [ ] **Step 2: Escrever testes do painel**

Verificar nome, horário, causa, dados e reação; cores/tipos distintos para pedido, fato e recusa; filtro esconde somente `recurso.produzido`.

- [ ] **Step 3: Executar e confirmar a falha**

Run: `npm run test:nuxt -- tests/nuxt/socket-composable.test.ts tests/nuxt/event-panel.test.ts`
Expected: FAIL porque os arquivos ainda não existem.

- [ ] **Step 4: Implementar composable e painel**

Registrar uma reação descritiva por evento. Limitar histórico aos 100 registros mais recentes. Sanitizar dados para texto curto sem renderizar HTML vindo da rede.

- [ ] **Step 5: Executar testes Nuxt**

Run: `npm run test:nuxt -- tests/nuxt/socket-composable.test.ts tests/nuxt/event-panel.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit sugerido**

```bash
git add composables/useAriOnionSocket.ts components/EventPanel.vue tests/nuxt
git commit -m "feat: add realtime client event projection"
```

### Task 7: Dashboard jogável e progressão visível

**Files:**
- Create: `components/EntryScreen.vue`
- Create: `components/GameDashboard.vue`
- Create: `components/ResourcePanel.vue`
- Create: `components/ActionPanel.vue`
- Create: `tests/nuxt/dashboard.test.ts`
- Modify: `app.vue`
- Create: `assets/css/main.css`
- Modify: `nuxt.config.ts`

**Interfaces:**
- Consumes: `useAriOnionSocket()` e `PublicGameState`.
- Produces: tela completa sem canvas, já operável por botões e feedback textual.

- [ ] **Step 1: Escrever testes da entrada e permissões**

Verificar entrada com nome/papel; controles de abrir/encerrar apenas para Mestre; botão de construção/melhoria apenas para Jogador; estado desabilitado enquanto desconectado ou encerrado.

- [ ] **Step 2: Escrever testes de recursos e próxima ação**

Verificar os três estoques, colhedores `ocupados/limite`, próxima etapa linear, nível e custo da melhoria, avisos de sucesso/recusa/brotamento e rodapé com placeholder configurável do estudante.

- [ ] **Step 3: Executar e confirmar a falha**

Run: `npm run test:nuxt -- tests/nuxt/dashboard.test.ts`
Expected: FAIL porque os componentes ainda não existem.

- [ ] **Step 4: Implementar os componentes e o tema**

Usar HTML semântico, foco visível, contraste adequado, labels nos campos e layout que funciona com duas abas lado a lado em 1280 px. O botão contextual descreve exatamente a próxima obra e seu custo.

- [ ] **Step 5: Executar testes e build**

Run: `npm run test:nuxt -- tests/nuxt/dashboard.test.ts && npm run build`
Expected: PASS.

- [ ] **Step 6: Commit sugerido**

```bash
git add app.vue assets components nuxt.config.ts tests/nuxt/dashboard.test.ts
git commit -m "feat: build the AriOnion game dashboard"
```

### Task 8: Vila Phaser e ativos do Cebolal

**Files:**
- Create: `components/OnionVillage.client.vue`
- Create: `game/createOnionVillage.ts`
- Create: `public/assets/arionion-map.json`
- Create: `public/assets/arionion-tiles.png`
- Create: `public/assets/arionion-sprites.png`
- Create: `public/assets/ASSETS.md`
- Create: `tests/unit/village-adapter.test.ts`
- Modify: `components/GameDashboard.vue`

**Interfaces:**
- Produces: `createOnionVillage(container, assets): OnionVillageAdapter`; métodos `sync`, `seasonStarted`, `constructionStarted`, `constructionCompleted`, `resourceProduced`, `onionSprouted`, `upgradeCompleted`, `rejected`, `seasonClosed`, `destroy`.

- [ ] **Step 1: Escrever teste do adaptador visual**

Com uma cena fake, mapear cada fato público a exatamente uma reação visual e garantir que eventos recebidos antes de `ready` sejam enfileirados uma única vez. `destroy()` deve remover listeners e instância Phaser.

- [ ] **Step 2: Executar e confirmar a falha**

Run: `npm test -- tests/unit/village-adapter.test.ts`
Expected: FAIL porque o adaptador não existe.

- [ ] **Step 3: Preparar mapa e sprites licenciados**

Adaptar os ativos livres do kit ou incorporar ativos públicos permissivos. Registrar em `ASSETS.md`: arquivo, autor, URL de origem, licença e alterações. Incluir pontos nomeados para canteiros, galpão, conserveira e origem dos textos flutuantes.

- [ ] **Step 4: Implementar cena e componente client-only**

Inicializar Phaser somente em `onMounted`, reagir aos fatos já projetados pelo composable e limpar no `onBeforeUnmount`. O estado sincronizado deve reconstruir a vila sem reproduzir animações históricas.

- [ ] **Step 5: Executar testes e inspeção manual**

Run: `npm test -- tests/unit/village-adapter.test.ts && npm run dev`
Expected: PASS; mapa nítido, canteiro vira construção correta e duas abas reagem sem recarregar.

- [ ] **Step 6: Commit sugerido**

```bash
git add components/OnionVillage.client.vue components/GameDashboard.vue game public/assets tests/unit/village-adapter.test.ts
git commit -m "feat: add animated onion village"
```

### Task 9: Especificação acadêmica, README e verificação final

**Files:**
- Create: `docs/especificacao.md`
- Create: `README.md`
- Modify: arquivos que falharem na verificação, sem ampliar escopo

**Interfaces:**
- Consumes: comportamento final das Tasks 1–8.
- Produces: entrega acadêmica reproduzível e explicável.

- [ ] **Step 1: Escrever `docs/especificacao.md`**

Documentar sem citar tecnologia: regras, custos, tempos, limite, tabela completa de eventos e cenários Dado/Quando/Então para recusa, passagem do tempo, disputa e brotamento. Manter nomes idênticos aos contratos.

- [ ] **Step 2: Escrever o README**

Incluir integrante e GitHub, requisitos, instalação, execução, teste com duas/três abas, catálogo de eventos, respostas às três perguntas do trabalho, créditos de ativos e declaração detalhada de uso de IA.

- [ ] **Step 3: Executar verificação automatizada completa**

Run: `npm test && npm run test:nuxt && npm run build`
Expected: todas as suítes PASS, nenhum handle aberto e build Nitro concluído.

- [ ] **Step 4: Executar roteiro manual completo**

Abrir três abas: Mestre, Jogador A e Jogador B. Confirmar sincronização, abertura, disputa pelo último colhedor, dois canteiros, galpão, brotamento, cura, conserveira, melhoria, reconexão e encerramento. Conferir que cada ação aparece corretamente no Painel de Eventos.

- [ ] **Step 5: Verificar reinício sem persistência**

Parar e reiniciar o servidor. Entrar novamente e confirmar fase `aguardando`, 100 cebolas, nenhuma construção e nível zero.

- [ ] **Step 6: Commit sugerido**

```bash
git add docs/especificacao.md README.md
git commit -m "docs: complete AriOnion specification and handoff"
```

## Self-Review Record

- Spec coverage: intenção, progressão, eventos, expiração, concorrência, UI, visual, testes e entrega estão associados às Tasks 1–9.
- Step scan: cada etapa produz um teste, interface, implementação, verificação ou commit observável.
- Type consistency: `GameState`, `Transition`, `RuntimeEmission`, `GameRuntime` e `OnionVillageAdapter` possuem um único ponto de definição e consumidores explícitos.
- Review focus: os cinco riscos globais aparecem em testes nas Tasks 3–5.
- Proportion: o plano fixa interfaces e provas de comportamento, deixando corpos idiomáticos ao implementador.
