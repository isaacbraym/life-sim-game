import type { JointId } from '../schemas/pose';
import type { Joint, Ponto } from './Joint';
import { computarFK } from './ForwardKinematics';

const ORDEM_HIERARQUICA: readonly JointId[] = [
  'root_pelvis',
  'spine',
  'neck',
  'head',
  'shoulder_L',
  'elbow_L',
  'wrist_L',
  'shoulder_R',
  'elbow_R',
  'wrist_R',
  'hip_L',
  'knee_L',
  'ankle_L',
  'hip_R',
  'knee_R',
];

export class Esqueleto {
  readonly juntas: Map<JointId, Joint>;
  private _fkSujo = true;
  private readonly _fkCache = new Map<JointId, { x: number; y: number; rotacao: number }>();

  constructor(juntas: Map<JointId, Joint>) {
    for (const [id, junta] of juntas) {
      juntas.set(id, this.observarJunta(junta));
    }

    this.juntas = juntas;
  }

  computarForwardKinematics(): void {
    this._fkCache.clear();

    for (const [id, transformacao] of computarFK(
      this.juntas,
      [...ORDEM_HIERARQUICA],
    )) {
      this._fkCache.set(id, transformacao);
    }

    this._fkSujo = false;
  }

  posicaoMundialDe(id: JointId): Ponto {
    if (this._fkSujo) {
      this.computarForwardKinematics();
    }

    const transformacao = this._fkCache.get(id);

    if (transformacao === undefined) {
      throw new Error(`Joint inexistente no cache FK: ${id}`);
    }

    return { x: transformacao.x, y: transformacao.y };
  }

  private observarJunta(junta: Joint): Joint {
    return new Proxy(junta, {
      set: (alvo, propriedade, valor, receptor): boolean => {
        const atualizado = Reflect.set(alvo, propriedade, valor, receptor);

        if (
          atualizado &&
          (propriedade === 'localPosition' || propriedade === 'rotacaoLocal')
        ) {
          this._fkSujo = true;
        }

        return atualizado;
      },
    });
  }
}
