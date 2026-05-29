import { Application, Assets, Container, Graphics, Sprite, Texture } from 'pixi.js';
import type { CamadaPersonagem, CharacterPartMetadata } from '@core/schemas/characterPart';
import { ORDEM_CAMADAS, CHARACTER_CANVAS } from '@core/schemas/characterPart';
import type { DirecaoVisual } from '@core/schemas/direction';

type ConfiguracaoPersonagem = {
  readonly corpoBase: string;          // partId do corpo base
  readonly partes:    readonly string[]; // partIds das partes equipadas
};

type CamadaCarregada = {
  readonly camada:   CamadaPersonagem;
  readonly partId:   string;
  readonly metadata: CharacterPartMetadata;
  sprite:            Sprite | Graphics;
};

async function carregarMetadataParte(
  partId: string,
  tipo: CamadaPersonagem,
): Promise<CharacterPartMetadata | undefined> {
  try {
    const res = await fetch(`/content/character-parts/${tipo}/${partId}/metadata.json`);
    if (!res.ok) return undefined;
    // SAFETY: dados externos, validação de shape mínimo antes de cast
    const dados = await res.json() as Record<string, unknown>;
    if (typeof dados['partId'] !== 'string') return undefined;
    return dados as unknown as CharacterPartMetadata;
  } catch {
    return undefined;
  }
}

async function carregarTexturaParte(
  partId: string,
  tipo: CamadaPersonagem,
  direcao: DirecaoVisual,
): Promise<Texture | undefined> {
  const url = `/content/character-parts/${tipo}/${partId}/${direcao}.webp`;
  try {
    const texture: Texture = await Assets.load(url);
    return texture;
  } catch {
    return undefined;
  }
}

function criarPlaceholderCamada(camada: CamadaPersonagem): Graphics {
  const g    = new Graphics();
  const ancX = CHARACTER_CANVAS.anchorPixelX;
  const ancY = CHARACTER_CANVAS.anchorPixelY;

  if (camada === 'sombra') {
    g.ellipse(ancX, ancY - 4, 20, 8);
    g.fill({ color: 0x000000, alpha: 0.3 });
  } else if (camada === 'sapato') {
    g.roundRect(ancX - 10, ancY - 10, 20, 8, 2);
    g.fill({ color: 0x5c3d2e });
  } else if (camada === 'calca') {
    g.roundRect(ancX - 12, ancY - 40, 24, 30, 3);
    g.fill({ color: 0x1a237e });
  } else if (camada === 'corpo_base') {
    g.roundRect(ancX - 13, ancY - 65, 26, 28, 5);
    g.fill({ color: 0xffcc80 });
  } else if (camada === 'camisa') {
    g.roundRect(ancX - 14, ancY - 68, 28, 30, 5);
    g.fill({ color: 0x4caf50 });
  } else if (camada === 'cabeca') {
    g.circle(ancX, ancY - 78, 13);
    g.fill({ color: 0xffcc80 });
  } else if (camada === 'rosto') {
    g.circle(ancX - 4, ancY - 80, 2);
    g.fill({ color: 0x333333 });
    g.circle(ancX + 4, ancY - 80, 2);
    g.fill({ color: 0x333333 });
  } else if (camada === 'cabelo_frente' || camada === 'cabelo_atras') {
    g.roundRect(ancX - 13, ancY - 92, 26, 16, 8);
    g.fill({ color: 0x4e342e });
  }
  // Demais camadas sem placeholder visível
  return g;
}

export class CharacterRenderer {
  private readonly _container: Container;
  private direcaoAtual: DirecaoVisual = 'S';
  private readonly camadas: CamadaCarregada[] = [];
  private readonly config: ConfiguracaoPersonagem;

  constructor(config: ConfiguracaoPersonagem) {
    this.config     = config;
    this._container = new Container();
  }

  async inicializar(_app: Application): Promise<void> {
    const mapeamentoPorCamada: Partial<Record<CamadaPersonagem, string>> = {};

    // Corpo base na camada correta
    const metaCorpo = await carregarMetadataParte(this.config.corpoBase, 'corpo_base');
    if (metaCorpo !== undefined) {
      mapeamentoPorCamada['corpo_base'] = this.config.corpoBase;
    }

    // Demais partes equipadas — descobrir camada pelo metadata
    for (const partId of this.config.partes) {
      for (const camada of ORDEM_CAMADAS) {
        const meta = await carregarMetadataParte(partId, camada);
        if (meta !== undefined) {
          mapeamentoPorCamada[camada] = partId;
          break;
        }
      }
    }

    // Renderizar na ordem de camadas
    let zIdx = 0;
    for (const camada of ORDEM_CAMADAS) {
      const partId = mapeamentoPorCamada[camada];

      if (partId !== undefined) {
        const meta = await carregarMetadataParte(partId, camada);
        if (meta !== undefined) {
          const textura = await carregarTexturaParte(partId, camada, this.direcaoAtual);
          let visual: Sprite | Graphics;
          if (textura !== undefined) {
            const spr = new Sprite(textura);
            spr.anchor.set(
              meta.anchorPixelX / meta.canvasLargura,
              meta.anchorPixelY / meta.canvasAltura,
            );
            visual = spr;
          } else {
            visual = criarPlaceholderCamada(camada);
          }
          visual.zIndex = zIdx;
          this._container.addChild(visual);
          this.camadas.push({ camada, partId, metadata: meta, sprite: visual });
          zIdx += 1;
          continue;
        }
      }

      // Camada sem parte: placeholder
      const placeholder = criarPlaceholderCamada(camada);
      placeholder.zIndex = zIdx;
      this._container.addChild(placeholder);
      zIdx += 1;
    }

    this._container.sortableChildren = true;
  }

  atualizarDirecao(direcao: DirecaoVisual): void {
    if (direcao === this.direcaoAtual) return;
    this.direcaoAtual = direcao;

    for (const entrada of this.camadas) {
      const direcaoAlvo = entrada.metadata.direcoes.includes(direcao)
        ? direcao
        : (entrada.metadata.direcoes[0] ?? direcao);

      void (async () => {
        const textura = await carregarTexturaParte(entrada.partId, entrada.camada, direcaoAlvo);
        if (textura !== undefined && entrada.sprite instanceof Sprite) {
          entrada.sprite.texture = textura;
        }
      })();
    }
  }

  obterContainer(): Container {
    return this._container;
  }

  destruir(): void {
    this._container.destroy({ children: true });
    this.camadas.length = 0;
  }
}
