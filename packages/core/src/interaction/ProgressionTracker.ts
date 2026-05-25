import type { ProgressionRule } from '../schemas/action';

export type EstadoProgressao = {
  readonly contadores: Readonly<Record<string, number>>;
  readonly marcadores: Readonly<Record<string, boolean>>;
  readonly ultimoReset: Readonly<Record<string, number>>;
};

export function criarEstadoProgressaoVazio(): EstadoProgressao {
  return { contadores: {}, marcadores: {}, ultimoReset: {} };
}

export function registrarProgressao(
  estado: EstadoProgressao,
  contadorId: string,
  delta: number,
  regra: ProgressionRule,
): { estadoAtualizado: EstadoProgressao; limiarAtingido: boolean } {
  const valorAtual = estado.contadores[contadorId] ?? 0;
  const novoValor = valorAtual + delta;
  const limiarAtingido = novoValor >= regra.limiar;

  return {
    estadoAtualizado: {
      ...estado,
      contadores: {
        ...estado.contadores,
        [contadorId]: limiarAtingido ? 0 : novoValor,
      },
    },
    limiarAtingido,
  };
}

export function resetarContadoresPorPeriodo(
  estado: EstadoProgressao,
  _periodo: ProgressionRule['periodoReset'],
): EstadoProgressao {
  const agora = Date.now();
  const idsContadores = Object.keys(estado.contadores);

  return {
    ...estado,
    contadores: Object.fromEntries(idsContadores.map(id => [id, 0])),
    ultimoReset: {
      ...estado.ultimoReset,
      ...Object.fromEntries(idsContadores.map(id => [id, agora])),
    },
  };
}
