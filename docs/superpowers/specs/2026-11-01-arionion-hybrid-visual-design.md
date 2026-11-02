# AriOnion — Design visual híbrido em tela cheia

## Intenção

Transformar a interface atual do AriOnion em um jogo alegre, expressivo e legível em tela cheia, preservando a simplicidade técnica do trabalho e a arquitetura orientada a eventos já implementada. O cebolal deve ser o protagonista visual, e as cebolas-personagem devem comunicar felicidade, preocupação, choro, brotamento e celebração como reação aos fatos enviados pelo servidor.

Esta mudança é exclusivamente de apresentação e interação. Regras, progressão linear, autoridade do servidor, catálogo de eventos, ausência de salvamento e papéis de Mestre/Jogador permanecem como definidos na especificação principal.

## Compatibilidade com os documentos do trabalho

O Guia de Implementação, o Trabalho 01 e o kit inicial analisados no começo do projeto continuam normativos para o comportamento observável do sistema. A adaptação autorizada permanece limitada à troca da implementação Python pela pilha Nuxt/TypeScript e à tematização da vila como cebolal.

O redesign preserva expressamente:

- comunicação orientada a eventos em tempo real;
- separação entre pedidos do cliente e fatos emitidos pelo servidor;
- servidor como única fonte da verdade;
- papéis de Mestre e Jogador e os controles próprios de cada papel;
- funcionamento com duas ou mais conexões simultâneas;
- sincronização do estado ao entrar;
- passagem do tempo por temporizadores do servidor;
- recusas direcionadas somente ao solicitante quando exigido;
- Painel de Eventos com direção, horário, evento, causa, dados e reação;
- teste de concorrência entre jogadores;
- estado exclusivamente em memória, sem salvamento de progresso;
- documentação final e demonstração dos cenários exigidos.

Nenhuma decisão visual poderá remover, ocultar de forma inacessível ou substituir esses requisitos. Em caso de conflito, o requisito acadêmico documentado prevalece sobre a composição visual.

## Objetivos

- Exibir o jogo usando toda a área útil da janela, com opção de entrar e sair do modo de tela cheia do navegador.
- Adotar a direção “livro ilustrado”: formas arredondadas, cores ensolaradas, texturas leves e personagens expressivos.
- Corrigir desalinhamentos por meio de regiões de layout estáveis, sem textos ou personagens sobrepostos.
- Usar um modelo híbrido: Phaser para o mundo animado e Nuxt/Vue para a interface, os recursos e os comandos.
- Animar o cebolal como reação aos eventos reais já recebidos pelo cliente.
- Manter a interface funcional em desktop e celular.
- Manter a implementação simples o suficiente para ser explicada individualmente na avaliação.

## Não objetivos

- Substituir o Phaser, reescrever a lógica do jogo ou alterar o protocolo Socket.IO.
- Adicionar navegação livre, colisões, combate ou controle individual dos colhedores.
- Criar animação esquelética complexa, física avançada ou um editor de mapas.
- Adicionar moedas, novas regras econômicas ou novos recursos apenas para preencher a interface.
- Usar um pacote visual incompatível com o estilo ilustrado aprovado.
- Tornar o modo de tela cheia obrigatório.

## Antiobjetivos

- A HUD não pode ser desenhada dentro do canvas se isso prejudicar alinhamento ou acessibilidade.
- Personagens, construções e balões não podem cobrir controles ou números importantes.
- Emojis não serão usados como arte final para edifícios ou personagens do mundo.
- Animações não podem decidir estado, quantidade, tempo ou sucesso de uma operação.
- O visual não pode depender de uma conexão externa depois que o projeto estiver instalado.
- A tela não pode criar rolagem horizontal em larguras suportadas.

## Abordagens consideradas

### 1. Tudo desenhado em código

O cenário e os personagens seriam construídos somente com primitivas do Phaser e CSS. É leve e simples, mas limita a expressividade necessária para a identidade de livro ilustrado.

### 2. Pacote completo de imagens e animações

Todo o cenário seria composto por sprites detalhados e animações quadro a quadro. Entregaria maior riqueza, porém aumentaria muito a produção de arte, o tamanho dos ativos e a complexidade de manutenção.

### 3. Modelo híbrido — escolhido

O Phaser renderiza cenário, personagens, edifícios, partículas e movimentos. Nuxt/Vue renderiza cabeçalho, recursos, progresso, ações, avisos, painel de eventos e controle de tela cheia. Personagens ilustrados transparentes fornecem personalidade; formas, camadas e movimentos simples fornecem dinamismo sem exigir dezenas de quadros.

Essa abordagem foi escolhida por equilibrar personalidade, alinhamento, desempenho e simplicidade de desenvolvimento.

## Linguagem visual

