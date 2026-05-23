import type { JointId } from '../schemas/pose';
import type { Joint } from './Joint';

// TODO: implementar FK top-down com matrizes 2D
export function computarFK(
  _juntas: Map<JointId, Joint>,
  _ordemTopologica: JointId[],
): Map<JointId, { x: number; y: number; rotacao: number }> {
  throw new Error('not implemented');
}
