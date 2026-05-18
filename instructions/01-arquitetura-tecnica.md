# 01 — Arquitetura Técnica

## Princípio fundamental

**100% código, sem game engine.** O projeto não usa Unity, Godot, Unreal, Phaser, ct.js ou similares. O desenvolvedor não vai mexer com editor visual de engine. Toda lógica, render e estado vivem em TypeScript.

A justificativa: o requisito de geração procedural via JSON declarativo, com rig invisível adaptável e personagens variados gerados em tempo de execução, é fundamentalmente incompatível com workflows de engine baseados em editor visual. Engines obrigam um workflow editor-first; este projeto é code-first.

## Stack frontend (jogo + dev tools)

| Camada | Tecnologia | Versão alvo | Por quê |
|---|---|---|---|
| Linguagem | TypeScript | 5.3+ strict | Type safety crítico para schemas de cena, rig, eventos |
| Build / dev server | Vite | 5+ | HMR rápido, `vite-plugin-pwa`, ESM nativo |
| UI framework | React | 18+ | Shell de UI, painéis, HUD, dev tools |
| Renderer 2D | PixiJS | v8 | WebGL/WebGPU, mesh deformável, Graphics Bézier |
| State management | Zustand | 4+ | Leve, sem boilerplate, integra bem com Pixi |
| Validação de schema | Zod | 3+ | Source-of-truth única para schemas (poses, cenas, eventos) |
| Persistência local | Dexie.js | 4+ | Wrapper IndexedDB com schema migrations |
| PWA | vite-plugin-pwa + Workbox | atual | Service worker, manifest, cache strategies |
| Localização | i18next | 23+ | Pt-BR canônico, EN-US planejado |

**Bibliotecas explicitamente proibidas:**
- Spine runtime, DragonBones runtime, Live2D Cubism (formato proprietário, custo, ou abandono)
- `localStorage`/`sessionStorage` para save principal (apenas para flags efêmeras)
- jQuery, Lodash inteiro (use `lodash-es` com tree-shaking se realmente precisar)
- Three.js (este é 2.5D, não 3D)
- Qualquer game engine

## Stack mobile (fase 4)

- **Capacitor 6+** como wrapper para iOS e Android. Justificativa: arquitetura "native project first" (gera projetos Xcode e Android Studio reais), plugins maduros para IAP/share/haptics, transição PWA → Capacitor é literalmente `npx cap init && npx cap add ios android`.
- **Bubblewrap (TWA)** como alternativa Android-only para Play Store mais econômica.

Tauri considerado e descartado para mobile (mobile beta ainda imaturo em 2026). Reservado para eventual build desktop nativo na Fase 5.

## Stack backend (fase 4)

- **FastAPI** (Python 3.12+) para API REST de auth e sync de saves
- **PostgreSQL 16+** com extensão JSONB para armazenar saves complexos
- **pgvector** opcional para "encontrar eventos similares" via embeddings
- **Auth.js** ou **Supabase Auth** para autenticação
- **Cloudflare R2** ou **AWS S3** para storage de assets pesados (avatars compartilhados, screenshots)

Schemas compartilhados entre frontend e backend: Zod no frontend → JSON Schema canônico via `zod-to-json-schema` → Pydantic no backend (geração automática no build).

## Hospedagem e deploy

| Recurso | Serviço | Custo estimado |
|---|---|---|
| PWA (fase 1-3) | Cloudflare Pages (free tier) | US$ 0 |
| Domínio | Cloudflare Registrar ou Registro.br | ~US$ 15-30/ano |
| Backend (fase 4) | Hetzner VPS CX22 ou Fly.io free tier | ~US$ 5/mês ou free |
| Storage backend | Cloudflare R2 | <US$ 5/mês para baixo volume |
| Apple Developer Program | Apple | US$ 99/ano |
| Google Play Developer | Google | US$ 25 (taxa única) |
| Anthropic API (dev-time) | Anthropic | ~US$ 100-300 acumulado durante todo o desenvolvimento |
| **Total ano 1** | | **<US$ 200** |

## Monorepo: estrutura PNPM workspaces

Estrutura escolhida: **monorepo com PNPM workspaces**, sem Turborepo ainda (overhead desnecessário para solo dev no início). Migrar para Turborepo só se o tempo de build cumulativo ficar dolorido.

```
life-sim-game/
├── package.json                    # workspace root, scripts orquestradores
├── pnpm-workspace.yaml
├── tsconfig.base.json              # config compartilhada
├── .nvmrc                          # Node 20+ obrigatório
├── .gitignore
├── .github/
│   └── workflows/
│       ├── ci.yml                  # lint + typecheck + test em PRs
│       └── deploy-preview.yml      # deploy Cloudflare Pages em push
│
├── packages/
│   ├── core/                       # motor reutilizável
│   ├── game/                       # app principal (o jogo)
│   └── dev-tools/                  # ferramentas internas
│
├── content/                        # banco de conteúdo versionado em Git
│   ├── events/
│   ├── poses/
│   ├── historical/
│   └── presets/
│
├── scripts/                        # automação Python/Node CLI
└── docs/                           # documentação técnica viva
```