- Direção: livro infantil ilustrado e acolhedor, sem aparência infantilizada demais.
- Paleta: céu azul-claro, verdes vivos, amarelo-cebola, creme, laranja e marrom-terra.
- Formas: cantos arredondados, volumes macios, contornos legíveis e sombras curtas.
- Tipografia: título com personalidade editorial; textos operacionais em fonte de sistema muito legível.
- Personagem-base: cebola dourada com folhas verdes, luvas de jardinagem e botas, mantendo proporções e roupas consistentes em todos os estados.
- Estados mínimos: feliz/ociosa, trabalhando/colhendo, chorando, brotando/preocupada e celebrando com uma conserva.
- Edifícios: canteiro, galpão de cura e conserveira redesenhados na mesma linguagem ilustrada.
- Elementos definitivos serão apresentados ao usuário para uma verificação explícita de coerência antes de serem incorporados ao jogo.

O spritesheet gerado durante o brainstorming é referência de estilo, não um ativo final automático. Antes da implementação definitiva, seus quadros devem ter células previsíveis, margens uniformes, transparência real e escala coerente.

## Composição e alinhamento

### Desktop

A aplicação ocupa no mínimo `100dvh` e divide a tela em três faixas:

1. Cabeçalho fixo de altura previsível com marca, fase, conexão, papel e jogador.
2. Área central flexível com o cebolal e painéis auxiliares.
3. Barra inferior de ações com botões de dimensões uniformes.

A área central usa uma grade com três regiões: estoques à esquerda, mundo Phaser no centro e progresso/eventos resumidos à direita. O canvas recebe todo o espaço central disponível e redimensiona mantendo proporção. Os painéis nunca são posicionados por coordenadas absolutas sobre o canvas.

### Larguras intermediárias e celular

Em larguras menores, o mundo aparece primeiro e ocupa toda a largura. Estoques e progresso passam para cartões abaixo do mundo; as ações viram uma grade de duas colunas. Elementos secundários podem ser recolhidos, mas recursos, próxima ação, avisos e acesso ao painel de eventos permanecem disponíveis.

O layout usa `minmax`, limites de largura, `aspect-ratio`, `clamp` e áreas nomeadas de grid. Coordenadas absolutas ficam restritas ao interior do mundo Phaser, cujo sistema de coordenadas é controlado pela câmera.

### Modo de tela cheia

Um botão explícito usa a Fullscreen API no contêiner raiz. O rótulo e o ícone mudam conforme `fullscreenchange`. Se a API não estiver disponível, o botão fica oculto e o jogo continua ocupando a janela normalmente. `Esc` continua sendo o mecanismo nativo para sair.

## Responsabilidade do Phaser

O Phaser continua isolado no componente somente-cliente e passa a renderizar:

- fundo do céu e terreno em camadas;
- fileiras de canteiros;
- galpão de cura e conserveira conforme o estado público;
- cebolas-personagem e efeitos ambientais;
- partículas, balões de reação e animações ligadas a eventos;
- sobreposição visual de temporada encerrada.

O Phaser não renderiza botões, números de estoque, identidade do jogador ou o Painel de Eventos. O adaptador atual continua sendo o limite entre eventos do cliente e efeitos visuais.

## Responsabilidade do Nuxt/Vue

Nuxt/Vue renderiza:

- cabeçalho e estado de conexão;
- recursos e colhedores;
- próxima etapa da progressão;
- ações de Mestre e Jogador;
- avisos de sucesso e recusa;
- Painel de Eventos obrigatório;
- botão de tela cheia;
- reorganização responsiva da HUD.

O estado exibido continua vindo das props e do composable Socket.IO existente. Nenhum componente visual cria um segundo estado de domínio.

### Painel de Eventos

A região lateral mostra somente um resumo recente e um botão claramente identificado. Esse botão abre o Painel de Eventos completo em uma gaveta expansível sobre a interface, sem destruir ou pausar o mundo Phaser. A gaveta preserva todos os campos exigidos pelos documentos, oferece fechamento por botão e `Esc`, controla o foco enquanto aberta e devolve o foco ao acionador ao fechar.

Em telas largas, a gaveta entra pela direita; em telas pequenas, ocupa a maior parte da tela. O conteúdo possui rolagem própria e filtros, enquanto a página não rola por baixo. A gaveta é uma reorganização visual do painel obrigatório, não uma simplificação dos dados exibidos.

### Representação dos colhedores

Os colhedores visíveis são cebolas-personagem e representam a ocupação informada pelo estado autoritativo. A quantidade em atividade acompanha `workersBusy`, respeitando o pequeno limite já definido no domínio, mas cada personagem não possui rota, inventário ou simulação própria. Ao receber eventos de construção ou produção, um colhedor disponível pode executar uma reação visual curta; a conclusão e o resultado continuam determinados exclusivamente pelo servidor.

## Sistema de animação

Serão usados dois níveis de animação:

### Movimento contínuo econômico

