# 07 — Roadmap de Execução

## Visão geral das fases

| Fase | Objetivo | Duração estimada | Entregável final |
|---|---|---|---|
| **0** | Validar hipóteses técnicas críticas | 4–6 semanas | Loop completo: descrição PT-BR → IA → JSON → render → ajuste manual → save |
| **1** | MVP jogável end-to-end | 10–14 semanas | Vida completa (nascimento aos 80+) jogável, sem crashes, com 80–120 eventos |
| **2** | Conteúdo e profundidade | 12–20 semanas | 500–1000 eventos, conteúdo histórico, múltiplas gerações, 15–20 carreiras |
| **3** | Polimento e launch web | 8–12 semanas | PWA pública, ads, tradução EN, soft launch |
| **4** | Mobile + backend (condicional) | 12–16 semanas | iOS e Android nas lojas, FastAPI + cloud sync |

**Total estimado**: 46–68 semanas (~12–16 meses) para chegar até Fase 3 (launch público web). Fase 4 condicional ao sucesso da Fase 3.

Assumindo 15–20 horas/semana de dedicação solo + IA como acelerador.

---

## Fase 0 — Validação de hipóteses críticas

A fase mais importante. Aqui você prova que o stack escolhido funciona **antes de investir meses em conteúdo**. Cada sprint tem entregável demonstrável e critério de saída binário.

### Sprint 0.1 — Scaffold (1 semana)

**Objetivo**: monorepo configurado, stack instalada, PWA deployada e instalável em 3 plataformas.

| Tarefa | Detalhe |
|---|---|
| Criar monorepo | `pnpm init`, `pnpm-workspace.yaml`, estrutura de pastas conforme `01-arquitetura-tecnica.md` |
| Instalar Vite + React + TS | `packages/game` com template Vite TypeScript |
| Instalar PixiJS v8 | `pnpm add pixi.js@^8` |
| Configurar PWA | `vite-plugin-pwa` + manifest + service worker |
| Configurar tsconfig paths | Imports absolutos `@core/*`, `@game/*` |
| Setup GitHub Actions | CI básico (lint + typecheck + build) |
| Deploy Cloudflare Pages | Conectar repositório, primeiro deploy |
| Validar instalação | Instalar PWA em desktop, Android, iOS |

**Critério de saída**: você instala a PWA no seu celular Android e iOS, abre em modo standalone (sem barra do navegador), confirma que carrega offline após primeira visita.

### Sprint 0.2 — Rig estático (1 semana)

**Objetivo**: primeira renderização visual do personagem em pose T-estática.

| Tarefa | Detalhe |
|---|---|
| Implementar `Joint`, `Skeleton` em `packages/core/src/rig/` | 15 joints conforme `02-avatar-core.md` |
| Forward kinematics | Algoritmo top-down, matrizes 2D próprias ou via `pixi.js` Matrix |
| Silhueta básica do braço | `gerarPathBracoOrganico` com Bézier |
| Silhueta básica da perna | Idem |
| Silhueta básica do tronco | Idem |
| Cabeça simples | Círculo + face placeholder |
| Renderizar em `<PixiStage>` no game | Personagem em pose T no canvas |
| Modo debug | Toggle exibindo joints + esqueleto |

**Critério de saída**: personagem visualmente coerente em pose T, 60fps no DevTools, modo debug funcional, silhuetas sem vincos visíveis nas articulações.

### Sprint 0.3 — Poses + interpolação (1 semana)

**Objetivo**: trocar entre poses suavemente.

| Tarefa | Detalhe |
|---|---|
| Schema Zod de `Pose` | Conforme `03-schemas-canonicos.md` |
| Criar 3 poses JSON hardcoded | `idle`, `maos_na_cintura`, `sentado` |
| Loader de pose | Aplica rotações de joints |
| Interpolação linear entre poses | `lerp` em rotação por joint, easing ease-in-out |
| UI de teste | 3 botões trocando poses, animação suave |

**Critério de saída**: clicar entre 3 botões troca pose com animação fluida em 0.5–1s, sem teleporte visual.

### Sprint 0.4 — IK + 2 personagens (1 semana)

**Objetivo**: dois personagens de proporções diferentes interagindo via IK.

