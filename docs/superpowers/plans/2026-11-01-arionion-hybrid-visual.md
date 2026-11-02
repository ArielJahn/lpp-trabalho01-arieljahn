# AriOnion Hybrid Visual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o AriOnion em um jogo responsivo de tela cheia com visual de livro ilustrado, cebolas animadas e Painel de Eventos em gaveta, sem alterar as regras autoritativas do servidor.

**Architecture:** Nuxt/Vue controla a HUD, responsividade, acessibilidade, gaveta de eventos e Fullscreen API. Phaser permanece isolado no cliente e renderiza somente o mundo, reagindo aos eventos Socket.IO por meio do adaptador existente; ativos ilustrados locais substituem emojis e o mapa pixelado na apresentação final.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Phaser 3, Socket.IO, Vitest, Vue Test Utils, CSS Grid, Fullscreen API

**Spec:** `docs/superpowers/specs/2026-11-01-arionion-hybrid-visual-design.md`

## Global Constraints

- Os documentos acadêmicos anexados continuam normativos; em conflito, seus requisitos prevalecem sobre a composição visual.
- O servidor continua como única fonte da verdade; nenhum componente visual calcula resultados ou altera estoques.
- O protocolo Socket.IO, a progressão linear, os papéis Mestre/Jogador e a ausência de salvamento permanecem inalterados.
- Phaser renderiza somente o mundo; Nuxt/Vue renderiza todos os controles, números e o Painel de Eventos.
- Nenhum ativo depende de URL externa em tempo de execução; origem e licença ficam em `public/assets/ASSETS.md`.
- Elementos definitivos devem ser validados pelo usuário quanto à coerência visual antes da conclusão.
- Suportar `prefers-reduced-motion: reduce`, teclado, foco visível e largura mínima de 320 px sem overflow horizontal.

## Review Focus

- Fullscreen API ausente ou rejeitada: o jogo continua utilizável e não deixa estado visual incorreto — coberto na Task 2.
- Muitos eventos chegando durante uma animação: reações são limitadas/enfileiradas sem vazamento de objetos — coberto na Task 5.
- Redimensionamento repetido e desmontagem: não recria Phaser nem mantém listeners/observadores — coberto na Task 5.
- Gaveta aberta por teclado em celular: prende foco, fecha com `Esc` e devolve foco ao acionador — coberto na Task 3.
- Movimento reduzido: elimina loops, tremor e grandes deslocamentos sem esconder informações — coberto nas Tasks 4 e 5.

---

### Task 1: Ativos ilustrados coerentes e catálogo visual

**Files:**
- Create: `public/assets/visual/onion-mascots.png`
- Create: `public/assets/visual/onion-buildings.png`
- Create: `public/assets/visual/onion-field.png`
- Create: `game/visualAssets.ts`
- Modify: `public/assets/ASSETS.md`
- Test: `tests/unit/visual-assets.test.ts`

**Interfaces:**
- Produces: `VISUAL_ASSETS`, `ONION_FRAMES`, `BUILDING_FRAMES` exported by `game/visualAssets.ts` with immutable URLs and frame metadata used by Task 5.

- [ ] **Step 1: Write the failing asset-contract test**

