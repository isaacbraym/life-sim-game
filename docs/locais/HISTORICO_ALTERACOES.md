# Historico de Alteracoes — Vida 2.5D

## 2026-05-18 — Sprint 0.1 concluido

- Monorepo PNPM configurado
- packages/game criado com Vite + React + PixiJS v8 + PWA
- PWA deployada em producao (Cloudflare Pages)
- Deploy automatico via wrangler CLI configurado
- Hello PixiJS: circulo vermelho no canvas
- URL: https://life-sim-game.isaacbraym1.workers.dev

## 2026-05-18 — Sprint 0.2 iniciado

- packages/core criado
- Esqueleto (Skeleton.ts): 15 joints com FK
- Joint.ts: tipos e limites anatomicos por joint
- RigDebug.ts: render debug do esqueleto (linhas + pontos)
- BezierSegment.ts: geracao de paths Bezier para membros
- SilhouetteRenderer.ts: render organico de braco, perna, tronco, cabeca
- Personagem renderizado como silhueta humanoide base
