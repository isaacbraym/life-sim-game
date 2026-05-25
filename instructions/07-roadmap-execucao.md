# 07 — Roadmap de Execução

## Visão geral das fases

| Fase | Objetivo | Duração estimada | Entregável final |
|---|---|---|---|
| **0** | Validar hipóteses técnicas críticas | 6–8 semanas | Rig + exploração point-and-click funcionando + pipeline IA gerando cômodos |
| **1** | MVP jogável end-to-end | 14–18 semanas | Vida completa jogável com exploração de 5+ locais, 80–120 eventos |
| **2** | Conteúdo e profundidade | 14–20 semanas | 500+ eventos, 15+ locais, conteúdo histórico 1985–2025, múltiplas gerações |
| **3** | Polimento e launch web | 8–12 semanas | PWA pública, ads, tradução EN, soft launch |
| **4** | Mobile + backend (condicional) | 12–16 semanas | iOS e Android nas lojas, cloud sync |

**Total estimado**: 54–78 semanas (~13–18 meses) para Fase 3. Fase 4 condicional ao sucesso da Fase 3.

---

## Fase 0 — Validação de hipóteses críticas

A fase mais importante. Prova que o stack escolhido funciona antes de investir em conteúdo.

### Sprint 0.1 — Scaffold ✅ (1 semana)

Monorepo configurado, stack instalada, PWA deployada e instalável em 3 plataformas.

Instalar novas libs:
```bash
pnpm add gsap@^3.13
pnpm add @pixi/ui@^2.2.0
```

**Critério**: PWA instalável no celular Android e iOS, carrega offline.

### Sprint 0.2 — Rig estático com 4 orientações ✅ (1–2 semanas)

- Rig de 15 joints em pose T estática
- 4 orientações implementadas (PERFIL_ESQUERDO/DIREITO, FRONTAL, COSTAS)
- Silhueta orgânica contínua sem vincos
- `RenderLayer` com `sortFunction` por Y (z-sorting)
- Escala leve por profundidade (0.85 no fundo, 1.05 na frente)
- Modo debug com toggle de joints

**Critério**: personagem visualmente coerente em pose T, 60fps, z-sorting funcional com 2 sprites, 4 orientações distintas sem quebra de silhueta.

### Sprint 0.3 — Primeiro cômodo navegável ✅ (1–2 semanas)

**Este é o sprint crítico novo.** Valida a mecânica central de exploração.

- `ComodoDefinition` hardcoded (sala simples, 3 objetos interativos)
- `ExplorationScene` com background placeholder (retângulo colorido)
- Objetos com highlight ao hover
- Click em objeto → personagem tweena via GSAP até `posicaoDeInteracao`
- `ActionBubble` React overlay aparece após chegar
- 2 ações disponíveis no ActionBubble (uma `direct`, uma `check`)
- `VisualFeedback` floating label após resolução
- `InteractionLock` durante resolução

**Critério**: clicar em qualquer objeto da sala faz o personagem andar até ele, ActionBubble aparece, escolha resolve com feedback visual, controle retorna. 60fps. Sem pathfinding.

### Sprint 0.4 — WorldMapScreen + integração ✅ (1 semana)

- `WorldMapScreen` com 3 locais clicáveis (Casa, Escola, Academia)
- Cada local tem 2 cômodos hardcoded
- Transição entre cômodos via fade (GSAP)
- Transição cômodo → WorldMapScreen ao clicar em saída tipo `'mapa'`
- Save guarda `currentLocationId` e `currentRoomId`

**Critério**: navegar Casa → Escola → cômodo de entrada → outro cômodo → WorldMapScreen sem crash. Estado correto após fechar e reabrir navegador.

### Sprint 0.5 — Prep Sprint 1.3 (LifeLog, NewGame, PainelAtributos) ✅ (1–2 semanas)

Schemas Zod completos para `action`, `location`, `furniture`, `era`, `lifephase`, `birthprofile`. Módulos `LifeLog`, `InteractionLock`, `EffectEngine`, `ProgressionTracker`, `ActionResolver`, `EraResolver`, `LifePhaseManager`, `NewGameGenerator`. Migração Dexie v2 com tabelas `lifeLog`, `progressao`, `homeSave`, `locationState`.

