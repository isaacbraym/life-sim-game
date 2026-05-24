---
name: diff-review-surgical
description: Revisão de PR de outros agentes com foco em correctness, segurança de tipos, integridade de save e cobertura de edge cases. Use ao revisar PR do Claude Code ou do Antigravity. NÃO use para revisão arquitetural — delegar ao Claude Code. Make sure to use this skill when the user asks to review a PR, diff, or changes from another agent.
---

# Diff Review Surgical — Codex (Vida 2.5D)

## Prioridade de review (nessa ordem)
1. **Correctness**: a lógica faz o que o PR descreve? Edge cases cobertos?
2. **Type safety**: sem `any`, sem cast injustificado, tipos corretos inferidos via Zod?
3. **Save integrity**: se tocou Dexie/schemas → migration inclusa? Invariantes mantidos?
4. **Performance**: sem alocação em loop de game tick? Sem N+1 no Dexie?
5. **Convenções**: nomes em PT-BR para domínio, conventional commit, PR template preenchido?

## Red flags (bloquear merge)
- `as any` ou `@ts-ignore` sem `// SAFETY:` explicando
- Mudança em `GameDB.ts` sem migration versionada
- Mudança de primary key em tabela Dexie existente
- Import de `react` ou `pixi.js` em `packages/core/`
- Loop sem limite iterando sobre roster de NPCs (pode ser O(n²))
- Conteúdo de evento sem passar por `EventSchema.safeParse()`

## Yellow flags (pedir esclarecimento)
- Função exportada sem tipo de retorno explícito
- Lógica complexa sem teste correspondente
- TODO sem issue rastreado
- Mudança em 3+ arquivos de packages diferentes (escalar para Claude Code)

## Formato do feedback
```text
[RED] packages/core/src/events/EventPool.ts:47
  `as any` sem justificativa. Qual o tipo correto? Se interop, adicionar SAFETY comment.

[YELLOW] packages/game/src/components/EventPanel.tsx:112
  Função `resolverOpcao` sem tipo de retorno. Adicionar `: void` ou o tipo correto.

[OK] packages/core/src/engine/GameEngine.ts — lógica correta, tipos ok, testes presentes.
```