- folhas balançando suavemente;
- personagem ocioso respirando e piscando;
- partículas ocasionais de pólen ou brilho;
- pequenas variações de posição entre personagens para evitar movimento mecânico.

Esses efeitos usam tweens e poucos objetos, com durações alternadas.

### Reações a eventos

| Evento                 | Reação visual                                                   |
| ---------------------- | --------------------------------------------------------------- |
| `cebolal.iniciado`     | sol ilumina a cena e cebolas comemoram                          |
| `construcao.iniciada`  | colhedor caminha até a obra; placa e poeira aparecem            |
| `construcao.concluida` | edifício surge com salto suave e brilho                         |
| `recurso.produzido`    | item percorre visualmente a etapa correspondente; número flutua |
| `cebola.brotada`       | personagem preocupado brota e chora; folhas novas aparecem      |
| `melhoria.concluida`   | ondas de brilho percorrem as construções                        |
| `operacao.recusada`    | ação sacode levemente e exibe reação curta, sem poluir a cena   |
| `cebolal.encerrado`    | luz fica mais quente e o cenário entra em repouso               |

Animações de evento são enfileiradas ou consolidadas para evitar sobreposição quando fatos chegam rapidamente. A sincronização completa redesenha o estado sem tentar repetir todo o histórico.

Usuários com `prefers-reduced-motion: reduce` recebem transições curtas, sem balanço contínuo, tremor ou deslocamentos grandes.

## Ativos e licenciamento

Frameworks de jogo não fornecem modelos temáticos de cebola. Os ativos serão próprios, gerados para o projeto ou obtidos de fonte pública com licença compatível. O estilo aprovado tem prioridade sobre a conveniência de um pacote pronto.

Para qualquer ativo externo, registrar autor, origem, licença e alterações em `public/assets/ASSETS.md` e resumir os créditos no README. Ativos gerados especificamente para AriOnion devem ser salvos no repositório e descritos como tal. Nenhuma imagem será carregada de URL externa em tempo de execução.

## Desempenho e robustez

- Texturas são carregadas uma vez e reutilizadas.
- Personagens inativos reutilizam animações globais e não criam temporizadores próprios ilimitados.
- Partículas e textos flutuantes têm quantidade máxima e são destruídos ao terminar.
- `ResizeObserver` ou o sistema de escala do Phaser sincroniza canvas e contêiner sem recriar o jogo a cada redimensionamento.
- O componente remove listeners, observadores e instância Phaser ao desmontar.
- A interface permanece utilizável durante o carregamento dos ativos e apresenta uma mensagem clara em caso de falha.

## Acessibilidade

- Botões possuem rótulos textuais, foco visível e estados desabilitados compreensíveis.
- Emoção e cor não são os únicos meios de comunicar um fato; avisos textuais permanecem.
- Texto mantém contraste adequado sobre painéis opacos.
- O canvas possui nome acessível, mas as informações essenciais também existem na HUD.
- O botão de tela cheia informa `aria-pressed` e seu estado atual.

## Verificação

- Teste unitário do adaptador confirma o mapeamento de cada evento para a reação correta.
- Testes de componente confirmam HUD, ações e estado de tela cheia sem depender do canvas real.
- Testes de redimensionamento verificam classes/estrutura responsiva e ausência de overflow horizontal.
- Teste de ciclo de vida confirma destruição do Phaser e remoção de listeners.
- Teste manual em desktop, janela estreita e celular verifica que painéis, canvas, balões e ações não se sobrepõem.
- Teste manual com duas abas confirma que a animação é apenas uma reação ao mesmo estado autoritativo.
- Teste com movimento reduzido confirma que o conteúdo permanece compreensível.
- Build e suítes existentes devem continuar passando.

## Critérios de aceitação

- A tela inicial do jogo utiliza toda a janela e oferece modo de tela cheia quando suportado.
- O visual segue a direção de livro ilustrado aprovada.
- Nenhum elemento essencial fica desalinhado ou encoberto nas larguras verificadas.
- Há animações visíveis para ociosidade, produção, brotamento, construção, melhoria, recusa e encerramento.
- Cebolas felizes e chorando são visualmente coerentes entre si.
- O Painel de Eventos continua completo e legível.
- Nenhuma regra de domínio é movida para o cliente.
- Nenhum progresso é salvo.
- O usuário aprova a coerência do modelo visual final antes de a implementação ser considerada concluída.

## Decisões deixadas ao implementador

- Tempos exatos, curvas de easing e quantidade de partículas, desde que discretos.
- Divisão interna dos componentes visuais e nomes das classes.
- Resolução-base do canvas e organização dos atlases.
- Técnica exata de geração ou recorte dos sprites finais, desde que mantenha consistência e licenciamento documentado.
- Pequenos ajustes de paleta, espaçamento e escala necessários para cumprir contraste e responsividade.
