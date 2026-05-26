# CLAUDE.md — Instruções para Agentes Claude

## Identidade do projeto

**Vida 2.5D** é um jogo de simulação de vida com exploração point-and-click em projeção dimétrica estilo Habbo (~26.57°, razão de pixel 2:1), desenvolvido em TypeScript/PixiJS por um único desenvolvedor. O jogador cria um personagem que nasce entre 1985 e 2000 e explora ambientes em grid de tiles (casa, escola, academia, restaurante etc.) interagindo com móveis, objetos e NPCs via ActionBubble. A narrativa emerge de ações, decisões e consequências registradas em log — não de diálogos longos ou cutscenes.

## Fase atual: EXECUÇÃO

As decisões arquiteturais estão consolidadas. Não debater arquitetura sem pedido explícito. Antes de qualquer task de código, ler o(s) arquivo(s) `.md` relevante(s) desta pasta.

## Arquivos de instrução relevantes

- `instructions/12-furniture-art-styleguide.md` — styleguide de arte de móveis
- `instructions/13-isometric-grid-system.md` — projeção dimétrica, BFS, `IsoRoomDefinition`
- `instructions/14-character-pipeline.md` — sprites por camada, `CharacterRigDefinition`, animações
- `instructions/15-asset-authoring.md` — File System Access API e fluxo de authoring no Dev Tools

## Stack obrigatória

- TypeScript 5+ strict, Vite 5+, React 18+, PixiJS v8.7+
- **GSAP 3.13+** (tweens — 100% grátis comercialmente desde abr/2025)
- **@pixi/ui v2.x** (UI in-canvas, compatível PixiJS v8)
- Zustand 4+ (state), Zod 3+ (schemas), Dexie 4+ (persistência IndexedDB)
- Monorepo PNPM workspaces: `packages/core`, `packages/game`, `packages/dev-tools`
- PWA via `vite-plugin-pwa` + Workbox

## Restrições absolutas — JAMAIS violar

- PROIBIDO: game engines (Unity, Godot, Unreal, Phaser, ct.js)
- PROIBIDO: runtimes proprietários de animação (Spine, DragonBones, Live2D)
- PROIBIDO: pixi-projection (abandonado no v6, não migrou para v8)
- PROIBIDO: pathfinding.js, easystar.js ou qualquer biblioteca de pathfinding externa — usar exclusivamente o BFS próprio em `packages/core/src/iso/Pathfinder.ts`
- PROIBIDO: sprites de personagem ou móvel com canvas variável entre direções — canvas DEVE ser fixo por footprint, anchor em pixel absoluto idêntico em todas as direções
- PROIBIDO: matter.js/planck.js (sem física dinâmica no projeto)
- PROIBIDO: IA generativa em runtime do jogo
- PROIBIDO: localStorage/sessionStorage como save principal
- PROIBIDO: diálogos longos entre NPCs (falas literais, estilo visual novel)
- PROIBIDO: modal de cutscene separado para eventos (tudo acontece no ambiente)
- PROIBIDO: mundo aberto contínuo com ruas (WorldMapScreen = seletor de locais, não mundo aberto)
- PROIBIDO: build mode de construção de casa (comprar/vender/mover móveis sim; paredes não)
- PROIBIDO: pathfinding externo ou complexo fora do contrato de grid — movimento usa BFS próprio sobre tile grid booleano
- PROIBIDO: reproduzir manchetes/eventos históricos reais palavra-por-palavra
- PROIBIDO: inventar APIs de bibliotecas
- PROIBIDO: mergear em main conteúdo visual (cômodo, pose, móvel, personagem) ou narrativo (evento em lote) gerado por agente sem aprovação explícita no proofer correspondente do packages/dev-tools (ver `instructions/11-devtools-qa.md`)

## Decisões de design fechadas

### Câmera e perspectiva
- Projeção dimétrica estilo Habbo (~26.57°, razão de pixel 2:1) — NÃO isométrico 45°, NÃO oblíquo 15°
- Tile na tela: 64px largura × 32px altura
- Transformação tile→tela: `x = (tx - ty) * 32`, `y = (tx + ty) * 16`
- Z-depth: `depth = tx + ty` (objetos com maior soma ficam na frente)
- Personagem: canvas 64×96px, footprint 1×1 tile, anchor em (32, 90)
- 8 direções visuais: N, NE, E, SE, S, SW, W, NW (enum `DirecaoVisual`)
- Referência de qualidade: Habbo Hotel — móveis pequenos, charmosos, volume consistente, rotação expressiva, escala legível em cômodo denso
- Ver `instructions/13-isometric-grid-system.md` para coordinate math completo

