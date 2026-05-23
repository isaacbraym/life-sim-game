import type { JointId } from '../schemas/pose';
import type { Limites } from './Joint';

// Ranges anatômicos por joint em graus
export const LIMITES_ANATOMICOS: Readonly<Record<JointId, Limites>> = {
  root_pelvis:  { minGraus: -180, maxGraus: 180 },
  spine:        { minGraus: -30,  maxGraus: 30  },
  neck:         { minGraus: -57,  maxGraus: 57  },
  head:         { minGraus: -69,  maxGraus: 69  },
  shoulder_L:   { minGraus: -180, maxGraus: 180 },
  elbow_L:      { minGraus: 0,    maxGraus: 150 },
  wrist_L:      { minGraus: -75,  maxGraus: 75  },
  shoulder_R:   { minGraus: -180, maxGraus: 180 },
  elbow_R:      { minGraus: 0,    maxGraus: 150 },
  wrist_R:      { minGraus: -75,  maxGraus: 75  },
  hip_L:        { minGraus: -90,  maxGraus: 90  },
  knee_L:       { minGraus: 0,    maxGraus: 140 },
  ankle_L:      { minGraus: -30,  maxGraus: 40  },
  hip_R:        { minGraus: -90,  maxGraus: 90  },
  knee_R:       { minGraus: 0,    maxGraus: 140 },
};
