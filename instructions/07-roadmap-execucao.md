# 07 — Roadmap de Execução

## Visão geral das fases

| Fase | Objetivo | Duração estimada | Entregável final | Status |
|---|---|---|---|---|
| **0** | Validar hipóteses técnicas críticas | 4–6 semanas | Loop completo: descrição PT-BR → IA → JSON → render → ajuste manual → save | ✅ Concluída |
| **1** | MVP jogável end-to-end | 10–14 semanas | Vida completa (nascimento aos 80+) jogável, sem crashes, com 80–120 eventos | 🚧 Em curso (Sprint 1.10) |
| **2** | Conteúdo e profundidade | 12–20 semanas | 500–1000 eventos, conteúdo histórico, múltiplas gerações, 15–20 carreiras | ⏳ Não iniciada |
| **3** | Polimento e launch web | 8–12 semanas | PWA pública, ads, tradução EN, soft launch | ⏳ Não iniciada |
| **4** | Mobile + backend (condicional) | 12–16 semanas | iOS e Android nas lojas, FastAPI + cloud sync | ⏳ Não iniciada |

**Total estimado**: 46–68 semanas (~12–16 meses) para chegar até Fase 3 (launch público web). Fase 4 condicional ao sucesso da Fase 3.

Assumindo 15–20 horas/semana de dedicação solo + IA como acelerador.

---

## 🚧 Sprint atual: 1.10 — Motor de tempo + ciclo de evento principal

**Em andamento.** Trabalho dividido entre três agentes em branches separados:

| Agente | Branch | Foco |
|---|---|---|
| Codex | `feat/tempo-engine-e-evento-principal` | TempoEngine, GameEngine (orquestrador), ResultadoResolucao, hudStore.avancarTempo |
| Antigravity/Gemini | `feat/autosave-e-conteudo-tempo` | Autosave debounced, sistema de migração de save, +25 eventos de transição etária |
| Claude Code | `feat/tempo-ui-e-event-modal` | BotaoAvancarTempo, ModalEventoPrincipal, ResultadoEventoOverlay, remoção do simularMorte debug |

**Critério de saída**: clicar "Avançar tempo" avança o calendário conforme o ritmo do save, envelhece o roster, sorteia um evento principal, abre modal bloqueante, jogador escolhe opção, d20 resolve com 4 tiers, efeitos aplicados, autosave dispara, fluxo volta para o jogo livre. Se saúde ≤ 0, transiciona para tela de morte.

---

## Fase 0 — Validação de hipóteses críticas ✅

Fase concluída. Todos os critérios de saída atingidos: rig com 15 joints renderizando em PixiJS, IK two-bone + FABRIK funcionando, silhuetas Bézier sem vincos, schema Zod de Scene completo, pipeline IA via Claude Structured Outputs validado, scene-validator MVP operacional.

### Sprints da Fase 0 (histórico)

| Sprint | Entregável principal | Status |
|---|---|---|
| 0.1 — Scaffold | Monorepo PNPM + Vite + React + PixiJS v8 + PWA + CI/CD + deploy | ✅ |
| 0.2 — Rig estático | 15 joints, FK top-down, silhueta de braço/perna/tronco/cabeça | ✅ |
| 0.3 — Poses + interpolação | Schema Pose, loader, lerp entre 3 poses hardcoded | ✅ |
| 0.4 — IK + 2 personagens | TwoBoneIK analítico, FABRIK iterativo, constraint-driven posing | ✅ |
| 0.5 — Pipeline Claude | Scene schema, generate-scene CLI, validação multi-camada, repair loop | ✅ |
| 0.6 — Validador visual | Scene-validator com Monaco + canvas embedded + edição two-way | ✅ |

---

## Fase 1 — MVP jogável

### Sprint 1.1 — Save & schema Dexie ✅

Concluído. Entregáveis:
- Schema Dexie v1, GameDB inicializado
- SaveManager com criarNovoSave, carregarSave, salvarSave
- Export/import JSON com validação Zod
- Hash SHA-256 de integridade, double-buffered save (slot temporário + swap atômico)
- `navigator.storage.persist()` chamado após primeiro save

### Sprint 1.2 — Motor de eventos + RPG ✅

