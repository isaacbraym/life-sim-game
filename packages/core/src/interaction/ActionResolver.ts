import type { ActionDefinition } from '../schemas/action';
import type { Effect } from '../schemas/effect';
import type { EstadoDeJogo } from '../events/EstadoDeJogo';
import type { Npc } from '../schemas/npc';
import type { LogEntry, LogCamadaEnum } from '../log/LifeLog';
import { registrarResultadoNoLog } from '../log/LifeLog';
import type { EstadoProgressao } from './ProgressionTracker';
import { avaliarPredicado } from '../events/PredicateEvaluator';
import { rolarD20ComModificador } from '../rpg/D20Roll';
import { registrarProgressao } from './ProgressionTracker';
import { interactionLock } from './InteractionLock';

export type ContextoDeAcao = {
  readonly estado: EstadoDeJogo;
  readonly npcAlvo?: Npc | undefined;
  readonly progressao: EstadoProgressao;
  readonly anoJogo: number;
  readonly mesJogo: number;
  readonly localId?: string | undefined;
};

export type DesfechoAcao =
  | 'sucesso'
  | 'falha'
  | 'critico_sucesso'
  | 'critico_falha'
  | 'direto';

export type ResultadoDeAcao = {
  readonly desfecho: DesfechoAcao;
  readonly rollValor: number | undefined;
  readonly efeitosAplicados: readonly Effect[];
  readonly logsGerados: readonly LogEntry[];
  readonly eventosDisparados: readonly string[];
  readonly progressoAtualizado: Record<string, number>;
};

type ObservadorResultadoAcao = (
  resultado: ResultadoDeAcao,
  acao: ActionDefinition,
  contexto: ContextoDeAcao,
) => void;

let observadorResultadoAcao: ObservadorResultadoAcao | undefined;

export class AcaoNaoPermitidaError extends Error {
  constructor(readonly acaoId: string) {
    super(`Ação '${acaoId}' não permitida no contexto atual`);
    this.name = 'AcaoNaoPermitidaError';
  }
}

function coletarEfeitosPorDesfecho(
  acao: ActionDefinition,
  desfecho: DesfechoAcao,
): Effect[] {
  const acertou =
    desfecho === 'sucesso' ||
    desfecho === 'critico_sucesso' ||
    desfecho === 'direto';

  return [
    ...(acao.onAlways ?? []),
    ...(acertou ? (acao.onSuccess ?? []) : (acao.onFailure ?? [])),
  ];
}

function gerarLogsDeAcao(
  acao: ActionDefinition,
  desfecho: DesfechoAcao,
  contexto: ContextoDeAcao,
): LogEntry[] {
  const acertou =
    desfecho === 'sucesso' ||
    desfecho === 'critico_sucesso' ||
    desfecho === 'direto';

  const texto = acertou
    ? (acao.logSucesso ?? acao.logAcao)
    : (acao.logFalha ?? acao.logAcao);

  const camada: LogCamadaEnum =
    acao.narrativeWeight === 'major'
      ? 'evento_importante'
      : acao.narrativeWeight === 'relevant'
        ? 'consequencia'
        : 'acao_simples';

  return [{
    id: crypto.randomUUID(),
    camada,
    timestamp: Date.now(),
    anoJogo: contexto.anoJogo,
    mesJogo: contexto.mesJogo,
    texto: texto ?? `Voce realizou ${acao.rotulo}.`,
    npcIds: contexto.npcAlvo !== undefined ? [contexto.npcAlvo.npcId] : undefined,
    localId: contexto.localId,
    tags: [acao.id, desfecho],
  }];
}

function formatarDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : String(delta);
}

function textoConsequencia(efeito: Effect): string | undefined {
  switch (efeito.tipo) {
    case 'alterar_atributo':
      return `${efeito.atributo} ${formatarDelta(efeito.delta)}.`;
    case 'alterar_dinheiro':
      return `Dinheiro ${formatarDelta(efeito.delta)}.`;
    case 'alterar_humor':
      return `Humor ${formatarDelta(efeito.delta)}.`;
    case 'alterar_saude':
      return `Saude ${formatarDelta(efeito.delta)}.`;
    case 'mudar_profissao':
      return `Profissao alterada para ${efeito.profissao}.`;
    case 'aplicar_status':
      return `Status aplicado: ${efeito.status}.`;
    case 'disparar_evento':
      return `Evento preparado: ${efeito.eventoId}.`;
    case 'alterar_relacionamento':
    case 'matar_npc':
    case 'adicionar_flag':
    case 'remover_flag':
      return undefined;
  }
}

