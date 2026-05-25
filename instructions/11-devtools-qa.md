# 11 — Dev Tools Visual QA

## Princípio

Agentes de IA podem gerar conteúdo em alto volume e com velocidade impossível para um desenvolvedor solo, mas não conseguem validar qualidade visual ou comportamental de forma autônoma. Um cômodo pode ter objetos com `posicaoDeInteracao` fora da navZona, um evento pode ter predicados que nunca passam em jogo, um móvel pode ter `availability` inconsistente, uma pose pode violar limites anatômicos do rig. Sem uma camada de revisão humana obrigatória, esses erros silenciosos acumulam-se no banco de conteúdo e só aparecem como bugs em runtime — difíceis de rastrear e corrigir. O `packages/dev-tools` resolve esse problema com um app interno separado (`pnpm dev:tools`), nunca incluído no bundle de produção, que oferece 5 ferramentas de inspeção e simulação especializadas. Cada tipo de conteúdo gerado por agente passa obrigatoriamente pelo proofer correspondente antes de ser mergeado em main.

## Regra fundamental

Conteúdo gerado por agente NUNCA entra em main sem aprovação explícita em pelo menos um proofer correspondente.

| Tipo de conteúdo | Proofer obrigatório |
|---|---|
| FurnitureDefinition | Furniture Viewer |
| ComodoDefinition | Room Validator |
| Pose / Cena / Animação | Scene Proofer |
| Evento narrativo (lote) | Event Graph + Simulador |
| Personagem / Rig | Character Editor |

## Stack do packages/dev-tools

- React 18 + TypeScript 5 strict
- PixiJS v8.7+ (compartilhado com `packages/game`)
- `@xyflow/react` (React Flow) — Event Graph
- Vite (app separado, não entra no bundle do jogo)
- Zod (validação de schemas carregados em runtime)
- **NÃO usa** Dexie, Zustand, GSAP ou @pixi/ui

Rodar via: `pnpm dev:tools` (script no `package.json` raiz)

> **Importante**: `packages/dev-tools` NÃO importa de `packages/game`.
> Importa APENAS de `packages/core` (schemas, rig, interaction).

## Ferramenta 1 — Furniture Viewer

**O que carrega**: todos os arquivos `content/furniture/**/*.json`, interpretando cada arquivo como array de `FurnitureDefinition` (validado via Zod em tempo real). Falhas de schema são destacadas com ícone ⚠️ no card.

**Filtros disponíveis**:
- Era: `eighties` / `nineties` / `twothousands` / `modern` (baseado em `availability.startYear`)
- Categoria: `assento` / `cama` / `tecnologia` / `eletrodomestico` / `decoracao` / `treino` / `mesa` / `outro`
- Faixa de preço: slider duplo (min–max) em reais
- Texto: busca por nome ou tag

**Campos exibidos por card**:
- Nome e categoria (com ícone)
- Era de disponibilidade (`startYear – endYear` ou `startYear+`)
- Preço de compra e valor de revenda
- Tamanho em grid (`largura × altura` tiles)
- Lista de ações disponíveis (`acoes[]`)
- Efeitos passivos (`conforto`, `humor`, `energia`, `statusSocial`)
- Tags

**Objetivo de QA**: revisar 60+ móveis rapidamente em uma única tela sem abrir arquivos JSON manualmente.

**Critério de aprovação**: todos os cards renderizam sem ⚠️; nenhum móvel com `acoes[]` vazio; `availability.endYear >= availability.startYear` em todos; efeitos passivos dentro do limite documentado (máx +3 por atributo).

## Ferramenta 2 — Room Validator / Editor

**O que renderiza** (via PixiJS, usando `shared/PixiCanvas.tsx`):
- Background placeholder colorido com label do nome do cômodo (`ComodoDefinition.nome`)
- Retângulo por `InteractableObject` com label de `tipo` e `id`
- `navZonas` como overlay semitransparente verde sobre o background
- `pontosDeSaida` como setas coloridas com o destino exibido (`comodoId` ou `mapa`)
- `posicaoDeInteracao` de cada objeto como círculo amarelo

**Drag-and-drop**: arrastar um `InteractableObject` atualiza `posicao` e `posicaoDeInteracao` simultaneamente (offset relativo mantido). As coordenadas no painel JSON lateral atualizam em tempo real.

**Painel lateral JSON**: editor de texto sincronizado bidirecionalmente com o canvas — editar o JSON move os elementos na tela; arrastar no canvas atualiza o JSON. Validação Zod contínua com destaque de campos inválidos.