Concluído. Entregáveis:
- Schemas Zod completos: Effect (discriminatedUnion), Event, Choice
- EventLoader normaliza id/eventoId
- EventPool com cooldown real (eventoPassaCooldown)
- AplicadorEfeitos com 11 tipos de efeito discriminados
- Sistema D20 com 4 tiers (falha crítica/falha/sucesso/sucesso crítico)
- Modificadores estilo D&D 5e: `(atributo - 10) / 2` arredondado para baixo
- atributoCheck e gerarAtributosIniciais (4d6-drop-lowest)

### Sprint 1.3 — NPC roster ✅

Concluído. Entregáveis:
- NpcGenerator, NpcMatcher, NpcRoster
- gerarRosterInicial — família inicial com idades coerentes
- gerarAtributosGeneticos (mulberry32 seedável + herança dos pais)
- envelhecerRoster + envelhecerRosterComRelatorio
- Tags de persistência: permanente, recorrente, descartavel

### Sprint 1.4 — Conteúdo seed ✅

Concluído acima do alvo. Entregáveis:
- 168+ eventos JSON em content/banco
- Cobertura por categoria: childhood (29), education (41 + 7 faculdade), career (26), relationship (20), emotional (163), interactions (58), action (31), health/crime/basic (~18 cada), hobby/finance/travel (3 cada)
- 5 eventos reescritos com humor ácido como padrão tonal de referência

### Sprint 1.5 — UI completa (base) ✅

Concluído. Entregáveis:
- BarraSuperior, RailVitais, RailAtividades (substituindo HudLateral legado)
- EventLog com formatação por tipo
- EventoBase (modal de evento simplificado)
- NewGameScreen (cria SaveSlot real + família inicial via gerarRosterInicial)
- SettingsScreen (toggle de conteúdo adulto + export/import)
- DeathScreen (epitáfio + estatísticas + botão "nova vida")
- PixiStage renderizando personagem em T-pose
- Paleta visual definitiva (cores, tipografia DM Sans + DM Mono)

### Sprint 1.6–1.8 — Consolidação técnica (intercalada)

Iterações intermediárias executadas em paralelo aos sprints maiores. Entregáveis:
- Refatoração HudLateral → BarraSuperior + Rails (migração de layout)
- Persistência: solicitarPersistenciaStorage automática
- Engine: registrarCooldown, aplicarResultadoEfeitos integrados
- hudStore: eventosVividos, conteudoAdulto, resolverOpcao reais
- Infra: .npmrc com shamefully-hoist (fix picocolors/PostCSS)
- Infra: build artifacts removidos do git, .gitignore corrigido

### Sprint 1.9 — Load Game + Activity Engine + Save listing ✅

| Agente | Branch | Entregáveis |
|---|---|---|
| Claude Code | `feat/load-game-screen-e-limpeza-ui` (entregou em `feat/save-listing-e-conteudo` por troca de HEAD) | LoadGameScreen, remoção do HudLateral, fix de comentário desatualizado em NewGameScreen |
| Codex | `feat/activity-engine-e-limpeza-core` | ActivityCatalog (10 atividades), ActivityEngine (função pura), realizarAtividade no hudStore, deleção do ChoiceResolver dead code |
| Antigravity/Gemini | `feat/save-listing-e-conteudo` | listarSaves, deletarSave, carregarSaveSeguro no SaveManager, +20 eventos em education(13-17) e career(18-22), script `validate:events`, auditoria fora de escopo de 48 eventos antigos (corrige problemas de enum Zod) |

Lições documentadas (vão para AGENTS.md): nunca `git add .` em prompts de agentes, sempre `git branch` antes de commit, escopo de Gemini precisa ser explícito.

### Sprint 1.10 — Motor de tempo + evento principal 🚧 (atual)

Detalhes acima na seção "Sprint atual".

### Sprint 1.11 — Polimento + playtest (planejado)

