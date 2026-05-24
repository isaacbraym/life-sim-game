import * as PIXI from 'pixi.js';
import type { Ponto } from '@core/rig/Joint';
import type { Esqueleto } from '@core/rig/Skeleton';
import type { JointId } from '@core/schemas/pose';
import {
  gerarPathCabeca,
  gerarPathMembroOrganico,
  gerarPathTronco,
} from '@core/silhouette';
import type { PerfilMembro, SegmentoPath } from '@core/silhouette';

export type ConfiguracaoVisual = {
  readonly corPele: string;
  readonly corSombra: string;
  readonly corHighlight: string;
  readonly escala: number;
  readonly debugMode: boolean;
};

const CONFIG_VISUAL_PADRAO: ConfiguracaoVisual = {
  corPele: '#f1c27d',
  corSombra: '#c8935a',
  corHighlight: '#ffdaaa',
  escala: 1.0,
  debugMode: false,
};

const PERFIL_BRACO_ORGANICO: PerfilMembro = {
  espessuraInicio: 18,
  espessuraMeio: 15,
  espessuraFim: 10,
  curvatura: 0.45,
};

const PERFIL_PERNA_ORGANICA: PerfilMembro = {
  espessuraInicio: 26,
  espessuraMeio: 20,
  espessuraFim: 12,
  curvatura: 0.36,
};

