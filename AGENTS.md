# Instrucoes para Agentes de IA — Vida 2.5D

## Leia PRIMEIRO antes de qualquer acao

Este e um jogo de simulacao de vida 2.5D em desenvolvimento solo.
Toda decisao arquitetural ja foi tomada e esta documentada em /instructions/.

## Passo obrigatorio ao iniciar qualquer sessao

1. Leia /instructions/00-visao-e-escopo.md
2. Leia /instructions/01-arquitetura-tecnica.md
3. Leia /docs/STATUS_ATUAL.md
4. Leia /docs/ROADMAP.md

## Decisoes fechadas — NUNCA questionar ou reverter

- Stack: TypeScript / Vite / React / PixiJS v8 / Zustand / Zod / Dexie
- Monorepo PNPM workspaces (packages/core, packages/game, packages/dev-tools)
- Rig 2D custom de 15 joints — SEM game engine, SEM Spine, SEM DragonBones
- IA generativa NUNCA em runtime — apenas dev-time
- Persistencia: Dexie.js sobre IndexedDB — localStorage PROIBIDO para saves
- Deploy: Cloudflare Pages via wrangler CLI

## Convencoes de codigo obrigatorias

- Linguagem: TypeScript strict
- Nomes de variaveis, metodos, classes: PORTUGUES BRASILEIRO
- Nomes especificos — NUNCA: total, lista, valor, resultado, temp
- Constantes: SCREAMING_SNAKE_CASE em portugues
- Tipos/Classes: PascalCase em portugues
- Excecao: tipos que mapeiam APIs externas (PixiJS, React, etc.)
- Maximo 25 linhas por funcao
- const por default, var PROIBIDO, any PROIBIDO sem justificativa

## O que esta PROIBIDO

- Game engines (Unity, Godot, Phaser, etc.)
- Runtimes de animacao proprietarios (Spine, DragonBones, Live2D)
- IA generativa em runtime do jogo
- localStorage/sessionStorage para save principal
- Inventar APIs — declare incerteza se nao souber

## Estrutura do projeto

- packages/core      — motor reutilizavel (rig, FK, IK, schemas, eventos)
- packages/game      — app principal (React + PixiJS)
- packages/dev-tools — ferramentas internas
- content/           — banco de conteudo (eventos, poses, historico)
- instructions/      — documentacao arquitetural (00 ao 07)
- docs/              — documentos operacionais

## Fluxo de commit

Conventional Commits: feat:, fix:, refactor:, docs:, chore:
Leia /docs/PROCEDIMENTO_COMMIT.md antes de qualquer commit.

## Antes de implementar qualquer feature

1. Verifique /docs/ROADMAP.md — estamos no sprint correto?
2. Verifique /docs/DECISOES_TECNICAS.md — ja foi decidido antes?
3. Se houver ambiguidade arquitetural — PERGUNTE, nao assuma
