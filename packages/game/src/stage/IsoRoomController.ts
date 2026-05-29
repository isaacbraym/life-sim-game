import { Application, Container, Graphics, Text } from 'pixi.js';
import { tileParaTela, calcularDepth, TILE_W, TILE_H } from '@core/iso/IsoMath';
import type { IsoRoomDefinition, ObjetoIsoDefinicao, SaidaIso } from '@core/schemas/isoRoom';
import { construirGrid } from '@core/iso/GridBuilder';
import type { GridCaminhavel } from '@core/iso/Pathfinder';

const MEIA_LARGURA    = TILE_W / 2;   // 32
const MEIA_ALTURA     = TILE_H / 2;   // 16
const ALTURA_OBJETO   = 28;

/** Altura em pixels das paredes laterais e do fundo — exportado para uso na câmera. */
export const ALTURA_PAREDE_PX = 96;

// ── Paleta estilo Habbo Hotel ──────────────────────────────────────────────
const COR = {
  // Chão – xadrez (dois tons alternados por (tx+ty)%2)
  CHAO_CLARO:          0xb5c9d8,
  CHAO_ESCURO:         0x9ab3c5,
  CHAO_BORDA_CLARA:    0x8fb3c8,
  CHAO_BORDA_ESCURA:   0x7a9aad,
  CHAO_BLOQUEADO:      0x5a2a2a,
  CHAO_BLOQUEADO_BORDA:0x7a3a3a,

  // Paredes
  PAREDE_FUNDO:        0xccd9e4,   // ty=0 — face mais iluminada (luz vem da frente-direita)
  PAREDE_FUNDO_BORDA:  0x8aa0b0,
  PAREDE_ESQ:          0xb8c8d6,   // tx=0 — levemente mais escura
  PAREDE_ESQ_BORDA:    0x7e96a8,
  PILAR:               0x3a5060,

  // Tile de saída
  SAIDA:               0xf7b267,
  SAIDA_BORDA:         0xffd07b,
  SAIDA_HOVER:         0xffe0b2,

  // Objetos/móveis — cubo 3 faces estilo Habbo
  OBJETO_TOPO:         0xa8cba9,   // face superior (mais clara)
  OBJETO_FRENTE:       0x72966e,   // face SW (média)
  OBJETO_LADO:         0x537a50,   // face SE (mais escura)
  OBJETO_BORDA:        0x3d5c41,
} as const;

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
    this.comodo        = comodo;
    this.callbackTile  = aoClicarTile;
    this.callbackSaida = aoClicarSaida;
    this.gridAtual     = construirGrid(comodo, []);

    const cont = new Container();
    cont.sortableChildren = true;
    this.container = cont;
    app.stage.addChild(cont);

    // Ordem: paredes (atrás) → chão → objetos/saídas (frente)
    this.renderizarParedes(cont, comodo);
    this.renderizarPilar(cont, comodo);
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

  // ── Paredes ───────────────────────────────────────────────────────────────

  /**
   * Paredes do fundo (ty=0) como retângulos planos e esquerda (tx=0) como
   * paralelogramos inclinados — visual Habbo Hotel.
   */
  private renderizarParedes(cont: Container, comodo: IsoRoomDefinition): void {
    const H  = ALTURA_PAREDE_PX;
    const hw = MEIA_LARGURA;  // 32
    const hh = MEIA_ALTURA;   // 16

    // ── Parede do fundo (ty = 0) — retângulos planos verticais ──────────────
    for (let tx = 0; tx < comodo.larguraTiles; tx += 1) {
      if (comodo.tiles[0]?.[tx]?.estado === 'vazio') continue;

      const { x, y } = tileParaTela(tx, 0);
      const g = new Graphics();

      g.poly([
        x - hw, y - hh - H,
        x + hw, y - hh - H,
        x + hw, y - hh,
        x - hw, y - hh,
      ]);
      g.fill({ color: COR.PAREDE_FUNDO });

      // Grade: linhas horizontais a cada TILE_H e linha vertical central
      for (let h = TILE_H; h < H; h += TILE_H) {
        g.moveTo(x - hw, y - hh - h).lineTo(x + hw, y - hh - h);
      }
      g.moveTo(x, y - hh - H).lineTo(x, y - hh);
      g.stroke({ color: COR.PAREDE_FUNDO_BORDA, width: 0.5, alpha: 0.5 });

      g.zIndex = calcularDepth(tx, 0) - 100;
      cont.addChild(g);
    }

    // ── Parede esquerda (tx = 0) — paralelogramos inclinados ────────────────
    for (let ty = 0; ty < comodo.alturaTiles; ty += 1) {
      if (comodo.tiles[ty]?.[0]?.estado === 'vazio') continue;

      const { x, y } = tileParaTela(0, ty);
      const g = new Graphics();

      g.poly([
        x - hw, y - hh - H,
        x,      y + hh - H,
        x,      y + hh,
        x - hw, y - hh,
      ]);
      g.fill({ color: COR.PAREDE_ESQ });

      // Grade: linhas diagonais a cada TILE_H de altura
      for (let h = TILE_H; h < H; h += TILE_H) {
        g.moveTo(x - hw, y - hh - h).lineTo(x, y + hh - h);
      }
      g.stroke({ color: COR.PAREDE_ESQ_BORDA, width: 0.5, alpha: 0.5 });

      g.zIndex = calcularDepth(0, ty) - 99;
      cont.addChild(g);
    }
  }

  /** Pilar vertical no canto onde as duas paredes se encontram. */
  private renderizarPilar(cont: Container, comodo: IsoRoomDefinition): void {
    if (comodo.tiles[0]?.[0]?.estado === 'vazio') return;

    const { x, y } = tileParaTela(0, 0);
    const hh = MEIA_ALTURA;
    const H  = ALTURA_PAREDE_PX;

    const g = new Graphics();
    g.rect(x - 4, y - hh - H, 8, H + hh);
    g.fill({ color: COR.PILAR });
    g.zIndex = calcularDepth(0, 0) - 98;
    cont.addChild(g);
  }

  // ── Chão ──────────────────────────────────────────────────────────────────

  private renderizarTiles(comodo: IsoRoomDefinition): void {
    for (let ty = 0; ty < comodo.tiles.length; ty += 1) {
      const linha = comodo.tiles[ty];
      if (linha === undefined) continue;
      for (let tx = 0; tx < linha.length; tx += 1) {
        const tile = linha[tx];
        if (tile === undefined || tile.estado === 'vazio') continue;

        const { x, y } = tileParaTela(tx, ty);
        const ehCaminhavel = tile.estado === 'caminhavel';

        // Xadrez: dois tons alternados por paridade de (tx+ty)
        const corFundo = ehCaminhavel
          ? ((tx + ty) % 2 === 0 ? COR.CHAO_CLARO : COR.CHAO_ESCURO)
          : COR.CHAO_BLOQUEADO;
        const corBorda = ehCaminhavel
          ? ((tx + ty) % 2 === 0 ? COR.CHAO_BORDA_CLARA : COR.CHAO_BORDA_ESCURA)
          : COR.CHAO_BLOQUEADO_BORDA;

        const g = new Graphics();
        g.position.set(x, y);  // posição em coordenadas do container
        g.poly([                // vértices locais (relativos ao centro do tile)
          0,             -MEIA_ALTURA,
          MEIA_LARGURA,   0,
          0,              MEIA_ALTURA,
          -MEIA_LARGURA,  0,
        ]);
        g.fill({ color: corFundo, alpha: ehCaminhavel ? 0.9 : 0.75 });
        g.stroke({ color: corBorda, width: 1 });
        g.zIndex = calcularDepth(tx, ty) - 1;

        if (ehCaminhavel && this.callbackTile !== undefined) {
          g.eventMode = 'static';
          g.cursor    = 'pointer';
          const txC = tx;
          const tyC = ty;
          g.on('pointerover', () => { g.tint = 0xddf0ff; });
          g.on('pointerout',  () => { g.tint = 0xffffff; });
          g.on('pointertap',  () => { this.callbackTile?.(txC, tyC); });
        }

        this.container?.addChild(g);
      }
    }
  }

  // ── Objetos/móveis (cubo 3 faces estilo Habbo) ───────────────────────────

  private renderizarObjeto(objeto: ObjetoIsoDefinicao): void {
    const { x, y } = tileParaTela(objeto.tileX, objeto.tileY);
    const H = ALTURA_OBJETO;

    // Face superior — losango elevado H px acima do chão
    const topo = new Graphics();
    topo.poly([
      x,                y - MEIA_ALTURA - H,
      x + MEIA_LARGURA, y - H,
      x,                y + MEIA_ALTURA - H,
      x - MEIA_LARGURA, y - H,
    ]);
    topo.fill({ color: COR.OBJETO_TOPO });
    topo.stroke({ color: COR.OBJETO_BORDA, width: 1 });

    // Face SW (frente) — face mais clara do Habbo (recebe mais luz)
    const frente = new Graphics();
    frente.poly([
      x - MEIA_LARGURA, y - H,
      x,                y + MEIA_ALTURA - H,
      x,                y + MEIA_ALTURA,
      x - MEIA_LARGURA, y,
    ]);
    frente.fill({ color: COR.OBJETO_FRENTE });
    frente.stroke({ color: COR.OBJETO_BORDA, width: 1 });

    // Face SE (lado) — face mais escura
    const lado = new Graphics();
    lado.poly([
      x,                y + MEIA_ALTURA - H,
      x + MEIA_LARGURA, y - H,
      x + MEIA_LARGURA, y,
      x,                y + MEIA_ALTURA,
    ]);
    lado.fill({ color: COR.OBJETO_LADO });
    lado.stroke({ color: COR.OBJETO_BORDA, width: 1 });

    // Rótulo discreto acima do objeto
    const rotulo = new Text({
      text:  objeto.furnitureId,
      style: { fill: '#e8f4f8', fontSize: 9, fontFamily: 'monospace' },
    });
    rotulo.anchor.set(0.5, 1);
    rotulo.position.set(x, y - MEIA_ALTURA - H - 2);

    const profundidade = calcularDepth(objeto.tileX, objeto.tileY);
    topo.zIndex    = profundidade;
    frente.zIndex  = profundidade;
    lado.zIndex    = profundidade;
    rotulo.zIndex  = profundidade + 0.01;

    this.container?.addChild(topo, frente, lado, rotulo);
  }

  // ── Saídas ────────────────────────────────────────────────────────────────

  private renderizarSaida(saida: SaidaIso): void {
    const { x, y } = tileParaTela(saida.tileX, saida.tileY);

    const g = new Graphics();
    g.position.set(x, y);
    g.poly([
      0,             -MEIA_ALTURA,
      MEIA_LARGURA,   0,
      0,              MEIA_ALTURA,
      -MEIA_LARGURA,  0,
    ]);
    g.fill({ color: COR.SAIDA, alpha: 0.8 });
    g.stroke({ color: COR.SAIDA_BORDA, width: 2 });
    g.zIndex    = calcularDepth(saida.tileX, saida.tileY) - 0.5;
    g.eventMode = 'static';
    g.cursor    = 'pointer';
    g.on('pointerover', () => { g.tint = 0xffe0b2; });
    g.on('pointerout',  () => { g.tint = 0xffffff; });
    g.on('pointertap',  () => { this.callbackSaida?.(saida.id); });

    this.container?.addChild(g);
  }
}
