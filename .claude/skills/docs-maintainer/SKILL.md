---
name: docs-maintainer
description: Mantém CLAUDE.md, AGENTS.md, GEMINI.md e docs/adr/ atualizados após mudanças arquiteturais em Vida 2.5D. Use após qualquer mudança que altere decisão de design, adicione dependência, mude schema versionado ou altere workflow de agentes. Make sure to use this skill when the user says "atualiza docs", "registra decisão", "ADR", or after any architectural change.
---

# Docs Maintainer — Claude Code (Vida 2.5D)

## O que atualizar e quando

| Arquivo | Atualizar quando |
|---|---|
| `CLAUDE.md` | Workflow, stack, regra inviolável muda |
| `AGENTS.md` | Comando de dev environment muda, skill nova adicionada |
| `GEMINI.md` | Schema de evento muda, zona de atuação do Antigravity muda |
| `docs/adr/NNNN-titulo.md` | Qualquer decisão arquitetural nova ou revisada |

## Template de ADR
```markdown
# NNNN — Título da decisão

**Data**: YYYY-MM-DD
**Status**: proposto | aceito | obsoleto | substituído por MMMM

## Contexto
O que motivou a decisão? Qual problema estava sendo resolvido?

## Decisão
O que foi decidido? Em 1-3 frases diretas.

## Consequências
- **Positivas**: o que melhora?
- **Negativas/trade-offs**: o que piora ou fica mais difícil?
- **Neutras**: o que muda sem ser melhor nem pior?

## Alternativas consideradas
- Alternativa A: por que foi descartada?
- Alternativa B: por que foi descartada?
```

## Regras de manutenção
- NUNCA deletar ADR — marcar como `obsoleto` ou `substituído por NNNN`.
- CLAUDE.md e AGENTS.md: manter abaixo de 200 linhas. Se ultrapassar, extrair seção para doc separado e referenciar.
- Mudança em docs vai no mesmo PR da mudança que motivou. Nunca docs desatualizados em main.
