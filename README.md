# Vida 2.5D

Simulacao de vida contemporanea 2.5D — sucessor espiritual do BitLife com camada visual procedural rica.

## Stack
TypeScript 5+ / Vite 8 / React 18 / PixiJS v8 / Zustand / Zod / Dexie.js
Monorepo PNPM workspaces: packages/core, packages/game, packages/dev-tools

## Rodar localmente
```bash
pnpm install
cd packages/game && pnpm dev
```

## Build
```bash
cd packages/game && pnpm build
```

## Deploy
```bash
cd packages/game && pnpm build && npx wrangler pages deploy dist --project-name life-sim-game
```

## Documentacao
- Decisoes arquiteturais: /instructions/
- Documentos operacionais: /docs/
- Instrucoes para agentes: AGENTS.md / CLAUDE.md / GEMINI.md
