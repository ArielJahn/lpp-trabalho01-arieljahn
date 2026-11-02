# Especificação — AriOnion: Cebolal em Tempo Real

**Integrante:** Ariel Jahn — @ArielJahn

**Tipo de vila:** Cebolal

## 1. Regras do Cebolal

- O recurso primário é a cebola, o recurso refinado é a cebola curada e o produto final é a conserva de cebola.
- O Cebolal começa em fase de espera, com 100 cebolas, nenhum edifício e dois colhedores disponíveis.
- Somente o Mestre pode abrir ou encerrar a temporada.
- Durante a temporada, os Jogadores desenvolvem a cadeia em ordem: primeiro dois canteiros, depois um galpão de cura e depois uma conserveira.
- Cada obra ocupa um colhedor durante 8 segundos. Quando a obra termina, o colhedor fica livre.
- O primeiro e o segundo canteiro custam 30 cebolas cada.
- O galpão de cura custa 60 cebolas e só pode ser construído depois da conclusão dos dois canteiros.
- A conserveira custa 40 cebolas curadas e só pode ser construída depois da conclusão do galpão.
- Cada canteiro produz 10 cebolas a cada 5 segundos.
- Cada lote de cebolas brota após 20 segundos se ainda não tiver sido gasto ou curado.
- O galpão processa primeiro as cebolas com menor prazo restante e cura até 10 cebolas a cada 5 segundos.
- A conserveira consome até 8 cebolas curadas e produz 4 conservas a cada 5 segundos.
- Depois da primeira conserveira, os Jogadores podem comprar melhorias globais usando conservas.
- A primeira melhoria custa 20 conservas. Cada novo custo é o valor arredondado de `20 × 1,6^nível`.
- Cada melhoria acrescenta 10% ao rendimento da cadeia. As quantidades produzidas são arredondadas para baixo.
- Quando eventos vencem no mesmo instante, o Cebolal processa brotamento, conclusão de obra, canteiros, cura e conserva, nessa ordem.
- Se faltarem recursos ou colhedores, se a etapa estiver bloqueada ou se a temporada não estiver aberta, somente quem fez o pedido recebe a recusa.
- O Mestre encerra a temporada quando desejar. Não existe uma quantidade obrigatória de conservas para vencer.
- Todo o progresso existe somente durante a execução atual e desaparece quando o Cebolal é reiniciado.

## 2. Eventos

| Evento | Emite | Recebe | O que muda no estado |
|---|---|---|---|
| `estado.sincronizado` | Cebolal | Um participante | O participante recebe uma cópia do estado atual. |
| `cebolal.abertura_solicitada` | Mestre | Cebolal | É um pedido; nada muda até ser aceito. |
| `cebolal.iniciado` | Cebolal | Todos | A fase muda para aberta e a produção começa. |
| `construcao.solicitada` | Jogador | Cebolal | É um pedido para iniciar a próxima construção da progressão. |
| `construcao.iniciada` | Cebolal | Todos | O custo é debitado, um colhedor é ocupado e a obra começa. |
| `construcao.concluida` | Cebolal | Todos | A construção é ativada e o colhedor fica livre. |
| `recurso.produzido` | Cebolal | Todos | Cebolas, cebolas curadas ou conservas entram no estoque correspondente. |
| `cebola.brotada` | Cebolal | Todos | As cebolas cruas vencidas são removidas do estoque. |
| `etapa.desbloqueada` | Cebolal | Todos | A próxima construção da cadeia fica disponível. |
| `melhoria.solicitada` | Jogador | Cebolal | É um pedido; nada muda até ser aceito. |
| `melhoria.concluida` | Cebolal | Todos | Conservas são debitadas e o rendimento global aumenta. |
| `operacao.recusada` | Cebolal | Somente quem pediu | O estado não muda e o motivo da recusa é informado. |
| `cebolal.encerramento_solicitado` | Mestre | Cebolal | É um pedido; nada muda até ser aceito. |
| `cebolal.encerrado` | Cebolal | Todos | A fase muda para encerrada e novas ações são bloqueadas. |
| `cebolal.reinicio_solicitado` | Mestre | Cebolal | É um pedido; nada muda até ser aceito. |
| `cebolal.reiniciado` | Cebolal | Todos | O progresso da temporada é zerado e a fase retorna à espera. |

## 3. Cenários de teste

### Recusa

Dado que a temporada ainda não está aberta, quando um Jogador emite `construcao.solicitada`, então o Cebolal emite `operacao.recusada` somente para esse Jogador e nenhum recurso ou colhedor é alterado.

### Passagem do tempo

Dado que a temporada está aberta e há um canteiro concluído, quando termina o intervalo de produção, então o Cebolal emite `recurso.produzido` com causa `temporizador`, acrescenta 10 cebolas e inicia o prazo de brotamento desse lote.

### Disputa entre dois jogadores

Dado que existe apenas um colhedor livre e recursos para uma obra, quando os Jogadores A e B emitem `construcao.solicitada` quase ao mesmo tempo, então o Cebolal emite `construcao.iniciada` para todos referente a apenas um pedido e emite `operacao.recusada` somente para o outro Jogador.

### Brotamento

Dado que um lote ainda possui cebolas cruas, quando seu prazo de 20 segundos termina, então o Cebolal remove a quantidade restante e emite `cebola.brotada` para todos com causa `temporizador`.
