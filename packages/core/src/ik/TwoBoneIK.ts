import type { Ponto } from '../rig/Joint';

export type ResultadoIK = {
  readonly anguloSuperior: number;
  readonly anguloInferior: number;
};

// TODO: implementar solver analítico via lei dos cossenos
export function resolverTwoBoneIK(
  _origem: Ponto,
  _alvo: Ponto,
  _comprimentoSuperior: number,
  _comprimentoInferior: number,
  _direcaoDobra: -1 | 1,
  _limites: { readonly flexaoMin: number; readonly flexaoMax: number },
): ResultadoIK {
  throw new Error('not implemented');
}
