import type { EstadoDeJogo } from './EstadoDeJogo';
import type { SaveSlot } from '../schemas/save';
import { salvarParaEstadoDeJogo } from './EstadoDeJogo';
import { evaluarPredicado, type Predicado } from './PredicateEvaluator';

type FaseDaVida = 'infancia' | 'adolescencia' | 'jovem_adulto' | 'adulto';

export type Evento = {
  readonly id?: string;
  readonly eventoId?: string;
  readonly faseDaVida?: string;
  readonly condicao?: Predicado;
  readonly triggers?: {
    readonly uniqueOnce?: boolean;
    readonly cooldownMeses?: number;
    readonly idadeRange?: readonly [number, number];
    readonly requisitos?: Predicado;
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

function obterEventoId(evento: { readonly id?: string; readonly eventoId?: string }): string {
  return evento.id ?? evento.eventoId ?? '';
}

function eventoPassaUniqueOnce(evento: Evento, estadoAtual: EstadoDeJogo): boolean {
  if (evento.triggers?.uniqueOnce !== true) return true;

  return !estadoAtual.flags.includes(`viu_${obterEventoId(evento)}`);
}

function eventoPassaCooldown(
  evento: Evento,
  estadoAtual: EstadoDeJogo,
): boolean {
  // 1. Se uniqueOnce for true, verifica se o evento já foi visto via flags
  if (evento.triggers?.uniqueOnce === true) {
    if (estadoAtual.flags.includes(`viu_${obterEventoId(evento)}`)) {
      return false;
    }
  }

  // 2. Se cooldownMeses for maior que zero, verifica se o anoExpiracao no cooldownRegistry já passou
  if (evento.triggers?.cooldownMeses !== undefined && evento.triggers.cooldownMeses > 0) {
    const anoExpiracao = estadoAtual.cooldownRegistry[obterEventoId(evento)];
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
  const predicado = evento.condicao ?? evento.triggers?.requisitos;
  return predicado === undefined || evaluarPredicado(predicado, estadoAtual);
}

function eventoPassaIdadeRange(evento: Evento, estadoAtual: EstadoDeJogo): boolean {
  if (evento.triggers?.idadeRange === undefined) return true;

  const idadeAtual = calcularIdade(estadoAtual);
  const [idadeMinima, idadeMaxima] = evento.triggers.idadeRange;
  return idadeAtual >= idadeMinima && idadeAtual <= idadeMaxima;
}

export function filtrarEventosElegiveis<TEvento extends Evento>(
  todosEventos: readonly TEvento[],
  estadoAtual: EstadoDeJogo,
): readonly TEvento[] {
  const faseAtual = resolverFaseDaVida(calcularIdade(estadoAtual));

  return todosEventos.filter(evento => {
    if (!eventoPassaUniqueOnce(evento, estadoAtual)) return false;
    if (!eventoPassaCooldown(evento, estadoAtual)) return false;
    if (!eventoPassaIdadeRange(evento, estadoAtual)) return false;
    if (!eventoPassaFaseDaVida(evento, faseAtual)) return false;
    if (!eventoPassaCondicao(evento, estadoAtual)) return false;

    return true;
  });
}

type ParametroSorteio = SaveSlot | (() => number);

function ehGeradorAleatorio(valor: ParametroSorteio | undefined): valor is () => number {
  return typeof valor === 'function';
}

export function sortearEvento<TEvento extends EventoSorteavel>(
  eventos: readonly TEvento[],
  saveOuAleatorio?: ParametroSorteio,
  aleatorio: () => number = Math.random,
): TEvento | undefined {
  const geradorAleatorio = ehGeradorAleatorio(saveOuAleatorio) ? saveOuAleatorio : aleatorio;
  const eventosFiltrados = saveOuAleatorio !== undefined && !ehGeradorAleatorio(saveOuAleatorio)
    ? filtrarEventosElegiveis(eventos, salvarParaEstadoDeJogo(saveOuAleatorio, saveOuAleatorio.estadoMundo.anoAtual))
    : eventos;

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
