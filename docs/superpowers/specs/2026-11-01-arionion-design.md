# AriOnion — Design do Cebolal em Tempo Real

## Intenção

AriOnion será um jogo web cooperativo em tempo real, com progressão linear de tycoon, desenvolvido em Nuxt e TypeScript. O projeto adapta integralmente o trabalho “Vila em Tempo Real” ao tema de um cebolal, trocando apenas a pilha Python por uma implementação Node/Nitro compatível com Nuxt.

O objetivo acadêmico principal é tornar a programação orientada a eventos visível e explicável: jogadores emitem pedidos, o servidor decide, todos recebem fatos e a interface reage sem recarregar. O visual e a progressão existem para tornar esse fluxo concreto, sem transformar o trabalho em um simulador complexo.

## Objetivos

- Manter o servidor como única fonte da verdade.
- Sincronizar Mestre e Jogadores em tempo real.
- Exibir pedidos, fatos, causas, dados e reações no Painel de Eventos.
- Implementar uma cadeia produtiva linear: `cebola → cebola curada → conserva de cebola`.
- Começar com produção pouco eficiente e liberar estágios melhores em sequência.
- Permitir melhorias repetíveis, com custos crescentes, para uma temporada longa e sem vitória obrigatória.
- Demonstrar temporizadores por meio de produção, construção, processamento e brotamento.
- Resolver corretamente solicitações simultâneas e enviar recusas apenas ao solicitante.
- Manter todo o estado somente em memória.

## Não objetivos

- Login, senha, contas ou permissões persistentes.
- Banco de dados, salvamento local ou recuperação de partidas.
- Publicação obrigatória na internet.
- Economia complexa, mercado, missões, combate ou múltiplas vilas.
- Simulação individual de cada colhedor caminhando pelo mapa.
- Condição automática de vitória.
- Contadores por evento, pois o trabalho será individual; eles podem ser incluídos depois como extra.

## Antiobjetivos

- O cliente não pode alterar estoques, liberar construções ou concluir temporizadores por conta própria.
- A interface não pode esconder o paradigma atrás de chamadas HTTP convencionais ou consultas periódicas.
- A progressão não deve adicionar sistemas que o autor não consiga explicar durante a avaliação.
- Recursos visuais não podem ser copiados de jogos comerciais.
- O jogo não deve depender de um serviço externo para funcionar localmente.

## Restrições do trabalho

- Dois papéis: o Mestre abre e encerra a temporada; o Jogador solicita construções e melhorias.
- O estado é compartilhado e mantido no servidor.
- Pedidos do cliente e fatos do servidor possuem eventos diferentes.
- O Painel de Eventos é obrigatório e mostra direção (`emit`/`on`), horário, nome, causa, dados e reação.
- Produção e conclusão de obras decorrem de temporizadores no servidor.
- Falta de recurso, falta de colhedor e fase inválida geram `operacao.recusada` apenas para quem pediu.
- A especificação do domínio deve existir antes do código e não citar tecnologia.
- O README final deve documentar execução, teste com duas abas, eventos, integrantes e uso de IA.
- Arte pública somente com licença de uso compatível e crédito no README.

## Abordagens consideradas

### 1. Progressão linear — escolhida

As construções são liberadas em ordem. Primeiro surgem os canteiros, depois o galpão de cura, depois a conserveira. Após a cadeia completa, uma melhoria global repetível aumenta a eficiência e fica progressivamente mais cara.

Vantagens: menor quantidade de estado, interface mais clara, eventos fáceis de explicar e boa aderência ao tamanho do trabalho. Desvantagem: menos liberdade estratégica.

### 2. Edifícios independentes

Cada construção teria nível, fila, capacidade e colhedores próprios. Produziria um tycoon mais profundo, mas multiplicaria estados, eventos e casos de concorrência sem melhorar a demonstração acadêmica principal.

### 3. Modelo híbrido

