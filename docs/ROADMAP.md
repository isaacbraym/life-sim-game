# Roadmap — Vida 2.5D

## Fases do projeto

| Fase | Objetivo | Status |
|------|----------|--------|
| 0 | Validar hipoteses tecnicas criticas | EM ANDAMENTO |
| 1 | MVP jogavel end-to-end | PENDENTE |
| 2 | Conteudo e profundidade | PENDENTE |
| 3 | Polimento e launch web | PENDENTE |
| 4 | Mobile + backend (condicional) | PENDENTE |

## Fase 0 — Sprints

| Sprint | Objetivo | Status |
|--------|----------|--------|
| 0.1 | Scaffold monorepo + PWA deployada | CONCLUIDO |
| 0.2 | Rig estatico 15 joints + FK + silhueta | EM ANDAMENTO |
| 0.3 | Poses + interpolacao | PENDENTE |
| 0.4 | IK + 2 personagens | PENDENTE |
| 0.5 | Pipeline Claude (geracao de cenas) | PENDENTE |
| 0.6 | Validador visual MVP | PENDENTE |

## Sprint 0.2 — Tarefas detalhadas

- [x] 15 joints implementados (Joint.ts, Skeleton.ts)
- [x] Forward Kinematics funcionando
- [x] Render debug do esqueleto (RigDebug.ts)
- [x] Silhueta organica Bezier — braco, perna, tronco, cabeca
- [ ] Refinamento anatomico da silhueta
- [ ] Modo debug toggle (mostrar/ocultar joints)
- [ ] Commit e validacao final do Sprint 0.2

## Criterio de saida da Fase 0

Loop completo funcional:
1. Descricao de cena em PT-BR
2. CLI chama Claude com Structured Outputs
3. Pipeline valida JSON via Zod + checagens anatomicas
4. Cena valida salva em _pendentes/
5. Validador visual — revisar, ajustar, aprovar
6. Cena vai para content/poses/{categoria}/

## URL de producao

https://life-sim-game.isaacbraym1.workers.dev
