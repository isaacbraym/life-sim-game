# 01 — Arquitetura Técnica

## Princípio fundamental

**100% código, sem game engine.** O projeto não usa Unity, Godot, Unreal, Phaser, ct.js ou similares. Toda lógica, render e estado vivem em TypeScript.

A justificativa: o requisito de exploração point-and-click declarativa com rig invisível adaptável, geração procedural de ambientes via JSON e personagens variados gerados em runtime é fundamentalmente incompatível com workflows de engine baseados em editor visual.

## Stack frontend (jogo + dev tools)

| Camada | Tecnologia | Versão alvo | Por quê |
|---|---|---|---|
| Linguagem | TypeScript | 5.3+ strict | Type safety crítico para schemas de cena, rig, eventos, cômodos |
| Build / dev server | Vite | 5+ | HMR rápido, `vite-plugin-pwa`, ESM nativo |
| UI framework | React | 18+ | Shell de UI, HUD, ActionBubble overlay, painéis, dev tools |
| Renderer 2D | PixiJS | v8.7+ | WebGL/WebGPU, RenderLayer com z-sorting, mesh deformável |
| Tweens / animação | GSAP | 3.13+ | Movimento click-to-move, transições de cômodo, feedback visual. **100% grátis para uso comercial desde abr/2025** |
| UI in-canvas | @pixi/ui | v2.x | Componentes PixiJS nativos para HUD permanente (barras, botões in-world). v2.x = compatível com PixiJS v8 |
| State management | Zustand | 4+ | Fonte da verdade única; PixiJS lê via subscribe imperativo, React via hooks |
| Validação de schema | Zod | 3+ | Source-of-truth para todos os schemas (poses, cenas, eventos, cômodos, ações, móveis) |
| Persistência local | Dexie.js | 4+ | Wrapper IndexedDB com schema migrations |
| PWA | vite-plugin-pwa + Workbox | atual | Service worker, manifest, cache strategies |
| Localização | i18next | 23+ | Pt-BR canônico, EN-US planejado |

**Bibliotecas explicitamente proibidas:**
- Spine runtime, DragonBones runtime, Live2D Cubism
- `localStorage`/`sessionStorage` para save principal
- jQuery, Lodash inteiro
- Three.js (este é 2.5D, não 3D)
- pixi-projection (abandonado no v6, sem suporte v8)
- easystar.js / pathfinding.js (sala única com interactionPoints declarados não precisa de pathfinding)
- matter.js / planck.js (sem física dinâmica = sem necessidade; AABB manual cobre furniture placement)
- pixi-isometric-tilemaps / traviso.js (isométrico clássico 45°, incompatível com oblíqua 15°)
- Qualquer game engine

## Stack mobile (fase 4)

Capacitor 6+ como wrapper para iOS e Android.

## Stack backend (fase 4)

FastAPI (Python 3.12+), PostgreSQL 16+, Cloudflare R2 para assets.

## Monorepo: estrutura PNPM workspaces

```
life-sim-game/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .nvmrc                          # Node 20+
├── .gitignore
├── .github/workflows/
│   ├── ci.yml
│   └── deploy-preview.yml
│
├── packages/
│   ├── core/                       # motor reutilizável (sem dep de React)
│   ├── game/                       # app principal (o jogo)
│   └── dev-tools/                  # ferramentas internas (nunca em produção)
│
├── content/                        # banco de conteúdo versionado em Git
│   ├── events/
│   ├── poses/
│   ├── historical/
│   ├── locations/                  # NEW: definições de locais e cômodos
│   ├── furniture/                  # NEW: catálogo de móveis por era
│   ├── eras/                       # NEW: EraDefinition por década
│   └── presets/
│
├── scripts/
└── docs/
```

### packages/core/ — motor reutilizável

Sem dependência de React. Usado por jogo, dev tools e CLI de conteúdo.

