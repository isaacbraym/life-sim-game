import { PredicateTree } from '../schemas/predicate';
import { Atributos } from '../schemas/character';

export interface GameState {
  personagem: {
    atributos: Atributos;
    dinheiro: number;
    flags: string[];
    idadeAtualMeses: number;
  };
}

function acessarValorCaminho(estado: GameState, caminho: string): any {
  const partes = caminho.split('.');
  let atual: any = estado;
  for (const parte of partes) {
    if (atual === undefined || atual === null) return undefined;
    atual = atual[parte];
  }
  return atual;
}

function avaliarComparacao(operador: string, atual: any, alvo: any): boolean {
  switch (operador) {
    case '==': return atual == alvo;
    case '!=': return atual != alvo;
    case '>': return atual > alvo;
    case '<': return atual < alvo;
    case '>=': return atual >= alvo;
    case '<=': return atual <= alvo;
    default: return false;
  }
}

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
    case 'relacionamento': {
      return false; // placeholder — NPCs vem na Fase 1
    }
    default:
      return false;
  }
}
