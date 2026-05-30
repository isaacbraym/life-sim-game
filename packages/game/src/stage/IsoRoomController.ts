import { Application, Container, Graphics, Text } from 'pixi.js';
import { gsap } from 'gsap';
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

// ── Helpers de cor por categoria de móvel ─────────────────────────────────

function deslocarCor(cor: number, delta: number): number {
  const r = Math.min(255, Math.max(0, ((cor >> 16) & 0xff) + delta));
  const g = Math.min(255, Math.max(0, ((cor >> 8)  & 0xff) + delta));
  const b = Math.min(255, Math.max(0, (cor & 0xff)          + delta));
  return (r << 16) | (g << 8) | b;
}

function corBasePorFurniture(furnitureId: string): number {
  if (furnitureId.includes('cama'))                                          return 0x8b6f8b;
  if (furnitureId.includes('sofa')   || furnitureId.includes('cadeira') ||
      furnitureId.includes('poltrona'))                                      return 0x6b8b6b;
  if (furnitureId.includes('tv')     || furnitureId.includes('computador')) return 0x4a6b8b;
  if (furnitureId.includes('mesa')   || furnitureId.includes('escrivaninha')) return 0x8b7b5b;
  if (furnitureId.includes('guarda') || furnitureId.includes('armario') ||
      furnitureId.includes('estante'))                                       return 0x7b6b4b;
  return 0x5a7a6a;
}

