# CLAUDE.md — Instruções para Agentes Claude

## Identidade do projeto

**Vida 2.5D** é um jogo de simulação de vida com exploração point-and-click em perspectiva oblíqua (~15°), desenvolvido em TypeScript/PixiJS por um único desenvolvedor. O jogador cria um personagem que nasce entre 1985 e 2000 e explora ambientes (casa, escola, academia, restaurante etc.) interagindo com objetos e NPCs via ActionBubble. A narrativa emerge de ações, decisões e consequências registradas em log — não de diálogos longos ou cutscenes.

## Fase atual: EXECUÇÃO

As decisões arquiteturais estão consolidadas. Não debater arquitetura sem pedido explícito. Antes de qualquer task de código, ler o(s) arquivo(s) `.md` relevante(s) desta pasta.

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
- PROIBIDO: easystar.js/pathfinding.js (sala única + interactionPoints declarados = overkill)
- PROIBIDO: matter.js/planck.js (sem física dinâmica no projeto)
- PROIBIDO: IA generativa em runtime do jogo
- PROIBIDO: localStorage/sessionStorage como save principal
- PROIBIDO: diálogos longos entre NPCs (falas literais, estilo visual novel)
- PROIBIDO: modal de cutscene separado para eventos (tudo acontece no ambiente)
- PROIBIDO: mundo aberto contínuo com ruas (WorldMapScreen = seletor de locais, não mundo aberto)
- PROIBIDO: build mode de construção de casa (comprar/vender/mover móveis sim; paredes não)
- PROIBIDO: pathfinding complexo (tween direto para posicaoDeInteracao do objeto)
- PROIBIDO: reproduzir manchetes/eventos históricos reais palavra-por-palavra
- PROIBIDO: inventar APIs de bibliotecas

## Decisões de design fechadas

### Câmera e perspectiva
- Perspectiva oblíqua 3/4 leve (~15°) — nem lateral puro, nem isométrico clássico
- Z-sorting via `RenderLayer` com `sortFunction: (a, b) => a.position.y - b.position.y`
- Escala leve por Y: `0.85 + (y / alturaComodo) * 0.20`
- Personagem grande e próximo da câmera, fácil de ler

### Rig e animação
- Rig 2D custom de 15 joints (lista canônica em `02-avatar-core.md`)
- **4 orientações**: PERFIL_ESQUERDO, PERFIL_DIREITO, FRONTAL, COSTAS
- IK: two-bone analítico (braços/pernas) + FABRIK (chains arbitrárias)
- Silhueta orgânica contínua — SEM linhas/círculos/vincos visíveis em articulações
- Mão e pé: presets de gesto (não joints individuais)
- Expressões: presets nomeados no MVP

### Game loop
- Fluxo: `NewGameGenerator → LifePhase → WorldMapScreen → LocationDefinition → ComodoDefinition → ExplorationScene → ActionBubble → ActionResolver → EffectEngine → VisualFeedback → LifeLog → Save`
- Exploração NÃO avança o tempo automaticamente
- Tempo avança somente quando: ação com `timeCost` é resolvida, ou jogador avança explicitamente o mês
- `InteractionLock` bloqueia input durante resolução de ação

### Locais e cômodos
- WorldMapScreen com ícones clicáveis — não mundo aberto
- Sala única por vez (room-by-room navigation)
- Movimento: tween GSAP direto para `posicaoDeInteracao` do objeto — sem pathfinding
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
