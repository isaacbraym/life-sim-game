# 09 — Sistema de Interação

## Visão geral

O sistema de interação é o coração do gameplay da exploração. Ele substitui o `ActivityMenu` e o `ChoiceDialog` por um fluxo contextual que acontece **dentro do ambiente explorável**, sem modais separados.

```
ExplorationScene
→ click em InteractableObject ou NPC
→ ActionBubble (menu contextual próximo ao alvo)
→ jogador escolhe uma ActionDefinition
→ ActionResolver
→ D20 se resolutionMode === 'check'
→ EffectEngine (aplica effects ao GameState)
→ ProgressionTracker (atualiza contadores)
→ VisualFeedback (floating labels na tela)
→ LifeLog (registra na camada adequada)
→ autosave se narrativeWeight >= 'relevant'
→ interactionLock = false → controle retorna
```

## ActionResolver

Único orquestrador de resolução. Recebe uma `ActionDefinition` + contexto (GameState, NPC se aplicável) e produz um `ResultadoDeAcao`.

```typescript
type ResultadoDeAcao = {
  readonly desfecho: 'sucesso' | 'falha' | 'critico_sucesso' | 'critico_falha' | 'direto';
  readonly rollValor: number | undefined;
  readonly efeitosAplicados: EffectSchema[];
  readonly logsGerados: LogEntry[];
  readonly eventosDisparados: string[];
  readonly progressoAtualizado: Record<string, number>;
};

async function resolverAcao(
  acao: ActionDefinition,
  contexto: ContextoDeAcao
): Promise<ResultadoDeAcao> {
  // 1. verificar requisitos
  if (acao.requisitos && !avaliarPredicado(acao.requisitos, contexto.estado)) {
    throw new AcaoNaoPermitidaError(acao.id);
  }

  // 2. setar interactionLock
  useGameStore.setState({ interactionLock: true });

  // 3. aplicar custos imediatos
  if (acao.custos) aplicarEfeitos(acao.custos, contexto.estado);

  // 4. resolver pelo modo
  let desfecho: DesfechoAcao;
  let rollValor: number | undefined;

  if (acao.resolutionMode === 'direct') {
    desfecho = 'direto';
  } else {
    const roll = rolarD20();
    const mod = calcularModificador(contexto.estado.atributos[acao.check!.atributo]);
    rollValor = roll + mod;
    desfecho = classificarRoll(roll, rollValor, acao.check!.dc);
  }

  // 5. aplicar efeitos por desfecho
  const efeitos = coletarEfeitos(acao, desfecho);
  aplicarEfeitos(efeitos, contexto.estado);

  // 6. progressão acumulada
  const progressoAtualizado = atualizarProgressao(acao.progression, contexto.estado);

  // 7. gerar logs
  const logsGerados = gerarLogs(acao, desfecho, contexto);

  // 8. hooks de evento
  const eventosDisparados = processarEventHooks(acao.eventHooks, desfecho);

  // 9. consumir tempo
  if (acao.timeCost) consumirTempo(acao.timeCost);

  // 10. liberar lock
  useGameStore.setState({ interactionLock: false });

  return { desfecho, rollValor, efeitosAplicados: efeitos, logsGerados, eventosDisparados, progressoAtualizado };
}
```

## ActionBubble

Componente React renderizado como overlay absoluto sobre o canvas PixiJS. Posição sincronizada via `toGlobal()` do PixiJS:

```typescript
// no ticker PixiJS (imperativo)
app.ticker.add(() => {
  const objSelecionado = explorationStore.getState().objetoFocado;
  if (objSelecionado) {
    const posicaoTela = objSelecionado.sprite.toGlobal({ x: 0, y: -60 });
    useUIStore.setState({ bubblePos: posicaoTela, bubbleAcoes: objSelecionado.acoes });
  }
});

// componente React
function ActionBubble() {
  const pos = useUIStore(s => s.bubblePos);
  const acoes = useUIStore(s => s.bubbleAcoes);
  const lock = useGameStore(s => s.interactionLock);

  if (!pos || !acoes.length) return null;

  return (
    <div
      style={{ position: 'absolute', left: pos.x, top: pos.y, transform: 'translateX(-50%)' }}
      className="action-bubble"
    >
      {acoes.map(acao => (
        <button
          key={acao.id}
          disabled={lock || !verificarRequisitos(acao)}
          onClick={() => iniciarAcao(acao)}
        >
          {acao.icone && <span>{acao.icone}</span>}
          {acao.rotulo}
        </button>
      ))}
      <button onClick={fecharBubble} className="fechar">✕</button>
    </div>
  );
}
```