**Critério**: `pnpm --filter @lifesim/core typecheck` passa sem erros. Todos os schemas exportados de `packages/core`.

### Sprint 0.6 — Dev Tools Visual QA Foundation (1–2 semanas)

Criação do `packages/dev-tools` como app interno separado (`pnpm dev:tools`). Implementação das 5 ferramentas de QA humano obrigatório. Spec completa em `instructions/11-devtools-qa.md`.

Entregas:
- `packages/dev-tools` com Vite + React + TypeScript configurado
- **Furniture Viewer**: grid filtrável de todos os `FurnitureDefinition` dos catálogos
- **Room Validator**: renderiza `ComodoDefinition` com PixiJS (objetos, navZonas, saídas, posicaoDeInteracao); drag-and-drop sincronizado com painel JSON
- **Scene Proofer**: rig 15 joints com silhueta, 4 orientações, modo debug, sliders por joint com limites anatômicos
- **Character Editor**: grid 2×2 das 4 orientações, presets, slider de idade
- **Event Graph**: grafo `@xyflow/react` de eventos por categoria + Simulador com `EstadoDeJogo` editável, execução passo a passo e diff rastreado por módulo

Dependência: `@xyflow/react` (dev-tools only).

**Critério de saída do Sprint 0.6**:
- `pnpm dev:tools` abre sem erro
- Furniture Viewer exibe os 60+ móveis existentes com filtros funcionando
- Room Validator carrega `quarto_simples.json` e renderiza objetos, navZona e pontos de saída corretamente
- Event Graph carrega pasta `career/` e exibe os eventos como nós conectados por `eventHooks`
- Simulador executa um evento de `career` com `EstadoDeJogo` editado e mostra diff de estado com rastreabilidade por módulo

### Sprint 0.7 — Poses + animações de movimento (1 semana)

*Usa Scene Proofer (Sprint 0.6) como gate de aprovação.*

- Ciclos de caminhada para PERFIL_ESQUERDO/DIREITO
- Ciclo de idle para as 4 orientações
- Transição de orientação ao mudar direção durante movimento
- Interpolação suave entre poses (lerp com easing)
- Toda pose gerada passa pelo Scene Proofer antes de ir para `content/poses/`

**Critério**: personagem caminha com animação suave, muda de orientação coerentemente, idle visual enquanto parado. Nenhuma pose commitada sem aprovação no Scene Proofer.

### Sprint 0.8 — Pipeline IA de cômodos (1–2 semanas)

*Usa Room Validator (Sprint 0.6) como gate de aprovação.*

- CLI `generate-room` com Anthropic SDK + Structured Outputs
- Pipeline: grid ASCII → JSON → Zod.safeParse → validação
- Retry loop (máximo 2 retries com erro injetado)
- Todo cômodo gerado passa pelo Room Validator antes de ir para `content/locations/`

**Critério**: digitar "Academia anos 90 com 5 aparelhos" → CLI gera JSON válido em <45s → Room Validator renderiza com objetos em posições coerentes → aprovação humana → commit.

### Sprint 0.9 — Pipeline IA de poses/cenas (1 semana)

*Usa Scene Proofer (Sprint 0.6) como gate de aprovação.*

- CLI `generate-scene` para geração de poses/cenas via IA
- Toda cena gerada passa pelo Scene Proofer antes de ir para `content/poses/`

**Critério**: pipeline gera cena válida → Scene Proofer valida anatomicamente → aprovação humana → commit.

### 🎯 Critério de saída da Fase 0

Loop completo funcional:

1. WorldMapScreen → escolher local → entrar em cômodo
2. Personagem caminha por click-to-move
3. Clicar em objeto → ActionBubble → escolher ação → resolver → feedback visual → log
4. Sair do local → WorldMapScreen
5. `pnpm dev:tools` abre e as 5 ferramentas funcionam
6. Gerar cômodo via CLI → validar no Room Validator → commitar
7. Gerar cena/pose via CLI → validar no Scene Proofer → commitar

**Se este loop não funciona, não avance para Fase 1.**

---

## Fase 1 — MVP jogável

### Sprint 1.1 — Save & schema Dexie v3 (2 semanas)