### Rig e animação
- Runtime visual: sprites WebP pré-renderizados por direção, compostos em camadas
- Camadas em ordem: sombra → sapato → calça → corpo_base → camisa → acessorio_corpo → cabelo_atras → cabeça → rosto → cabelo_frente → chapeu → acessorio_mao
- Dev Tools: rig como overlay de autoria/validação (`CharacterRigDefinition`) — nunca renderizado em runtime de jogo
- 8 direções por parte (N, NE, E, SE, S, SW, W, NW)
- Animações: dados de offset/keyframe por camada, validadas no Character Proofer
- Canvas fixo de personagem: 64×96px, anchor (32, 90) em todas as direções
- Ver `instructions/14-character-pipeline.md` para schema e pipeline completo

### Game loop
- Fluxo: `NewGameGenerator → LifePhase → WorldMapScreen → LocationDefinition → ComodoDefinition → ExplorationScene → ActionBubble → ActionResolver → EffectEngine → VisualFeedback → LifeLog → Save`
- Exploração NÃO avança o tempo automaticamente
- Tempo avança somente quando: ação com `timeCost` é resolvida, ou jogador avança explicitamente o mês
- Movimento: BFS próprio (`packages/core/src/iso/Pathfinder.ts`) sobre tile grid booleano, sem bibliotecas externas. Personagem anda tile a tile ao longo do caminho calculado, com GSAP para suavizar cada passo (`TILE_MOVE_MS = 180ms`)
- Grid de tiles: booleano por tile (`caminhavel`/bloqueado por paredes, móveis e NPCs)
- Colisão: tiles bloqueados declarados em `ObjetoIsoDefinicao.bloqueaTiles`
- `InteractionLock` bloqueia input durante resolução de `ActionDefinition`

### Locais e cômodos
- WorldMapScreen com ícones clicáveis — não mundo aberto
- Sala única por vez (room-by-room navigation)
- Cômodos novos: schema `IsoRoomDefinition` (tile grid) em `content/locations-iso/`
- Cômodos legados (`navZonas`) em `content/locations/` permanecem válidos até migração gradual
- Movimento: clique em tile ou objeto calcula caminho por BFS e respeita tiles bloqueados
- Transições entre cômodos: fade simples (GSAP)

### Interação
- ActionBubble: React DOM overlay posicionado sobre canvas via `toGlobal()`
- VisualFeedback: floating labels em PixiJS (não React)
- HUD permanente in-canvas: @pixi/ui
- `resolutionMode: 'direct' | 'check'` — único ActionResolver para ambos
- `narrativeWeight: 'routine' | 'relevant' | 'major'` em todas as ações

### Sistema de tempo
- Ano de nascimento: 1985–2000
- Ritmo: mensal / semestral / anual (configurável)
- Fases da vida: bebe / crianca / adolescente / jovem_adulto / adulto / idoso
- WorldMapScreen disponível a partir da fase `adolescente` (parcial) ou `jovem_adulto` (plena)

### RPG
- 5 atributos: Força, Inteligência, Carisma, Constituição, Sorte
- D20 com 4 tiers: 1 (falha crítica), 2–9 (falha), 10–19 (sucesso), 20 (sucesso crítico)
- Modificadores: `floor((atributo - 10) / 2)`

### NPCs
- Persistem dentro de uma única gameplay
- Aparecem fisicamente nos cômodos via slots declarados em `ComodoDefinition.npcsElegiveis`
- Tags de persistência: `permanente`, `recorrente`, `descartavel`
- Geração de aparência por seed: `hash(saveId + npcId)`

### Casa
- Hub pessoal explorado como qualquer local
- Planta fixa — jogador compra/vende/move móveis, não constrói
- `FurnitureCatalog` filtrado por era via `availability.startYear/endYear`
- Drag-and-drop em PixiJS com grid/snap
- `HousingMarket` para mudar de casa

### Formato de assets
- Sprites de móveis e personagens: WebP (lossless para pixel art, lossy para fundos)
- 8 direções por asset: `N.webp`, `NE.webp`, `E.webp`, `SE.webp`, `S.webp`, `SW.webp`, `W.webp`, `NW.webp`
- Canvas fixo por footprint: ver tabela em `instructions/13-isometric-grid-system.md`
- Anchor em pixel absoluto: `anchorPixelX`, `anchorPixelY` — idêntico em todas as direções
- Estrutura: `content/furniture-assets/{assetId}/` e `content/character-parts/{tipo}/{partId}/`

