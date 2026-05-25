import { Application, Container, Graphics, Text } from 'pixi.js';
import type { ComodoDefinition, InteractableObject, PontoDeSaida } from '@core/schemas/location';

type RoomControllerParams = {
  readonly onObjetoClicado?: (objeto: InteractableObject) => void;
  readonly onSaidaClicada?: (saida: PontoDeSaida) => void;
};

const COR_FUNDO = 0x252b33;
const COR_OBJETO = 0x456990;
const COR_OBJETO_HOVER = 0x69a7d8;
const COR_SAIDA = 0xf7b267;
const COR_SAIDA_HOVER = 0xffd08a;

export class RoomController {
  private readonly onObjetoClicado: ((objeto: InteractableObject) => void) | undefined;
  private readonly onSaidaClicada: ((saida: PontoDeSaida) => void) | undefined;
  private readonly spritesPorObjeto = new Map<string, Container>();
  private containerRaiz: Container | undefined;

  constructor(params: RoomControllerParams = {}) {
    this.onObjetoClicado = params.onObjetoClicado;
    this.onSaidaClicada = params.onSaidaClicada;
  }

  carregarComodo(app: Application, comodo: ComodoDefinition): void {
    this.destruir();

    const container = new Container();
    container.label = `comodo:${comodo.id}`;
    this.containerRaiz = container;
    app.stage.addChild(container);

    container.addChild(this.criarBackground(comodo));

    for (const objeto of comodo.objetos) {
      const sprite = this.criarObjetoInterativo(objeto);
      this.spritesPorObjeto.set(objeto.id, sprite);
      container.addChild(sprite);
    }

    for (const saida of comodo.pontosDeSaida) {
      container.addChild(this.criarPontoDeSaida(saida));
    }
  }

  destruir(): void {
    this.spritesPorObjeto.clear();

    if (this.containerRaiz === undefined) return;

    this.containerRaiz.destroy({ children: true });
    this.containerRaiz = undefined;
  }

  obterSpriteDeObjeto(objetoId: string): Container | undefined {
    return this.spritesPorObjeto.get(objetoId);
  }

  private criarBackground(comodo: ComodoDefinition): Container {
    const background = new Container();
    const grafico = new Graphics();

    grafico
      .rect(0, 0, comodo.tamanho.largura, comodo.tamanho.altura)
      .fill({ color: COR_FUNDO });

    const label = new Text({
      text: comodo.nome,
      style: {
        fill: 0xf5f0e8,
        fontFamily: 'Arial, sans-serif',
        fontSize: 26,
        fontWeight: '700',
      },
    });

    label.position.set(24, 20);
    background.addChild(grafico, label);

    return background;
  }

  private criarObjetoInterativo(objeto: InteractableObject): Container {
    const sprite = new Container();
    const grafico = new Graphics();

    sprite.label = `objeto:${objeto.id}`;
    sprite.position.set(objeto.posicao.x, objeto.posicao.y);
    sprite.eventMode = 'static';
    sprite.cursor = 'pointer';

    grafico
      .rect(0, 0, objeto.tamanho.largura, objeto.tamanho.altura)
      .fill({ color: COR_OBJETO });

    const label = new Text({
      text: objeto.tipo,
      style: {
        fill: 0xffffff,
        fontFamily: 'Arial, sans-serif',
        fontSize: 13,
        fontWeight: '700',
        wordWrap: true,
        wordWrapWidth: Math.max(40, objeto.tamanho.largura - 8),
      },
    });

    label.anchor.set(0.5);
    label.position.set(objeto.tamanho.largura / 2, objeto.tamanho.altura / 2);

    sprite.addChild(grafico, label);
    sprite.on('pointerover', () => {
      grafico.tint = COR_OBJETO_HOVER;
    });
    sprite.on('pointerout', () => {
      grafico.tint = 0xffffff;
    });
    sprite.on('pointertap', () => {
      this.onObjetoClicado?.(objeto);
    });

    return sprite;
  }

  private criarPontoDeSaida(saida: PontoDeSaida): Container {
    const sprite = new Container();
    const grafico = new Graphics();
    const rotulo = saida.rotulo ?? 'Sair';

    sprite.label = `saida:${saida.id}`;
    sprite.position.set(saida.posicao.x, saida.posicao.y);
    sprite.eventMode = 'static';
    sprite.cursor = 'pointer';

    grafico
      .circle(0, 0, 16)
      .fill({ color: COR_SAIDA })
      .stroke({ color: 0x3a2a16, width: 2 });

    const label = new Text({
      text: rotulo,
      style: {
        fill: 0xffffff,
        fontFamily: 'Arial, sans-serif',
        fontSize: 12,
        fontWeight: '700',
      },
    });

    label.anchor.set(0.5, 0);
    label.position.set(0, 20);

    sprite.addChild(grafico, label);
    sprite.on('pointerover', () => {
      grafico.tint = COR_SAIDA_HOVER;
    });
    sprite.on('pointerout', () => {
      grafico.tint = 0xffffff;
    });
    sprite.on('pointertap', () => {
      this.onSaidaClicada?.(saida);
    });

    return sprite;
  }
}