- Schema Dexie v3 completo (todas as tabelas novas: `homeSave`, `locationState`, `progressao`, `lifeLog`)
- Save slot creation com `BirthProfile`
- Load save com restauração de `currentLocationId` / `currentRoomId`
- Export/import JSON
- Hash de integridade + double-buffered save
- `navigator.storage.persist()`

**Critério**: criar save, explorar 2 locais, fechar navegador, reabrir, exatamente no mesmo cômodo.

### Sprint 1.2 — Motor de eventos + RPG (2 semanas)

- Event loader + manifest builder
- `PredicateEvaluator` com suporte a `localContextId`
- `EventPool` com weighted random + cooldown + uniqueOnce
- `ActionResolver` unificado (`direct` + `check`)
- `ProgressionTracker` com contadores e limiares
- D20 + DC + modificadores + 4 tiers
- `EffectEngine` aplicando todos os tipos de efeito

**Critério**: ação com `check` em academia dispara D20, aplica modificador de Força, mostra resultado correto. Treinar 6 vezes no mês gera consequência de +1 Força com log.

### Sprint 1.3 — LifeLog 5 camadas (1 semana)

- `LifeLog` implementado com as 5 camadas
- Persistence em Dexie com subscribe debounced
- `LifeLogPanel` React exibindo entradas por camada
- Geração automática de `resumo_periodico` ao avançar mês

**Critério**: jogar 3 meses, ver log com ações simples, consequências e resumo mensal. Log persiste após reload.

### Sprint 1.4 — NPC roster + presença nos locais (2 semanas)

- `NpcGenerator` com aparência por seed + `TracosFixos`/`TracosVariaveis`
- Roster inicial ao nascer (pai, mãe, possíveis irmãos)
- `NpcMatcher` instanciando NPCs nos slots de `ComodoDefinition`
- NPCs visíveis nos cômodos com idle contextual
- Click em NPC → ActionBubble com ações de relacionamento
- Painel de NPC (5 abas) acessível via NpcPanel

**Critério**: ir à escola e ver colegas de classe fisicamente no cômodo. Clicar em colega → opções de interação. Painel NPC com linha do tempo de eventos compartilhados.

### Sprint 1.5 — LifePhase + WorldMapScreen dinâmico (2 semanas)

- `LifePhaseManager` calculando fase por idade
- `WorldMapScreen` filtrando locais por fase + requisitos
- `NewGameGenerator` com `BirthProfile` + estrutura familiar inicial
- Fases `bebe` e `crianca`: experiência limitada sem WorldMapScreen completo
- `EraResolver` filtrando objetos/móveis por `YearContext`

**Critério**: personagem nascido em 1990 em família de classe média inicia sem WorldMapScreen. Ao crescer, mapa se expande. Sala de aula tem objetos coerentes com 1996 (sem smartphones, sem internet).

### Sprint 1.6 — Casa + sistema de mobília (3 semanas)

- `HouseDefinition` + template de casa inicial por `BirthProfile.condicaoHabitacional`
- Cômodos da casa como qualquer outro local (explorável)
- `FurnitureCatalog` com 20–30 móveis iniciais por era
- Móveis como `InteractableObject` com `ActionDefinition`
- `FurnitureCatalog` UI (sidebar de compra)
- Drag-and-drop com grid/snap em PixiJS
- `HomeSaveState` persistido em Dexie
- Efeitos passivos de móveis (conforto, energia, humor)

**Critério**: entrar no quarto da casa, clicar na cama → dormir (recupera energia, avança tempo). Comprar um computador, posicioná-lo na sala, clicar nele → opções de estudar/jogar.

### Sprint 1.7 — Conteúdo seed (3 semanas)

80–120 eventos cobrindo nascimento até 25 anos, adaptados para o novo modelo:

| Categoria | Quantidade |
|---|---|
| childhood (0–12) + home/school context | 25–30 |
| education adolescente (escola) | 20–25 |
| education faculdade (18–22) | 15–20 |
| career (primeiro emprego) | 10–15 |
| relationship (família, romance) | 15–20 |
| crime/health/hobby | 5–10 |

Cada evento tem `localContextId`, `narrativeWeight`, `eraDisponivel` definidos.

