# Status Atual — Vida 2.5D

## Data da ultima atualizacao
18/05/2026

## Sprint atual
0.2 — Rig estatico + silhueta organica

## O que esta funcionando

- Monorepo PNPM configurado (packages/core, game, dev-tools)
- PWA deployada: https://life-sim-game.isaacbraym1.workers.dev
- Deploy automatico via Cloudflare (push no main dispara build)
- PixiJS v8 rodando no canvas
- packages/core com Esqueleto (15 joints, FK)
- Silhueta organica Bezier renderizando: braco, perna, tronco, pescozo, cabeca
- Modo debug disponivel em RigDebug.ts

## O que esta em andamento

- Refinamento anatomico da silhueta (proporcoes, curvatura organica)
- Modo debug toggle

## Proximo passo imediato

Finalizar Sprint 0.2:
- Ajustar proporcoes do personagem (ombros, cintura, quadril)
- Implementar toggle debug (tecla D)
- Commit e passar para Sprint 0.3 (poses + interpolacao)

## Problemas conhecidos

- Personagem levemente deslocado para direita na tela
- Bracos ainda um pouco retangulares (em refinamento)
- ankle_R nao tem joint proprio — calculado manualmente como knee_R.y + 42

## Versao atual
v0.0.1-fase-0-sprint-02

## Repositorio
https://github.com/isaacbraym/life-sim-game
