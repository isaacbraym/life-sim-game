import { evaluarPredicado, type GameState, type Predicado } from './PredicateEvaluator';

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

function calcularIdade(estadoAtual: GameState, anoAtual: number): number {
  return anoAtual - estadoAtual.anoNascimento;
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

function eventoPassaUniqueOnce(evento: Evento, estadoAtual: GameState): boolean {
  if (evento.triggers?.uniqueOnce !== true) return true;

  return !registroExiste(estadoAtual.cooldownRegistry, evento.id);
}

function eventoPassaCooldown(evento: Evento, estadoAtual: GameState, anoAtual: number): boolean {
  const anoExpiracao = estadoAtual.cooldownRegistry[evento.id];

  return anoExpiracao === undefined || anoExpiracao <= anoAtual;
}

function eventoPassaFaseDaVida(evento: Evento, faseAtual: FaseDaVida): boolean {
  return evento.faseDaVida === undefined || evento.faseDaVida === faseAtual;
}

function eventoPassaCondicao(evento: Evento, estadoAtual: GameState, anoAtual: number): boolean {
  return evento.condicao === undefined || evaluarPredicado(evento.condicao, estadoAtual, anoAtual);
}

export function filtrarEventosElegiveis(
  todosEventos: readonly Evento[],
  estadoAtual: GameState,
  anoAtual: number,
): readonly Evento[] {
  const faseAtual = resolverFaseDaVida(calcularIdade(estadoAtual, anoAtual));

  return todosEventos.filter(evento => {
    if (!eventoPassaUniqueOnce(evento, estadoAtual)) return false;
    if (!eventoPassaCooldown(evento, estadoAtual, anoAtual)) return false;
    if (!eventoPassaFaseDaVida(evento, faseAtual)) return false;
    if (!eventoPassaCondicao(evento, estadoAtual, anoAtual)) return false;

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