## VisualFeedback

Floating labels que aparecem sobre o personagem ou NPC após resolução. Implementadas em PixiJS (não React — precisam de posição no mundo):

```typescript
function mostrarFeedback(params: {
  posicao: Vec2;
  texto: string;
  cor: string;
  duracao?: number;
}): void {
  const label = new Text({ text: params.texto, style: { fill: params.cor, fontSize: 18 } });
  label.position.set(params.posicao.x, params.posicao.y);
  camadaFeedback.addChild(label);

  gsap.to(label, {
    y: params.posicao.y - 60,
    alpha: 0,
    duration: params.duracao ?? 1.5,
    ease: 'power1.out',
    onComplete: () => camadaFeedback.removeChild(label),
  });
}

// exemplos de chamada após resolverAcao()
mostrarFeedback({ posicao: jogador.posicao, texto: '+1 Força', cor: '#4ade80' });
mostrarFeedback({ posicao: jogador.posicao, texto: '-Energia', cor: '#f87171' });
mostrarFeedback({ posicao: npc.posicao, texto: '😠 Irritado', cor: '#fbbf24' });
```

## ProgressionTracker

Mantém contadores de hábito por período. Persiste em Dexie via subscribe debounced.

```typescript
type EstadoProgressao = {
  contadores: Record<string, number>;     // { 'treinosNoMes': 4 }
  marcadores: Record<string, boolean>;    // { 'rotinaDeTreinoAtiva': true }
  ultimoReset: Record<string, number>;    // timestamp do último reset por contador
};

function registrarProgressao(
  estado: EstadoProgressao,
  contadorId: string,
  delta: number,
  regra: ProgressionRule
): { estadoAtualizado: EstadoProgressao; limiarAtingido: boolean } {
  const novoValor = (estado.contadores[contadorId] ?? 0) + delta;
  const limiarAtingido = novoValor >= regra.limiar;

  return {
    estadoAtualizado: {
      ...estado,
      contadores: {
        ...estado.contadores,
        [contadorId]: limiarAtingido ? 0 : novoValor, // reset ao atingir
      },
    },
    limiarAtingido,
  };
}
```

Persistência via subscribe Zustand + debounce:

```typescript
useGameStore.subscribe(
  s => s.progressao,
  debounce(async (prog) => {
    await db.progressao.put({ id: salvo.id, ...prog });
  }, 1500)
);
```

## LifeLog — 5 camadas

### Camada 1: feedback

Floating visual. Não persiste no banco. Gerado por `VisualFeedback` automaticamente para toda ação.

### Camada 2: acao_simples

Gerado quando `narrativeWeight >= 'relevant'` e `logAcao` está definido:

```
"Você treinou na academia."
"Você saiu para jantar com Juliana."
"Você estudou durante a tarde."
```

### Camada 3: consequencia

Gerado ao atingir limiar de progressão, ou quando ação importante tem `logSucesso`/`logFalha`:

```
"Você ganhou +1 de Força após manter rotina de treino."
"Sua relação com Juliana melhorou após a conversa."
"O clima do jantar ficou tenso."
```

### Camada 4: evento_importante

Gerado quando `narrativeWeight === 'major'`:

```
"Aos 18 anos, você começou um relacionamento sério com Juliana."
"Você foi preso após tentativa de roubo."
"Seu pai faleceu aos 67 anos de infarto."
```

### Camada 5: resumo_periodico

Gerado ao avançar mês/semestre. Template baseado no que aconteceu no período:

```
"Neste mês, você focou no físico, se aproximou de Juliana e gastou
mais do que deveria em saídas."

"No último semestre, você manteve presença na escola, mas suas
notas caíram por falta de estudo. Sua amizade com Pedro esfriou."
```