Usaria desbloqueios por marcos, edifícios independentes e melhorias por categoria. Equilibraria profundidade e expansão, porém ainda acrescentaria escolhas e telas desnecessárias para uma entrega individual.

## Experiência da temporada

### Entrada

O usuário informa um nome e entra como Mestre ou Jogador. Ao conectar, recebe `estado.sincronizado` apenas em sua conexão. A tela mostra a fase, os três estoques, colhedores ocupados, progressão, próxima ação, vila e Painel de Eventos.

### Abertura

O Mestre solicita a abertura. Se a fase estiver aguardando, o servidor muda para aberta, inicia os ciclos produtivos e emite `cebolal.iniciado` para todos.

### Progressão linear

1. O Cebolal começa com um pequeno estoque de cebolas e baixa capacidade.
2. Jogadores constroem dois canteiros, um por vez. Cada obra ocupa um colhedor e termina por temporizador.
3. Os canteiros produzem lotes de cebola automaticamente em intervalos definidos pelo servidor.
4. Ao concluir dois canteiros, o galpão de cura é desbloqueado.
5. O galpão consome cebolas mais antigas e produz cebolas curadas automaticamente.
6. Ao concluir o galpão e acumular cebolas curadas suficientes, a conserveira é desbloqueada.
7. A conserveira consome cebolas curadas e produz conservas automaticamente.
8. Depois da primeira conserveira, jogadores podem solicitar uma melhoria global repetível. Cada nível aumenta em 10% o rendimento da cadeia e custa mais conservas que o anterior. O intervalo permanece fixo, mantendo os temporizadores simples.

Não há tela de seleção complexa: a interface apresenta a próxima construção válida ou a melhoria disponível. Isso preserva a progressão linear.

### Brotamento

Cada lote de cebola recebe do servidor um identificador, uma quantidade remanescente e um instante de expiração. O galpão sempre cura o lote mais antigo primeiro. Quando o prazo vence, somente a quantidade ainda crua daquele lote é removida, e o servidor emite `cebola.brotada` para todos.

Esse modelo evita um temporizador por unidade e mantém o efeito explicável. Cebola curada e conserva não expiram.

### Encerramento

O Mestre solicita o encerramento. O servidor muda a fase para encerrada, interrompe novos ciclos e emite `cebolal.encerrado`. Novas construções e melhorias são recusadas. Não há vitória automática nem persistência; reiniciar o servidor restaura o estado inicial.

## Regras iniciais propostas

Estes números são parâmetros de balanceamento e podem ser ajustados durante os testes sem alterar a arquitetura:

| Regra | Valor inicial |
|---|---:|
| Cebolas iniciais | 100 |
| Limite de colhedores ocupados | 2 |
| Tempo de construção | 8 s |
| Intervalo-base da cadeia | 5 s |
| Prazo para uma cebola brotar | 20 s |
| Custo de cada canteiro | 30 cebolas |
| Produção por canteiro/ciclo | 10 cebolas |
| Custo do galpão | 60 cebolas |
| Cura por ciclo | até 10 cebolas |
| Custo da conserveira | 40 cebolas curadas |
| Consumo da conserveira/ciclo | até 8 cebolas curadas |
| Produção de conservas/ciclo | 4 conservas |
| Custo da primeira melhoria | 20 conservas |
| Crescimento do custo | `arredondar(20 × 1,6^nível)` |
| Ganho por melhoria | +10% de rendimento global acumulativo |

O multiplicador de rendimento é `1 + (nível × 0,10)` e se aplica à quantidade produzida por canteiros, galpão e conserveira. Cada quantidade final é arredondada para baixo, com mínimo de uma unidade quando houver insumo suficiente. O bônus é linear, não exponencial, para manter números e testes previsíveis em temporadas longas.

Decisão do projeto: a produção automática atende à exigência de passagem do tempo. O aspecto “manual” do começo vem da necessidade de jogadores construírem cada estágio e da baixa eficiência inicial, não de cliques repetitivos para colher.

