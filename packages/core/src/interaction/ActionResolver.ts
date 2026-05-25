import type { ActionDefinition } from '../schemas/action';
import type { Effect } from '../schemas/effect';
import type { EstadoDeJogo } from '../events/EstadoDeJogo';
import type { Npc } from '../schemas/npc';
import type { LogEntry, LogCamadaEnum } from '../log/LifeLog';
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

  if (texto === undefined) return [];

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
    texto,
    npcIds: contexto.npcAlvo !== undefined ? [contexto.npcAlvo.npcId] : undefined,
    localId: contexto.localId,
    tags: [acao.id, desfecho],
  }];
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

    return {
      desfecho,
      rollValor,
      efeitosAplicados: [...(acao.custos ?? []), ...efeitosAcao, ...efeitosProgressao],
      logsGerados: gerarLogsDeAcao(acao, desfecho, contexto),
      eventosDisparados: processarEventHooks(acao.eventHooks, desfecho),
      progressoAtualizado,
    };
  } finally {
    interactionLock.destravar();
  }
}