| Tarefa | Detalhe |
|---|---|
| Localização PT-BR canônica | i18next configurado, todas strings extraídas |
| Áudio MVP | SFX para clicks, transições, eventos importantes |
| 5–10 testers externos | Amigos/família que joguem 1+ vida completa |
| Balanceamento | Ajustar pesos de eventos, DCs, efeitos baseado em feedback |
| Bundle splitting | Resolver aviso `chunk > 500 kB` via manualChunks em Vite |
| Investigar enums Zod restritivos | Issue do Sprint 1.9: decidir caso a caso ampliar enum ou aceitar perda em contentTags/background/facing |
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

## Como esta seção é atualizada

Cada sprint concluído migra de "🚧 atual" para "✅ histórico" com bullets dos entregáveis reais (não do plano original). O bloco "Sprint atual" no topo é reescrito a cada início de sprint. Esse arquivo é a fonte oficial de status arquitetural — os `.txt` capturados refletem o código real entre as atualizações.

---

## Anti-padrões a evitar

1. **Pular validação da Fase 0** — "vamos só começar a fazer eventos, depois ajustamos o rig" → garantia de retrabalho massivo (já evitado ✅)
2. **Adicionar features fora do roadmap** — "e se eu adicionasse um sistema de roupas customizáveis na Fase 1?" → ladrão de tempo
3. **Perfeccionismo visual na Fase 0/1** — silhueta perfeita pode esperar a Fase 1.11
4. **Escrever 20 eventos antes de validar pipeline** — gera retrabalho se algo no pipeline mudar
5. **Otimizar performance antes de medir** — só otimize quando DevTools mostrar problema real
6. **Adiar testes em mobile real** — emuladores mentem; teste em hardware fraco regularmente
7. **Aceitar conteúdo da IA sem validar visualmente** — IA gera coisas anatomicamente impossíveis silenciosamente
8. **Investir em backend antes de validar produto** — Fase 4 é condicional; cliente local funciona perfeitamente sozinho
9. **Adicionar libs sem necessidade clara** — cada dep nova é custo de manutenção
10. **Commitar direto em `main`** — sempre via feature branch + PR, mesmo solo
11. **Agentes IA fazendo `git add .`** — staging seletivo obrigatório; ambientes como FleetView puxam arquivos órfãos
12. **Agentes IA fazendo trabalho fora do escopo** — Gemini no Sprint 1.9 corrigiu 48 eventos antigos não pedidos; brief precisa ser explícito sobre restrição

---

## Riscos principais e mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Rig não fica visualmente convincente | Baixa (validado na Fase 0) | Alto | Sprint 0.2 validou cedo |
| Pipeline IA produz cenas inúteis | Média | Alto | Few-shots de qualidade; repair loop; humano sempre valida |
| iOS apaga saves | Alta | Médio | UX educativa de instalação; auto-export; persist API |
| Burnout solo | Alta | Crítico | Limites semanais; pausa entre fases; manter outras coisas na vida |
| Custo IA escala demais | Baixa | Médio | Prompt caching; orçamento mensal cap; batches noturnos |
| Plágio detectado em notícia histórica | Baixa | Alto | Paráfrase obrigatória; blacklist; revisão humana |
| Browser API quebra entre versões | Baixa | Médio | Polyfills onde necessário; testes em múltiplos browsers |
| Stack desatualiza durante desenvolvimento | Média | Baixo | Lock de versões em `package.json`; updates em batch trimestral |
| Agentes IA quebram convenções em branches paralelas | Média | Médio | PR obrigatório + revisão humana; checklist em todo prompt; AGENTS.md como source of truth |
| Ambiente do agente troca HEAD silenciosamente | Confirmado no 1.9 | Médio | `git branch` antes de cada commit; staging seletivo (`git add arq1 arq2`, nunca `git add .`) |

---

## Métricas de saúde do desenvolvimento

Acompanhe semanalmente:

- **Velocidade**: tarefas concluídas vs planejadas no sprint
- **Débito técnico**: TODOs no código, issues abertas
- **Cobertura de testes**: pelo menos 60% em `packages/core` ao fim da Fase 1
- **Performance**: FPS médio em cenas típicas, em desktop e mobile mid-range
- **Tamanho do bundle**: alvo <500KB gzipped no Sprint 1.11
- **Tempo de cold start**: alvo <3s em mobile mid-range

Reavaliar roadmap a cada fase concluída — adaptar baseado em aprendizados reais.
