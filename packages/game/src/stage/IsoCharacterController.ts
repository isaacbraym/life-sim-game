import { Container, Graphics } from 'pixi.js';
import { gsap } from 'gsap';
import { tileParaTela, calcularDepth, TILE_MOVE_MS } from '@core/iso/IsoMath';
import { calcularCaminho } from '@core/iso/Pathfinder';
import type { GridCaminhavel } from '@core/iso/Pathfinder';
import { calcularDirecao } from '@core/schemas/direction';
import type { DirecaoVisual } from '@core/schemas/direction';

type Tile = { tx: number; ty: number };

// Canvas fixo 64×96 conforme spec; anchor em pixel absoluto (32, 90)
const ANCORA_X = 32;
const ANCORA_Y = 90;

export class IsoCharacterController {
  private readonly _container: Container;
  private posicaoAtual: Tile = { tx: 1, ty: 1 };
  private _emMovimento      = false;

  constructor() {
    this._container = new Container();
    this._container.addChild(this.criarGrafico());
    this.sincronizarPosicao();
  }

  posicionarEm(tx: number, ty: number): void {
    this.posicaoAtual = { tx, ty };
    this.sincronizarPosicao();
  }

  estaEmMovimento(): boolean {
    return this._emMovimento;
  }

  obterPosicao(): { tx: number; ty: number } {
    return { ...this.posicaoAtual };
  }

  async moverPara(destino: Tile, grid: GridCaminhavel): Promise<void> {
    // Guarda contra movimentos simultâneos
    if (this._emMovimento) return;

    const caminho = calcularCaminho(grid, this.posicaoAtual, destino);
    if (caminho.length < 2) return;

    this._emMovimento = true;
    try {
      for (let i = 1; i < caminho.length; i += 1) {
        const proximo = caminho[i];
        // Guard noUncheckedIndexedAccess — caminho[i] pode ser undefined
        if (proximo === undefined) break;

        const direcao = calcularDirecao(this.posicaoAtual, proximo);
        this.atualizarDirecaoVisual(direcao);

        const { x, y } = tileParaTela(proximo.tx, proximo.ty);
        await gsap.to(this._container.position, {
          x: x - ANCORA_X,
          y: y - ANCORA_Y,
          duration: TILE_MOVE_MS / 1000,
          ease: 'power1.inOut',
        });

        this.posicaoAtual              = proximo;
        this._container.zIndex = calcularDepth(proximo.tx, proximo.ty);
      }
    } finally {
      // finally garante reset mesmo em exceção do GSAP
      this._emMovimento = false;
    }
  }

  obterContainer(): Container {
    return this._container;
  }

  destruir(): void {
    gsap.killTweensOf(this._container.position);
    this._container.destroy({ children: true });
  }

  private sincronizarPosicao(): void {
    const { x, y } = tileParaTela(this.posicaoAtual.tx, this.posicaoAtual.ty);
    this._container.position.set(x - ANCORA_X, y - ANCORA_Y);
    this._container.zIndex = calcularDepth(this.posicaoAtual.tx, this.posicaoAtual.ty);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private atualizarDirecaoVisual(_direcao: DirecaoVisual): void {
    // Placeholder — será substituído por sprites WebP por direção
  }

  private criarGrafico(): Graphics {
    const g = new Graphics();

    // Sombra elíptica no chão (ponto de âncora)
    g.ellipse(ANCORA_X, ANCORA_Y - 4, 20, 8);
    g.fill({ color: 0x000000, alpha: 0.35 });

    // Corpo (verde placeholder)
    g.roundRect(ANCORA_X - 14, ANCORA_Y - 60, 28, 44, 6);
    g.fill({ color: 0x4caf50 });

    // Cabeça
    g.circle(ANCORA_X, ANCORA_Y - 72, 14);
    g.fill({ color: 0xffcc80 });

    // Triângulo indicador de direção (aponta para frente/sul por padrão)
    g.poly([
      ANCORA_X,     ANCORA_Y - 62,
      ANCORA_X - 6, ANCORA_Y - 50,
      ANCORA_X + 6, ANCORA_Y - 50,
    ]);
    g.fill({ color: 0xffd700 });

    return g;
  }
}