| Tarefa | Detalhe |
|---|---|
| Two-bone IK analítico | `resolverTwoBoneIK` conforme `02-avatar-core.md` |
| FABRIK | Implementação iterativa em `FABRIK.ts` |
| Constraint anatômicas por joint | Tabela de limites em `constraints.ts` |
| Sistema de socket | `right_hand_socket`, `left_shoulder_socket`, etc. |
| Constraint-driven posing entre rigs | Mão de A toca ombro de B |
| Cena com 2 personagens | Proporções diferentes (1.85m vs 1.55m) |
| UI: arrastar personagem B | Recalcula braço de A em tempo real |

**Critério de saída**: arrastando o personagem B pela cena, o braço de A acompanha via IK mantendo "mão no ombro" coerente, sem dobrar cotovelo para trás, sem estender além do alcance.

### Sprint 0.5 — Pipeline Claude (1–2 semanas)

**Objetivo**: gerar primeira cena via IA e renderizá-la.

| Tarefa | Detalhe |
|---|---|
| Schema Zod completo de `Scene` | Conforme `03-schemas-canonicos.md` |
| Converter Zod → JSON Schema | `zod-to-json-schema` |
| System prompt do gerador | Em `prompts/sceneSystem.md` |
| Few-shots (3–5 exemplos) | Cenas humanas validadas manualmente |
| CLI `generate-scene` | `pnpm cli generate "Maria abraça emocionada a filha"` |
| Pipeline de validação | JSON.parse → Zod.safeParse → anatômico → coerência |
| Repair loop | Retry com feedback estruturado, max 2 |
| Renderizar cena gerada | Loader + RigRenderer + SceneRenderer |

**Critério de saída**: você digita "Maria abraça emocionada a filha que voltou do colégio chorando" e o CLI gera JSON válido em menos de 30s, que é renderizado em canvas com 2 personagens em pose de abraço.

### Sprint 0.6 — Validador visual MVP (1 semana)

**Objetivo**: ferramenta para validar/ajustar cenas geradas pela IA.

| Tarefa | Detalhe |
|---|---|
| App separado em `dev-tools/apps/scene-validator` | Vite + React |
| File picker de JSON | Drag-and-drop |
| Canvas PixiJS embedded | Renderiza cena |
| Inspetor Monaco editor | JSON com syntax highlighting |
| Click em joint → seleciona | Slider de ângulo aparece |
| Edição two-way | Slider ↔ JSON ↔ canvas |
| Botão salvar | Exporta para `content/poses/_pendentes/` |
| Validação contínua | Badge verde/vermelho com erros |

**Critério de saída**: você abre o validador, carrega uma cena gerada pela IA, clica num cotovelo cuja rotação ficou estranha, ajusta via slider, salva. O arquivo JSON em disco é atualizado e a cena fica visualmente correta.

### 🎯 Critério de saída da Fase 0

**Loop completo funcional, executável solo em sequência:**

1. Você digita uma descrição de cena em PT-BR
2. CLI chama Claude com Structured Outputs
3. Pipeline valida JSON via Zod + checagens anatômicas
4. Cena válida é salva em `_pendentes/`
5. Você abre o validador, revisa, ajusta o que precisa
6. Aprova → cena vai para `content/poses/{categoria}/`
7. Próxima cena reutiliza a pose ajustada como referência

**Se este loop não funciona, não avance para Fase 1.** A Fase 1 inteira depende de gerar centenas de cenas via este pipeline.

---

## Fase 1 — MVP jogável

### Sprint 1.1 — Save & schema Dexie (2 semanas)

| Tarefa | Detalhe |
|---|---|
| Schema Dexie v1 | Conforme `06-persistencia.md` |
| Save slot creation | Tela de "Nova Vida" cria Character + family roster |
| Load save | Lista de saves, seleção, carregamento de state |
| Export/import JSON | Botões em settings |
| Hash de integridade | SHA-256 ao salvar, validação ao carregar |
| Double-buffered save | Slot temporário + swap atômico |
| `navigator.storage.persist()` | Chamar após criar primeiro save |

**Critério**: criar save, jogar 1 evento, fechar navegador, reabrir, save carrega corretamente. Exportar JSON, deletar save, importar de volta, jogo continua.

