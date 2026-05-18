# Procedimento de Commit — Vida 2.5D

## Formato obrigatorio (Conventional Commits)

tipo(escopo): descricao curta em portugues

## Tipos permitidos

- feat     — nova funcionalidade
- fix      — correcao de bug
- refactor — refatoracao sem mudanca de comportamento
- docs     — documentacao
- chore    — configuracao, deps, build
- test     — testes
- perf     — melhoria de performance

## Escopos comuns

- core     — packages/core
- game     — packages/game
- dev-tools — packages/dev-tools
- deploy   — configuracao de deploy
- deps     — dependencias

## Exemplos corretos

feat(core): adicionar IK two-bone analitico para bracos
fix(game): corrigir centralizacao do canvas na PWA
refactor(core): extrair calculo de FK para metodo proprio
chore(deps): atualizar pixi.js para 8.18.1
docs: atualizar STATUS_ATUAL com progresso Sprint 0.2

## Fluxo de commit

1. Verificar que o build passa: cd packages/game && pnpm build
2. git add .
3. git commit -m "tipo(escopo): descricao"
4. git push
5. Atualizar /docs/STATUS_ATUAL.md

## Deploy apos commit

cd packages/game && pnpm build && npx wrangler pages deploy dist --project-name life-sim-game
