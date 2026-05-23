import type { EstadoDeJogo } from './EstadoDeJogo';

type Predicado = unknown;
type Efeito = unknown;

type Choice = {
  readonly texto: string;
  readonly efeitos: readonly Efeito[];
  readonly condicao?: Predicado;
  readonly eventoId?: string;
  readonly cooldownMeses?: number;
};

const VALOR_MINIMO_PERCENTUAL = 0;
const VALOR_MAXIMO_PERCENTUAL = 100;
const MESES_POR_ANO = 12;

function limitarPercentual(valor: number): number {
  return Math.min(VALOR_MAXIMO_PERCENTUAL, Math.max(VALOR_MINIMO_PERCENTUAL, valor));
}

function obterNumero(valor: unknown): number {
  return typeof valor === 'number' ? valor : 0;
}

function calcularAnoExpiracao(anoAtual: number, cooldownMeses: number): number {
  return anoAtual + Math.ceil(cooldownMeses / MESES_POR_ANO);
}

function ehObjeto(valor: unknown): valor is Readonly<Record<string, unknown>> {
  return typeof valor === 'object' && Boolean(valor);
}

function ehEfeitoComDelta(
  efeito: Efeito,
  tipo: string,
): efeito is Readonly<Record<string, unknown>> & { readonly delta: number } {
  return ehObjeto(efeito) && efeito.tipo === tipo && typeof efeito.delta === 'number';
}

function ehEfeitoAtributo(
  efeito: Efeito,
): efeito is Readonly<Record<string, unknown>> & { readonly atributo: string; readonly delta: number } {
  return (
    ehObjeto(efeito) &&
    efeito.tipo === 'atributo' &&
    typeof efeito.atributo === 'string' &&
    typeof efeito.delta === 'number'
  );
}

function ehEfeitoCooldown(
  efeito: Efeito,
): efeito is Readonly<Record<string, unknown>> & { readonly eventoId: string; readonly anoExpiracao: number } {
  return (
    ehObjeto(efeito) &&
    efeito.tipo === 'cooldown' &&
    typeof efeito.eventoId === 'string' &&
    typeof efeito.anoExpiracao === 'number'
  );
}

function aplicarEfeito(estadoAtual: EstadoDeJogo, efeito: Efeito): EstadoDeJogo {
  if (ehEfeitoComDelta(efeito, 'humor')) {
    return {
      ...estadoAtual,
      humor: limitarPercentual(estadoAtual.humor + efeito.delta),
    };
  }

  if (ehEfeitoComDelta(efeito, 'saude')) {
    return {
      ...estadoAtual,
      saude: limitarPercentual(estadoAtual.saude + efeito.delta),
    };
  }

  if (ehEfeitoComDelta(efeito, 'dinheiro')) {
    return {
      ...estadoAtual,
      dinheiro: estadoAtual.dinheiro + efeito.delta,
    };
  }

  if (ehEfeitoAtributo(efeito)) {
    return {
      ...estadoAtual,
      atributos: {
        ...estadoAtual.atributos,
        [efeito.atributo]: obterNumero(estadoAtual.atributos[efeito.atributo]) + efeito.delta,
      },
    };
  }

  if (ehEfeitoCooldown(efeito)) {
    return {
      ...estadoAtual,
      cooldownRegistry: {
        ...estadoAtual.cooldownRegistry,
        [efeito.eventoId]: efeito.anoExpiracao,
      },
    };
  }

  return estadoAtual;
}

function aplicarCooldownDaEscolha(
  escolha: Choice,
  estadoAtual: EstadoDeJogo,
): EstadoDeJogo {
  if (escolha.eventoId === undefined || escolha.cooldownMeses === undefined || escolha.cooldownMeses <= 0) {
    return estadoAtual;
  }

  return {
    ...estadoAtual,
    cooldownRegistry: {
      ...estadoAtual.cooldownRegistry,
      [escolha.eventoId]: calcularAnoExpiracao(estadoAtual.anoAtual, escolha.cooldownMeses),
    },
  };
}

export function resolverEscolha(
  escolha: Choice,
  estadoAtual: EstadoDeJogo,
): EstadoDeJogo {
  const estadoComEfeitos = escolha.efeitos.reduce<EstadoDeJogo>(aplicarEfeito, estadoAtual);

  return aplicarCooldownDaEscolha(escolha, estadoComEfeitos);
}