### Sprint 1.2 — Motor de eventos + RPG (2 semanas)

| Tarefa | Detalhe |
|---|---|
| Event loader | Carrega `content/events/**/*.json` em build, gera manifest |
| PredicateEvaluator | Compila predicados em closures |
| EventPool | Weighted random pick filtrado por idade/predicados |
| ChoiceResolver | Aplica `Effect[]` ao GameState |
| Sistema D20 + DC | `rolarD20`, modificadores, 4 tiers |
| Cooldown + uniqueOnce | Flags automáticas após disparo |

**Critério**: clicar "envelhecer" avança 1 ano, dispara evento elegível, oferece escolhas, resolve com D20 + atributo, aplica efeitos. Save reflete novo estado.

### Sprint 1.3 — NPC roster (2 semanas)

| Tarefa | Detalhe |
|---|---|
| NpcGenerator | Gera NPC aleatório dentro de constraints |
| Roster inicial ao nascer | Pai, mãe, possíveis irmãos com idades coerentes |
| NpcMatcher | Algoritmo `selecionarOuCriarNpc` |
| Aging de NPCs | Envelhecimento sincronizado com timeline |
| Tags de persistência | Garbage collect de descartáveis após X anos |
| Painel de NPC (5 abas) | UI completa de detalhamento |

**Critério**: ao envelhecer, NPCs do roster envelhecem visualmente; clicar em qualquer NPC abre painel com 5 abas funcionais; eventos puxam NPCs corretos do roster (mãe é a mãe, sempre).

### Sprint 1.4 — Conteúdo seed (3 semanas)

**Objetivo**: 80–120 eventos handwritten cobrindo nascimento até 25 anos.

| Categoria | Quantidade-alvo |
|---|---|
| childhood (0–12 anos) | 25–30 eventos |
| education (13–18 anos) | 20–25 eventos |
| education (faculdade, 18–22) | 15–20 eventos |
| career (primeiro emprego) | 10–15 eventos |
| relationship (família, romance) | 15–20 eventos |
| crime/health/hobby | 5–10 eventos |

Cada evento passa pelo pipeline da Fase 0:
- Autor escreve estrutura no chat roteirista
- IA gera cenas para cada desfecho
- Autor valida visualmente no scene-validator
- Commit no `content/events/`

**Critério**: pool de eventos atinge 80+ eventos validados; uma vida completa de nascimento aos 25 anos é jogável sem repetições óbvias.

### Sprint 1.5 — UI completa (3 semanas)

| Componente | Detalhe |
|---|---|
| HUD principal | Idade, dinheiro, humor, saúde, ano |
| Painel de atributos | 5 stats com barras |
| Event log | Histórico de eventos vividos |
| Choice dialog | UI de escolhas com requisitos visíveis |
| Activity menu | Atividades livres por categoria |
| NPC list/panel | Roster com filtros |
| Settings screen | Conteúdo adulto, ritmo, exportar/importar |
| Death screen | Resumo da vida, estatísticas, "nova vida" |

**Critério**: jogabilidade sem pontos cegos de UI. Tester consegue jogar uma vida inteira só com mouse/touch, sem precisar do teclado.

### Sprint 1.6 — Polimento + playtest (2 semanas)

| Tarefa | Detalhe |
|---|---|
| Localização PT-BR canônica | i18next configurado, todas strings extraídas |
| Áudio MVP | SFX para clicks, transições, eventos importantes |
| 5–10 testers externos | Amigos/família que joguem 1+ vida completa |
| Balanceamento | Ajustar pesos de eventos, DCs, efeitos baseado em feedback |
| Bug fixing | Resolver críticos antes de Fase 2 |

**Critério**: 10 testers jogam uma vida completa (nascimento aos 80+) sem crashes; 70%+ deles relatam vontade de jogar novamente.

### 🎯 Critério de saída da Fase 1

MVP rodando em produção (Cloudflare Pages), jogável end-to-end, com base de testers validando que o loop é divertido.

---

## Fase 2 — Conteúdo e profundidade

Foco: escala. Pipeline de conteúdo + carreiras profundas + simulação autônoma de NPCs.

### Blocos principais

