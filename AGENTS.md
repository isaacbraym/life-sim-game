# AGENTS.md — Instruções para Todos os Agentes IA

## Contexto do projeto

**Vida 2.5D** — jogo de simulação de vida com exploração point-and-click em perspectiva oblíqua (~15°). TypeScript 5+, PixiJS v8.7+, React 18+, GSAP 3.13+, @pixi/ui v2.x, Zustand, Zod, Dexie. Monorepo PNPM. Ver `CLAUDE.md` para todas as decisões de design e convenções de código.

## Regras obrigatórias de Git para agentes

**CHECKLIST obrigatório antes de cada commit:**

```bash
# 1. Confirmar em qual branch está
git branch

# 2. Confirmar o que está staged
git status

# 3. Staging SEMPRE seletivo — NUNCA git add .
git add packages/core/src/interaction/ActionResolver.ts
git add packages/core/src/schemas/action.ts
# (listar cada arquivo individualmente)

# 4. Commit com mensagem conventional
git commit -m "feat: implementar ActionResolver com resolutionMode direct e check"
```

**PROIBIDO em prompts enviados a agentes:**
- `git add .` — pode incluir arquivos não-relacionados de outros agentes
- Commitar direto em `main`
- Fazer rebase sem instrução explícita do desenvolvedor

**Fluxo de branch:**
```bash
# Início de qualquer tarefa
git checkout main
git pull origin main
git checkout -b feat/nome-descritivo-da-tarefa

# Após revisão do desenvolvedor
git checkout main
git merge feat/nome-descritivo-da-tarefa
git push origin main
```

## Nomenclatura

- Variáveis, métodos, classes: **português brasileiro**
- Constantes: `SCREAMING_SNAKE_CASE` em PT-BR
- Tipos/classes: `PascalCase` em PT-BR
- Exceção: tipos que mapeiam APIs externas (`Application`, `Container`, `Texture`)

## Proibições técnicas

- NUNCA usar `any` sem comentário justificando
- NUNCA usar `localStorage`/`sessionStorage` para save
- NUNCA usar game engines (Unity, Godot, Phaser, etc.)
- NUNCA usar pixi-projection, easystar.js, matter.js/planck.js
- NUNCA implementar pathfinding — movimento é tween GSAP direto para `posicaoDeInteracao`
- NUNCA criar modal/cutscene separado — interação acontece no ambiente via ActionBubble
- NUNCA inventar APIs de bibliotecas — declarar incerteza e pedir verificação

## Estrutura de módulos-chave

```
packages/core/src/
├── schemas/action.ts          → ActionDefinition, EffectSchema
├── schemas/location.ts        → LocationDefinition, ComodoDefinition, InteractableObject
├── schemas/furniture.ts       → FurnitureDefinition, PlacedFurniture
├── schemas/era.ts             → EraDefinition, YearContext
├── schemas/lifephase.ts       → LifePhaseDefinition, LifePhaseEnum
├── schemas/birthprofile.ts    → BirthProfile, OriginProfile
├── interaction/ActionResolver.ts  → orquestrador único de resolução de ações
├── interaction/ProgressionTracker.ts → contadores de hábito
├── interaction/EffectEngine.ts    → aplica Effect[] ao GameState
├── interaction/InteractionLock.ts → controla bloqueio de input
├── log/LifeLog.ts             → 5 camadas de log
├── era/EraResolver.ts         → filtra conteúdo por YearContext
└── lifephase/LifePhaseManager.ts → gerencia fase atual

packages/game/src/
├── screens/WorldMapScreen.tsx → seletor de locais
├── screens/ExplorationScene.tsx → cômodo explorável
├── ui/ActionBubble.tsx        → React overlay contextual
├── ui/VisualFeedback.tsx      → floating labels PixiJS
├── stage/CharacterController.ts → GSAP click-to-move
├── stage/RoomController.ts    → gerencia cômodo atual
└── state/explorationStore.ts  → estado efêmero de exploração
```

## Quando duvidar

- Se a task tocar uma decisão de design: parar e consultar `CLAUDE.md` e o `.md` relevante
- Se a API de uma biblioteca for incerta: declarar "não tenho certeza" e não inventar
- Se houver 2+ caminhos viáveis: apresentar prós/contras antes de implementar
