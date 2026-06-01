import { AnimatedSprite, Assets, Container, Texture } from 'pixi.js';
import type { DirecaoVisual } from '@core/schemas/direction';
import type {
  CanvasPersonagemTeste,
  ClipPersonagemTeste,
} from '@core/schemas/testCharacter';
import { caminhoFramesPersonagemTeste } from '@core/schemas/testCharacter';

type ChaveClipeDirecao = string; // `${clipId}/${direcao}`

/**
 * Reproduz sequências de frames WebP pré-bakeadas (personagem de teste, ex.: Marnie)
 * como `AnimatedSprite` do PixiJS. Cada combinação clip+direção tem sua própria
 * lista de texturas, carregada sob demanda e cacheada.
 *
 * Anchor normalizado a partir do canvas do manifesto (ex.: 32/64, 90/96), de modo
 * que o container se posiciona pelo pé do personagem, igual ao sistema de camadas.
 */
export class FrameSequenceAnimator {
  private readonly _container: Container;
  private readonly sprite: AnimatedSprite;
  private readonly cache = new Map<ChaveClipeDirecao, Texture[]>();
  private readonly personagemId: string;
  private readonly varianteId: string;
  private readonly canvas: CanvasPersonagemTeste;
  private readonly clipsPorId: Map<string, ClipPersonagemTeste>;
  private clipAtual: string | undefined;
  private direcaoAtual: DirecaoVisual = 'S';
  private destruido = false;

  constructor(
    personagemId: string,
    varianteId: string,
    canvas: CanvasPersonagemTeste,
    clips: readonly ClipPersonagemTeste[],
  ) {
    this.personagemId = personagemId;
    this.varianteId = varianteId;
    this.canvas = canvas;
    this.clipsPorId = new Map(clips.map((c) => [c.clipId, c]));

    this._container = new Container();
    this.sprite = new AnimatedSprite([Texture.EMPTY]);
    this.sprite.anchor.set(canvas.anchorX / canvas.largura, canvas.anchorY / canvas.altura);
    this._container.addChild(this.sprite);
  }

  obterContainer(): Container {
    return this._container;
  }

  /** Escala o sprite para o tamanho lógico do canvas, qualquer que seja a
   * resolução real da textura (supersampling). Anchor é normalizado. */
  private ajustarTamanhoLogico(): void {
    const tex = this.sprite.texture;
    if (tex.width > 0) {
      this.sprite.scale.set(
        this.canvas.largura / tex.width,
        this.canvas.altura / tex.height,
      );
    }
  }

  direcao(): DirecaoVisual {
    return this.direcaoAtual;
  }

  fpsDoClip(clipId: string): number | undefined {
    return this.clipsPorId.get(clipId)?.fps;
  }

  framesDoClip(clipId: string): number | undefined {
    return this.clipsPorId.get(clipId)?.frames;
  }

  /** Carrega (com cache) as texturas de um clip/direção. */
  private async carregarTexturas(
    clipId: string,
    direcao: DirecaoVisual,
  ): Promise<Texture[] | undefined> {
    const chave = `${clipId}/${direcao}`;
    const cacheado = this.cache.get(chave);
    if (cacheado !== undefined) return cacheado;

    const clip = this.clipsPorId.get(clipId);
    if (clip === undefined || clip.frames <= 0) return undefined;

    const base = caminhoFramesPersonagemTeste(
      this.personagemId, this.varianteId, clipId, direcao);
    const urls = Array.from({ length: clip.frames }, (_, i) =>
      `${base}/frame_${String(i).padStart(3, '0')}.webp`);

    try {
      const texturas = await Promise.all(urls.map((u) => Assets.load<Texture>(u)));
      if (this.destruido) return undefined;
      this.cache.set(chave, texturas);
      return texturas;
    } catch {
      return undefined;
    }
  }

  /** Reproduz um clip numa direção. Retorna `false` se não houver frames. */
  async reproduzir(clipId: string, direcao: DirecaoVisual): Promise<boolean> {
    if (this.destruido) return false;
    const clip = this.clipsPorId.get(clipId);
    if (clip === undefined) return false;

    const texturas = await this.carregarTexturas(clipId, direcao);
    if (this.destruido || texturas === undefined || texturas.length === 0) return false;

    this.clipAtual = clipId;
    this.direcaoAtual = direcao;
    this.sprite.textures = texturas;
    // Texturas podem ser bakeadas em supersampling (2x/3x); reduz ao tamanho
    // lógico do canvas → nitidez (downscale) e composição estável.
    this.ajustarTamanhoLogico();
    this.sprite.animationSpeed = clip.fps / 60; // PixiJS conta em frames de 60fps
    this.sprite.loop = clip.loop;
    this.sprite.gotoAndPlay(0);
    return true;
  }

  /** Troca apenas a direção mantendo o clip e o progresso atual. */
  async atualizarDirecao(direcao: DirecaoVisual): Promise<void> {
    if (this.destruido || direcao === this.direcaoAtual || this.clipAtual === undefined) {
      this.direcaoAtual = direcao;
      return;
    }
    const frameAtual = this.sprite.currentFrame;
    const tocando = this.sprite.playing;
    const texturas = await this.carregarTexturas(this.clipAtual, direcao);
    if (this.destruido || texturas === undefined) return;
    this.direcaoAtual = direcao;
    this.sprite.textures = texturas;
    const alvo = Math.min(frameAtual, texturas.length - 1);
    if (tocando) this.sprite.gotoAndPlay(alvo);
    else this.sprite.gotoAndStop(alvo);
  }

  pausar(): void {
    this.sprite.stop();
  }

  retomar(): void {
    this.sprite.play();
  }

  destruir(): void {
    this.destruido = true;
    this.sprite.stop();
    this._container.destroy({ children: true });
    this.cache.clear();
  }
}
