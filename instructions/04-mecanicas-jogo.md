# 04 — Mecânicas de Jogo

## Sistema RPG: 5 atributos

| Atributo | Influencia |
|---|---|
| **Força** | Brigas, esportes físicos, trabalhos manuais, intimidação física |
| **Inteligência** | Performance escolar, trabalhos cerebrais, decisões lógicas |
| **Carisma** | Relacionamentos, persuasão, vendas, sedução, liderança |
| **Constituição** | Saúde física, resistência a doenças, longevidade |
| **Sorte** | Modificador universal em rolagens, eventos aleatórios |

Ao nascer: valores aleatórios entre 6 e 14 (distribuição normal centrada em 10), armazenados em `atributosGeneticos` (imutáveis). O campo `atributos` é o valor atual, que muda com ações.

Decaimento por idade: a partir dos 60 anos, Força e Constituição decaem 1 ponto a cada 5 anos.

## D20 com 4 tiers de desfecho

| Roll | Tier | Descrição |
|---|---|---|
| 1 | Falha crítica | Consequência ruim, dispara efeito especial negativo |
| 2–9 | Falha | Resultado negativo |
| 10–19 | Sucesso | Resultado positivo padrão |
| 20 | Sucesso crítico | Consequência ótima, dispara efeito especial positivo |

```typescript
const modificador = Math.floor((atributo - 10) / 2);
const rollEfetivo = rolar1d20() + modificador;
```

Tiers 1 e 20 são absolutos — independem de DC.

## Sistema de Fases da Vida (LifePhase)

O personagem passa por 6 fases que controlam autonomia e locais disponíveis:

| Fase | Faixa etária | Autonomia | WorldMapScreen |
|---|---|---|---|
| `bebe` | 0–2 anos | Nenhuma | Não |
| `crianca` | 3–11 anos | Limitada | Não (apenas casa e escola com acompanhamento) |
| `adolescente` | 12–17 anos | Parcial | Sim (com restrições de horário e locais) |
| `jovem_adulto` | 18–25 anos | Plena | Sim |
| `adulto` | 26–59 anos | Plena | Sim |
| `idoso` | 60+ anos | Plena (com limitações físicas) | Sim |

Nas fases `bebe` e `crianca`, a experiência é mais parecida com eventos narrativos sequenciais — menor exploração livre, maior dependência do contexto familiar. O WorldMapScreen se expande gradualmente.

## Nascimento e Início de Vida (NewGameGenerator)

```
NewGameGenerator
→ BirthProfile / OriginProfile
→ FamilyProfile (pais, irmãos, estrutura familiar)
→ StartingHouse (template baseado em classeSocial)
→ LifePhase inicial (bebe)
→ loop de jogo na fase atual
```

O jogador escolhe ano de nascimento entre **1985 e 2000**. A cidade e seus locais acompanham a época: tecnologias, móveis, roupas e eventos históricos mudam conforme o ano avança.

## Sistema de Tempo

### Passagem de tempo

O jogador controla quando o tempo avança. A exploração de um local **não faz o tempo passar automaticamente**. O tempo avança quando:

1. Uma `ActionDefinition` com `timeCost` é resolvida (treinar, estudar, trabalhar, dormir)
2. O jogador explicitamente escolhe avançar o tempo (mês/semestre — configurável no início)
3. Um evento da pool principal é resolvido

Quando o jogador pula tempo (avança semestre ou ano), o jogo gera um **resumo periódico** das atividades e consequências do período, com oportunidades possivelmente perdidas.

### Ritmo configurável

| Ritmo | Eventos principais por ano | Gameplay |
|---|---|---|
| Mensal | 12 | Mais detalhado, ~80h de vida completa |
| Semestral | 2 | Intermediário, ~10h |
| Anual | 1 | Rápido, estilo BitLife clássico, ~5h |

### Modos de tempo

**Modo Exploração**: personagem está dentro de um local. Tempo não avança. Ações consomem energia/disposição, não calendário. Sair do local pode custar 1 unidade de tempo conforme configuração.

**Modo Pool**: eventos da pool principal são consultados e disparados. Ocorre ao avançar o calendário.

## Sistema de Exploração

### Fluxo canônico

