export type GameState = {
  readonly anoNascimento: number;
  readonly humor: number;
  readonly saude: number;
  readonly atributos: Readonly<Record<string, number>>;
  readonly flags: readonly string[];
  readonly cooldownRegistry: Readonly<Record<string, number>>;
};

export type Predicado = unknown;

type ObjetoPredicado = Readonly<Record<string, unknown>>;

type PredicadoComValor = ObjetoPredicado & {
  readonly valor: number;
};

type PredicadoComAtributo = PredicadoComValor & {
  readonly atributo: string;
};

type PredicadoComFlag = ObjetoPredicado & {
  readonly flag: string;
};

type PredicadoComLista = ObjetoPredicado & {
  readonly predicados: readonly Predicado[];
};

type PredicadoComFilho = ObjetoPredicado & {
  readonly predicado: Predicado;
};

function ehObjetoPredicado(predicado: Predicado): predicado is ObjetoPredicado {
  return typeof predicado === 'object' && Boolean(predicado);
}

function ehPredicadoComValor(predicado: Predicado): predicado is PredicadoComValor {
  return ehObjetoPredicado(predicado) && typeof predicado.valor === 'number';
}

function ehPredicadoComAtributo(predicado: Predicado): predicado is PredicadoComAtributo {
  return ehPredicadoComValor(predicado) && typeof predicado.atributo === 'string';
}

function ehPredicadoComFlag(predicado: Predicado): predicado is PredicadoComFlag {
  return ehObjetoPredicado(predicado) && typeof predicado.flag === 'string';
}

function ehPredicadoComLista(predicado: Predicado): predicado is PredicadoComLista {
  return ehObjetoPredicado(predicado) && Array.isArray(predicado.predicados);
}

function ehPredicadoComFilho(predicado: Predicado): predicado is PredicadoComFilho {
  return ehObjetoPredicado(predicado) && predicado.predicado !== undefined;
}

function calcularIdade(estadoAtual: GameState, anoAtual: number): number {
  return anoAtual - estadoAtual.anoNascimento;
}

export function evaluarPredicado(
  predicado: Predicado,
  estadoAtual: GameState,
  anoAtual: number,
): boolean {
  if (!ehObjetoPredicado(predicado) || typeof predicado.tipo !== 'string') {
    return true;
  }

  switch (predicado.tipo) {
    case 'idade_min':
      return ehPredicadoComValor(predicado) && calcularIdade(estadoAtual, anoAtual) >= predicado.valor;

    case 'idade_max':
      return ehPredicadoComValor(predicado) && calcularIdade(estadoAtual, anoAtual) <= predicado.valor;

    case 'atributo_min': {
      if (!ehPredicadoComAtributo(predicado)) return false;

      const valorAtributo = estadoAtual.atributos[predicado.atributo];
      return valorAtributo !== undefined && valorAtributo >= predicado.valor;
    }

    case 'atributo_max': {
      if (!ehPredicadoComAtributo(predicado)) return false;

      const valorAtributo = estadoAtual.atributos[predicado.atributo];
      return valorAtributo !== undefined && valorAtributo <= predicado.valor;
    }

    case 'humor_min':
      return ehPredicadoComValor(predicado) && estadoAtual.humor >= predicado.valor;

    case 'saude_min':
      return ehPredicadoComValor(predicado) && estadoAtual.saude >= predicado.valor;

    case 'flag_ativo':
      return ehPredicadoComFlag(predicado) && estadoAtual.flags.includes(predicado.flag);

    case 'flag_ausente':
      return ehPredicadoComFlag(predicado) && !estadoAtual.flags.includes(predicado.flag);

    case 'and':
      return (
        ehPredicadoComLista(predicado) &&
        predicado.predicados.every(predicadoInterno =>
          evaluarPredicado(predicadoInterno, estadoAtual, anoAtual),
        )
      );

    case 'or':
      return (
        ehPredicadoComLista(predicado) &&
        predicado.predicados.some(predicadoInterno =>
          evaluarPredicado(predicadoInterno, estadoAtual, anoAtual),
        )
      );

    case 'not':
      return ehPredicadoComFilho(predicado) && !evaluarPredicado(predicado.predicado, estadoAtual, anoAtual);

    default:
      return true;
  }
}

export const avaliarPredicado = evaluarPredicado;