**Pipeline histórico** (3–4 semanas)
- Script Python coleta Wikipedia/Wikidata 1990–2025
- Curador IA parafraseia conforme blacklist
- Revisão humana de todos arquivos `historical/{ano}.json`
- Integração no jogo: noticiário, eventos vinculados

**Expansão de eventos** (6–8 semanas, paralelo)
- 500–1000 eventos cobrindo dos 25 aos 80 anos
- Cobertura completa de carreiras, relacionamentos, crime, saúde, hobby
- Equilíbrio entre eventos sérios e cômicos

**15–20 carreiras com árvores narrativas** (4–6 semanas)
- Cada carreira: 20–40 eventos próprios
- Progressão por níveis
- Eventos específicos ligados à profissão

**Múltiplas gerações** (2 semanas)
- Após morte do personagem, opção "jogar como descendente"
- Herda parte do roster, atributos genéticos parcialmente
- Novo save vinculado ao anterior por `linhagem_id`

**Simulação autônoma de NPCs** (3 semanas)
- NPCs envelhecem, mudam de emprego, se relacionam entre si **sem o jogador ver**
- Periodicamente eventos "off-screen" alteram NPCs do roster
- Jogador descobre via reencontros ("seu antigo chefe abriu empresa própria")

### 🎯 Critério de saída da Fase 2

- 500+ eventos no pool
- 15+ carreiras jogáveis
- Conteúdo histórico cobrindo 1990–anoAtual
- Múltiplas gerações funcionais

---

## Fase 3 — Polimento e launch web

| Bloco | Duração |
|---|---|
| Performance pass | 2 sem |
| Onboarding UX (tutorial, install prompt) | 2 sem |
| Identidade visual final (UI design pass) | 3 sem |
| Tradução EN-US (paralelo com pipeline IA) | 2 sem |
| Monetização (ads + telemetria) | 1 sem |
| Soft launch (Reddit, itch.io, TikTok) | 1 sem |
| Bug fixing e ajustes pós-feedback | 2 sem |

### 🎯 Critério de saída da Fase 3

- 1.000 usuários mensais ativos
- NPS positivo
- Churn 7 dias <50%
- Ads gerando pelo menos US$ 50/mês (sinal de tração)

---

## Fase 4 — Mobile + backend (CONDICIONAL)

Só ativar se Fase 3 mostrar tração real. Caso contrário, melhor iterar mais a versão web.

| Bloco | Duração |
|---|---|
| Setup Capacitor + plugins essenciais | 2 sem |
| Adaptações de UI mobile | 3 sem |
| Build iOS, submissão Apple | 2 sem |
| Build Android, submissão Google | 1 sem |
| Backend FastAPI (auth + sync) | 4 sem |
| Cloud sync no client | 2 sem |
| IAP (cosméticos, scenarios) | 2 sem |
| Marketing de launch mobile | 2 sem |

### 🎯 Critério de saída da Fase 4

- Apps aprovados nas duas lojas
- 10k downloads cumulativos em 6 meses
- Sync funcional sem corrupção de save

---

## Próximos 7 dias práticos — Sprint 0.1

Concreto, executável esta semana:

### Dia 1 — Setup do repositório

```bash
mkdir life-sim-game && cd life-sim-game
git init
pnpm init
```

Criar `pnpm-workspace.yaml`:
```yaml
packages:
  - 'packages/*'
```

Criar `.nvmrc`:
```
20
```

Criar estrutura de pastas conforme `01-arquitetura-tecnica.md`.

Commit inicial: `chore: scaffold inicial do monorepo`.

### Dia 2 — Package `game`

```bash
cd packages/game
pnpm create vite . --template react-ts
pnpm add pixi.js@^8 zustand zod dexie
pnpm add -D vite-plugin-pwa workbox-window
```

Configurar `vite.config.ts` com `VitePWA` plugin, manifest com icons placeholder.

### Dia 3 — Hello PixiJS

Em `packages/game/src/stage/PixiStage.tsx`, componente React que monta `PIXI.Application`, renderiza um quadrado vermelho ou círculo simples. Validar 60fps no DevTools.

### Dia 4 — Deploy Cloudflare Pages

