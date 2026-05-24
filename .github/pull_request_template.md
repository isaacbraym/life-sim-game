## Entrega [agente]: <título curto>

- **Branch**: feat/??-???
- **Owner**: Codex | Claude Code | Antigravity
- **Toca**: (lista de arquivos/pastas principais)
- **Tipo**: refactor | feature | bugfix | content | docs | schema

### Checklist obrigatório (TODOS marcados antes de pedir merge)
- [ ] `pnpm check` passa (typecheck + lint + test)
- [ ] `pnpm build` passa
- [ ] Sem `any`, sem `@ts-ignore` sem `// SAFETY:`
- [ ] Mudança em schema Zod → migration Dexie incluída + teste round-trip
- [ ] Mudança em conteúdo → `tone-validator-br` passou
- [ ] CLAUDE.md / AGENTS.md / docs atualizados se aplicável
- [ ] Não toca arquivos fora do escopo declarado acima

### Notas para o orquestrador
<!-- O que o próximo agente ou a próxima sessão precisa saber -->
