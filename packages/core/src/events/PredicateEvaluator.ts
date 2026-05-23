import type { PredicateTree } from '../schemas/predicate';

export type GameState = {
  readonly personagem: {
    readonly eventosVividos: readonly string[];
    readonly idadeAtualMeses: number;
  };
  readonly cooldownRegistry: Readonly<Record<string, number>>;
};

// TODO: implementar evaluator recursivo com compilação para closures
export function avaliarPredicado(
  _predicado: PredicateTree,
  _gameState: GameState,
): boolean {
  void _predicado;
  void _gameState;
  throw new Error('not implemented');
}