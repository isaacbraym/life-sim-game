---
name: arch-reviewer
description: Revisão arquitetural para mudanças cross-package em Vida 2.5D. Use sempre que uma mudança tocar 2+ packages (core, game, dev-tools), introduzir nova dependência externa, alterar export público de pacote, ou modificar schema Zod versionado. NÃO use para bug fix isolado em 1 arquivo — delegar ao Codex. Make sure to use this skill whenever the user mentions cross-package change, new dependency, architecture, boundary, or schema version bump.
---

# Arch Reviewer — Claude Code (Vida 2.5D)

## Camadas (invioláveis)
- `packages/core` → lógica pura de domínio. SEM React, SEM PixiJS, SEM DOM.
- `packages/game` → UI e rendering. Pode importar de `core`. `core` NUNCA importa de `game`.
- `packages/dev-tools` → ferramentas internas. Pode importar de ambos.

## Fronteiras públicas versionadas
- `packages/core/src/schemas/` — todo schema tem `schemaVersion`.
  Mudança de shape → bump de versão + migration Dexie obrigatória.
- `packages/core/src/index.ts` — barrel de exports públicos.
  Novo export → intenção clara, não vazamento acidental.

## Checklist de review cross-package
- [ ] Unidirecionalidade: `game` → `core`? Nunca `core` → `game`.
- [ ] Schema Zod mudou shape? → Migration Dexie incluída + teste round-trip.
- [ ] Nova dependência externa? → Bundle impact < 30KB gzip. Justificar se maior.
- [ ] Side effects em module-level em `core`? → Rejeitar (quebra testes).
- [ ] PWA tocada (service worker, manifest)? → Testar install + offline.
- [ ] Performance: caminhos quentes (game tick, render PixiJS) sem new() em loop?
- [ ] `pnpm check` passa em todos os packages após a mudança?

## Quando rejeitar
Se mudança vaza tipos React/PixiJS para `packages/core`, REJEITAR.
Proposta: extrair interface em `packages/core/src/ports/` e implementar em `packages/game`.

## Quando escalar para humano
- Decisão que muda schema de save sem path de migration para saves existentes.
- Nova dependência que traz licença incompatível (GPL, AGPL).
- Mudança que afeta pipeline de geração de conteúdo da IA.
