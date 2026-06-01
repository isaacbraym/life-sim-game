import { Application, Container, Graphics } from 'pixi.js';
import { gsap } from 'gsap';
import { tileParaTela, calcularDepth } from '@core/iso/IsoMath';
import { calcularCaminho } from '@core/iso/Pathfinder';
import type { GridCaminhavel } from '@core/iso/Pathfinder';
import type { DirecaoVisual } from '@core/schemas/direction';
import {
  ManifestoPersonagemTeste,
  type ManifestoPersonagemTeste as TipoManifesto,
} from '@core/schemas/testCharacter';
import { FrameSequenceAnimator } from './FrameSequenceAnimator';

const URL_MANIFESTO = '/content/test-characters/marnie/manifest.json';
const DIRECAO_IDLE: DirecaoVisual = 'SE';
const CLIP_ANDAR = 'andar';
const CLIP_IDLE = 'idle';
const CLIP_SENTAR = 'sentar';     // transição em pé→sentado (1x)
const CLIP_SENTADO = 'sentado';   // idle sentado (loop)

const espera = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Personagem um pouco maior que 1 tile (mais presente no piso, estilo Habbo).
const ESCALA_PERSONAGEM = 1.35;
// Velocidade de deslocamento em px de tela por segundo (caminhada calma).
const VELOCIDADE_PX_S = 130;

type Tile = { tx: number; ty: number };

// Ângulo de tela (rad, dx→direita, dy→baixo) de cada DirecaoVisual, na projeção
// iso do jogo. Usado para escolher o facing natural de um segmento de caminho.
const ANGULO_TELA_POR_DIRECAO: ReadonlyArray<readonly [DirecaoVisual, number]> = [
  ['NE', Math.atan2(0, 64)],
  ['E', Math.atan2(16, 32)],
  ['SE', Math.atan2(32, 0)],
  ['S', Math.atan2(16, -32)],
  ['SW', Math.atan2(0, -64)],
  ['W', Math.atan2(-16, -32)],
  ['NW', Math.atan2(-32, 0)],
  ['N', Math.atan2(-16, 32)],
];

function diffAngulo(a: number, b: number): number {
  let d = Math.abs(a - b) % (Math.PI * 2);
  if (d > Math.PI) d = Math.PI * 2 - d;
  return d;
}

/** Direção visual cujo facing na tela mais se aproxima do vetor (dx, dy) em tela. */
function direcaoPorTela(dxTela: number, dyTela: number): DirecaoVisual {
  const ang = Math.atan2(dyTela, dxTela);
  let melhor: DirecaoVisual = 'SE';
  let menor = Infinity;
  for (const [dir, a] of ANGULO_TELA_POR_DIRECAO) {
    const d = diffAngulo(ang, a);
    if (d < menor) { menor = d; melhor = dir; }
  }
  return melhor;
}

function caminhavel(grid: GridCaminhavel, tx: number, ty: number): boolean {
  return grid[ty]?.[tx] === true;
}

/** Há linha reta livre (todos os tiles no caminho são caminháveis) entre a e b. */
function temLinhaDeVisao(grid: GridCaminhavel, a: Tile, b: Tile): boolean {
  const dx = b.tx - a.tx;
  const dy = b.ty - a.ty;
  const passos = Math.max(Math.abs(dx), Math.abs(dy)) * 2;
  if (passos === 0) return true;
  for (let i = 0; i <= passos; i += 1) {
    const tx = Math.round(a.tx + (dx * i) / passos);
    const ty = Math.round(a.ty + (dy * i) / passos);
    if (!caminhavel(grid, tx, ty)) return false;
  }
  return true;
}

/**
 * String-pulling: reduz o caminho BFS a poucos waypoints, ligando o ponto atual
 * ao tile mais distante alcançável em linha reta livre. Transforma zigue-zagues
 * em segmentos retos (movimento natural).
 */
function suavizarCaminho(grid: GridCaminhavel, caminho: readonly Tile[]): Tile[] {
  if (caminho.length <= 2) return [...caminho];
  const saida: Tile[] = [caminho[0]!];
  let ancora = 0;
  while (ancora < caminho.length - 1) {
    let proximo = ancora + 1;
    // Estende o segmento enquanto houver linha de visão livre.
    for (let j = caminho.length - 1; j > ancora + 1; j -= 1) {
      if (temLinhaDeVisao(grid, caminho[ancora]!, caminho[j]!)) { proximo = j; break; }
    }
    saida.push(caminho[proximo]!);
    ancora = proximo;
  }
  return saida;
}

