import { Event } from '../schemas/event';
import { avaliarPredicado, GameState } from './PredicateEvaluator';

export type EventoCarregado = Event & {
  runtimeId: string;
};

export interface FiltroEventosParams {
  eventos: Event[];
  estado: GameState;
  idadeAtualAnos: number;
  flagsDisparadas: string[];
}

function eventoPassaCooldown(evento: Event, flags: string[]): boolean {
  if (evento.triggers.uniqueOnce) {
    const jaDisparou = flags.some(f => f.startsWith(`evento_unico_${evento.eventoId}`));
    if (jaDisparou) return false;
  }
  // Cooldown simplificado omitido
  return true;
}

export function filtrarEventosElegiveis(params: FiltroEventosParams): Event[] {
  const { eventos, estado, idadeAtualAnos, flagsDisparadas } = params;

  return eventos.filter(evento => {
    const triggers = evento.triggers;
    
    if (triggers.idadeRange) {
      if (idadeAtualAnos < triggers.idadeRange[0] || idadeAtualAnos > triggers.idadeRange[1]) {
        return false;
      }
    }

    if (!eventoPassaCooldown(evento, flagsDisparadas)) {
      return false;
    }

    if (triggers.requisitos) {
      const passaReq = avaliarPredicado(triggers.requisitos, estado);
      if (!passaReq) return false;
    }

    return true;
  });
}

export function sortearEvento(eventosFiltrados: Event[], rng?: () => number): Event | null {
  if (eventosFiltrados.length === 0) return null;

  const totalPeso = eventosFiltrados.reduce((sum, ev) => sum + ev.triggers.peso, 0);
  const r = (rng ? rng() : Math.random()) * totalPeso;
  
  let acumulado = 0;
  for (const evento of eventosFiltrados) {
    acumulado += evento.triggers.peso;
    if (r <= acumulado) {
      return evento;
    }
  }

  return eventosFiltrados[eventosFiltrados.length - 1];
}