### packages/core/ — motor reutilizável

Contém toda a lógica reutilizada entre o jogo final e as dev tools. Sem dependência de React (pode ser usado em qualquer host: jogo, validador, simulador headless).

```
packages/core/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts                    # entry barrel
    ├── rig/
    │   ├── Skeleton.ts             # 15 joints, FK
    │   ├── Joint.ts                # tipo Joint e helpers
    │   ├── ForwardKinematics.ts
    │   ├── constraints.ts          # ranges anatômicos por joint
    │   └── index.ts
    ├── ik/
    │   ├── TwoBoneIK.ts            # solver analítico
    │   ├── FABRIK.ts               # solver iterativo
    │   └── index.ts
    ├── silhouette/
    │   ├── BezierSegment.ts        # geração de path por segmento
    │   ├── BodyProfile.ts          # presets de proporção
    │   └── index.ts
    ├── mesh/
    │   ├── MeshSkinning.ts         # vertex deformation manual
    │   └── index.ts
    ├── schemas/
    │   ├── pose.ts                 # Zod Pose
    │   ├── scene.ts                # Zod Scene
    │   ├── event.ts                # Zod Event
    │   ├── character.ts            # Zod Character
    │   ├── npc.ts                  # Zod Npc + tags
    │   ├── predicate.ts            # PredicateTree grammar
    │   └── index.ts
    ├── events/
    │   ├── EventLoader.ts
    │   ├── PredicateEvaluator.ts
    │   ├── EventPool.ts
    │   ├── ChoiceResolver.ts
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
    ├── persistence/
    │   ├── GameDB.ts               # classe Dexie principal
    │   ├── migrations/
    │   │   ├── v1.ts
    │   │   └── v2.ts
    │   ├── exporters.ts            # JSON export/import
    │   └── index.ts
    └── render/
        ├── RigRenderer.ts          # bridge para PixiJS
        ├── SceneRenderer.ts
        ├── ExpressionRenderer.ts
        └── index.ts
```

### packages/game/ — app principal

```
packages/game/
├── package.json
├── tsconfig.json
├── vite.config.ts                  # com vite-plugin-pwa
├── index.html
├── public/
│   ├── manifest.webmanifest
│   ├── icons/                      # PWA icons
│   ├── splash/                     # splash screens iOS
│   └── fonts/
└── src/
    ├── main.tsx                    # bootstrap React
    ├── app/
    │   ├── App.tsx
    │   ├── routes.tsx
    │   └── providers.tsx           # Zustand, i18n, theme
    ├── screens/
    │   ├── TitleScreen.tsx
    │   ├── CharacterCreatorScreen.tsx
    │   ├── GameLoopScreen.tsx
    │   ├── SettingsScreen.tsx
    │   └── DeathScreen.tsx
    ├── ui/
    │   ├── Hud.tsx                 # barra de atributos, idade, dinheiro
    │   ├── EventLog.tsx
    │   ├── NpcPanel.tsx            # 5 abas
    │   ├── ChoiceDialog.tsx
    │   └── ActivityMenu.tsx
    ├── stage/
    │   ├── PixiStage.tsx           # React component wrapping PIXI.Application
    │   ├── SceneController.ts
    │   └── usePixiApp.ts           # hook
    ├── state/
    │   ├── saveStore.ts            # Zustand: estado do save atual
    │   ├── settingsStore.ts        # Zustand: configurações persistidas
    │   ├── uiStore.ts              # Zustand: estado efêmero da UI
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

Apps separados que rodam em dev local. Nunca entram em produção.

```
packages/dev-tools/
├── package.json
├── tsconfig.json
└── apps/
    ├── scene-validator/            # ferramenta principal de validação visual
    │   ├── vite.config.ts
    │   ├── index.html
    │   └── src/
    │       ├── App.tsx
    │       ├── components/
    │       │   ├── PoseEditor.tsx
    │       │   ├── JointGizmo.tsx
    │       │   ├── JsonInspector.tsx  # Monaco editor
    │       │   ├── PoseLibrary.tsx
    │       │   └── SceneCanvas.tsx    # PixiJS embedded
    │       └── main.tsx
    ├── event-grapher/              # visualizador de árvore narrativa
    │   └── src/                    # usa react-flow
    └── ai-pipeline/                # scripts CLI Node para geração
        ├── package.json
        ├── src/
        │   ├── generateScene.ts    # CLI: gera 1 cena via Claude
        │   ├── generateBatch.ts    # CLI: gera N cenas
        │   ├── validateBatch.ts    # CLI: revalida pasta de cenas
        │   ├── repairLoop.ts
        │   └── prompts/
        │       ├── sceneSystem.md
        │       ├── rigGrammar.md
        │       └── fewShots.json
        └── bin/
            └── pipeline.ts
