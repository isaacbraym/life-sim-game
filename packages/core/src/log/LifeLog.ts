import { z } from 'zod';
import { db, type EntradaLifeLog } from '../persistence/GameDB';

export const LogCamadaEnum = z.enum([
  'feedback',
  'acao_simples',
  'consequencia',
  'evento_importante',
  'resumo_periodico',
]);
export type LogCamadaEnum = z.infer<typeof LogCamadaEnum>;

export const LogEntrySchema = z.object({
  id: z.string(),
  camada: LogCamadaEnum,
  timestamp: z.number(),
  anoJogo: z.number().int(),
  mesJogo: z.number().int().min(1).max(12),
  texto: z.string(),
  npcIds: z.array(z.string()).optional(),
  localId: z.string().optional(),
  tags: z.array(z.string()),
});
export type LogEntry = z.infer<typeof LogEntrySchema>;

function serializarEntradaLog(saveId: string, entrada: LogEntry): Omit<EntradaLifeLog, 'id'> {
  return {
    saveId,
    logId: entrada.id,
    camada: entrada.camada,
    timestamp: entrada.timestamp,
    anoJogo: entrada.anoJogo,
    mesJogo: entrada.mesJogo,
    texto: entrada.texto,
    npcIds: entrada.npcIds,
    localId: entrada.localId,
    tags: entrada.tags,
  };
}

function desserializarEntradaLog(entrada: EntradaLifeLog): LogEntry {
  const logEntry: LogEntry = {
    id: entrada.logId,
    camada: entrada.camada,
    timestamp: entrada.timestamp,
    anoJogo: entrada.anoJogo,
    mesJogo: entrada.mesJogo,
    texto: entrada.texto,
    tags: entrada.tags,
  };

  if (entrada.npcIds !== undefined) {
    logEntry.npcIds = entrada.npcIds;
  }

  if (entrada.localId !== undefined) {
    logEntry.localId = entrada.localId;
  }

  return logEntry;
}

type OuvinteLifeLogSessao = (entradas: readonly LogEntry[]) => void;

const entradasSessao: LogEntry[] = [];
const ouvintesSessao = new Set<OuvinteLifeLogSessao>();

export type LifeLog = {
  adicionarEntrada(entrada: Omit<LogEntry, 'id' | 'timestamp'>): void;
  buscarPorCamada(camada: LogCamadaEnum, limite?: number): readonly LogEntry[];
  buscarPorPeriodo(anoInicio: number, anoFim: number): readonly LogEntry[];
  gerarResumoPeriodico(anoInicio: number, anoFim: number): string;
};

export function criarLifeLog(): LifeLog {
  const entradas: LogEntry[] = [];

  return {
    adicionarEntrada(entrada) {
      entradas.push({
        ...entrada,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      });
    },

    buscarPorCamada(camada, limite) {
      const filtradas = entradas.filter(e => e.camada === camada);
      return limite !== undefined ? filtradas.slice(-limite) : filtradas;
    },

    buscarPorPeriodo(anoInicio, anoFim) {
      return entradas.filter(e => e.anoJogo >= anoInicio && e.anoJogo <= anoFim);
    },

    gerarResumoPeriodico(anoInicio, anoFim) {
      const periodo = entradas.filter(e => e.anoJogo >= anoInicio && e.anoJogo <= anoFim);
      const contAcoes = periodo.filter(e => e.camada === 'acao_simples').length;
      const contEventos = periodo.filter(e => e.camada === 'evento_importante').length;
      const partes: string[] = [];
      if (contAcoes > 0) partes.push(`${contAcoes} ações registradas`);
      if (contEventos > 0) partes.push(`${contEventos} eventos importantes`);
      return partes.length > 0
        ? `Período ${anoInicio}–${anoFim}: ${partes.join(', ')}.`
        : `Período ${anoInicio}–${anoFim}: sem registros.`;
    },
  };
}

export async function persistirEntradaLog(saveId: string, entrada: LogEntry): Promise<void> {
  try {
    await db.lifeLog.add(serializarEntradaLog(saveId, entrada));
  } catch (erro) {
    console.warn('Falha ao persistir entrada do LifeLog.', erro);
  }
}

export async function carregarEntradasLog(
  saveId: string,
  limite?: number,
): Promise<readonly LogEntry[]> {
  if (limite !== undefined && limite <= 0) {
    return [];
  }

  try {
    const consulta = db.lifeLog.where('saveId').equals(saveId);
    const entradas = limite !== undefined
      ? await consulta.reverse().limit(limite).sortBy('timestamp')
      : await consulta.sortBy('timestamp');

    return entradas.map(desserializarEntradaLog);
  } catch (erro) {
    console.warn('Falha ao carregar entradas do LifeLog.', erro);
    return [];
  }
}

export async function gerarResumoPeriodico(
  saveId: string,
  anoInicio: number,
  anoFim: number,
): Promise<string> {
  try {
    const periodo = await db.lifeLog
      .where('saveId')
      .equals(saveId)
      .and(entrada => entrada.anoJogo >= anoInicio && entrada.anoJogo <= anoFim)
      .toArray();

    if (periodo.length === 0) {
      return `Período ${anoInicio}–${anoFim}: sem registros.`;
    }

    const totalAcoes = periodo.filter(entrada => entrada.camada === 'acao_simples').length;
    const totalEventos = periodo.filter(entrada => entrada.camada === 'evento_importante').length;
    const totalConsequencias = periodo.filter(entrada => entrada.camada === 'consequencia').length;

    return `Período ${anoInicio}–${anoFim}: ${totalAcoes} ações, ${totalEventos} eventos importantes, ${totalConsequencias} consequências.`;
  } catch (erro) {
    console.warn('Falha ao gerar resumo periódico do LifeLog.', erro);
    return `Período ${anoInicio}–${anoFim}: sem registros.`;
  }
}

export function obterEntradasSessaoLifeLog(): readonly LogEntry[] {
  return entradasSessao;
}

export function adicionarEntradasSessaoLifeLog(entradas: readonly LogEntry[]): void {
  if (entradas.length === 0) return;

  entradasSessao.push(...entradas);

  for (const ouvinte of ouvintesSessao) {
    ouvinte(entradasSessao);
  }
}

export function assinarLifeLogSessao(ouvinte: OuvinteLifeLogSessao): () => void {
  ouvintesSessao.add(ouvinte);
  ouvinte(entradasSessao);

  return () => {
    ouvintesSessao.delete(ouvinte);
  };
}

export function registrarResultadoNoLog(resultado: {
  readonly logsGerados: readonly LogEntry[];
}): void {
  adicionarEntradasSessaoLifeLog(resultado.logsGerados);
}
