export { Esqueleto } from './rig/Skeleton';
export type { Ponto, TransformacaoMundial } from './rig/Skeleton';
export type { Joint, JointId, LimitesJoint } from './rig/Joint';
export { LIMITES_POR_JOINT } from './rig/Joint';

export {
  gerarPathBraco,
  gerarPathPerna,
  PERFIL_BRACO_PADRAO,
  PERFIL_PERNA_PADRAO,
  PERFIL_TRONCO_PADRAO,
} from './silhouette/BezierSegment';

export type {
  PerfilBraco,
  PerfilPerna,
  PerfilTronco,
  PathBraco,
} from './silhouette/BezierSegment';

export const VERSAO_CORE = '0.0.1';

// Schemas
export * from './schemas';

// Motor RPG
export * from './rpg';

// Motor de eventos
export * from './events';