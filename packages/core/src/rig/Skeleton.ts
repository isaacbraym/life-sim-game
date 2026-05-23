import type { JointId } from '../schemas/pose';
import type { Joint, Ponto } from './Joint';

export class Esqueleto {
  readonly juntas: Map<JointId, Joint>;

  constructor(juntas: Map<JointId, Joint>) {
    this.juntas = juntas;
  }

  computarForwardKinematics(): void {
    throw new Error('not implemented');
  }

  posicaoMundialDe(_id: JointId): Ponto {
    throw new Error('not implemented');
  }
}
