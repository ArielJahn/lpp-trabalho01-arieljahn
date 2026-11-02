# AriOnion — Design de nova temporada

## Intenção

Permitir que uma turma reinicie o jogo sem encerrar o processo Nuxt. Depois que o Mestre encerra uma temporada, ele pode apagar o progresso em memória e preparar uma nova rodada para todos os clientes conectados.

## Comportamento aprovado

- O botão **Nova temporada** aparece somente para o Mestre quando a fase é `closed`.
- O Mestre emite um novo pedido `cebolal.reinicio_solicitado`.
- O servidor valida papel e fase antes de alterar o estado.
- Se válido, o servidor cria o estado inicial com fase `waiting`, preserva as conexões atuais e emite `cebolal.reiniciado` para todos com o novo estado.
- A nova temporada não abre automaticamente; o Mestre usa **Abrir temporada** como uma segunda ação.
- Jogadores não veem o botão e, se emitirem o pedido manualmente, recebem `operacao.recusada` somente em sua conexão.
- O reinício cancela efeitos e temporizadores da temporada encerrada antes de publicar o novo estado.
- Nenhum dado é salvo ou recuperado.

## Abordagens consideradas

1. **Reiniciar e voltar para Aguardando — escolhida:** mantém separadas as decisões de limpar e abrir, deixando o fluxo visível no Painel de Eventos.
2. **Reiniciar e abrir automaticamente:** exige que um único pedido represente duas transições e torna a demonstração dos eventos menos clara.
3. **Reiniciar o processo manualmente:** já funciona, mas é inadequado durante uma demonstração com vários clientes.

## Compatibilidade acadêmica

O recurso é aditivo. Mantém pedidos e fatos separados, servidor autoritativo, recusas direcionadas, sincronização para todos, estado em memória e registro completo no Painel de Eventos. Os eventos originais continuam inalterados.

## Verificação

- Teste de domínio/runtime confirma estado inicial, conexões preservadas e temporizadores cancelados.
- Teste de gateway confirma o novo pedido.
- Teste de componente confirma visibilidade apenas para Mestre na fase encerrada e emissão da ação.
- Teste multicliente confirma que todos voltam a `waiting` e podem acompanhar a abertura seguinte.