**Carregamento**: abrir qualquer `content/locations/**/*.json` via seletor de arquivo ou drop na janela.

**Gate de QA**: toda `ComodoDefinition` gerada por IA passa aqui antes de ir para `content/locations/`. Nunca commitar cômodo sem validação visual.

**Critério de aprovação**: o personagem consegue alcançar a `posicaoDeInteracao` de todos os objetos a partir do ponto de entrada sem sair da navZona (inspeção visual); todos os pontos de saída apontam para destinos existentes; nenhum objeto sobreposto a outro.

## Ferramenta 3 — Scene / Animation Proofer

**O que carrega**: JSON de pose única ou cena com timeline, validado contra o schema `Scene` via Zod.

**Renderização** (PixiJS via `shared/PixiCanvas.tsx`):
- Rig de 15 joints com silhueta orgânica (sem linhas de articulação visíveis)
- 4 orientações disponíveis: `PERFIL_ESQUERDO`, `PERFIL_DIREITO`, `FRONTAL`, `COSTAS` — botões de alternância
- **Modo debug**: toggle que exibe joints como círculos coloridos com label do nome do joint

**Controles de inspeção**:
- Slider de timeline com play/pause se a cena tiver múltiplos frames
- Sliders por joint com valores numéricos e indicação dos limites anatômicos definidos em `constraints.ts` — joint fora do range é destacado em vermelho
- Botão para exportar frame atual como PNG (para documentação de aprovação)

**Gate de QA**: toda pose ou cena gerada por IA passa aqui antes de ir para `content/poses/`.

**Critério de aprovação**: nenhum joint fora dos ranges anatômicos de `constraints.ts`; silhueta coerente nas 4 orientações; sem interpenetração de membros visível.

## Ferramenta 4 — Character Editor

**O que exibe**: grid 2×2 com as 4 orientações do personagem renderizadas simultaneamente via PixiJS, compartilhando o mesmo estado de configuração.

**Controles disponíveis**:
- Dropdowns para presets de expressão, cabelo, roupa e estilo corporal
- Slider de idade (0–80 anos) que ajusta progressivamente traços variáveis (`tracosVariaveis`) do personagem — envelhecimento gradual visível
- Seletor de gênero e tons de pele

**Objetivo**: validar que o rig renderiza corretamente para combinações de configuração antes de gerar sprites definitivos, e que o slider de idade produz variação visual coerente em todas as orientações.

**Critério de aprovação**: todas as 4 orientações renderizam sem artefatos para cada combinação de configuração testada; transição de idade suave e anatomicamente plausível.

## Ferramenta 5 — Event Graph / Consequence Simulator

A ferramenta mais crítica. Duas abas integradas que cobrem inspeção estrutural e simulação comportamental de eventos.

### Aba Grafo (`@xyflow/react`)

**Carregamento**: selecionar uma pasta de categoria (`content/events/{categoria}/`) carrega todos os JSONs de eventos como nós do grafo.

**Visualização**:
- Cada nó = um evento; label exibe `eventoId` e `titulo`
- Cor do nó por `narrativeWeight`: cinza (`routine`), azul (`relevant`), vermelho (`major`)
- Arestas conectam eventos via `eventHooks` (`eventoId` referenciado)
- Nós sem conexão de entrada ficam à esquerda; nós terminais à direita

**Filtros disponíveis**: categoria, fase de vida (`idadeRange`), era (`eraDisponivel`), `narrativeWeight`, `localContextId`, `contentTags`.

**Painel de detalhes** (clique num nó): exibe predicados (`triggers.requisitos`), choices disponíveis com seus checks (`atributo` + DC), efeitos por desfecho, flags referenciadas, `cooldownMeses`, `uniqueOnce`, `narrativeWeight`, `localContextId`, `eraDisponivel`, `criadoPor`.

### Aba Simulador

**Painel esquerdo — EstadoDeJogo editável**:
- 5 atributos (Força, Inteligência, Carisma, Constituição, Sorte) com sliders 1–20
- Campo de dinheiro
- Lista de flags ativas (adicionar/remover por texto)
- Campos: idade, ano, mês, faseDeVida
- Seletor de evento da lista carregada no grafo

