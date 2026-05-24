import type { EstadoDeJogo } from './EstadoDeJogo';
import { evaluarPredicado, type Predicado } from './PredicateEvaluator';

type FaseDaVida = 'infancia' | 'adolescencia' | 'jovem_adulto' | 'adulto';

export type Evento = {
  readonly id: string;
  readonly faseDaVida?: string;
  readonly condicao?: Predicado;
  readonly triggers?: {
    readonly uniqueOnce?: boolean;
    readonly cooldownMeses?: number;
  };
};

type EventoSorteavel = Evento & {
  readonly triggers?: Evento['triggers'] & {
    readonly peso?: number;
  };
};

function calcularIdade(estadoAtual: EstadoDeJogo): number {
  return estadoAtual.anoAtual - estadoAtual.anoNascimento;
}

function resolverFaseDaVida(idadeAtual: number): FaseDaVida {
  if (idadeAtual <= 12) return 'infancia';
  if (idadeAtual <= 17) return 'adolescencia';
  if (idadeAtual <= 24) return 'jovem_adulto';

  return 'adulto';
}

function registroExiste(registro: Readonly<Record<string, number>>, chave: string): boolean {
  return Object.prototype.hasOwnProperty.call(registro, chave);
}

function eventoPassaUniqueOnce(evento: Evento, estadoAtual: EstadoDeJogo): boolean {
  if (evento.triggers?.uniqueOnce !== true) return true;

  return !estadoAtual.flags.includes(`viu_${evento.id}`);
}

function eventoPassaCooldown(
  evento: Evento,
  estadoAtual: EstadoDeJogo,
): boolean {
  // 1. Se uniqueOnce for true, verifica se o evento já foi visto via flags
  if (evento.triggers?.uniqueOnce === true) {
    if (estadoAtual.flags.includes(`viu_${evento.id}`)) {
      return false;
    }
  }

  // 2. Se cooldownMeses for maior que zero, verifica se o anoExpiracao no cooldownRegistry já passou
  if (evento.triggers?.cooldownMeses !== undefined && evento.triggers.cooldownMeses > 0) {
    const anoExpiracao = estadoAtual.cooldownRegistry[evento.id];
    if (anoExpiracao !== undefined && estadoAtual.anoAtual < anoExpiracao) {
      return false;
    }
  }

  return true;
}

function eventoPassaFaseDaVida(evento: Evento, faseAtual: FaseDaVida): boolean {
  return evento.faseDaVida === undefined || evento.faseDaVida === faseAtual;
}

function eventoPassaCondicao(evento: Evento, estadoAtual: EstadoDeJogo): boolean {
  return evento.condicao === undefined || evaluarPredicado(evento.condicao, estadoAtual);
}

export function filtrarEventosElegiveis(
  todosEventos: readonly Evento[],
  estadoAtual: EstadoDeJogo,
): readonly Evento[] {
  const faseAtual = resolverFaseDaVida(calcularIdade(estadoAtual));

  return todosEventos.filter(evento => {
    if (!eventoPassaUniqueOnce(evento, estadoAtual)) return false;
    if (!eventoPassaCooldown(evento, estadoAtual)) return false;
    if (!eventoPassaFaseDaVida(evento, faseAtual)) return false;
    if (!eventoPassaCondicao(evento, estadoAtual)) return false;

    return true;
  });
}

export function sortearEvento(
  eventosFiltrados: readonly EventoSorteavel[],
  geradorAleatorio: () => number = Math.random,
): EventoSorteavel | undefined {
  if (eventosFiltrados.length === 0) return undefined;

  const totalPeso = eventosFiltrados.reduce(
    (soma, evento) => soma + (evento.triggers?.peso ?? 1),
    0,
  );
  const pontoAleatorio = geradorAleatorio() * totalPeso;

  let acumulado = 0;
  for (const evento of eventosFiltrados) {
    acumulado += evento.triggers?.peso ?? 1;
    if (pontoAleatorio <= acumulado) return evento;
  }

  return eventosFiltrados.at(-1);
}
