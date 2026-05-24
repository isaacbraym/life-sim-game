---
name: git-hygiene-codex
description: Garante commits limpos, mensagens no padrão Conventional Commits e branches isolados no Vida 2.5D. Use em todo commit. Bloqueia commits gigantes e mensagens vagas. Make sure to use this skill before every git commit or push.
---

# Git Hygiene — Codex (Vida 2.5D)

## Branch obrigatória
- Suas branches: `feat/codex-<descricao-curta>`
- Worktree isolado: `git worktree add ../vida25-codex feat/codex-current`
- Nunca commitar direto em `main`. Sempre via PR com checklist.

## Conventional Commits (obrigatório)
```text
feat(engine): adicionar cooldown de eventos no EventPool
fix(persistence): corrigir double-buffer em save slot vazio
refactor(core): extrair calcularModificador para módulo separado
chore(deps): bump zod 3.22 → 3.23
docs(adr): registrar decisão de usar Dexie para persistência
test(core): cobertura de round-trip em SaveSlot
```

Escopo entre parênteses = package ou módulo afetado
Imperativo, presente, sem ponto final
1 commit = 1 mudança lógica

## Tamanho de PR

Ideal: < 200 linhas de diff
Aceitável: < 500 linhas

> 500 linhas: dividir em PRs menores antes de abrir

## Antes de todo commit

- `git status` — confirmar que só os arquivos declarados no PR estão staged
- `pnpm check` — zero erros
- Revisar diff: sem console.log, sem debugger, sem TODO não rastreado

## Checklist do PR (.github/pull_request_template.md)

Preencher TODOS os campos antes de abrir o PR. Nunca abrir PR sem o checklist.