**Critério**: vida de nascimento (1990) até 25 anos jogável sem repetições óbvias; eventos aparecem nos locais certos; log narrativo conta uma história coerente.

### Sprint 1.8 — Conteúdo histórico 1985–2025 (delegado ao Gemini)

CLI Gemini gera `content/historical/YYYY.json` para cada ano. Revisão humana dos anos mais sensíveis.

### Sprint 1.9 — UI completa + HUD (2 semanas)

- HUD adaptado para modo exploração (sem botão "Avançar Tempo" visível durante exploração)
- Botão "Passar tempo" disponível no WorldMapScreen e em ações específicas
- `LifeLogPanel` navegável
- Painel de status do personagem (atributos, dinheiro, humor, energia)
- Notificações de progressão atingida
- Tela de morte

### Sprint 1.10 — Polimento Fase 1 (2 semanas)

- Performance: 60fps em mobile mid-range
- Bundle < 500KB gzipped
- Cold start < 3s em mobile
- Testes de regressão: save/load, progressão, eventos
- Playtests com 3–5 pessoas externas

### 🎯 Critério de saída da Fase 1

- Vida completa de nascimento (1985–2000) aos 80+ anos jogável
- Mínimo 5 locais exploráveis com NPCs presentes
- Sistema de casa com mobília funcional
- Log narrativo conta história coerente da vida
- Sem crashes em sessão de 2h

---

## Fase 2 — Conteúdo e profundidade

**15+ locais** (novos: praça, mercado, delegacia, cartório, hospital completo, parque de diversões)

**Carreiras** com locais de trabalho específicos por profissão

**Simulação autônoma de NPCs** — NPCs envelhecem, mudam de emprego, casam entre si sem o jogador ver

**Múltiplas gerações** — jogar como descendente com herança de roster e atributos genéticos

**Era visual completa** — ambientes visualmente diferentes por década (80s retrô, 90s, 2000s, 2010s)

**HousingMarket** — comprar e alugar diferentes casas com progressão do personagem

### 🎯 Critério de saída da Fase 2

- 500+ eventos no pool
- 15+ locais exploráveis
- Conteúdo histórico 1985–2025 completo
- Múltiplas gerações funcionais
- Era visual funcionando em pelo menos 3 décadas

---

## Fase 3 — Polimento e launch web

- Performance pass
- Onboarding UX (tutorial, install prompt)
- Identidade visual final
- Tradução EN-US
- Monetização (ads entre vidas)
- Soft launch (Reddit, itch.io, TikTok)

---

## Fase 4 — Mobile + backend (CONDICIONAL)

Só ativar se Fase 3 mostrar tração. Capacitor para iOS/Android, FastAPI + cloud sync.

---

## Anti-padrões a evitar

1. **Pular Sprint 0.3** — "vamos logo para eventos, depois colocamos a exploração" → retrabalho massivo
2. **Pathfinding antes de validar que não precisa** — tween direto é suficiente para sala única
3. **Arte antes de mecânica** — placeholders são suficientes até Fase 1.9
4. **Cutscene separada quando ActionBubble funciona** — complexidade desnecessária
5. **Mundo aberto antes de world map estável** — adicionar ruas depois de validar locais isolados
6. **Build mode completo antes de furniture básico** — decoração simples primeiro
7. **Gerar 200 eventos antes de validar o pipeline novo** — valide com 10 eventos primeiro

## Riscos principais

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Exploração não fica satisfatória visualmente | Média | Alto | Sprint 0.3 valida cedo; ajustar ângulo oblíquo conforme necessário |
| Click-to-move parece estranho sem obstáculos | Baixa | Médio | NavZona limita onde o personagem pode ir; tween direto é aceitável |
| Móveis difíceis de posicionar em mobile | Média | Médio | Grid snap facilita; testar em touch desde Sprint 1.6 |
| Pipeline IA gera cômodos inutilizáveis | Média | Alto | Few-shots de qualidade; room-validator obrigatório antes de commitar |
| Conteúdo histórico 1985–1989 escasso | Baixa | Baixo | Gemini gera; revisão humana só dos anos mais importantes |
| Burnout solo | Alta | Crítico | Limites semanais, pausas entre fases, celebrar cada sprint |