## Estado autoritativo

O servidor mantém, no mínimo:

- `fase`: `aguardando`, `aberta` ou `encerrada`;
- estoques de cebola crua, cebola curada e conserva;
- lotes crus com expiração;
- número de canteiros, galpões e conserveiras concluídos ou em obra;
- colhedores ocupados e limite disponível;
- nível de melhoria e custo atual;
- parâmetros de produção, duração e expiração;
- jogadores conectados, com nome e papel;
- identificador da temporada para invalidar temporizadores antigos.

Todo fato público inclui uma cópia segura do estado atual, sua causa e os dados relevantes. O cliente nunca recebe estruturas internas mutáveis nem decide resultados.

## Catálogo de eventos

Os nomes finais permanecem em português e seguem `objeto.acao_solicitada` para pedidos e passado para fatos.

| Evento | Emite | Recebe | Efeito |
|---|---|---|---|
| `estado.sincronizado` | Servidor | Um cliente | Entrega o estado atual ao recém-conectado. |
| `cebolal.abertura_solicitada` | Mestre | Servidor | Pede o início da temporada. |
| `cebolal.iniciado` | Servidor | Todos | Abre a temporada e inicia ciclos. |
| `construcao.solicitada` | Jogador | Servidor | Pede a próxima construção permitida. |
| `construcao.iniciada` | Servidor | Todos | Debita o custo, ocupa colhedor e inicia a obra. |
| `construcao.concluida` | Servidor | Todos | Libera colhedor e ativa a construção. |
| `recurso.produzido` | Servidor | Todos | Registra produção ou transformação automática. |
| `cebola.brotada` | Servidor | Todos | Remove cebolas cruas expiradas. |
| `etapa.desbloqueada` | Servidor | Todos | Torna visível o próximo estágio da cadeia. |
| `melhoria.solicitada` | Jogador | Servidor | Pede o próximo nível global. |
| `melhoria.concluida` | Servidor | Todos | Debita conservas e aumenta a eficiência. |
| `operacao.recusada` | Servidor | Solicitante | Informa fase, recurso, papel ou colhedor inválido. |
| `cebolal.encerramento_solicitado` | Mestre | Servidor | Pede o fim da temporada. |
| `cebolal.encerrado` | Servidor | Todos | Interrompe a temporada e bloqueia novas ações. |

`recurso.produzido` terá dados que identificam `origem`, `consumido`, `recurso`, `quantidade` e `destino`. Assim, o catálogo continua pequeno, mas o painel diferencia colheita, cura e conserva.

## Concorrência e validação

Para cada pedido, o servidor valida papel, fase, etapa, recursos e colhedores antes de alterar qualquer estado. Validação e mutação síncrona formam uma única seção crítica, sem espera assíncrona entre elas. Só depois o servidor emite o fato.

Qualquer consumo de cebolas cruas — cura ou pagamento de construção — retira primeiro dos lotes com expiração mais próxima. O estoque agregado exibido na interface é sempre a soma das quantidades remanescentes nesses lotes.

Com isso, dois jogadores que disputem o último colhedor ou recurso são processados sequencialmente: um recebe o fato público de sucesso e o outro recebe `operacao.recusada` em sua conexão.

Temporizadores carregam o identificador da temporada e confirmam a fase antes de alterar o estado. Um ciclo antigo não pode afetar uma temporada reiniciada ou encerrada.

Eventos com o mesmo instante lógico obedecem a uma fila única do servidor. A ordem é: brotamento, conclusão de obras, produção dos canteiros, cura e fabricação de conservas. Assim, uma cebola cujo prazo chegou não pode ser salva por um processamento agendado para o mesmo instante, e os testes não dependem da ordem acidental dos timers da plataforma.

## Interface

