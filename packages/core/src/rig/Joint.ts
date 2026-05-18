export type JointId =
  | 'root_pelvis'
  | 'spine'
  | 'neck'
  | 'head'
  | 'shoulder_L' | 'elbow_L' | 'wrist_L'
  | 'shoulder_R' | 'elbow_R' | 'wrist_R'
  | 'hip_L' | 'knee_L' | 'ankle_L'
  | 'hip_R' | 'knee_R';

export type LimitesJoint = {
  readonly minAngulo: number;
  readonly maxAngulo: number;
};

export type Joint = {
  readonly id: JointId;
  readonly idPai: JointId | null;
  readonly posicaoLocal: { readonly x: number; readonly y: number };
  rotacaoLocal: number;
  readonly comprimento: number;
  readonly limites: LimitesJoint;
};

export const LIMITES_POR_JOINT: Record<JointId, LimitesJoint> = {
  root_pelvis: { minAngulo: -Math.PI,     maxAngulo: Math.PI     },
  spine:       { minAngulo: -0.5,         maxAngulo: 0.5         },
  neck:        { minAngulo: -1.0,         maxAngulo: 1.0         },
  head:        { minAngulo: -1.2,         maxAngulo: 1.2         },
  shoulder_L:  { minAngulo: -Math.PI,     maxAngulo: Math.PI     },
  elbow_L:     { minAngulo: 0,            maxAngulo: 2.6         },
  wrist_L:     { minAngulo: -1.3,         maxAngulo: 1.3         },
  shoulder_R:  { minAngulo: -Math.PI,     maxAngulo: Math.PI     },
  elbow_R:     { minAngulo: 0,            maxAngulo: 2.6         },
  wrist_R:     { minAngulo: -1.3,         maxAngulo: 1.3         },
  hip_L:       { minAngulo: -Math.PI / 2, maxAngulo: Math.PI / 2 },
  knee_L:      { minAngulo: 0,            maxAngulo: 2.4         },
  ankle_L:     { minAngulo: -0.5,         maxAngulo: 0.7         },
  hip_R:       { minAngulo: -Math.PI / 2, maxAngulo: Math.PI / 2 },
  knee_R:      { minAngulo: 0,            maxAngulo: 2.4         },
};