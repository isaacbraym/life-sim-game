import { z } from 'zod';
import type { PredicateTree } from '../schemas/predicate';
import { Atributos } from '../schemas/character';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface GameState {
  personagem: {
    atributos: z.infer<typeof Atributos>;
    dinheiro: number;
    flags: string[];
    idadeAtualMeses: number;
    eventosVividos: string[];
  };
  cooldownRegistry: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

// any justificado: resultado de traversal dinâmico; tipo de retorno não inferível estaticamente
function acessarValorCaminho(estado: GameState, caminho: string): unknown {
  const partes = caminho.split('.');
  let atual: unknown = estado;
  for (const parte of partes) {
    if (atual === undefined || atual === null) return undefined;
    atual = (atual as Record<string, unknown>)[parte];
  }
  return atual;
}

// any justificado: comparação dinâmica entre valores de tipos heterogêneos vindos do predicate tree
function avaliarComparacao(operador: string, atual: unknown, alvo: unknown): boolean {
  switch (operador) {
    case '==':  return atual === alvo;
    case '!=':  return atual !== alvo;
    case '>':   return (atual as number) > (alvo as number);
    case '<':   return (atual as number) < (alvo as number);
    case '>=':  return (atual as number) >= (alvo as number);
    case '<=':  return (atual as number) <= (alvo as number);
    default:    return false;
  }
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

export function avaliarPredicado(predicado: PredicateTree, estado: GameState): boolean {
  if (predicado.tipo === 'todos') {
    return predicado.predicados.every(p => avaliarPredicado(p, estado));
  }
  if (predicado.tipo === 'algum') {
    return predicado.predicados.some(p => avaliarPredicado(p, estado));
  }
  if (predicado.tipo === 'nao') {
    return !avaliarPredicado(predicado.predicado, estado);
  }

  switch (predicado.tipo) {
    case 'var': {
      const valorCaminho = acessarValorCaminho(estado, predicado.caminho);
      return avaliarComparacao(predicado.operador, valorCaminho, predicado.valor);
    }
    case 'flag': {
      const temFlag = estado.personagem.flags.includes(predicado.flag);
      return predicado.presente ? temFlag : !temFlag;
    }
    case 'idade': {
      const idadeAtualAnos = Math.floor(estado.personagem.idadeAtualMeses / 12);
      if (predicado.minimo !== undefined && idadeAtualAnos < predicado.minimo) return false;
      if (predicado.maximo !== undefined && idadeAtualAnos > predicado.maximo) return false;
      return true;
    }
    case 'relacionamento':
      return false; // placeholder — implementar com roster de NPCs no Sprint 1.3
    default:
      return false;
  }
}