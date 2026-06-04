import { z } from 'zod';

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