```
NewGameGenerator
→ LifePhase atual
→ WorldMapScreen (quando disponível)
→ LocationDefinition selecionado
→ ComodoDefinition (cômodo de entrada)
→ ExplorationScene
→ click em InteractableObject ou NPC
→ ActionBubble com opções contextuais
→ escolha do jogador
→ ActionResolver
→ D20 se resolutionMode === 'check'
→ EffectEngine (aplica efeitos)
→ VisualFeedback (floating labels)
→ LifeLog (registra na camada adequada)
→ autosave se narrativeWeight >= 'relevant'
→ controle retorna ao jogador
→ jogador sai do local ou continua explorando
```

### WorldMapScreen

Tela com ícones de locais clicáveis. Locais filtrados por:
- `LifePhase` atual
- `requisitos` (predicados: dinheiro, flags, atributos)
- `disponibilidadeEra` (alguns locais só existem em certas épocas)

Locais base do MVP:

| Local | Subáreas (cômodos) | Fase mínima |
|---|---|---|
| Casa | Quarto / Sala / Cozinha / Banheiro | Bebe |
| Escola | Sala de aula / Corredor / Pátio | Criança |
| Parque | Área de lazer / Quadra | Criança |
| Academia | Musculação / Esteiras / Recepção | Adolescente |
| Restaurante | Salão / Balcão | Adolescente |
| Shopping | Praça de alimentação / Lojas | Adolescente |
| Trabalho | Escritório / Sala de reunião | Jovem adulto |
| Bar | Balcão / Mesas | Jovem adulto |
| Hospital | Recepção / Consultório | Qualquer |
| Banco | Atendimento | Jovem adulto |

### Movimento click-to-move

Sem pathfinding. O personagem tweena diretamente para `posicaoDeInteracao` do objeto clicado via GSAP:

```typescript
function aoClicarEmInteractable(obj: InteractableObject): void {
  const distancia = calcularDistancia(jogador.posicao, obj.posicaoDeInteracao);
  const duracao = distancia / VELOCIDADE_PADRAO;

  gsap.to(jogador, {
    x: obj.posicaoDeInteracao.x,
    y: obj.posicaoDeInteracao.y,
    duration: duracao,
    ease: 'none',
    onUpdate: () => atualizarOrientacao(jogador, obj.posicaoDeInteracao),
    onComplete: () => abrirActionBubble(obj),
  });
}
```

### InteractionLock

Durante resolução de uma ação, input é bloqueado:

```typescript
// no store
interactionLock: boolean;

// no ticker do PixiJS
app.ticker.add(() => {
  if (useGameStore.getState().interactionLock) return;
  processarInputDeExploracao();
});

// na React UI: ActionBubble e botões de mapa ficam desabilitados
```

## Sistema de Interação e Ações

### ActionDefinition — estrutura

Cada ação tem:

```
ActionDefinition
├── requisitos / predicados
├── custos (imediatos, antes de resolver)
├── resolutionMode: 'direct' | 'check'
├── check (atributo + DC), se resolutionMode === 'check'
├── onAlways (efeitos independentes do resultado)
├── onSuccess
├── onFailure
├── progression (contadores de hábito)
├── logs (textos por camada)
├── eventHooks (eventos futuros disparados)
├── timeCost
└── narrativeWeight: 'routine' | 'relevant' | 'major'
```

### Regra de distinção: direct vs check

**Use `direct` quando:**
- A ação é cotidiana e previsível
- O resultado é determinístico ou simplesmente aleatório sem drama narrativo
- É ação de manutenção, rotina, treino, consumo ou gestão

Exemplos: dormir, usar esteira, comer, estudar por uma hora, jogar videogame, comprar móvel.

**Use `check` quando:**
- Existe risco, incerteza ou conflito com drama narrativo
- O resultado pode mudar vida, relação, reputação, carreira, saúde, liberdade ou dinheiro
- O D20 tornaria o resultado interessante

Exemplos: paquerar alguém, confrontar rival, mentir, pedir aumento, entrevista de emprego, cometer crime, discutir com parceiro, fazer prova importante.

### Progressão acumulada (ProgressionTracker)

Ações repetidas alimentam contadores. Ao atingir limiares, geram efeitos e logs:

