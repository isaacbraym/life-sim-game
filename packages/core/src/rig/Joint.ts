import type { JointId } from '../schemas/pose';

export type Ponto = { readonly x: number; readonly y: number };

export type Limites = {
  readonly minGraus: number;
  readonly maxGraus: number;
};

export type Joint = {
  readonly id: JointId;
  readonly parentId: JointId | null;
  localPosition: Ponto;
  rotacaoLocal: number;  // radianos
  readonly comprimento: number;
  readonly limites: Limites;
};
