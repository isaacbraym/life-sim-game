import { Application, Container, Graphics, Text } from 'pixi.js';
import { tileParaTela, calcularDepth, TILE_W, TILE_H } from '@core/iso/IsoMath';
import type { IsoRoomDefinition, ObjetoIsoDefinicao, SaidaIso } from '@core/schemas/isoRoom';
import { construirGrid } from '@core/iso/GridBuilder';
import type { GridCaminhavel } from '@core/iso/Pathfinder';

const MEIA_LARGURA = TILE_W / 2; // 32
const MEIA_ALTURA  = TILE_H / 2; // 16
const ALTURA_OBJETO = 28;

const COR_TILE_CAMINHAVEL = 0x3d5a73;
const COR_TILE_BLOQUEADO  = 0x5a2a2a;
const COR_TILE_SAIDA      = 0xf7b267;
const COR_OBJETO_TOPO     = 0x6b8f71;
const COR_OBJETO_FRENTE   = 0x4a6b50;
const COR_OBJETO_LADO     = 0x3a5540;

export class IsoRoomController {
  private comodo: IsoRoomDefinition | undefined;
  private container: Container | undefined;
  private gridAtual: GridCaminhavel = [];
  private callbackTile: ((tx: number, ty: number) => void) | undefined;
  private callbackSaida: ((saidaId: string) => void) | undefined;

  carregarComodo(
    app: Application,
    comodo: IsoRoomDefinition,
    aoClicarTile?: (tx: number, ty: number) => void,
    aoClicarSaida?: (saidaId: string) => void,
  ): void {
    this.destruir();
    this.comodo       = comodo;
    this.callbackTile  = aoClicarTile;
    this.callbackSaida = aoClicarSaida;
    this.gridAtual = construirGrid(comodo, []);

    const cont = new Container();
    cont.sortableChildren = true;
    this.container = cont;
    app.stage.addChild(cont);

    this.renderizarTiles(comodo);
    for (const objeto of comodo.objetos) {
      this.renderizarObjeto(objeto);
    }
    for (const saida of comodo.saidas) {
      this.renderizarSaida(saida);
    }
  }

  obterGrid(): GridCaminhavel {
    return this.gridAtual;
  }

  obterComodo(): IsoRoomDefinition | undefined {
    return this.comodo;
  }

  atualizarGrid(npcs: readonly { tileX: number; tileY: number }[] = []): void {
    if (this.comodo !== undefined) {
      this.gridAtual = construirGrid(this.comodo, npcs);
    }
  }

  destruir(): void {
    this.container?.destroy({ children: true });
    this.container     = undefined;
    this.comodo        = undefined;
    this.gridAtual     = [];
    this.callbackTile  = undefined;
    this.callbackSaida = undefined;
  }

  private renderizarTiles(comodo: IsoRoomDefinition): void {
    for (let ty = 0; ty < comodo.tiles.length; ty += 1) {
      const linha = comodo.tiles[ty];
      if (linha === undefined) continue;
      for (let tx = 0; tx < linha.length; tx += 1) {
        const tile = linha[tx];
        if (tile === undefined || tile.estado === 'vazio') continue;

        const { x, y } = tileParaTela(tx, ty);
        const ehCaminhavel = tile.estado === 'caminhavel';
        const corFundo = ehCaminhavel ? COR_TILE_CAMINHAVEL : COR_TILE_BLOQUEADO;
        const corBorda  = ehCaminhavel ? 0x5d8099 : 0x7a3a3a;

        const g = new Graphics();
        g.poly([
          x, y - MEIA_ALTURA,
          x + MEIA_LARGURA, y,
          x, y + MEIA_ALTURA,
          x - MEIA_LARGURA, y,
        ]);
        g.fill({ color: corFundo, alpha: 0.85 });
        g.stroke({ color: corBorda, width: 1 });
        g.zIndex = calcularDepth(tx, ty) - 1;

        if (ehCaminhavel && this.callbackTile !== undefined) {
          g.eventMode = 'static';
          g.cursor    = 'pointer';
          const txCapturado = tx;
          const tyCapturado = ty;
          g.on('pointerover', () => { g.tint = 0xaaddff; });
          g.on('pointerout',  () => { g.tint = 0xffffff; });
          g.on('pointertap',  () => { this.callbackTile?.(txCapturado, tyCapturado); });
        }

        this.container?.addChild(g);
      }
    }
  }

  private renderizarObjeto(objeto: ObjetoIsoDefinicao): void {
    const { x, y } = tileParaTela(objeto.tileX, objeto.tileY);
    const H = ALTURA_OBJETO;

    // Face superior (topo)
    const topo = new Graphics();
    topo.poly([
      x,                y - MEIA_ALTURA - H,
      x + MEIA_LARGURA, y - H,
      x,                y + MEIA_ALTURA - H,
      x - MEIA_LARGURA, y - H,
    ]);
    topo.fill({ color: COR_OBJETO_TOPO, alpha: 0.9 });
    topo.stroke({ color: 0x8ab89a, width: 1 });

    // Face SW (frente)
    const frente = new Graphics();
    frente.poly([
      x - MEIA_LARGURA, y - H,
      x,                y + MEIA_ALTURA - H,
      x,                y + MEIA_ALTURA,
      x - MEIA_LARGURA, y,
    ]);
    frente.fill({ color: COR_OBJETO_FRENTE, alpha: 0.9 });
    frente.stroke({ color: 0x5a7d60, width: 1 });

    // Face SE (lado)
    const lado = new Graphics();
    lado.poly([
      x,                y + MEIA_ALTURA - H,
      x + MEIA_LARGURA, y - H,
      x + MEIA_LARGURA, y,
      x,                y + MEIA_ALTURA,
    ]);
    lado.fill({ color: COR_OBJETO_LADO, alpha: 0.9 });
    lado.stroke({ color: 0x4a6b50, width: 1 });

    // Rótulo
    const rotulo = new Text({
      text: objeto.furnitureId,
      style: { fill: '#d4edda', fontSize: 9, fontFamily: 'monospace' },
    });
    rotulo.anchor.set(0.5, 1);
    rotulo.x = x;
    rotulo.y = y - MEIA_ALTURA - H - 2;

    const profundidade = calcularDepth(objeto.tileX, objeto.tileY);
    topo.zIndex    = profundidade;
    frente.zIndex  = profundidade;
    lado.zIndex    = profundidade;
    rotulo.zIndex  = profundidade + 0.01;

    this.container?.addChild(topo, frente, lado, rotulo);
  }

  private renderizarSaida(saida: SaidaIso): void {
    const { x, y } = tileParaTela(saida.tileX, saida.tileY);

    const g = new Graphics();
    g.poly([
      x, y - MEIA_ALTURA,
      x + MEIA_LARGURA, y,
      x, y + MEIA_ALTURA,
      x - MEIA_LARGURA, y,
    ]);
    g.fill({ color: COR_TILE_SAIDA, alpha: 0.75 });
    g.stroke({ color: 0xffd07b, width: 2 });
    g.zIndex = calcularDepth(saida.tileX, saida.tileY) - 0.5;
    g.eventMode = 'static';
    g.cursor    = 'pointer';
    g.on('pointerover', () => { g.tint = 0xffe0b2; });
    g.on('pointerout',  () => { g.tint = 0xffffff; });
    g.on('pointertap',  () => { this.callbackSaida?.(saida.id); });

    this.container?.addChild(g);
  }
}