// ─────────────────────────────────────────────────────────────────────────

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

  /** Marcador branco pulsante no tile clicado — confirma destino acessível. */
  mostrarMarcadorDestino(tx: number, ty: number): void {
    if (this.container === undefined) return;
    const { x, y } = tileParaTela(tx, ty);

    const marcador = new Graphics();
    marcador.circle(0, 0, 14).fill({ color: 0xffffff, alpha: 0.45 });
    marcador.position.set(x, y);
    marcador.zIndex = 9998;
    this.container.addChild(marcador);

    gsap.to(marcador, {
      alpha:    0,
      duration: 0.8,
      onComplete: () => { marcador.destroy(); },
    });
  }

  /** Flash vermelho rápido — sinaliza que o tile está bloqueado. */
  flashTileBloqueado(tx: number, ty: number): void {
    if (this.container === undefined) return;
    const { x, y } = tileParaTela(tx, ty);
    const hw = MEIA_LARGURA;
    const hh = MEIA_ALTURA;

    const flash = new Graphics();
    flash.poly([
      { x: 0,   y: -hh },
      { x: hw,  y: 0   },
      { x: 0,   y: hh  },
      { x: -hw, y: 0   },
    ]).fill({ color: 0xff4444, alpha: 0.65 });
    flash.position.set(x, y);
    flash.zIndex = 9999;
    this.container.addChild(flash);

    gsap.to(flash, {
      alpha:    0,
      duration: 0.4,
      onComplete: () => { flash.destroy(); },
    });
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

    // ── Parede do fundo (ty = 0) — paralelogramo seguindo a perspectiva ─────
    // Base: vértice topo de (tx,0) → vértice topo de (tx+1,0)
    // Em tela: (x, y-hh) → (x+hw, y)  [aresta top-direita do diamond]
    for (let tx = 0; tx < comodo.larguraTiles; tx += 1) {
      if (comodo.tiles[0]?.[tx]?.estado === 'vazio') continue;

      const { x, y } = tileParaTela(tx, 0);
      const g = new Graphics();

      g.poly([
        { x: x,      y: y - hh },       // base-esquerda  (topo do diamond tx,0)
        { x: x + hw, y: y },             // base-direita   (topo do diamond tx+1,0)
        { x: x + hw, y: y - H },         // topo-direita
        { x: x,      y: y - hh - H },    // topo-esquerda
      ]);
      g.fill({ color: COR.PAREDE_FUNDO });

      // Grade: linhas horizontais isométricas (ligeiramente inclinadas)
      for (let h = TILE_H; h < H; h += TILE_H) {
        g.moveTo(x, y - hh - h).lineTo(x + hw, y - h);
      }
      g.stroke({ color: COR.PAREDE_FUNDO_BORDA, width: 0.5, alpha: 0.5 });

      g.zIndex = -10;
      cont.addChild(g);
    }

    // ── Parede esquerda (tx = 0) — paralelogramo seguindo a perspectiva ─────
    // Base: vértice topo de (0,ty) → vértice topo de (0,ty+1)
    // Em tela: (x, y-hh) → (x-hw, y)  [aresta top-esquerda do diamond]
    for (let ty = 0; ty < comodo.alturaTiles; ty += 1) {
      if (comodo.tiles[ty]?.[0]?.estado === 'vazio') continue;

      const { x, y } = tileParaTela(0, ty);
      const g = new Graphics();

      g.poly([
        { x: x,      y: y - hh },       // base-frente  (topo do diamond 0,ty)
        { x: x - hw, y: y },             // base-fundo   (topo do diamond 0,ty+1)
        { x: x - hw, y: y - H },         // topo-fundo
        { x: x,      y: y - hh - H },    // topo-frente
      ]);
      g.fill({ color: COR.PAREDE_ESQ });

      // Grade: linhas horizontais isométricas (inclinadas para a esquerda)
      for (let h = TILE_H; h < H; h += TILE_H) {
        g.moveTo(x, y - hh - h).lineTo(x - hw, y - h);
      }
      g.stroke({ color: COR.PAREDE_ESQ_BORDA, width: 0.5, alpha: 0.5 });

      g.zIndex = -9;
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
    g.zIndex = -8;
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
        // Todos os tiles não-vazio renderizam com cor de chão (xadrez) — sem dark red.
        // Interatividade apenas para tiles 'caminhavel' no JSON.
        const ehCaminhavel = tile.estado === 'caminhavel';
        const corFundo = (tx + ty) % 2 === 0 ? COR.CHAO_CLARO : COR.CHAO_ESCURO;
        const corBorda = (tx + ty) % 2 === 0 ? COR.CHAO_BORDA_CLARA : COR.CHAO_BORDA_ESCURA;

        const g = new Graphics();
        g.position.set(x, y);  // posição em coordenadas do container
        g.poly([                // vértices locais (relativos ao centro do tile)
          0,             -MEIA_ALTURA,
          MEIA_LARGURA,   0,
          0,              MEIA_ALTURA,
          -MEIA_LARGURA,  0,
        ]);
        g.fill({ color: corFundo, alpha: 0.9 });
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
    const H  = ALTURA_OBJETO;
    const hw = MEIA_LARGURA;
    const hh = MEIA_ALTURA;

    const corBase   = corBasePorFurniture(objeto.furnitureId);
    const corTopo   = deslocarCor(corBase,  32);
    const corFrente = corBase;
    const corLado   = deslocarCor(corBase, -16);
    const corBorda  = deslocarCor(corBase, -48);

    // Face superior — losango elevado H px acima do chão
    const topo = new Graphics();
    topo.poly([
      x,      y - hh - H,
      x + hw, y - H,
      x,      y + hh - H,
      x - hw, y - H,
    ]);
    topo.fill({ color: corTopo });
    topo.stroke({ color: corBorda, width: 1 });

    // Face SW (frente)
    const frente = new Graphics();
    frente.poly([
      x - hw, y - H,
      x,      y + hh - H,
      x,      y + hh,
      x - hw, y,
    ]);
    frente.fill({ color: corFrente });
    frente.stroke({ color: corBorda, width: 1 });

    // Face SE (lado)
    const lado = new Graphics();
    lado.poly([
      x,      y + hh - H,
      x + hw, y - H,
      x + hw, y,
      x,      y + hh,
    ]);
    lado.fill({ color: corLado });
    lado.stroke({ color: corBorda, width: 1 });

    // Rótulo — visível apenas no hover
    const rotulo = new Text({
      text:  objeto.furnitureId,
      style: { fill: '#e8f4f8', fontSize: 9, fontFamily: 'monospace' },
    });
    rotulo.anchor.set(0.5, 1);
    rotulo.position.set(x, y - hh - H - 2);
    rotulo.visible = false;

    const mostrarLabel  = () => { rotulo.visible = true; };
    const esconderLabel = () => { rotulo.visible = false; };
    for (const face of [topo, frente, lado]) {
      face.eventMode = 'static';
      face.on('pointerenter', mostrarLabel);
      face.on('pointerleave', esconderLabel);
    }

    const profundidade = calcularDepth(objeto.tileX, objeto.tileY);
    topo.zIndex    = profundidade;
    frente.zIndex  = profundidade;
    lado.zIndex    = profundidade;
    rotulo.zIndex  = profundidade + 0.01;

    this.container?.addChild(topo, frente, lado, rotulo);

    // Overlays nos tiles secundários do footprint (cor do móvel + borda + cruz)
    for (const offset of objeto.bloqueaTiles) {
      if (offset.dx === 0 && offset.dy === 0) continue;
      const tileX = objeto.tileX + offset.dx;
      const tileY = objeto.tileY + offset.dy;
      const { x: ox, y: oy } = tileParaTela(tileX, tileY);

      const overlay = new Graphics();
      overlay.poly([
        { x: 0,   y: -hh },
        { x: hw,  y: 0   },
        { x: 0,   y: hh  },
        { x: -hw, y: 0   },
      ]).fill({ color: corBase, alpha: 0.5 });
      overlay.poly([
        { x: 0,   y: -hh },
        { x: hw,  y: 0   },
        { x: 0,   y: hh  },
        { x: -hw, y: 0   },
      ]).stroke({ color: corBase, width: 2, alpha: 0.8 });
      // Cruz no centro — sinaliza tile bloqueado
      overlay.moveTo(-8, 0).lineTo(8, 0);
      overlay.moveTo(0, -4).lineTo(0, 4);
      overlay.stroke({ color: 0xffffff, width: 1, alpha: 0.5 });

      overlay.position.set(ox, oy);
      overlay.zIndex = calcularDepth(tileX, tileY) - 0.5;
      this.container?.addChild(overlay);
    }
  }

  // ── Saídas ────────────────────────────────────────────────────────────────

  private renderizarSaida(saida: SaidaIso): void {
    const comodo = this.comodo;
    if (comodo === undefined || this.container === undefined) return;

    // Tile de saída renderizado FORA do cômodo — um passo além da borda
    let visualTx = saida.tileX;
    let visualTy = saida.tileY;
    if      (saida.tileY === comodo.alturaTiles  - 1) visualTy += 1;
    else if (saida.tileY === 0)                        visualTy -= 1;
    else if (saida.tileX === comodo.larguraTiles - 1)  visualTx += 1;
    else                                               visualTx -= 1;
    const { x, y } = tileParaTela(visualTx, visualTy);
    const hw = MEIA_LARGURA;
    const hh = MEIA_ALTURA;

    const g = new Graphics();

    // Losango dourado na borda — mesmo nível do chão
    g.poly([
      { x: 0,   y: -hh },
      { x: hw,  y: 0   },
      { x: 0,   y: hh  },
      { x: -hw, y: 0   },
    ]).fill({ color: 0xd4a853 });
    g.poly([
      { x: 0,   y: -hh },
      { x: hw,  y: 0   },
      { x: 0,   y: hh  },
      { x: -hw, y: 0   },
    ]).stroke({ color: 0xb8862e, width: 1.5 });

    // Seta indicando direção de saída (aponta para fora do cômodo)
    const setaDx = saida.tileX === 0 ? -1 :
                   saida.tileX === comodo.larguraTiles - 1 ? 1 : 0;
    const setaDy = saida.tileY === 0 ? -1 :
                   saida.tileY === comodo.alturaTiles  - 1 ? 1 : 0;
    const setaX  = (setaDx - setaDy) * 10;
    const setaY  = (setaDx + setaDy) * 5;

    // Seta desenhada diretamente em g (Graphics v8 não aceita addChild)
    g.poly([
      { x: setaX,     y: setaY - 6 },
      { x: setaX + 6, y: setaY + 4 },
      { x: setaX - 6, y: setaY + 4 },
    ]).fill({ color: 0xffffff, alpha: 0.8 });

    // Clicar inicia caminhada — ao chegar, IsoExplorationScene dispara onSaida (Fix 2c)
    g.eventMode = 'static';
    g.cursor    = 'pointer';
    g.on('pointerenter', () => { g.tint = 0xffe0a0; });
    g.on('pointerleave', () => { g.tint = 0xffffff; });
    g.on('pointertap',   () => { this.callbackTile?.(saida.tileX, saida.tileY); });

    g.position.set(x, y);
    g.zIndex = calcularDepth(visualTx, visualTy) + 0.2;
    this.container.addChild(g);
  }
}
