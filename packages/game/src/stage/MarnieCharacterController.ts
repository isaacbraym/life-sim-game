import { Application, Container, Graphics } from 'pixi.js';
import { gsap } from 'gsap';
import { tileParaTela, calcularDepth, TILE_MOVE_MS } from '@core/iso/IsoMath';
import { calcularCaminho } from '@core/iso/Pathfinder';
import type { GridCaminhavel } from '@core/iso/Pathfinder';
import { calcularDirecao } from '@core/schemas/direction';
import type { DirecaoVisual } from '@core/schemas/direction';
import {
  ManifestoPersonagemTeste,
  type ManifestoPersonagemTeste as TipoManifesto,
} from '@core/schemas/testCharacter';
import { FrameSequenceAnimator } from './FrameSequenceAnimator';

const URL_MANIFESTO = '/content/test-characters/marnie/manifest.json';
const DIRECAO_IDLE: DirecaoVisual = 'S';
const CLIP_ANDAR = 'andar';
const CLIP_IDLE = 'idle';

type Tile = { tx: number; ty: number };

/**
 * Controlador de personagem de TESTE (Marnie) com sprites de frames bakeados.
 * Espelha a interface do {@link IsoCharacterController} (BFS + GSAP, tile a tile),
 * mas renderiza via {@link FrameSequenceAnimator}. Sem clip de idle disponível,
 * o repouso congela o 1º frame de "andar" na direção atual.
 */
export class MarnieCharacterController {
  private readonly _container: Container;
  private readonly sombra: Graphics;
  private animator: FrameSequenceAnimator | undefined;
  private posicaoAtual: Tile = { tx: 1, ty: 1 };
  private _emMovimento = false;
  private direcaoAtual: DirecaoVisual = DIRECAO_IDLE;
  private destruido = false;

  constructor(private readonly varianteId: string = 'base') {
    this._container = new Container();
    this.sombra = new Graphics();
    this.sombra.ellipse(0, 0, 22, 9).fill({ color: 0x000000, alpha: 0.3 });
    this.sombra.position.set(0, 4);
    this._container.addChild(this.sombra);
    this.sincronizarPosicao();
  }

  async inicializar(_app: Application): Promise<void> {
    let manifesto: TipoManifesto | undefined;
    try {
      const res = await fetch(URL_MANIFESTO);
      if (res.ok) {
        const parsed = ManifestoPersonagemTeste.safeParse(await res.json());
        if (parsed.success) manifesto = parsed.data;
      }
    } catch {
      manifesto = undefined;
    }
    if (this.destruido || manifesto === undefined) return;

    const variante = manifesto.variantes.find((v) => v.varianteId === this.varianteId)
      ?? manifesto.variantes[0];
    if (variante === undefined) return;

    this.animator = new FrameSequenceAnimator(
      manifesto.personagemId, variante.varianteId, manifesto.canvas, variante.clips,
    );
    this._container.addChild(this.animator.obterContainer());

    await this.repousar();
  }

  /** Repouso: toca o clip idle (loop). Se ausente, congela o 1º frame de andar. */
  private async repousar(): Promise<void> {
    const a = this.animator;
    if (a === undefined) return;
    const temIdle = await a.reproduzir(CLIP_IDLE, this.direcaoAtual);
    if (this.destruido || temIdle) return;
    await a.reproduzir(CLIP_ANDAR, this.direcaoAtual);
    if (!this.destruido) a.pausar();
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
    if (this._emMovimento) return;
    const caminho = calcularCaminho(grid, this.posicaoAtual, destino);
    if (caminho.length < 2) return;

    this._emMovimento = true;
    this.animator?.retomar();
    try {
      for (let i = 1; i < caminho.length; i += 1) {
        const proximo = caminho[i];
        if (proximo === undefined) break;

        const direcao = calcularDirecao(this.posicaoAtual, proximo);
        this.direcaoAtual = direcao;
        void this.animator?.reproduzir(CLIP_ANDAR, direcao);

        const { x, y } = tileParaTela(proximo.tx, proximo.ty);
        await gsap.to(this._container.position, {
          x, y, duration: TILE_MOVE_MS / 1000, ease: 'power1.inOut',
        });

        this.posicaoAtual = proximo;
        this._container.zIndex = calcularDepth(proximo.tx, proximo.ty);
      }
    } finally {
      this._emMovimento = false;
      void this.repousar();
    }
  }

  /** Reproduz um clip arbitrário (ex.: "sentado", "conversar") na direção atual. */
  async reproduzirClip(clipId: string, direcao?: DirecaoVisual): Promise<boolean> {
    if (this.animator === undefined) return false;
    const dir = direcao ?? this.direcaoAtual;
    this.direcaoAtual = dir;
    this.animator.retomar();
    return this.animator.reproduzir(clipId, dir);
  }

  obterContainer(): Container {
    return this._container;
  }

  destruir(): void {
    this.destruido = true;
    this.animator?.destruir();
    gsap.killTweensOf(this._container.position);
    this._container.destroy({ children: true });
  }

  private sincronizarPosicao(): void {
    const { x, y } = tileParaTela(this.posicaoAtual.tx, this.posicaoAtual.ty);
    this._container.position.set(x, y);
    this._container.zIndex = calcularDepth(this.posicaoAtual.tx, this.posicaoAtual.ty);
  }
}
