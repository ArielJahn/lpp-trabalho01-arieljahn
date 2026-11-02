# AriOnion

AriOnion é um jogo tycoon multijogador, em tempo real e orientado a eventos. A vila é um cebolal que começa com trabalho manual e evolui por uma cadeia linear: canteiros produzem cebolas, galpões fazem a cura e conserveiras entregam o produto final. Cebolas não curadas a tempo brotam e são perdidas.

**Integrante:** Ariel Jahn — [@ArielJahn](https://github.com/ArielJahn)

## Regras principais

- Um participante entra como **Mestre** e os demais como **Jogadores**.
- O Mestre abre e encerra a temporada. Depois do encerramento, **Nova temporada** zera o progresso compartilhado e retorna todos à espera; a abertura seguinte continua sendo uma ação separada.
- Jogadores constroem canteiros, galpões de cura e conserveiras, nessa ordem, e depois compram melhorias lineares quase infinitas.
- O servidor é autoritativo: pedidos podem gerar fatos públicos para todos ou uma recusa privada para quem solicitou.
- Não há autenticação de usuários nem salvamento. Ao reiniciar o servidor, o progresso em memória é perdido.

## Execução

Requer Node.js LTS.

```bash
npm install
npm run dev
```

Abra o endereço exibido pelo Nuxt em cada navegador ou dispositivo conectado à mesma rede. Use o endereço IP do computador servidor no celular. Uma janela deve entrar como Mestre e as outras como Jogador; o serviço Socket.IO utiliza a porta `3001`.

### Como testar com duas ou mais abas

1. Abra uma aba como **Mestre** e outra como **Jogador**.
2. No Mestre, abra a temporada.
3. No Jogador, solicite construções e observe o mesmo estado e os mesmos fatos nas duas abas.
4. Tente construir sem recursos ou colhedor livre e confirme que apenas o solicitante recebe `operacao.recusada`.
5. Encerre a temporada no Mestre e confirme que novas ações e efeitos ficam bloqueados.

## Eventos relevantes

O Painel de Eventos torna visível a cadeia pedido → fato → reação. Exemplos: `cebolal.abertura_solicitada` → `cebolal.iniciado`, `construcao.solicitada` → `construcao.iniciada`/`construcao.concluida`, `cebolal.reinicio_solicitado` → `cebolal.reiniciado`. Operações inválidas geram `operacao.recusada` apenas ao solicitante.

## Perguntas obrigatórias

### 1. Quais eventos o sistema emite e escuta?

O cliente emite os pedidos `cebolal.abertura_solicitada`, `construcao.solicitada`, `melhoria.solicitada`, `cebolal.encerramento_solicitado` e `cebolal.reinicio_solicitado`. Ele escuta `estado.sincronizado`, `cebolal.iniciado`, `construcao.iniciada`, `construcao.concluida`, `recurso.produzido`, `cebola.brotada`, `etapa.desbloqueada`, `melhoria.concluida`, `operacao.recusada`, `cebolal.encerrado` e `cebolal.reiniciado`.

### 2. Como o sistema sabe quando atualizar os outros jogadores?

O servidor processa cada pedido ou temporizador no runtime autoritativo. Quando uma transição é aceita, ele emite um fato Socket.IO com o novo estado para todos; recusas são enviadas somente ao socket solicitante. Os clientes nunca calculam o novo estoque por conta própria.

### 3. Onde aparece claramente a programação orientada a eventos?

O encadeamento aparece em `server/arionion/socket-gateway.ts`, que escuta pedidos e emite os fatos produzidos pelo runtime, e em `composables/useAriOnionSocket.ts`, que registra `emit/on`, causa, dados e reação no Painel de Eventos antes de projetar o estado na interface.

## Interface e animações

A HUD em Vue se reorganiza para desktop e celular, enquanto o mundo Phaser preserva o enquadramento 16:9 e cobre todo o quadro ilustrado. Não há botão próprio de tela cheia; use o recurso nativo do navegador quando necessário. As cebolas ociosas, trabalhando, chorando, brotando ou celebrando são reações visuais aos fatos recebidos e nunca alteram as regras autoritativas do servidor. O painel lateral permite consultar o histórico completo e ocultar eventos repetitivos de produção.

## Verificação

```bash
npm test
npm run test:nuxt
npm run build
```

## Créditos

Projeto individual desenvolvido por Ariel Jahn para Programação Orientada a Eventos (2026), adaptando as especificações acadêmicas fornecidas para Nuxt, Vue, Socket.IO e Phaser. Ilustrações e sprites próprios do projeto ficam em `public/assets/visual`; consulte `public/assets/ASSETS.md` para procedência. Ferramentas de IA foram utilizadas como apoio no planejamento, programação, testes, documentação e criação visual, com decisões e validação final realizadas pelo autor.