```typescript
// Exemplo: treinar 6 vezes no mês
const regraDeFrequenciaDeTreino: ProgressionRule = {
  contadorId: 'treinosNoMes',
  limiar: 6,
  periodoReset: 'mes',
  efeito: [{ tipo: 'alterar_atributo', atributo: 'forca', delta: 1 }],
  narrativeWeight: 'relevant',
  logAoAtigir: 'Você manteve uma rotina consistente de treino e começou a notar evolução física. Força +1.',
};
```

Outros exemplos de progressão:
- Estudar 8+ vezes no mês → +1 Inteligência
- Faltar 5+ dias na escola no semestre → desempenho escolar -, relação com pais/professores piora
- Beber 10+ vezes no mês → Constituição -1, chance de evento de dependência
- Não ver NPC importante por 6+ meses → afeto com esse NPC decai
- Economizar 3+ meses seguidos → reserva financeira, evento de oportunidade

### VisualFeedback

Feedback imediato que aparece sobre o personagem/NPC após resolução:

```
+Força    -Energia    ♥ +Afeto    ✗ Falhou    ✓ Sucesso
NPC irritado    $ -R$150    😊 Humor+
```

Esses labels duram 1.5–2s e somem com fade out. Não ficam no log permanente.

## LifeLog — 5 camadas

| Camada | Quando usar | Persiste? |
|---|---|---|
| `feedback` | Toda ação — floating visual imediato | Não |
| `acao_simples` | Ações com `narrativeWeight >= 'relevant'` | Sim |
| `consequencia` | Ao atingir limiar de progressão ou efeito relevante | Sim |
| `evento_importante` | Qualquer `narrativeWeight === 'major'` | Sim |
| `resumo_periodico` | Ao avançar mês/semestre automaticamente | Sim |

Exemplos concretos:

```
[acao_simples]    "Você treinou na academia."
[acao_simples]    "Você saiu para jantar com Juliana."
[consequencia]    "Você ganhou +1 de Força após manter uma rotina de treino."
[consequencia]    "Sua relação com Juliana ficou mais próxima."
[evento_importante] "Aos 18 anos, você começou um relacionamento sério com Juliana."
[resumo_periodico]  "Neste mês, você focou no físico, se aproximou de Juliana e gastou mais do que deveria."
```

## NPCs Persistentes

Sistema intacto do design original. Com a exploração, NPCs **aparecem fisicamente nos cômodos**:

- Colegas de classe estão na sala de aula e no corredor da escola
- Personal trainer está na academia
- Namorada pode ser convidada para um restaurante
- Família está em casa

O jogador clica no NPC no ambiente → ActionBubble com ações contextuais de relacionamento.

NPCs do roster são instanciados nos slots declarados no `ComodoDefinition.npcsElegiveis`, via `NpcMatcher`.

### Tags de persistência

- `permanente`: família direta, cônjuges, melhores amigos
- `recorrente`: chefes, colegas, ex-romances
- `descartavel`: NPCs gerados para um único evento/local

## Sistema de Eventos (Pool)

Mantido do design original. Integração com exploração:

- Eventos com `localContextId` só disparam quando o jogador está naquele tipo de local
- Eventos sem `localContextId` disparam como interrupções contextuais (aparecem na tela com ActionBubble, não como modal)
- Pool principal é consultado ao avançar o calendário

### Conteúdo adulto opt-in

Tags de conteúdo (`violence`, `sexual`, `substance`, `language`, `death`, `trauma`) em todos os eventos, ações e cenas. Por padrão todas bloqueadas. Jogador pode liberar nas configurações.

## Casa e Mobília

Ver `10-casa-e-moveis.md` para detalhamento completo.

Resumo: a casa é explorada como qualquer outro local, com cômodos navegáveis. Móveis são interactáveis com `ActionDefinition`. Sistema de compra/venda/reposicionamento via `furnishing mode`. Planta da casa é fixa — jogador não constrói paredes, mas pode comprar casas maiores.

## Carreiras (Fase 2+)

Profissões com árvores de eventos dedicadas. MVP cobre `profissaoAtual` e `salarioMensal`. Fase 2 introduz 15–20 carreiras com progressão por níveis e eventos específicos.
