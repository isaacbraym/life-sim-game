---
name: ts-strict-guardian
description: Garante que todo código TypeScript em Vida 2.5D respeite strict mode, sem `any`, sem `@ts-ignore` sem justificativa, com retorno explícito em funções exportadas e tipos sempre inferidos via z.infer. Use sempre que editar qualquer arquivo .ts ou .tsx, especialmente em packages/core e packages/game. Bloqueia mudanças que reduzem type safety. Make sure to use this skill whenever editing .ts or .tsx files, or whenever the user mentions types, any, casting, or type errors.
---

# TypeScript Strict Guardian — Vida 2.5D

## tsconfig.base.json — configuração canônica
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- `noImplicitAny: true`
NUNCA relaxar esses flags, nem temporariamente.

## Regras absolutas
- Proibido: `any`, `as any`, `as unknown as X`, `@ts-ignore`, `@ts-expect-error` sem
  comentário `// SAFETY: <razão específica>` na linha imediatamente acima.
- Funções exportadas DEVEM ter tipo de retorno explícito declarado.
- Tipos de domínio = sempre `z.infer<typeof Schema>`. Nunca duplicar com `interface` ou `type` manual.
- `undefined` para ausência, nunca `null` (exceto interop com libs externas).
- `const` por default; `let` só quando necessário; `var` proibido.
- `readonly` em arrays de configuração e props imutáveis.

## Caminhos mais arriscados
- `packages/core/src/schemas/` — qualquer mudança de shape quebra save e conteúdo.
- `packages/core/src/persistence/GameDB.ts` — migrations mal feitas corrompem save.
- `packages/core/src/events/` — PredicateEvaluator e AplicadorEfeitos são críticos.

## Workflow obrigatório antes de commitar
1. `pnpm -r typecheck` deve passar em ZERO erros em TODOS os packages.
2. Se houver erro de tipo: corrigir na raiz, nunca suprimir com cast.
3. Se cast inevitável (interop com lib não tipada): adicionar `// SAFETY: <razão>`.

## Quando delegar
- Mudança de shape de schema Zod → Claude Code com skill `zod-schema-migrator`.
- Decisão arquitetural cross-package → Claude Code com skill `arch-reviewer`.