function gerarLogsDeConsequencias(
  acao: ActionDefinition,
  desfecho: DesfechoAcao,
  efeitos: readonly Effect[],
  contexto: ContextoDeAcao,
): LogEntry[] {
  return efeitos.flatMap((efeito) => {
    const texto = textoConsequencia(efeito);
    if (texto === undefined) return [];

    return [{
      id: crypto.randomUUID(),
      camada: 'consequencia' as const,
      timestamp: Date.now(),
      anoJogo: contexto.anoJogo,
      mesJogo: contexto.mesJogo,
      texto,
      npcIds: contexto.npcAlvo !== undefined ? [contexto.npcAlvo.npcId] : undefined,
      localId: contexto.localId,
      tags: [acao.id, desfecho, efeito.tipo],
    }];
  });
}

function processarEventHooks(
  hooks: ActionDefinition['eventHooks'],
  desfecho: DesfechoAcao,
): string[] {
  if (hooks === undefined) return [];

  const acertou =
    desfecho === 'sucesso' ||
    desfecho === 'critico_sucesso' ||
    desfecho === 'direto';

  return hooks
    .filter(h =>
      h.condicao === 'always' ||
      (h.condicao === 'onSuccess' && acertou) ||
      (h.condicao === 'onFailure' && !acertou),
    )
    .filter(h => Math.random() < h.chance)
    .map(h => h.eventoId);
}

export function configurarObservadorResultadoAcao(
  observador: ObservadorResultadoAcao | undefined,
): void {
  observadorResultadoAcao = observador;
}

export function resolverAcao(
  acao: ActionDefinition,
  contexto: ContextoDeAcao,
): ResultadoDeAcao {
  if (acao.requisitos !== undefined && !avaliarPredicado(acao.requisitos, contexto.estado)) {
    throw new AcaoNaoPermitidaError(acao.id);
  }

  interactionLock.travar();

  try {
    let desfecho: DesfechoAcao;
    let rollValor: number | undefined;

    if (acao.resolutionMode === 'direct') {
      desfecho = 'direto';
    } else {
      const check = acao.check!;
      const valorAtributo = contexto.estado.atributos[check.atributo] ?? 10;
      const resultado = rolarD20ComModificador(valorAtributo, check.dc);
      rollValor = resultado.total;

      if (resultado.falhaGrave) {
        desfecho = 'critico_falha';
      } else if (resultado.critico) {
        desfecho = 'critico_sucesso';
      } else if (resultado.passou) {
        desfecho = 'sucesso';
      } else {
        desfecho = 'falha';
      }
    }

    const efeitosAcao = coletarEfeitosPorDesfecho(acao, desfecho);
    const efeitosProgressao: Effect[] = [];
    const progressoAtualizado: Record<string, number> = {};

    if (acao.progression !== undefined) {
      const { estadoAtualizado, limiarAtingido } = registrarProgressao(
        contexto.progressao,
        acao.progression.contadorId,
        1,
        acao.progression,
      );

      progressoAtualizado[acao.progression.contadorId] =
        estadoAtualizado.contadores[acao.progression.contadorId] ?? 0;

      if (limiarAtingido) {
        efeitosProgressao.push(...acao.progression.efeito);
      }
    }

    const efeitosAplicados = [...(acao.custos ?? []), ...efeitosAcao, ...efeitosProgressao];
    const resultado: ResultadoDeAcao = {
      desfecho,
      rollValor,
      efeitosAplicados,
      logsGerados: [
        ...gerarLogsDeAcao(acao, desfecho, contexto),
        ...gerarLogsDeConsequencias(acao, desfecho, efeitosAplicados, contexto),
      ],
      eventosDisparados: processarEventHooks(acao.eventHooks, desfecho),
      progressoAtualizado,
    };

    registrarResultadoNoLog(resultado);
    observadorResultadoAcao?.(resultado, acao, contexto);

    return resultado;
  } finally {
    interactionLock.destravar();
  }
}