/**
 * Controlador de personagem de TESTE (Marnie) com sprites de frames bakeados.
 * Movimento: BFS (Pathfinder) + string-pulling para segmentos retos, animados
 * por GSAP a velocidade constante. Facing escolhido pelo ângulo de tela do
 * segmento (nearest-8), casando com as direções bakeadas.
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
    this._container.scale.set(ESCALA_PERSONAGEM);
    this.sombra = new Graphics();
    this.sombra.ellipse(0, 0, 20, 8).fill({ color: 0x000000, alpha: 0.28 });
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
    const bruto = calcularCaminho(grid, this.posicaoAtual, destino);
    if (bruto.length < 2) return;
    const caminho = suavizarCaminho(grid, bruto);

    this._emMovimento = true;
    this.animator?.retomar();
    try {
      // Garante que o clip 'andar' inicie já no 1º segmento, mesmo que a direção
      // seja igual à do repouso (senão o personagem deslizava no idle/parado).
      let precisaIniciarAndar = true;
      for (let i = 1; i < caminho.length; i += 1) {
        const proximo = caminho[i];
        if (proximo === undefined) break;

        const de = tileParaTela(this.posicaoAtual.tx, this.posicaoAtual.ty);
        const para = tileParaTela(proximo.tx, proximo.ty);
        const dist = Math.hypot(para.x - de.x, para.y - de.y);

        const direcao = direcaoPorTela(para.x - de.x, para.y - de.y);
        if (precisaIniciarAndar || direcao !== this.direcaoAtual) {
          this.direcaoAtual = direcao;
          precisaIniciarAndar = false;
          void this.animator?.reproduzir(CLIP_ANDAR, direcao);
        }

        await gsap.to(this._container.position, {
          x: para.x, y: para.y,
          duration: Math.max(0.12, dist / VELOCIDADE_PX_S),
          ease: 'none',
        });

        this.posicaoAtual = proximo;
        this._container.zIndex = calcularDepth(proximo.tx, proximo.ty);
      }
    } finally {
      this._emMovimento = false;
      void this.repousar();
    }
  }

  /**
   * Vai até um assento e senta: anda ao tile caminhável adjacente mais próximo,
   * vira para o assento e toca sentar→sentado. Se o clip "sentar" não existir,
   * vai direto para o "sentado".
   */
  async irESentar(assento: Tile, grid: GridCaminhavel): Promise<void> {
    if (this._emMovimento) return;
    const adj = this.melhorTileAdjacente(assento, grid);
    if (adj === undefined) return;

    await this.moverPara(adj, grid);
    if (this.destruido || this.animator === undefined) return;

    // Vira para o assento (facing pelo ângulo de tela).
    const de = tileParaTela(this.posicaoAtual.tx, this.posicaoAtual.ty);
    const para = tileParaTela(assento.tx, assento.ty);
    this.direcaoAtual = direcaoPorTela(para.x - de.x, para.y - de.y);

    const a = this.animator;
    a.retomar();
    const fps = a.fpsDoClip(CLIP_SENTAR) ?? 12;
    const nframes = a.framesDoClip(CLIP_SENTAR) ?? 0;
    const temSentar = nframes > 0 && await a.reproduzir(CLIP_SENTAR, this.direcaoAtual);
    if (this.destruido) return;
    if (temSentar) {
      await espera((nframes / fps) * 1000);
      if (this.destruido) return;
    }
    await a.reproduzir(CLIP_SENTADO, this.direcaoAtual);
  }

  /** Tile caminhável vizinho ao assento mais próximo da posição atual. */
  private melhorTileAdjacente(assento: Tile, grid: GridCaminhavel): Tile | undefined {
    const candidatos: Tile[] = [
      { tx: assento.tx, ty: assento.ty + 1 }, // frente (S de tela)
      { tx: assento.tx + 1, ty: assento.ty },
      { tx: assento.tx, ty: assento.ty - 1 },
      { tx: assento.tx - 1, ty: assento.ty },
      { tx: assento.tx + 1, ty: assento.ty + 1 },
      { tx: assento.tx - 1, ty: assento.ty + 1 },
      { tx: assento.tx + 1, ty: assento.ty - 1 },
      { tx: assento.tx - 1, ty: assento.ty - 1 },
    ];
    let melhor: Tile | undefined;
    let menor = Infinity;
    for (const c of candidatos) {
      if (grid[c.ty]?.[c.tx] !== true) continue;
      const d = Math.abs(c.tx - this.posicaoAtual.tx) + Math.abs(c.ty - this.posicaoAtual.ty);
      if (d < menor) { menor = d; melhor = c; }
    }
    return melhor;
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