```

### content/ — banco de conteúdo versionado

```
content/
├── events/                         # 1 arquivo JSON por evento
│   ├── childhood/
│   │   ├── 0-3-anos/
│   │   ├── 4-7-anos/
│   │   └── 8-12-anos/
│   ├── education/
│   │   ├── ensino-medio/
│   │   ├── faculdade/
│   │   └── pos-graduacao/
│   ├── career/
│   │   ├── primeiro-emprego/
│   │   ├── promocoes/
│   │   ├── conflitos-trabalho/
│   │   └── empreendedorismo/
│   ├── relationship/
│   │   ├── familia/
│   │   ├── amizades/
│   │   ├── romance/
│   │   └── traicao/
│   ├── crime/
│   ├── health/
│   ├── hobby/
│   └── mortality/
├── poses/                          # biblioteca de poses validadas
│   ├── basic/
│   │   ├── idle.json
│   │   ├── sentado.json
│   │   └── caminhando.json
│   ├── interactions/
│   │   ├── abracar.json
│   │   ├── apertar-mao.json
│   │   ├── socar.json
│   │   └── beijar.json
│   ├── emotional/
│   │   ├── chorar.json
│   │   ├── comemorar.json
│   │   └── desespero.json
│   └── action/
│       ├── correr.json
│       ├── beber-copo.json
│       └── digitar-computador.json
├── historical/                     # eventos históricos por ano
│   ├── 1990.json
│   ├── 1991.json
│   └── ...2025.json
└── presets/
    ├── body-profiles/              # slim, average, strong, etc.
    ├── face-presets/
    ├── hair-presets/
    └── clothing-presets/
```

Cada arquivo de evento, pose ou preset é um JSON independente. **Justificativa**: diff fácil em PRs, LLM consegue editar 1 arquivo por vez sem confundir, autor humano consegue achar via filesystem search.

Loader em build-time agrega tudo em `events.manifest.json`, `poses.manifest.json` etc com índices invertidos (por categoria, idade, flag), para performance em runtime.

## Convenções de código TypeScript

### Imports absolutos

`tsconfig.base.json` define paths:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@core/*": ["packages/core/src/*"],
      "@game/*": ["packages/game/src/*"],
      "@dev/*": ["packages/dev-tools/apps/*"],
      "@content/*": ["content/*"]
    }
  }
}
```

### Nomenclatura

- Variáveis, métodos, classes, comentários: **português brasileiro**
- Exceções: tipos que mapeiam APIs externas (`Application`, `Container`, `Texture` do PixiJS)
- Nomes específicos sempre, nunca genéricos: `rosterDeNpcs` em vez de `lista`, `totalAtributosBase` em vez de `total`

### Imutabilidade

- `const` por default, `let` só onde necessário, `var` proibido
- `readonly` em propriedades de configuração e domínio imutável
- Para mutação estruturada: `immer` via Zustand `immer middleware`

### Tipos

- `type` preferido sobre `interface` (exceto quando precisar extender)
- Tipos inferidos via `z.infer<typeof X>` quando vêm de Zod
- `any` proibido sem comentário justificando

### Funções

- Máximo 25 linhas por função (alinhado às preferences globais)
- Complexidade ciclomática ≤ 15
- Sem magic numbers — usar constantes nomeadas em SCREAMING_SNAKE_CASE

### Performance

- Análise Big-O explícita em algoritmos críticos (event matching, NPC matching, IK)
- `Float32Array` reaproveitado em loops de render (não alocar por frame)
- `pixi-cull` ou culling manual para entidades off-screen

## CI/CD

GitHub Actions com 2 workflows:

**ci.yml** — em PRs e push para main:
1. Setup Node 20, pnpm
2. `pnpm install --frozen-lockfile`
3. `pnpm lint` (ESLint + Prettier)
4. `pnpm typecheck`
5. `pnpm test` (Vitest)
6. `pnpm build`

**deploy-preview.yml** — em push para main e PRs:
- Build do `packages/game`
- Deploy automático para Cloudflare Pages
- URL de preview em PR comment

## Versionamento

- Semantic Versioning para a aplicação (`v0.1.0`, `v0.2.0`...)
- Conventional Commits para mensagens (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`)
- Tags Git para cada release de fase (`v0.1.0-fase-0-completa`)
- CHANGELOG.md mantido manualmente

## Decisões adiadas

Estas decisões serão feitas quando a fase relevante chegar, com base em dados reais:

- Provedor de ads exato (AdMob, Unity Ads, AppLovin) — fase 3 final
- Provedor de IAP (Stripe direto, RevenueCat, Adapty) — fase 4
- Provedor de auth backend (Supabase, Auth.js self-hosted, Clerk) — fase 4
- Métrica de telemetria (Plausible, Umami, PostHog) — fase 3
- Loja de assets gráficos (próprio, freelancer, marketplace) — fase 2