const JOINTS_DEBUG: readonly JointId[] = [
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

function corParaNumero(cor: string): number {
  return new PIXI.Color(cor).toNumber();
}

function subtrair(a: Ponto, b: Ponto): Ponto {
  return { x: a.x - b.x, y: a.y - b.y };
}

function somar(a: Ponto, b: Ponto): Ponto {
  return { x: a.x + b.x, y: a.y + b.y };
}

function multiplicar(v: Ponto, escala: number): Ponto {
  return { x: v.x * escala, y: v.y * escala };
}

export class RigRenderer {
  private readonly container: PIXI.Container;
  private readonly camadaSilhueta: PIXI.Graphics;
  private readonly camadaDebug: PIXI.Graphics;
  private readonly labelsDebug: PIXI.Text[] = [];
  private configuracao: ConfiguracaoVisual;

  constructor(configuracao: Partial<ConfiguracaoVisual> = {}) {
    this.configuracao = { ...CONFIG_VISUAL_PADRAO, ...configuracao };
    this.container = new PIXI.Container();
    this.camadaSilhueta = new PIXI.Graphics();
    this.camadaDebug = new PIXI.Graphics();
    this.container.scale.set(this.configuracao.escala);
    this.container.addChild(this.camadaSilhueta);
    this.container.addChild(this.camadaDebug);
  }

  get containerPixi(): PIXI.Container {
    return this.container;
  }

  renderizar(esqueleto: Esqueleto): void {
    this.camadaSilhueta.clear();
    this.camadaDebug.clear();
    this.limparLabelsDebug();
    this.desenharPersonagem(esqueleto);

    if (this.configuracao.debugMode) {
      this.desenharDebug(esqueleto);
    }
  }

  definirDebugMode(ativo: boolean): void {
    this.configuracao = { ...this.configuracao, debugMode: ativo };
  }

  definirEscala(escala: number): void {
    this.configuracao = { ...this.configuracao, escala };
    this.container.scale.set(escala);
  }

  destruir(): void {
    this.limparLabelsDebug();
    this.container.destroy({ children: true });
  }

  private desenharPersonagem(esqueleto: Esqueleto): void {
    const pele = corParaNumero(this.configuracao.corPele);
    const sombra = corParaNumero(this.configuracao.corSombra);
    const highlight = corParaNumero(this.configuracao.corHighlight);

    const ombroL = esqueleto.posicaoMundialDe('shoulder_L');
    const cotoveloL = esqueleto.posicaoMundialDe('elbow_L');
    const pulsoL = esqueleto.posicaoMundialDe('wrist_L');
    const ombroR = esqueleto.posicaoMundialDe('shoulder_R');
    const cotoveloR = esqueleto.posicaoMundialDe('elbow_R');
    const pulsoR = esqueleto.posicaoMundialDe('wrist_R');
    const quadrilL = esqueleto.posicaoMundialDe('hip_L');
    const joelhoL = esqueleto.posicaoMundialDe('knee_L');
    const tornozeloL = esqueleto.posicaoMundialDe('ankle_L');
    const quadrilR = esqueleto.posicaoMundialDe('hip_R');
    const joelhoR = esqueleto.posicaoMundialDe('knee_R');
    const pescoco = esqueleto.posicaoMundialDe('neck');
    const cabeca = esqueleto.posicaoMundialDe('head');
    const tornozeloR = this.inferirTornozeloDireito(quadrilR, joelhoR);

    this.desenharSegmento(
      gerarPathMembroOrganico(quadrilR, joelhoR, tornozeloR, PERFIL_PERNA_ORGANICA, 'R'),
      sombra,
    );
    this.desenharSegmento(
      gerarPathMembroOrganico(ombroR, cotoveloR, pulsoR, PERFIL_BRACO_ORGANICO, 'R'),
      sombra,
    );
    this.desenharSegmento(
      gerarPathTronco(pescoco, ombroL, ombroR, quadrilL, quadrilR, {
        larguraTopo: 72,
        larguraBase: 54,
        curvatura: 0.42,
      }),
      pele,
    );
    this.desenharSegmento(
      gerarPathMembroOrganico(quadrilL, joelhoL, tornozeloL, PERFIL_PERNA_ORGANICA, 'L'),
      pele,
    );
    this.desenharSegmento(gerarPathCabeca(cabeca, 22, 27), highlight);
    this.desenharSegmento(
      gerarPathMembroOrganico(ombroL, cotoveloL, pulsoL, PERFIL_BRACO_ORGANICO, 'L'),
      pele,
    );
  }

  private desenharSegmento(segmento: SegmentoPath, cor: number): void {
    const pontoInicial = segmento.pontos[0];

    if (pontoInicial === undefined) {
      return;
    }

    this.camadaSilhueta.moveTo(pontoInicial.x, pontoInicial.y);

    for (let indice = 0; indice < segmento.pontos.length; indice += 1) {
      const destino = segmento.pontos[(indice + 1) % segmento.pontos.length];
      const handle1 = segmento.handles[indice * 2];
      const handle2 = segmento.handles[indice * 2 + 1];

      if (destino === undefined) {
        continue;
      }

      if (handle1 === undefined || handle2 === undefined) {
        this.camadaSilhueta.lineTo(destino.x, destino.y);
        continue;
      }

      this.camadaSilhueta.bezierCurveTo(
        handle1.x,
        handle1.y,
        handle2.x,
        handle2.y,
        destino.x,
        destino.y,
      );
    }

    this.camadaSilhueta.closePath();
    this.camadaSilhueta.fill({ color: cor });
  }

  private desenharDebug(esqueleto: Esqueleto): void {
    this.camadaDebug.setStrokeStyle({ color: 0x7f8899, width: 1 });

    for (const junta of esqueleto.juntas.values()) {
      if (junta.parentId === null) {
        continue;
      }

      const origem = esqueleto.posicaoMundialDe(junta.parentId);
      const destino = esqueleto.posicaoMundialDe(junta.id);
      this.camadaDebug.moveTo(origem.x, origem.y);
      this.camadaDebug.lineTo(destino.x, destino.y);
    }

    this.camadaDebug.stroke();

    for (const id of JOINTS_DEBUG) {
      const posicao = esqueleto.posicaoMundialDe(id);
      this.camadaDebug.circle(posicao.x, posicao.y, id === 'root_pelvis' ? 5 : 4);
      this.camadaDebug.fill({ color: id === 'root_pelvis' ? 0xfff1a8 : 0xffffff });
      this.criarLabelDebug(id, posicao);
    }
  }

  private criarLabelDebug(id: JointId, posicao: Ponto): void {
    const label = new PIXI.Text({
      text: id,
      style: {
        fontFamily: 'DM Mono, monospace',
        fontSize: 8,
        fill: 0xffffff,
      },
    });
    label.position.set(posicao.x + 5, posicao.y - 6);
    this.labelsDebug.push(label);
    this.container.addChild(label);
  }

  private limparLabelsDebug(): void {
    for (const label of this.labelsDebug) {
      label.destroy();
    }

    this.labelsDebug.length = 0;
  }

  private inferirTornozeloDireito(quadril: Ponto, joelho: Ponto): Ponto {
    const perna = subtrair(joelho, quadril);
    const panturrilha = multiplicar(perna, 0.86);
    return somar(joelho, panturrilha);
  }
}