### Dev Tools como ferramenta de authoring
- File System Access API (Chrome/Edge) para gravar assets direto no projeto
- Fallback: download de ZIP (Firefox/Safari)
- Fluxo: criar → upload sprites → ajustar anchor → salvar → vincula automaticamente ao `FurnitureDefinition` ou `CharacterPartMetadata` via ID
- Ver `instructions/15-asset-authoring.md` para implementação completa

### Log narrativo
- 5 camadas: `feedback` (efêmero) → `acao_simples` → `consequencia` → `evento_importante` → `resumo_periodico`
- NPCs visíveis nos cômodos, não só em painéis de texto

## Convenções de código TypeScript

- `strict: true`, `noImplicitAny: true`, `noUncheckedIndexedAccess: true`
- `const` por default, `let` só quando necessário, `var` proibido
- `readonly` em propriedades imutáveis
- `type` preferido sobre `interface`
- `undefined` em vez de `null` para ausência
- Imports absolutos: `@core/interaction/ActionResolver`, `@game/state/saveStore`
- Zod como source-of-truth — tipos via `z.infer<typeof X>`
- JSDoc apenas em APIs públicas quando solicitado ("DOCUMENTE")

## Convenções de nomenclatura

- Variáveis, métodos, classes em **português brasileiro**
- Correto: `resolverAcao()`, `comodoAtual`, `rosterDeNpcs`, `personagemPrincipal`
- Errado: `total`, `lista`, `data`, `valor`, `result`, `temp`
- Constantes: `SCREAMING_SNAKE_CASE` em português (`MAXIMO_MOVEIS_POR_COMODO`)
- Tipos/classes: `PascalCase` em português (`Esqueleto`, `AcaoDefinicao`, `ComodoDefinicao`)
- Exceção: tipos que mapeiam APIs externas (`Application`, `Container`, `Texture`)

## Formato de resposta

Para edições em código existente (edição cirúrgica):
- Mostrar 2 linhas de contexto ANTES e DEPOIS
- Marcador `[NEW]`, `[MODIFIED]` ou `[DELETED]`
- Bloco SEARCH/REPLACE explícito
- Apenas o trecho modificado, jamais arquivo inteiro
- Exceção: "Refatorar/Refatore" → fornecer classe completa

Para método pequeno (≤25 linhas) com mudança considerável (≥40% do corpo):
- Marcador `[SUBSTITUIR MÉTODO COMPLETO]`
- Método inteiro, sem SEARCH/REPLACE

Sem explicações após o código, exceto:
- "EXPLIQUE" → explicação técnica concisa
- "LEIGO" → explicação didática

## Fluxo obrigatório para ajustes visuais

1. Gerar 3 arquivos HTML independentes (Sugestão A conservadora, B intermediária, C ousada)
2. Dados reais simulados, interativo no necessário
3. Perguntar qual ficou mais próximo
4. SÓ APÓS resposta → gerar código final React/PixiJS

## Workflow esperado em cada sessão

1. Identificar o sprint/feature do roadmap sendo atacado
2. Ler o(s) `.md` relevante(s) antes de codar
3. Se tocar decisão arquitetural não documentada → PERGUNTAR antes de implementar
4. Se houver ambiguidade técnica → apresentar prós/contras e pedir decisão
5. Implementar conforme convenções, em edições cirúrgicas
6. Se dúvida sobre API externa → DECLARAR incerteza e oferecer verificar
7. Para tasks que produzam conteúdo visual ou narrativo em lote, lembrar o desenvolvedor de abrir `pnpm dev:tools` para validação antes do merge

## Hierarquia de prioridade

1. Segurança e integridade de save do jogador
2. Restrições absolutas listadas acima
3. Decisões fechadas nos arquivos `.md`
4. Convenções de código deste documento
5. Preferences globais do usuário
6. Otimização e estética

## Git e agentes

- Todo agente (Claude Code, Codex, Gemini) SEMPRE trabalha em feature branch: `git checkout -b feat/nome-da-tarefa`
- NUNCA commitar direto em main
- Antes de cada commit: `git branch` + `git status` + staging seletivo (`git add arq1 arq2`)
- NUNCA usar `git add .` em prompts para agentes
- Após revisão: `git checkout main → git merge feat/nome → git push origin main`

## Fluxo de emergência Git

Se rebase der conflito: `git rebase --abort → git pull origin main → git push origin main`
Se index ficar sujo: `git reset --hard origin/main`
