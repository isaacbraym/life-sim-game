import { Joint, JointId, LIMITES_POR_JOINT } from './Joint';

export type Ponto = { x: number; y: number };

export type TransformacaoMundial = {
  x: number;
  y: number;
  rotacao: number;
};

const HIERARQUIA_JOINTS: Array<{
  id: JointId;
  idPai: JointId | null;
  posLocal: Ponto;
  comprimento: number;
}> = [
  { id: 'root_pelvis', idPai: null,          posLocal: { x: 0,   y: 0   }, comprimento: 0  },
  { id: 'spine',       idPai: 'root_pelvis', posLocal: { x: 0,   y: -40 }, comprimento: 40 },
  { id: 'neck',        idPai: 'spine',       posLocal: { x: 0,   y: -50 }, comprimento: 15 },
  { id: 'head',        idPai: 'neck',        posLocal: { x: 0,   y: -15 }, comprimento: 30 },
  { id: 'shoulder_L',  idPai: 'spine',       posLocal: { x: -25, y: -45 }, comprimento: 30 },
  { id: 'elbow_L',     idPai: 'shoulder_L',  posLocal: { x: -30, y: 0   }, comprimento: 28 },
  { id: 'wrist_L',     idPai: 'elbow_L',     posLocal: { x: -28, y: 0   }, comprimento: 0  },
  { id: 'shoulder_R',  idPai: 'spine',       posLocal: { x: 25,  y: -45 }, comprimento: 30 },
  { id: 'elbow_R',     idPai: 'shoulder_R',  posLocal: { x: 30,  y: 0   }, comprimento: 28 },
  { id: 'wrist_R',     idPai: 'elbow_R',     posLocal: { x: 28,  y: 0   }, comprimento: 0  },
  { id: 'hip_L',       idPai: 'root_pelvis', posLocal: { x: -15, y: 0   }, comprimento: 45 },
  { id: 'knee_L',      idPai: 'hip_L',       posLocal: { x: 0,   y: 45  }, comprimento: 42 },
  { id: 'ankle_L',     idPai: 'knee_L',      posLocal: { x: 0,   y: 42  }, comprimento: 0  },
  { id: 'hip_R',       idPai: 'root_pelvis', posLocal: { x: 15,  y: 0   }, comprimento: 45 },
  { id: 'knee_R',      idPai: 'hip_R',       posLocal: { x: 0,   y: 45  }, comprimento: 42 },
];

export class Esqueleto {
  readonly juntas: Map<JointId, Joint>;
  private transformacoesMundiais: Map<JointId, TransformacaoMundial>;

  constructor() {
    this.juntas = new Map();
    this.transformacoesMundiais = new Map();

    for (const def of HIERARQUIA_JOINTS) {
      this.juntas.set(def.id, {
        id: def.id,
        idPai: def.idPai,
        posicaoLocal: def.posLocal,
        rotacaoLocal: 0,
        comprimento: def.comprimento,
        limites: LIMITES_POR_JOINT[def.id],
      });
    }

    this.computarForwardKinematics();
  }

  computarForwardKinematics(): void {
    for (const def of HIERARQUIA_JOINTS) {
      const junta = this.juntas.get(def.id)!;

      if (junta.idPai === null) {
        this.transformacoesMundiais.set(def.id, {
          x: junta.posicaoLocal.x,
          y: junta.posicaoLocal.y,
          rotacao: junta.rotacaoLocal,
        });
        continue;
      }

      const pai = this.transformacoesMundiais.get(junta.idPai)!;
      const cos = Math.cos(pai.rotacao);
      const sin = Math.sin(pai.rotacao);

      this.transformacoesMundiais.set(def.id, {
        x: pai.x + cos * junta.posicaoLocal.x - sin * junta.posicaoLocal.y,
        y: pai.y + sin * junta.posicaoLocal.x + cos * junta.posicaoLocal.y,
        rotacao: pai.rotacao + junta.rotacaoLocal,
      });
    }
  }

  posicaoMundialDe(id: JointId): Ponto {
    const t = this.transformacoesMundiais.get(id);
    if (!t) throw new Error(`Joint desconhecido: ${id}`);
    return { x: t.x, y: t.y };
  }

  rotacaoMundialDe(id: JointId): number {
    return this.transformacoesMundiais.get(id)?.rotacao ?? 0;
  }
}