```
packages/core/src/
├── index.ts
├── rig/
│   ├── Skeleton.ts                 # 15 joints, FK
│   ├── Joint.ts
│   ├── ForwardKinematics.ts
│   ├── constraints.ts
│   ├── OrientacaoPersonagem.ts     # NEW: enum + configs para 4 orientações
│   └── index.ts
├── ik/
│   ├── TwoBoneIK.ts
│   ├── FABRIK.ts
│   └── index.ts
├── silhouette/
│   ├── BezierSegment.ts
│   ├── BodyProfile.ts              # EXTENDED: perfis por orientação (frontal, costas, perfil)
│   └── index.ts
├── schemas/
│   ├── pose.ts
│   ├── scene.ts
│   ├── event.ts                    # EXTENDED: localContextId?, narrativeWeight?
│   ├── character.ts                # EXTENDED: faseDeVidaAtual, origemFamiliar
│   ├── npc.ts
│   ├── predicate.ts
│   ├── action.ts                   # NEW: ActionDefinition completo
│   ├── location.ts                 # NEW: LocationDefinition + ComodoDefinition
│   ├── furniture.ts                # NEW: FurnitureDefinition + availability
│   ├── era.ts                      # NEW: EraDefinition + YearContext
│   ├── lifephase.ts                # NEW: LifePhaseDefinition
│   ├── birthprofile.ts             # NEW: BirthProfile + OriginProfile
│   └── index.ts
├── events/
│   ├── EventLoader.ts
│   ├── PredicateEvaluator.ts
│   ├── EventPool.ts
│   ├── ChoiceResolver.ts           # mantido para eventos pool clássicos
│   └── index.ts
├── interaction/                    # NEW: sistema de interação
│   ├── ActionResolver.ts           # orquestrador único (direct + check)
│   ├── ProgressionTracker.ts       # contadores de hábito por período
│   ├── EffectEngine.ts             # aplica Effect[] ao GameState
│   ├── InteractionLock.ts          # controla bloqueio de input
│   └── index.ts
├── rpg/
│   ├── Attributes.ts
│   ├── D20Roll.ts
│   ├── Modifiers.ts
│   └── index.ts
├── npc/
│   ├── NpcRoster.ts
│   ├── NpcMatcher.ts
│   ├── NpcGenerator.ts
│   ├── Aging.ts
│   └── index.ts
├── lifephase/                      # NEW: fases da vida
│   ├── LifePhaseManager.ts
│   ├── phases.ts                   # definições das fases (bebe, crianca, adolescente...)
│   └── index.ts
├── era/                            # NEW: sistema de época
│   ├── EraResolver.ts              # resolve o que está disponível dado um ano
│   ├── YearContext.ts
│   └── index.ts
├── log/                            # NEW: sistema de log em 5 camadas
│   ├── LifeLog.ts
│   ├── MonthlyLog.ts
│   └── index.ts
├── persistence/
│   ├── GameDB.ts                   # EXTENDED: novas tabelas
│   ├── migrations/
│   │   ├── v1.ts
│   │   ├── v2.ts
│   │   └── v3.ts                   # NEW: tabelas de location, furniture, progression
│   ├── exporters.ts
│   └── index.ts
└── render/
    ├── RigRenderer.ts              # EXTENDED: suporte a 4 orientações
    ├── SceneRenderer.ts            # EXTENDED: render de cômodo com z-sorting
    ├── RoomRenderer.ts             # NEW: renderiza ComodoDefinition completo
    ├── ZSorter.ts                  # NEW: RenderLayer com sortFunction por Y
    ├── ExpressionRenderer.ts
    └── index.ts
```

### packages/game/ — app principal

```
packages/game/src/
├── main.tsx
├── app/
│   ├── App.tsx
│   ├── routes.tsx
│   └── providers.tsx
├── screens/
│   ├── TitleScreen.tsx
│   ├── NewGameScreen.tsx           # EXTENDED: BirthProfile + OriginProfile
│   ├── WorldMapScreen.tsx          # NEW: mapa de locais clicáveis
│   ├── ExplorationScene.tsx        # NEW: cômodo explorável com PixiJS
│   ├── GameLoopScreen.tsx          # wrapper que orquestra Map ↔ Exploration
│   ├── SettingsScreen.tsx
│   └── DeathScreen.tsx
├── ui/
│   ├── Hud.tsx                     # EXTENDED: modo exploração vs modo mapa
│   ├── ActionBubble.tsx            # NEW: menu contextual sobre canvas
│   ├── VisualFeedback.tsx          # NEW: floating labels (+Força, -Energia)
│   ├── LifeLogPanel.tsx            # NEW: log narrativo em 5 camadas
│   ├── FurnitureCatalogUI.tsx      # NEW: sidebar de compra de móveis
│   ├── EventLog.tsx                # mantido, absorvido pelo LifeLog
│   ├── NpcPanel.tsx                # 5 abas
│   └── ActivityMenu.tsx            # DEPRECATED: substituído por ActionBubble
├── stage/
│   ├── PixiStage.tsx               # React component wrapping PIXI.Application
│   ├── RoomController.ts           # NEW: controla cômodo atual (enter/exit)
│   ├── CharacterController.ts      # NEW: movimento click-to-move via GSAP
│   ├── InteractableHighlight.ts    # NEW: hover highlight em objetos
│   ├── SceneController.ts          # EXTENDED
│   └── usePixiApp.ts
├── state/
│   ├── saveStore.ts                # EXTENDED: currentLocationId, currentRoomId, lifephase
│   ├── explorationStore.ts         # NEW: estado efêmero da exploração
│   ├── settingsStore.ts
│   ├── uiStore.ts                  # EXTENDED: bubblePos, bubbleActions, interactionLock
│   └── index.ts
├── audio/
│   ├── SfxPlayer.ts
│   └── MusicManager.ts
├── i18n/
│   ├── pt-BR.json
│   ├── en-US.json
│   └── config.ts
└── styles/
    └── globals.css
```

### packages/dev-tools/ — ferramentas internas

App interno separado (`pnpm dev:tools`), nunca incluído no bundle de produção.
**Importa APENAS de `packages/core`** (schemas, rig, interaction). NÃO importa de `packages/game`.
Spec completa das 5 ferramentas: `instructions/11-devtools-qa.md`.