O resumo usa os logs do período + variáveis de estado como input para gerar a frase. No MVP pode ser template string; na Fase 2+ pode usar Claude para gerar variações.

### Interface do LifeLog

```typescript
interface LifeLog {
  adicionarEntrada(entrada: Omit<LogEntry, 'id' | 'timestamp'>): void;
  buscarPorCamada(camada: LogCamadaEnum, limite?: number): LogEntry[];
  buscarPorPeriodo(anoInicio: number, anoFim: number): LogEntry[];
  gerarResumoPeriodico(anoInicio: number, anoFim: number): string;
}
```

## InteractionLock — fluxo completo

```
click em objeto
→ verificar interactionLock === false
→ iniciar movimento (GSAP tween)
→ ao chegar: abrir ActionBubble
→ jogador escolhe ação
→ interactionLock = true
→ ActionResolver executa
→ VisualFeedback mostrado (GSAP)
→ LifeLog atualizado
→ autosave se necessário
→ interactionLock = false
→ ActionBubble fecha
→ controle retorna ao jogador
```

Durante o lock: novos cliques no mundo são ignorados. Botões de mapa ficam desabilitados no React. O ticker PixiJS verifica o flag antes de processar input.

## Exemplos de ActionDefinition completos

### Treinar no supino (academia)

```json
{
  "id": "treinar_peito",
  "rotulo": "Treinar peito",
  "icone": "💪",
  "resolutionMode": "direct",
  "custos": [{ "tipo": "alterar_energia", "delta": -2 }],
  "onSuccess": [{ "tipo": "alterar_progressao", "contadorId": "treinosNoMes", "delta": 1 }],
  "progression": {
    "contadorId": "treinosNoMes",
    "limiar": 6,
    "periodoReset": "mes",
    "efeito": [{ "tipo": "alterar_atributo", "atributo": "forca", "delta": 1 }],
    "narrativeWeight": "relevant",
    "logAoAtigir": "Você manteve uma rotina consistente de treino e começou a notar evolução física. Força +1."
  },
  "narrativeWeight": "routine",
  "timeCost": { "unidades": 1, "tipo": "periodo" }
}
```

### Paquerar alguém (restaurante, bar)

```json
{
  "id": "paquerar_npc",
  "rotulo": "Paquerar",
  "icone": "😏",
  "requisitos": { "tipo": "var", "caminho": "personagem.idade", "operador": ">=", "valor": 14 },
  "resolutionMode": "check",
  "check": { "atributo": "carisma", "dc": 12 },
  "onSuccess": [
    { "tipo": "alterar_relacao", "npcId": "__alvo__", "delta": 3 },
    { "tipo": "setar_flag", "flag": "flertou_com_npc_id" }
  ],
  "onFailure": [
    { "tipo": "alterar_relacao", "npcId": "__alvo__", "delta": -1 },
    { "tipo": "alterar_humor", "delta": -1 }
  ],
  "logSucesso": "A conversa fluiu bem e a pessoa pareceu interessada.",
  "logFalha": "O flerte não foi correspondido. Constrangedor.",
  "eventHooks": [
    { "condicao": "onSuccess", "eventoId": "inicio_possivel_romance", "chance": 0.4 }
  ],
  "narrativeWeight": "relevant"
}
```

### Conversa séria com namorado/a (qualquer local)

```json
{
  "id": "conversa_seria",
  "rotulo": "Conversar sério",
  "icone": "💬",
  "resolutionMode": "check",
  "check": { "atributo": "carisma", "dc": 10 },
  "onAlways": [{ "tipo": "alterar_dinheiro", "delta": 0 }],
  "onSuccess": [
    { "tipo": "alterar_relacao", "npcId": "__alvo__", "delta": 4 },
    { "tipo": "setar_flag", "flag": "fortaleceu_confianca_npc_id" }
  ],
  "onFailure": [
    { "tipo": "alterar_relacao", "npcId": "__alvo__", "delta": -2 },
    { "tipo": "alterar_humor", "delta": -2 }
  ],
  "logSucesso": "A conversa aproximou vocês e fortaleceu a confiança.",
  "logFalha": "O papo ficou tenso. Saíram com o clima pesado.",
  "narrativeWeight": "relevant"
}
```
