# Decisoes Tecnicas — Vida 2.5D

Registro permanente de decisoes tecnicas tomadas durante o desenvolvimento.
NUNCA reverter sem discussao explicita com o desenvolvedor principal.

---

## 2026-05-18 — Stack principal

**Decisao**: TypeScript 5+ / Vite 8 / React 18 / PixiJS v8 / Zustand / Zod / Dexie.js
**Motivo**: code-first, sem editor visual, geracao procedural via JSON declarativo
**Alternativas descartadas**: Unity, Godot, Phaser, Spine, DragonBones

---

## 2026-05-18 — Monorepo PNPM workspaces

**Decisao**: packages/core, packages/game, packages/dev-tools
**Motivo**: compartilhar schemas Zod entre jogo e dev tools sem duplicacao
**Versao PNPM local**: 9.x (compatibilidade com Cloudflare)

---

## 2026-05-18 — Rig 2D custom de 15 joints

**Decisao**: implementar FK proprio sem runtime de animacao externo
**Joints**: root_pelvis, spine, neck, head, shoulder_L/R, elbow_L/R, wrist_L/R, hip_L/R, knee_L/R, ankle_L
**Nota**: ankle_R calculado como knee_R.y + 42 (nao e joint proprio — decidir no Sprint 0.2 final)
**Motivo**: controle total, sem licenca, adaptavel a personagens procedurais

---

## 2026-05-18 — IA exclusivamente dev-time

**Decisao**: zero chamadas a LLM em runtime do jogo
**Motivo**: custo, latencia, determinismo, offline-first
**Pipeline**: descricao PT-BR -> Claude API -> JSON -> validacao -> conteudo congelado

---

## 2026-05-18 — Persistencia: Dexie.js sobre IndexedDB

**Decisao**: Dexie como unica biblioteca de persistencia
**Proibido**: localStorage/sessionStorage para save principal
**Motivo**: queries indexadas, migrations nativas, multi-tab safe, liveQuery reativo

---

## 2026-05-18 — Deploy: Cloudflare Pages via wrangler CLI

**Decisao**: build local + wrangler pages deploy (nao usar auto-build do Cloudflare)
**Motivo**: incompatibilidade de formato de lockfile pnpm 9 vs ambiente Cloudflare
**Comando**: cd packages/game && pnpm build && npx wrangler pages deploy dist --project-name life-sim-game

---

## 2026-05-18 — Silhueta organica via Bezier

**Decisao**: contornos de membros gerados como paths Bezier cubicos
**Arquivo**: packages/core/src/silhouette/BezierSegment.ts
**Motivo**: silhueta continua sem vincos visiveis nas articulacoes
**Aberto**: refinamento de proporcoes em andamento no Sprint 0.2
