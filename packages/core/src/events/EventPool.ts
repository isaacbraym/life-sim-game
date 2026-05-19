import type { Event } from '../schemas/event';
import { avaliarPredicado } from './PredicateEvaluator';
import type { GameState } from './PredicateEvaluator';

// ---------------------------------------------------------------------------
// Tipos auxiliares
// ---------------------------------------------------------------------------

export type EventoCarregado = Event & {
  readonly runtimeId: string;
};

export interface FiltroEventosParams {
  readonly eventos: readonly Event[];
  readonly estado: GameState;
  readonly idadeAtualAnos: number;
  readonly flagsDisparadas: readonly string[];
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/**
 * Retorna true se o cooldown do evento já expirou (ou nunca foi disparado).
 * Compara em meses para alinhar com a unidade canônica de tempo (idadeAtualMeses).
 */
function eventoPassaCooldown(evento: Event, estado: GameState): boolean {
  const { cooldownMeses, uniqueOnce } = evento.triggers;

  if (uniqueOnce) {
    return !estado.personagem.eventosVividos.includes(evento.eventoId);
  }

  if (cooldownMeses > 0) {
    const foiDisparado = estado.personagem.eventosVividos.includes(evento.eventoId);
    if (!foiDisparado) return true;

    const mesAtual = estado.personagem.idadeAtualMeses;
    const mesUltimoDisparo = estado.cooldownRegistry[evento.eventoId];
    if (mesUltimoDisparo === undefined) return true;

    return mesAtual - mesUltimoDisparo >= cooldownMeses;
  }

  return true;
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

export function filtrarEventosElegiveis(params: FiltroEventosParams): Event[] {
  const { eventos, estado, idadeAtualAnos } = params;

  return eventos.filter(evento => {
    const { idadeRange, requisitos } = evento.triggers;

    if (idadeRange !== undefined) {
      const [minAnos, maxAnos] = idadeRange;
      if (idadeAtualAnos < minAnos || idadeAtualAnos > maxAnos) return false;
    }

    if (!eventoPassaCooldown(evento, estado)) return false;

    if (requisitos !== undefined) {
      if (!avaliarPredicado(requisitos, estado)) return false;
    }

    return true;
  });
}

export function sortearEvento(
  eventosFiltrados: readonly Event[],
  rng: () => number = Math.random,
): Event | undefined {
  if (eventosFiltrados.length === 0) return undefined;

  const totalPeso = eventosFiltrados.reduce((soma, ev) => soma + ev.triggers.peso, 0);
  const pontoAleatorio = rng() * totalPeso;

  let acumulado = 0;
  for (const evento of eventosFiltrados) {
    acumulado += evento.triggers.peso;
    if (pontoAleatorio <= acumulado) return evento;
  }

  return eventosFiltrados[eventosFiltrados.length - 1];
}