- Tela de entrada com nome e escolha de papel.
- Cabeçalho com nome AriOnion, papel, jogador e fase.
- Painel de estoques para cebola, cebola curada e conserva.
- Indicador de colhedores ocupados e livres.
- Linha de progressão mostrando canteiros, galpão, conserveira e nível de melhoria.
- Botão contextual para a próxima construção ou melhoria.
- Controles de abertura e encerramento visíveis apenas ao Mestre.
- Área visual do Cebolal, preferencialmente com Phaser e mapa adaptado do kit.
- Avisos de sucesso, recusa, conclusão e brotamento.
- Painel de Eventos com filtro para eventos produtivos frequentes.
- Rodapé com o nome do estudante.

A interface será responsiva, mas priorizará a demonstração em desktop com duas ou três abas lado a lado.

## Arquitetura proposta

- Nuxt com TypeScript para interface, componentes e servidor Nitro.
- Socket.IO integrado ao processo Node que executa o Nuxt, mantendo uma única instância de estado em memória.
- Composable do cliente para conexão, registro de pedidos/fatos e sincronização do estado.
- Serviço de domínio independente da interface para regras, validações e transições.
- Agendador no servidor para ciclos de produção e conclusão de obras.
- Phaser no cliente para a vila desenhada, isolado em componente exclusivo do navegador.
- Testes do domínio e dos eventos com relógio controlável, sem depender do canvas.

O modo de execução de referência será uma única instância Node. Execução serverless, múltiplas réplicas e edge runtime ficam fora do escopo porque quebrariam o estado em memória compartilhado.

## Cenários obrigatórios

### Recusa

Dado que a temporada não está aberta, quando um Jogador emite `construcao.solicitada`, então o servidor emite `operacao.recusada` somente para esse Jogador e o estado não muda.

### Passagem do tempo

Dado que a temporada está aberta e existe um canteiro, quando o intervalo produtivo termina, então o servidor emite `recurso.produzido` com causa `temporizador`, acrescenta um lote de cebolas e agenda seu prazo de brotamento.

### Disputa

Dado que resta apenas um colhedor livre e recursos para uma obra, quando os Jogadores A e B emitem `construcao.solicitada` quase ao mesmo tempo, então o servidor emite `construcao.iniciada` para todos referente a apenas um pedido e `operacao.recusada` somente para o outro solicitante.

### Evento próprio de expiração

Dado um lote de cebola ainda crua, quando seu prazo termina, então o servidor remove a quantidade remanescente e emite `cebola.brotada` com causa `temporizador`.

## Estratégia visual e ativos

O mapa e os sprites do kit podem servir como base estrutural, mas deverão representar um cebolal: fileiras de cebola, canteiros, galpão de cura e conserveira. Modelos públicos só serão incorporados após confirmar licença permissiva. Cada fonte, autor, licença e modificação será registrada no README.

O visual não bloqueará a lógica: emojis ou formas simples serão usados temporariamente caso os sprites definitivos ainda não estejam prontos.

## Verificação e entrega

- Testar conexão e sincronização com duas abas.
- Testar abertura e encerramento pelo Mestre.
- Testar progressão completa até a primeira conserva.
- Testar brotamento com e sem cura parcial de um lote.
- Testar disputa simultânea com três abas.
- Confirmar que o Painel de Eventos mostra todos os pedidos e fatos pertinentes.
- Confirmar que reiniciar o servidor apaga o progresso.
- Manter commits por etapa, começando pela especificação antes do código.
- Preencher o README com execução, teste, eventos, respostas acadêmicas, créditos e declaração de uso de IA.

## Decisões deixadas ao implementador

- Organização exata dos componentes Nuxt e nomes de arquivos internos.
- Biblioteca de testes e detalhes do relógio falso.
- Paleta, tipografia e composição final do mapa.
- Pequenos ajustes nos valores de balanceamento após testes, desde que registrados na especificação de domínio antes do código correspondente.
- Implementação opcional dos contadores por evento após todos os requisitos obrigatórios estarem funcionando.
