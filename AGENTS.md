# Instrucoes para Agentes de IA — Vida 2.5D

## Leia PRIMEIRO antes de qualquer acao

Este e um jogo de simulacao de vida 2.5D em desenvolvimento solo.
Toda decisao arquitetural ja foi tomada e esta documentada em /instructions/.

## Passo obrigatorio ao iniciar qualquer sessao

1. Leia /instructions/00-visao-e-escopo.md
2. Leia /instructions/01-arquitetura-tecnica.md
3. Leia /docs/ROADMAP.md — sprint atual e proximos passos
4. Consulte os arquivos .txt anexados ao chat para o estado real do codigo
   (pkg_core.txt, pkg_game.txt, content_banco.txt, 00_raiz_configs.txt)
5. Leia /docs/DECISOES_TECNICAS.md quando tocar decisao arquitetural
6. Leia /docs/PROCEDIMENTO_COMMIT.md antes de commitar

NUNCA suponha conteudo de arquivo sem verificar nos .txt.

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
- undefined em vez de null para ausencia

## O que esta PROIBIDO

- Game engines (Unity, Godot, Phaser, etc.)
- Runtimes de animacao proprietarios (Spine, DragonBones, Live2D)
- IA generativa em runtime do jogo
- localStorage/sessionStorage para save principal
- Inventar APIs — declare incerteza se nao souber
- Commitar build artifacts em packages/*/src/:
  *.js, *.d.ts, *.js.map, *.d.ts.map gerados pelo tsc

Se aparecerem como M no `git status`:

```
find packages -path "*/src/*.js"       | xargs git rm --cached --ignore-unmatch -q
find packages -path "*/src/*.d.ts"     | xargs git rm --cached --ignore-unmatch -q
find packages -path "*/src/*.js.map"   | xargs git rm --cached --ignore-unmatch -q
find packages -path "*/src/*.d.ts.map" | xargs git rm --cached --ignore-unmatch -q
```

## Estrutura do projeto

- packages/core      — motor reutilizavel (rig, FK, IK, schemas, eventos, engine, npc, persistencia)
- packages/game      — app principal (React + PixiJS, UI, state, telas)
- packages/dev-tools — ferramentas internas
- content/           — banco de conteudo (eventos, poses, historico)
- instructions/      — documentacao arquitetural (00 ao 07)
- docs/              — documentos operacionais (ROADMAP, COMANDOS_RAPIDOS, DECISOES_TECNICAS, PROCEDIMENTO_COMMIT)

## Fluxo de branches (OBRIGATORIO)

NUNCA commitar direto em main. Cada agente SEMPRE trabalha em feature branch:

```
git checkout -b feat/nome-da-tarefa
# ... codar ...
```

ANTES de cada commit:

```
git branch                       # confirmar HEAD (alguns ambientes trocam silenciosamente)
git status                       # ver o que sera commitado
git add <arquivo1> <arquivo2>    # staging SELETIVO — NUNCA `git add .`
git status                       # confirmar staging
git commit -m "feat: descricao curta"
git push origin feat/nome-da-tarefa
```

Apos revisao:

```
git checkout main
git pull origin main
git merge --no-ff feat/nome-da-tarefa
git push origin main
```

## Fluxo de emergencia git

Se rebase der conflito ou erro de lock — NUNCA tentar continuar manualmente.
1. `git rebase --abort`
2. `git pull origin main`
3. `git push origin main`

Se index ficar sujo (deletions em massa no `git status`):

```
git reset --hard origin/main
```

## Convencao de commit

Conventional Commits: feat:, fix:, refactor:, docs:, chore:, content:, test:
Leia /docs/PROCEDIMENTO_COMMIT.md antes de qualquer commit.

## Antes de implementar qualquer feature

1. Verifique /docs/ROADMAP.md — estamos no sprint correto?
2. Verifique os .txt capturados — qual e o codigo real hoje?
3. Verifique /docs/DECISOES_TECNICAS.md — ja foi decidido antes?
4. Se houver ambiguidade arquitetural — PERGUNTE, nao assuma
