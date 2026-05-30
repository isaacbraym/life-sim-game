import { Application, Container, Graphics } from 'pixi.js';
import { gsap } from 'gsap';
import { tileParaTela, calcularDepth, TILE_MOVE_MS } from '@core/iso/IsoMath';
import { calcularCaminho } from '@core/iso/Pathfinder';
import type { GridCaminhavel } from '@core/iso/Pathfinder';
import { calcularDirecao } from '@core/schemas/direction';
import type { DirecaoVisual } from '@core/schemas/direction';
import { CharacterRenderer } from './CharacterRenderer';

type Tile = { tx: number; ty: number };

// Corpo base padrão do personagem jogável.
const CORPO_BASE_PADRAO = 'adulto_neutro';
// Direção de repouso (personagem voltado para a câmera).
const DIRECAO_IDLE: DirecaoVisual = 'S';
// Amplitude do "bob" vertical durante a caminhada (px de tela).
const BOB_AMPLITUDE_PX = 4;

export class IsoCharacterController {
  private readonly _container: Container;
  private readonly renderer: CharacterRenderer;
  private readonly sombra: Graphics;
  private posicaoAtual: Tile = { tx: 1, ty: 1 };
  private _emMovimento      = false;
  private bobTween: gsap.core.Tween | undefined;

  constructor() {
    this._container = new Container();

    // Sombra elíptica no chão (alinhada ao anchor/pés do personagem).
    this.sombra = new Graphics();
    this.sombra.ellipse(0, 0, 22, 9).fill({ color: 0x000000, alpha: 0.3 });
    this.sombra.position.set(0, 4);
    this._container.addChild(this.sombra);

    // Personagem real (sprites WebP por direção, sem placeholders).
    this.renderer = new CharacterRenderer({
      corpoBase: CORPO_BASE_PADRAO,
      partes: [],
      mostrarPlaceholders: false,
    });

    this.sincronizarPosicao();
  }

  /** Carrega os sprites do personagem. Deve ser aguardado antes de exibir. */
  async inicializar(app: Application): Promise<void> {
    await this.renderer.inicializar(app);
    this._container.addChild(this.renderer.obterContainer());
    this.renderer.atualizarDirecao(DIRECAO_IDLE);
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
    this.iniciarBob();
    try {
      for (let i = 1; i < caminho.length; i += 1) {
        const proximo = caminho[i];
        // Guard noUncheckedIndexedAccess — caminho[i] pode ser undefined
        if (proximo === undefined) break;

        const direcao = calcularDirecao(this.posicaoAtual, proximo);
        this.atualizarDirecaoVisual(direcao);

        const { x, y } = tileParaTela(proximo.tx, proximo.ty);
        await gsap.to(this._container.position, {
          x,
          y,
          duration: TILE_MOVE_MS / 1000,
          ease: 'power1.inOut',
        });

        this.posicaoAtual      = proximo;
        this._container.zIndex = calcularDepth(proximo.tx, proximo.ty);
      }
    } finally {
      // finally garante reset mesmo em exceção do GSAP
      this.pararBob();
      this.atualizarDirecaoVisual(DIRECAO_IDLE);
      this._emMovimento = false;
    }
  }

  obterContainer(): Container {
    return this._container;
  }

  destruir(): void {
    this.pararBob();
    gsap.killTweensOf(this._container.position);
    this.renderer.destruir();
    this._container.destroy({ children: true });
  }

  private iniciarBob(): void {
    const alvo = this.renderer.obterContainer().position;
    this.bobTween = gsap.to(alvo, {
      y: -BOB_AMPLITUDE_PX,
      duration: TILE_MOVE_MS / 1000 / 2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }

  private pararBob(): void {
    this.bobTween?.kill();
    this.bobTween = undefined;
    this.renderer.obterContainer().position.y = 0;
  }

  private sincronizarPosicao(): void {
    const { x, y } = tileParaTela(this.posicaoAtual.tx, this.posicaoAtual.ty);
    this._container.position.set(x, y);
    this._container.zIndex = calcularDepth(this.posicaoAtual.tx, this.posicaoAtual.ty);
  }

  private atualizarDirecaoVisual(direcao: DirecaoVisual): void {
    this.renderer.atualizarDirecao(direcao);
  }
}
