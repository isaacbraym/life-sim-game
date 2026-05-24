import type { EstadoDeJogo } from './EstadoDeJogo';

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
  readonly presente?: boolean;
};

type PredicadoComIdade = ObjetoPredicado & {
  readonly minimo?: number;
  readonly maximo?: number;
};

type PredicadoComComparacao = ObjetoPredicado & {
  readonly operador: string;
  readonly valor: number | string | boolean;
};

type PredicadoVar = PredicadoComComparacao & {
  readonly caminho: string;
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

function ehPredicadoComIdade(predicado: Predicado): predicado is PredicadoComIdade {
  return ehObjetoPredicado(predicado)
    && (typeof predicado.minimo === 'number' || typeof predicado.maximo === 'number');
}

function ehPredicadoComComparacao(predicado: Predicado): predicado is PredicadoComComparacao {
  return ehObjetoPredicado(predicado)
    && typeof predicado.operador === 'string'
    && ['number', 'string', 'boolean'].includes(typeof predicado.valor);
}

function ehPredicadoVar(predicado: Predicado): predicado is PredicadoVar {
  return ehPredicadoComComparacao(predicado) && typeof predicado.caminho === 'string';
}

function ehPredicadoComLista(predicado: Predicado): predicado is PredicadoComLista {
  return ehObjetoPredicado(predicado) && Array.isArray(predicado.predicados);
}

function ehPredicadoComFilho(predicado: Predicado): predicado is PredicadoComFilho {
  return ehObjetoPredicado(predicado) && predicado.predicado !== undefined;
}

function calcularIdade(estadoAtual: EstadoDeJogo): number {
  return estadoAtual.anoAtual - estadoAtual.anoNascimento;
}

function comparar(
  esquerdo: number | string | boolean | undefined,
  operador: string,
  direito: number | string | boolean,
): boolean {
  if (esquerdo === undefined) return false;

  switch (operador) {
    case '==':
      return esquerdo === direito;
    case '!=':
      return esquerdo !== direito;
    case '>':
      return typeof esquerdo === 'number' && typeof direito === 'number' && esquerdo > direito;
    case '<':
      return typeof esquerdo === 'number' && typeof direito === 'number' && esquerdo < direito;
    case '>=':
      return typeof esquerdo === 'number' && typeof direito === 'number' && esquerdo >= direito;
    case '<=':
      return typeof esquerdo === 'number' && typeof direito === 'number' && esquerdo <= direito;
    default:
      return false;
  }
}

function lerVariavel(caminho: string, estadoAtual: EstadoDeJogo): number | string | boolean | undefined {
  const variaveis: Readonly<Record<string, number | string | boolean>> = {
    anoAtual: estadoAtual.anoAtual,
    anoNascimento: estadoAtual.anoNascimento,
    humor: estadoAtual.humor,
    saude: estadoAtual.saude,
    dinheiro: estadoAtual.dinheiro,
    idade: calcularIdade(estadoAtual),
  };

  return variaveis[caminho];
}

export function evaluarPredicado(
  predicado: Predicado,
  estadoAtual: EstadoDeJogo,
): boolean {
  if (!ehObjetoPredicado(predicado) || typeof predicado.tipo !== 'string') {
    return true;
  }

  switch (predicado.tipo) {
    case 'idade_min':
      return ehPredicadoComValor(predicado) && calcularIdade(estadoAtual) >= predicado.valor;

    case 'idade_max':
      return ehPredicadoComValor(predicado) && calcularIdade(estadoAtual) <= predicado.valor;

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

    case 'flag':
      return (
        ehPredicadoComFlag(predicado) &&
        estadoAtual.flags.includes(predicado.flag) === (predicado.presente ?? true)
      );

    case 'idade':
      return ehPredicadoComIdade(predicado)
        && (predicado.minimo === undefined || calcularIdade(estadoAtual) >= predicado.minimo)
        && (predicado.maximo === undefined || calcularIdade(estadoAtual) <= predicado.maximo);

    case 'atributo': {
      if (!ehPredicadoComAtributo(predicado) || !ehPredicadoComComparacao(predicado)) return false;

      return comparar(estadoAtual.atributos[predicado.atributo], predicado.operador, predicado.valor);
    }

    case 'var':
      return ehPredicadoVar(predicado)
        && comparar(lerVariavel(predicado.caminho, estadoAtual), predicado.operador, predicado.valor);

    case 'and':
    case 'todos':
      return (
        ehPredicadoComLista(predicado) &&
        predicado.predicados.every(predicadoInterno =>
          evaluarPredicado(predicadoInterno, estadoAtual),
        )
      );

    case 'or':
    case 'algum':
      return (
        ehPredicadoComLista(predicado) &&
        predicado.predicados.some(predicadoInterno =>
          evaluarPredicado(predicadoInterno, estadoAtual),
        )
      );

    case 'not':
    case 'nao':
      return ehPredicadoComFilho(predicado) && !evaluarPredicado(predicado.predicado, estadoAtual);

    default:
      return true;
  }
}

export const avaliarPredicado = evaluarPredicado;
