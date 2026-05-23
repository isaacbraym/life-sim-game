type Predicado = unknown;

type EfeitoHumor = {
  readonly tipo: 'humor';
  readonly delta: number;
};

type EfeitoSaude = {
  readonly tipo: 'saude';
  readonly delta: number;
};

type EfeitoDinheiro = {
  readonly tipo: 'dinheiro';
  readonly delta: number;
};

type EfeitoAtributo = {
  readonly tipo: 'atributo';
  readonly atributo: string;
  readonly delta: number;
};

type EfeitoCooldown = {
  readonly tipo: 'cooldown';
  readonly eventoId: string;
  readonly anoExpiracao: number;
};

type EfeitoConhecido =
  | EfeitoHumor
  | EfeitoSaude
  | EfeitoDinheiro
  | EfeitoAtributo
  | EfeitoCooldown;

type Efeito = EfeitoConhecido | unknown;

type Choice = {
  readonly texto: string;
  readonly efeitos: readonly Efeito[];
  readonly condicao?: Predicado;
  readonly eventoId?: string;
  readonly cooldownMeses?: number;
};

type GameState = {
  readonly cooldownRegistry: Readonly<Record<string, number>>;
  readonly humor?: number;
  readonly saude?: number;
  readonly dinheiro?: number;
  readonly atributos?: Readonly<Record<string, number>>;
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

function ehEfeitoHumor(efeito: Efeito): efeito is EfeitoHumor {
  return ehObjeto(efeito) && efeito.tipo === 'humor' && typeof efeito.delta === 'number';
}

function ehEfeitoSaude(efeito: Efeito): efeito is EfeitoSaude {
  return ehObjeto(efeito) && efeito.tipo === 'saude' && typeof efeito.delta === 'number';
}

function ehEfeitoDinheiro(efeito: Efeito): efeito is EfeitoDinheiro {
  return ehObjeto(efeito) && efeito.tipo === 'dinheiro' && typeof efeito.delta === 'number';
}

function ehEfeitoAtributo(efeito: Efeito): efeito is EfeitoAtributo {
  return (
    ehObjeto(efeito) &&
    efeito.tipo === 'atributo' &&
    typeof efeito.atributo === 'string' &&
    typeof efeito.delta === 'number'
  );
}

function ehEfeitoCooldown(efeito: Efeito): efeito is EfeitoCooldown {
  return (
    ehObjeto(efeito) &&
    efeito.tipo === 'cooldown' &&
    typeof efeito.eventoId === 'string' &&
    typeof efeito.anoExpiracao === 'number'
  );
}

function aplicarEfeito(estadoAtual: GameState, efeito: Efeito): GameState {
  if (ehEfeitoHumor(efeito)) {
    return {
      ...estadoAtual,
      humor: limitarPercentual(obterNumero(estadoAtual.humor) + efeito.delta),
    };
  }

  if (ehEfeitoSaude(efeito)) {
    return {
      ...estadoAtual,
      saude: limitarPercentual(obterNumero(estadoAtual.saude) + efeito.delta),
    };
  }

  if (ehEfeitoDinheiro(efeito)) {
    return {
      ...estadoAtual,
      dinheiro: obterNumero(estadoAtual.dinheiro) + efeito.delta,
    };
  }

  if (ehEfeitoAtributo(efeito)) {
    return {
      ...estadoAtual,
      atributos: {
        ...estadoAtual.atributos,
        [efeito.atributo]: obterNumero(estadoAtual.atributos?.[efeito.atributo]) + efeito.delta,
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
  estadoAtual: GameState,
  anoAtual: number,
): GameState {
  if (escolha.eventoId === undefined || escolha.cooldownMeses === undefined || escolha.cooldownMeses <= 0) {
    return estadoAtual;
  }

  return {
    ...estadoAtual,
    cooldownRegistry: {
      ...estadoAtual.cooldownRegistry,
      [escolha.eventoId]: calcularAnoExpiracao(anoAtual, escolha.cooldownMeses),
    },
  };
}

export function resolverEscolha(
  escolha: Choice,
  estadoAtual: GameState,
  anoAtual: number,
): GameState {
  const estadoComEfeitos = escolha.efeitos.reduce<GameState>(aplicarEfeito, estadoAtual);

  return aplicarCooldownDaEscolha(escolha, estadoComEfeitos, anoAtual);
}