**Execução passo a passo**:
1. Botão **"Verificar predicados"**: executa `PredicateEvaluator` e exibe se o evento passa ou não, com indicação de qual predicado falhou e por quê
2. Painel de **choices disponíveis**: lista as escolhas do evento com seus checks (`atributo + DC`)
3. Clique numa choice → campos adicionais: slider D20 (1–20) ou botão "Rolar aleatório"
4. Botão **"Simular"**: executa `ActionResolver` + `EffectEngine` + `ProgressionTracker` com os valores configurados

**Painel direito — diff antes/depois**: exibe estado completo do personagem lado a lado (antes e depois da ação), campo a campo, com delta destacado (`+2 Força`, `-50 dinheiro`). Cada mudança identifica o módulo responsável (ver subseção abaixo).

**Objetivo**: quando algo narrativo ficar estranho em jogo, o desenvolvedor consegue isolar exatamente "erro neste evento, nesta condição, neste efeito, nesta função" sem precisar abrir o código.

### Rastreabilidade por módulo

O simulador exibe, para cada mudança de estado, qual módulo foi responsável:

| Módulo | O que rastreia |
|---|---|
| `PredicateEvaluator` | Predicado que bloqueou ou liberou o evento; qual condição falhou com os valores atuais |
| `ActionResolver` | Modo de resolução (`direct` / `check`), resultado do D20, tier obtido (falha crítica / falha / sucesso / sucesso crítico) |
| `EffectEngine` | Efeito aplicado, delta resultante, valor antes e depois por campo |
| `ProgressionTracker` | Contador atualizado (`contadorId`, novo valor), limiar atingido e efeito de threshold disparado |
| `LifeLog` | Camada registrada (`feedback` / `acao_simples` / `consequencia` / `evento_importante`), texto gerado |

Isso permite ao desenvolvedor/QA apontar exatamente onde está o problema sem precisar abrir o código fonte.

## Fluxo de QA humano

1. Agente gera conteúdo e commita na feature branch
2. Desenvolvedor abre `pnpm dev:tools`
3. Carrega o arquivo gerado no proofer correspondente
4. Revisa visualmente e/ou simula comportamento
5. Se aprovado: merge normal para main
6. Se reprovado: anota o problema com precisão  
   *(ex.: "objeto sofá com `posicaoDeInteracao` fora da navZona — coordenada Y=290 mas navZona começa em Y=300")*
7. Repassa o feedback ao agente para correção
8. Agente corrige e republica na branch
9. Novo ciclo de revisão até aprovação

## Critérios de rejeição automática

As situações abaixo reprovam o conteúdo imediatamente, sem revisão subjetiva:

- `ComodoDefinition` com `posicaoDeInteracao` de qualquer objeto fora de todas as `navZonas`
- `FurnitureDefinition` com `availability.endYear < availability.startYear`
- `FurnitureDefinition` com `acoes[]` vazio
- Evento com predicado que referencia flag inexistente no vocabulário do jogo
- Evento com `narrativeWeight: 'major'` sem pelo menos 2 choices definidas
- Pose com qualquer joint fora dos ranges anatômicos definidos em `constraints.ts`
- `InteractableObject` com `posicaoDeInteracao` igual a `posicao` (personagem ficaria dentro do objeto)
- Evento em lote com manchete que reproduz texto histórico real palavra-por-palavra

## Estrutura de arquivos do packages/dev-tools

```
packages/dev-tools/
├── package.json
├── vite.config.ts
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx               (roteador entre as 5 ferramentas)
    ├── tools/
    │   ├── FurnitureViewer/
    │   │   ├── index.tsx
    │   │   └── FurnitureCard.tsx
    │   ├── RoomValidator/
    │   │   ├── index.tsx
    │   │   ├── RoomCanvas.tsx
    │   │   ├── JsonPanel.tsx
    │   │   └── ObjectDragger.tsx
    │   ├── SceneProofer/
    │   │   ├── index.tsx
    │   │   ├── RigCanvas.tsx
    │   │   └── JointSliders.tsx
    │   ├── CharacterEditor/
    │   │   ├── index.tsx
    │   │   └── OrientationGrid.tsx
    │   └── EventGraph/
    │       ├── index.tsx
    │       ├── GraphTab.tsx
    │       ├── SimulatorTab.tsx
    │       ├── StateDiffPanel.tsx
    │       └── ModuleTracer.tsx
    └── shared/
        ├── SchemaLoader.ts   (carrega e valida JSONs via Zod)
        └── PixiCanvas.tsx    (wrapper reutilizável do PixiJS)
```