```
packages/dev-tools/
├── package.json
├── vite.config.ts
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx               # roteador entre as 5 ferramentas
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
    │       ├── GraphTab.tsx          # @xyflow/react — grafo de eventos
    │       ├── SimulatorTab.tsx
    │       ├── StateDiffPanel.tsx
    │       └── ModuleTracer.tsx
    └── shared/
        ├── SchemaLoader.ts   # carrega e valida JSONs via Zod
        └── PixiCanvas.tsx    # wrapper reutilizável do PixiJS
```

### content/ — banco de conteúdo versionado

```
content/
├── events/
│   ├── childhood/
│   ├── education/
│   ├── career/
│   ├── relationship/
│   ├── crime/
│   ├── health/
│   ├── hobby/
│   └── mortality/
├── poses/
│   ├── basic/
│   ├── interactions/
│   ├── emotional/
│   └── action/
├── historical/
│   ├── 1985.json
│   ├── 1986.json
│   └── ...2025.json
├── locations/                      # NEW
│   ├── casa/
│   │   ├── quarto_simples.json
│   │   ├── sala_simples.json
│   │   └── ...
│   ├── escola/
│   │   ├── sala_de_aula.json
│   │   ├── corredor.json
│   │   └── patio.json
│   ├── academia/
│   │   ├── area_musculacao.json
│   │   └── recepcao.json
│   └── restaurante/
│       ├── salao.json
│       └── ...
├── furniture/                      # NEW
│   ├── eighties/                   # móveis disponíveis 1980–1989
│   ├── nineties/                   # móveis disponíveis 1990–1999
│   ├── twothousands/               # 2000–2009
│   └── modern/                     # 2010+
├── eras/                           # NEW
│   ├── eighties.json
│   ├── nineties.json
│   ├── twothousands.json
│   └── tens.json
└── presets/
    ├── body-profiles/
    ├── face-presets/
    ├── hair-presets/
    └── clothing-presets/
```

## Padrão de render: Zustand → PixiJS

O Zustand é a única fonte da verdade. O PixiJS nunca tem estado próprio — ele reflete o store.

```typescript
// ticker lê store imperativo (não via hook React)
app.ticker.add((ticker) => {
  const estado = useGameStore.getState();
  if (estado.interactionLock) return;
  estado.tickJogo(ticker.deltaMS);
});

// sprites atualizam via subscribe seletivo
useGameStore.subscribe(
  s => s.jogador.posicao,
  ({ x, y }) => { spriteJogador.position.set(x, y); }
);
```

React renderiza apenas HUD e overlays (ActionBubble, LifeLog, painéis) via hooks normais.

## Z-sorting com RenderLayer (PixiJS v8.7+)

```typescript
import { RenderLayer } from 'pixi.js';

const camadaPersonagens = new RenderLayer({
  sortableChildren: true,
  sortFunction: (a, b) => a.position.y - b.position.y,
});

// escala leve por profundidade (ilusão de perspectiva)
app.ticker.add(() => {
  for (const entidade of entidadesNaCena) {
    const profundidade = entidade.y / ALTURA_COMODO;
    entidade.scale.set(0.85 + profundidade * 0.20);
  }
});
```

## Convenções de código TypeScript

- `strict: true`, `noImplicitAny: true`, `noUncheckedIndexedAccess: true`
- `const` por default, `let` só quando necessário, `var` proibido
- `readonly` em propriedades imutáveis e arrays de configuração
- `type` preferido sobre `interface`
- `any` proibido sem comentário justificando
- `undefined` em vez de `null` para ausência
- Imports absolutos via tsconfig paths: `@core/interaction/ActionResolver`, `@game/state/saveStore`
- Zod como source-of-truth — tipos inferidos via `z.infer<typeof X>`

## Nomenclatura

- Variáveis, métodos, classes em português brasileiro
- Constantes: `SCREAMING_SNAKE_CASE` em português (`MAXIMO_MOVEIS_POR_COMODO`)
- Tipos/classes: `PascalCase` em português (`Esqueleto`, `AcaoDefinicao`, `ComodoDefinicao`)
- Excepcionalmente em inglês: tipos que mapeiam APIs externas (`Application`, `Container`, `Texture`)

## CI/CD

GitHub Actions: lint + typecheck + test + build em PRs. Deploy Cloudflare Pages em push para main.

## Decisões de libs — veredicto final

| Lib | Status | Motivo |
|---|---|---|
| GSAP 3.13+ | ✅ ADICIONAR | Click-to-move, transições, feedback visual. 100% grátis comercialmente desde abr/2025 |
| @pixi/ui v2.x | ✅ ADICIONAR | HUD in-canvas oficial PixiJS v8 |
| @xyflow/react | ✅ dev-tools only | Event Graph — editor de grafo de nós para visualizar árvore de eventos narrativos |
| pixi-viewport | ⚠️ Fase 2+ | Só se cômodos ficarem maiores que viewport |
| easystar.js | ❌ NÃO | Sala única + interactionPoints declarados = overkill |
| matter.js / planck.js | ❌ NÃO | Sem física dinâmica, AABB manual cobre placement |
| pixi-projection | ❌ NÃO | Abandonado no v6, sem suporte v8 |