Assert that `VISUAL_ASSETS` contains local `/assets/visual/...` URLs, `ONION_FRAMES` contains `idle`, `work`, `cry`, `sprout`, and `celebrate`, and every frame has positive integer `x`, `y`, `width`, and `height` values with a shared character size.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- tests/unit/visual-assets.test.ts`

Expected: FAIL because `game/visualAssets.ts` does not exist.

- [ ] **Step 3: Produce and validate the final raster assets**

Generate or refine transparent storybook-style sprites with consistent onion proportions, uniform frame cells and the five required states. Create matching field and building art without text; inspect transparency, cropping and scale before copying only approved assets into `public/assets/visual/`.

- [ ] **Step 4: Implement the immutable asset metadata**

Export exact interfaces `VisualFrame { x: number; y: number; width: number; height: number }`, `VISUAL_ASSETS`, `ONION_FRAMES: Record<OnionVisualState, VisualFrame>` and `BUILDING_FRAMES` from `game/visualAssets.ts`; use `OnionVisualState = 'idle' | 'work' | 'cry' | 'sprout' | 'celebrate'`.

- [ ] **Step 5: Document origin and license**

Update `public/assets/ASSETS.md` with filename, purpose, author/generator, date, license/usage basis and modifications for every new asset. State explicitly that no runtime network access is required.

- [ ] **Step 6: Run the focused test**

Run: `npm test -- tests/unit/visual-assets.test.ts`

Expected: PASS.

- [ ] **Step 7: Present the assets for coherence approval**

Show the five mascot states and three buildings at their intended relative scale. Do not continue to integration until the user confirms that expressions, proportions, colors and alignment are coherent.

- [ ] **Step 8: Commit**

```bash
git add public/assets/visual public/assets/ASSETS.md game/visualAssets.ts tests/unit/visual-assets.test.ts
git commit -m "feat: add AriOnion illustrated asset set"
```

### Task 2: Fullscreen controller

**Files:**
- Create: `composables/useGameFullscreen.ts`
- Test: `tests/nuxt/fullscreen.test.ts`

**Interfaces:**
- Produces: `useGameFullscreen(target: Ref<HTMLElement | null>)` returning `{ isSupported: ComputedRef<boolean>; isFullscreen: Ref<boolean>; toggleFullscreen(): Promise<void> }`.

- [ ] **Step 1: Write failing tests for the Fullscreen API boundary**

Test successful enter/exit, `fullscreenchange` synchronization, missing `requestFullscreen`, rejected promises, and removal of the document listener on unmount. Assert rejection does not set `isFullscreen` to `true`.

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `npm run test:nuxt -- tests/nuxt/fullscreen.test.ts`

Expected: FAIL because the composable does not exist.

- [ ] **Step 3: Implement `useGameFullscreen`**

Use only the standard document/element Fullscreen API. Derive actual state from `document.fullscreenElement`, hide unsupported controls through `isSupported`, and always unregister `fullscreenchange` during scope disposal.

- [ ] **Step 4: Run the focused tests**

Run: `npm run test:nuxt -- tests/nuxt/fullscreen.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add composables/useGameFullscreen.ts tests/nuxt/fullscreen.test.ts
git commit -m "feat: add game fullscreen controller"
```

### Task 3: Painel de Eventos em gaveta acessível

**Files:**
- Create: `components/EventDrawer.vue`
- Modify: `components/EventPanel.vue`
- Test: `tests/nuxt/event-drawer.test.ts`
- Modify: `tests/nuxt/event-panel.test.ts`

**Interfaces:**
- Consumes: existing `ClientEventRecord[]`, `hideProduction`, and `update:hideProduction` contract.
- Produces: `EventDrawer` props `{ open: boolean; events: ClientEventRecord[]; hideProduction: boolean }` and emits `{ close: []; 'update:hideProduction': [boolean] }`.

- [ ] **Step 1: Write failing drawer behavior tests**

Assert closed content is inaccessible, open drawer has `role="dialog"` and `aria-modal="true"`, close button and `Escape` emit `close`, focus enters the drawer, tab stays within its controls, and closing returns focus to the supplied trigger element.

- [ ] **Step 2: Extend event-panel tests for academic fields**

Assert the full panel still renders direction (`emit`/`on`), time, event name, cause, data, reaction and the production filter exactly as required by the existing documents.

- [ ] **Step 3: Run focused tests and verify failure**

Run: `npm run test:nuxt -- tests/nuxt/event-drawer.test.ts tests/nuxt/event-panel.test.ts`

Expected: FAIL because the drawer is missing.

- [ ] **Step 4: Implement `EventDrawer.vue`**

Use a Vue `Teleport` to `body`, a backdrop, a labelled dialog and explicit focus management. Lock background scrolling while open, support `Escape`, and restore both scrolling and focus on close/unmount.

- [ ] **Step 5: Keep `EventPanel.vue` presentation-neutral**

Retain its complete semantic content and filtering while adjusting styles so it fills the drawer without owning page placement.

- [ ] **Step 6: Run focused tests**

Run: `npm run test:nuxt -- tests/nuxt/event-drawer.test.ts tests/nuxt/event-panel.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/EventDrawer.vue components/EventPanel.vue tests/nuxt/event-drawer.test.ts tests/nuxt/event-panel.test.ts
git commit -m "feat: move event log into accessible drawer"
```

### Task 4: Tela de jogo responsiva e HUD ilustrada

**Files:**
- Create: `components/EventSummary.vue`
- Modify: `components/GameDashboard.vue`
- Modify: `components/ResourcePanel.vue`
- Modify: `components/ActionPanel.vue`
- Modify: `assets/css/main.css`
- Modify: `tests/nuxt/dashboard.test.ts`

**Interfaces:**
- Consumes: `useGameFullscreen` from Task 2 and `EventDrawer` from Task 3.
- Produces: named layout regions `game-header`, `resources`, `world`, `activity`, `actions`; `EventSummary` props `{ events: ClientEventRecord[]; limit?: number }` with default limit `3`.

- [ ] **Step 1: Write failing dashboard structure tests**

Assert the five named regions exist, event summary shows at most three recent items, the “Abrir painel de eventos” trigger opens the drawer, the fullscreen control is rendered only when supported, and existing notices, role-specific actions and student credit remain present.

- [ ] **Step 2: Add reduced-motion and overflow assertions**

Assert root classes expose a reduced-motion-safe state and CSS contains `min-width: 0`, responsive grid areas, `100dvh`, and a breakpoint that places the world before auxiliary panels without horizontal page overflow.

- [ ] **Step 3: Run dashboard tests and verify failure**

Run: `npm run test:nuxt -- tests/nuxt/dashboard.test.ts`

Expected: FAIL because the new regions, summary and controls are absent.

- [ ] **Step 4: Implement `EventSummary.vue`**

Render the newest `limit` events with event name, short reaction and time. This component is a preview only; it must not replace or filter the full drawer data.

- [ ] **Step 5: Recompose `GameDashboard.vue`**

Use CSS Grid regions instead of the current hero/document flow. Add the event-drawer state and trigger ref, integrate fullscreen on the root container, keep all existing emits unchanged, and provide textual button labels alongside icons.

- [ ] **Step 6: Restyle resource and action panels**

Apply the approved storybook palette, rounded panel system and uniform action dimensions without changing props, emits, role visibility or enabled/disabled rules.

- [ ] **Step 7: Implement responsive and reduced-motion CSS**

Desktop uses left/world/right regions and a bottom action dock. At the mobile breakpoint the world is first, panels stack below and actions form two columns. Disable nonessential CSS animation inside `@media (prefers-reduced-motion: reduce)`.

- [ ] **Step 8: Run dashboard tests**

Run: `npm run test:nuxt -- tests/nuxt/dashboard.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add components/EventSummary.vue components/GameDashboard.vue components/ResourcePanel.vue components/ActionPanel.vue assets/css/main.css tests/nuxt/dashboard.test.ts
git commit -m "feat: add fullscreen storybook game layout"
```

### Task 5: Mundo Phaser ilustrado e animado

**Files:**
- Create: `game/villageReactions.ts`
- Modify: `game/createOnionVillage.ts`
- Modify: `components/OnionVillage.client.vue`
- Modify: `tests/unit/village-adapter.test.ts`
- Create: `tests/unit/village-reactions.test.ts`

**Interfaces:**
- Consumes: asset metadata from Task 1 and unchanged `VillagePayload` events.
- Produces: `VisualReaction` union, `reactionForEvent(event: string, payload: VillagePayload): VisualReaction`, `createReactionQueue(maxSize?: number)` returning `{ enqueue(reaction: VisualReaction): void; dequeue(): VisualReaction | undefined; size(): number; clear(): void }`, and `createOnionVillage(container, options?: { reducedMotion?: boolean }): Promise<VillageDriver>`.

- [ ] **Step 1: Write failing reaction-mapping tests**

Assert mappings for season start, construction start/completion, production, sprouting, upgrade, rejection and closing. Assert unknown events return `{ type: 'none' }`; the reaction queue never exceeds `6`, coalesces consecutive production reactions of the same resource and clears all pending work.

- [ ] **Step 2: Extend adapter lifecycle tests**

Assert queued events still flush once, destroy remains idempotent and events after destroy are ignored. The adapter remains lossless; queue bounding applies only to transient visual playback after the driver is ready.

- [ ] **Step 3: Run focused unit tests and verify failure**

Run: `npm test -- tests/unit/village-reactions.test.ts tests/unit/village-adapter.test.ts`

Expected: FAIL because the reaction model and queue bound are absent.

- [ ] **Step 4: Implement `villageReactions.ts`**

Keep the event-to-visual mapping pure. Define exact reaction types for `celebrate`, `build`, `produce`, `sprout`, `upgrade`, `reject`, `rest`, and `none`, including resource/quantity where supplied.

- [ ] **Step 5: Replace the pixel/emoji scene in `createOnionVillage.ts`**

Load Task 1 assets, build layered sky/field/buildings, render `workers.busy` onion workers, and use sprites/tweens for the required states. Preserve every `VillageDriver` method, state synchronization and close overlay contract.

- [ ] **Step 6: Add bounded reaction playback**

Allow one principal reaction at a time, keep at most six queued reactions, coalesce consecutive production reactions of the same resource, and destroy transient sprites/text/particles after completion.

- [ ] **Step 7: Add responsive canvas lifecycle**

Use Phaser scale resize or one `ResizeObserver` to fit the container without recreating the game. Ensure `destroy()` disconnects the observer, clears queued reactions and destroys Phaser exactly once.

- [ ] **Step 8: Respect reduced motion in `OnionVillage.client.vue`**

Pass the media-query preference into `createOnionVillage`. In reduced mode, use instant state changes and short fades, with no continuous idle loop, camera shake or large travel.

- [ ] **Step 9: Run focused unit tests**

Run: `npm test -- tests/unit/village-reactions.test.ts tests/unit/village-adapter.test.ts`

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add game/villageReactions.ts game/createOnionVillage.ts components/OnionVillage.client.vue tests/unit/village-reactions.test.ts tests/unit/village-adapter.test.ts
git commit -m "feat: animate the illustrated onion village"
```