- Push para repositório GitHub
- Conectar Cloudflare Pages (build: `pnpm --filter game build`, output: `packages/game/dist`)
- Validar URL pública carrega
- Validar PWA instalável no desktop (prompt nativo do Chrome)

### Dia 5 — Validação mobile

- Abrir URL no Android Chrome → "Adicionar à tela inicial" → confirmar standalone
- Abrir URL no iOS Safari → "Compartilhar → Adicionar à Tela de Início" → confirmar standalone
- Confirmar que app abre sem barra do navegador
- Confirmar que funciona offline após primeira visita

### Dia 6 — Package `core`

```bash
mkdir -p packages/core/src
cd packages/core
pnpm init
# nome: @lifesim/core
# main: src/index.ts
```

Configurar tsconfig estendendo `tsconfig.base.json`. Exportar shape vazio:

```typescript
// packages/core/src/index.ts
export const VERSAO_CORE = '0.0.1';
```

Em `packages/game`, adicionar:
```bash
pnpm add @lifesim/core --workspace
```

Importar e logar no console: `import { VERSAO_CORE } from '@lifesim/core'`.

### Dia 7 — Primeira spike do rig

Em `packages/core/src/rig/`:
- `Joint.ts`: tipo `Joint`
- `Skeleton.ts`: classe `Esqueleto` com 3 joints só (`root_pelvis`, `head`, `neck`)
- Método `posicaoMundialDe(id)`

Em `packages/game/src/stage/`, renderizar os 3 pontos como círculos no canvas.

**Esse é o "hello rig" — smoke test do stack completo.**

---

## Anti-padrões a evitar

1. **Pular validação da Fase 0** — "vamos só começar a fazer eventos, depois ajustamos o rig" → garantia de retrabalho massivo
2. **Adicionar features fora do roadmap** — "e se eu adicionasse um sistema de roupas customizáveis na Fase 1?" → ladrão de tempo
3. **Perfeccionismo visual na Fase 0/1** — silhueta perfeita pode esperar a Fase 1.6
4. **Escrever 20 eventos antes de validar pipeline** — gera retrabalho se algo no pipeline mudar
5. **Otimizar performance antes de medir** — só otimize quando DevTools mostrar problema real
6. **Adiar testes em mobile real** — emuladores mentem; teste em hardware fraco regularmente
7. **Aceitar conteúdo da IA sem validar visualmente** — IA gera coisas anatomicamente impossíveis silenciosamente
8. **Investir em backend antes de validar produto** — Fase 4 é condicional; cliente local funciona perfeitamente sozinho
9. **Adicionar libs sem necessidade clara** — cada dep nova é custo de manutenção

---

## Riscos principais e mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Rig não fica visualmente convincente | Média | Alto | Sprint 0.2 valida cedo; recursar para Spine se Fase 0 falhar |
| Pipeline IA produz cenas inúteis | Média | Alto | Few-shots de qualidade; repair loop; humano sempre valida |
| iOS apaga saves | Alta | Médio | UX educativa de instalação; auto-export; persist API |
| Burnout solo | Alta | Crítico | Limites semanais; pausa entre fases; manter outras coisas na vida |
| Custo IA escala demais | Baixa | Médio | Prompt caching; orçamento mensal cap; batches noturnos |
| Plágio detectado em notícia histórica | Baixa | Alto | Paráfrase obrigatória; blacklist; revisão humana |
| Browser API quebra entre versões | Baixa | Médio | Polyfills onde necessário; testes em múltiplos browsers |
| Stack desatualiza durante desenvolvimento | Média | Baixo | Lock de versões em `package.json`; updates em batch trimestral |

---

## Métricas de saúde do desenvolvimento

Acompanhe semanalmente:

- **Velocidade**: tarefas concluídas vs planejadas no sprint
- **Débito técnico**: TODOs no código, issues abertas em `docs/debt.md`
- **Cobertura de testes**: pelo menos 60% em `packages/core` ao fim da Fase 1
- **Performance**: FPS médio em cenas típicas, em desktop e mobile mid-range
- **Tamanho do bundle**: alvo <500KB gzipped no Sprint 1.6
- **Tempo de cold start**: alvo <3s em mobile mid-range

Reavaliar roadmap a cada fase concluída — adaptar baseado em aprendizados reais.