### Task 6: Integração, documentação e validação visual

**Files:**
- Modify: `README.md`
- Modify: `public/assets/ASSETS.md`
- Modify: `docs/superpowers/specs/2026-11-01-arionion-hybrid-visual-design.md` only if implementation-approved visual details need recording

**Interfaces:**
- Consumes: all previous tasks.
- Produces: documented execution and a verified release candidate; no new runtime API.

- [ ] **Step 1: Run all automated verification**

Run: `npm test`

Expected: all unit tests pass.

Run: `npm run test:nuxt`

Expected: all Nuxt/component tests pass.

Run: `npm run build`

Expected: Nuxt production build exits with code `0`.

- [ ] **Step 2: Perform the required multi-client scenario**

Open one Master and at least two Player sessions. Verify synchronization, role controls, construction contention, requester-only rejection, timed production, sprouting, curing, preserves and season closing while the corresponding animations remain reactions only.

- [ ] **Step 3: Perform the visual matrix**

Check desktop window, narrow desktop, 320 px mobile width and browser fullscreen. Confirm no horizontal overflow, clipped controls, canvas/HUD overlap or misplaced speech bubbles; verify drawer scrolling and focus behavior.

- [ ] **Step 4: Verify motion and lifecycle edge cases**

Test reduced-motion mode, repeated resizes, repeated fullscreen enter/exit, rapid event bursts and navigation/unmount. Confirm no duplicate canvas, stale listener, runaway animation or retained page scroll lock.

- [ ] **Step 5: Obtain final coherence approval**

Show the running game in normal and fullscreen layouts with happy, crying/brotando and celebrating states. Record and address any alignment or consistency feedback before declaring completion.

- [ ] **Step 6: Update project documentation**

Document fullscreen controls, event drawer, responsive behavior, animation/event mapping, asset credits and the unchanged no-save behavior. Preserve all academic execution, two-tab/multi-player, event catalog and AI-use documentation required by the original work.

- [ ] **Step 7: Commit**

```bash
git add README.md public/assets/ASSETS.md docs/superpowers/specs/2026-11-01-arionion-hybrid-visual-design.md
git commit -m "docs: document the animated AriOnion interface"
```

- [ ] **Step 8: Final verification after the documentation commit**

Run: `npm test && npm run test:nuxt && npm run build`

Expected: every command exits with code `0`; working tree contains no unintended changes.
