import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { Application, Graphics, Text } from 'pixi.js';
import { tileParaTela, telaParaTile, type IsoRoomDefinition } from '@lifesim/core';
import { PixiCanvas } from '../../shared/PixiCanvas';

type PropsCanvasIso = {
  readonly comodo: IsoRoomDefinition;
};

type ModoVisualizacao = 'editor' | 'jogo';

const CORES_TILE: Record<IsoRoomDefinition['tiles'][number][number]['estado'], number> = {
  caminhavel: 0x4a5568,
  bloqueado: 0x742a2a,
  vazio: 0x000000,
};

// Canvas fixo do personagem (spec: 64×96, âncora em (32, 90))
const SILHUETA_W  = 64;
const SILHUETA_H  = 96;
const SILHUETA_AX = 32;
const SILHUETA_AY = 90;

// Visual do jogo — mesmas constantes do IsoRoomController
const ALTURA_PAREDE_PX = 96;
const COR_JOGO = {
  CHAO_CLARO:       0xb5c9d8,
  CHAO_ESCURO:      0x9ab3c5,
  CHAO_BORDA_CLARA: 0x8fb3c8,
  CHAO_BORDA_ESC:   0x7a9aad,
  CHAO_BLOQUEADO:   0x5a2a2a,
  CHAO_BLOQ_BORDA:  0x7a3a3a,
  PAREDE_FUNDO:     0xccd9e4,
  PAREDE_FUNDO_B:   0x8aa0b0,
  PAREDE_ESQ:       0xb8c8d6,
  PAREDE_ESQ_B:     0x7e96a8,
  PILAR:            0x3a5060,
  SAIDA:            0xf7b267,
  SAIDA_BORDA:      0xffd07b,
  OBJETO_TOPO:      0xa8cba9,
  OBJETO_FRENTE:    0x72966e,
  OBJETO_LADO:      0x537a50,
  OBJETO_BORDA:     0x3d5c41,
} as const;

export function CanvasIsoDoComodo({ comodo }: PropsCanvasIso) {
  const appRef    = useRef<Application | undefined>();
  const comodoRef = useRef(comodo);
  const tamanhoCanvas = useMemo(() => calcularTamanhoCanvas(comodo), [comodo]);

  const [modo, setModo]                           = useState<ModoVisualizacao>('editor');
  const [mostrarReferencia, setMostrarReferencia] = useState(false);
  const [tileRef, setTileRef]                     = useState<{ tx: number; ty: number } | undefined>();

  useEffect(() => {
    comodoRef.current = comodo;
    setTileRef(undefined);
  }, [comodo]);

  const renderizarTudo = useCallback((app: Application) => {
    if (modo === 'jogo') {
      desenharComodoJogo(app, comodoRef.current);
    } else {
      desenharComodoIso(app, comodoRef.current);
      if (mostrarReferencia && tileRef !== undefined) {
        desenharSilhuetaPersonagem(app, comodoRef.current, tileRef.tx, tileRef.ty);
      }
    }
  }, [modo, mostrarReferencia, tileRef]);

  const aoInicializar = useCallback((app: Application) => {
    appRef.current = app;
    renderizarTudo(app);
  }, [renderizarTudo]);

  useEffect(() => {
    if (appRef.current !== undefined) renderizarTudo(appRef.current);
  }, [comodo, renderizarTudo]);

  const aoClicarCanvas = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!mostrarReferencia || modo === 'jogo') return;
    const div    = e.currentTarget;
    const rect   = div.getBoundingClientRect();
    const clicX  = e.clientX - rect.left;
    const clicY  = e.clientY - rect.top;
    const origem = origemDoComodo(comodoRef.current);
    const { tx, ty } = telaParaTile(clicX - origem.x, clicY - origem.y);
    const comodoAtual = comodoRef.current;
    const dentroGrade =
      tx >= 0 && ty >= 0 &&
      tx < comodoAtual.larguraTiles && ty < comodoAtual.alturaTiles;
    if (dentroGrade) setTileRef({ tx, ty });
  }, [mostrarReferencia, modo]);

  return (
    <div>
      {/* Toggle de modo */}
      <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setModo('editor')}
          style={estiloToggle(modo === 'editor')}
        >
          Modo Editor
        </button>
        <button
          type="button"
          onClick={() => setModo('jogo')}
          style={estiloToggle(modo === 'jogo')}
        >
          Modo Jogo
        </button>

        {modo === 'editor' && (
          <button
            type="button"
            onClick={() => {
              setMostrarReferencia(v => !v);
              setTileRef(undefined);
            }}
            style={{
              padding: '4px 12px',
              fontSize: 13,
              cursor: 'pointer',
              background: mostrarReferencia ? '#2b6cb0' : '#2d3748',
              color: '#e2e8f0',
              border: '1px solid #4a5568',
              borderRadius: 4,
            }}
          >
            Ref. escala {mostrarReferencia ? '(ativo — clique num tile)' : ''}
          </button>
        )}
      </div>

      <div onClick={aoClicarCanvas} style={{ cursor: mostrarReferencia && modo === 'editor' ? 'crosshair' : 'default' }}>
        <PixiCanvas
          largura={tamanhoCanvas.largura}
          altura={tamanhoCanvas.altura}
          aoInicializar={aoInicializar}
        />
      </div>
    </div>
  );
}

function estiloToggle(ativo: boolean): React.CSSProperties {
  return {
    padding: '4px 14px',
    fontSize: 13,
    cursor: 'pointer',
    background: ativo ? '#2b6cb0' : '#2d3748',
    color: '#e2e8f0',
    border: `1px solid ${ativo ? '#63b3ed' : '#4a5568'}`,
    borderRadius: 4,
    fontWeight: ativo ? 600 : 400,
  };
}

function calcularTamanhoCanvas(comodo: IsoRoomDefinition): { largura: number; altura: number } {
  return {
    largura: Math.max(560, (comodo.larguraTiles + comodo.alturaTiles) * 32 + 160),
    altura:  Math.max(420, (comodo.larguraTiles + comodo.alturaTiles) * 16 + ALTURA_PAREDE_PX + 120),
  };
}

function origemDoComodo(comodo: IsoRoomDefinition): { x: number; y: number } {
  return {
    x: comodo.alturaTiles * 32 + 80,
    y: ALTURA_PAREDE_PX + 80,
  };
}

function pontoTile(
  comodo: IsoRoomDefinition,
  tx: number,
  ty: number,
): { x: number; y: number } {
  const origem = origemDoComodo(comodo);
  const tela = tileParaTela(tx, ty);
  return { x: origem.x + tela.x, y: origem.y + tela.y };
}

// ─── Modo Editor ──────────────────────────────────────────────────────────────

function desenharComodoIso(app: Application, comodo: IsoRoomDefinition) {
  app.stage.removeChildren();

  const titulo = new Text({
    text: `${comodo.nome} (${comodo.larguraTiles}x${comodo.alturaTiles}) — Editor`,
    style: { fill: '#e2e8f0', fontSize: 15, fontFamily: 'monospace', fontWeight: 'bold' },
  });
  titulo.x = 16;
  titulo.y = 16;
  app.stage.addChild(titulo);

  for (let ty = 0; ty < comodo.tiles.length; ty += 1) {
    const linha = comodo.tiles[ty];
    if (linha === undefined) continue;
    for (let tx = 0; tx < linha.length; tx += 1) {
      const tile = linha[tx];
      if (tile === undefined || tile.estado === 'vazio') continue;
      desenharLosango(app, comodo, tx, ty, CORES_TILE[tile.estado], tile.estado === 'bloqueado' ? 0xe53e3e : 0xa0aec0, 0.88);
    }
  }

  for (const objeto of comodo.objetos) {
    for (const offset of objeto.bloqueaTiles) {
      desenharLosango(app, comodo, objeto.tileX + offset.dx, objeto.tileY + offset.dy, 0x3182ce, 0x63b3ed, 0.38);
    }

    const principal = pontoTile(comodo, objeto.tileX, objeto.tileY);
    const label = new Text({
      text: objeto.furnitureId,
      style: { fill: '#bee3f8', fontSize: 10, fontFamily: 'monospace' },
    });
    label.x = principal.x - 24;
    label.y = principal.y - 32;
    app.stage.addChild(label);
  }

  for (const saida of comodo.saidas) {
    desenharLosango(app, comodo, saida.tileX, saida.tileY, 0x22543d, 0x68d391, 0.4, 3);
    desenharSetaSaida(app, comodo, saida.tileX, saida.tileY);
  }
}

function desenharLosango(
  app: Application,
  comodo: IsoRoomDefinition,
  tx: number,
  ty: number,
  cor: number,
  borda: number,
  alpha: number,
  larguraBorda = 1,
) {
  const { x, y } = pontoTile(comodo, tx, ty);
  const grafico = new Graphics();
  grafico.poly([x, y - 16, x + 32, y, x, y + 16, x - 32, y]);
  grafico.fill({ color: cor, alpha });
  grafico.stroke({ color: borda, width: larguraBorda });
  app.stage.addChild(grafico);
}

function desenharSetaSaida(app: Application, comodo: IsoRoomDefinition, tx: number, ty: number) {
  const { x, y } = pontoTile(comodo, tx, ty);
  const seta = new Graphics();
  seta.moveTo(x - 9, y + 2);
  seta.lineTo(x + 9, y + 2);
  seta.moveTo(x + 9, y + 2);
  seta.lineTo(x + 2, y - 5);
  seta.moveTo(x + 9, y + 2);
  seta.lineTo(x + 2, y + 9);
  seta.stroke({ color: 0x9ae6b4, width: 2 });
  app.stage.addChild(seta);
}

function desenharSilhuetaPersonagem(
  app: Application,
  comodo: IsoRoomDefinition,
  tx: number,
  ty: number,
): void {
  const { x, y } = pontoTile(comodo, tx, ty);
  const esqX  = x - SILHUETA_AX;
  const topoY = y - SILHUETA_AY;

  const silhueta = new Graphics();
  silhueta.rect(esqX, topoY, SILHUETA_W, SILHUETA_H);
  silhueta.fill({ color: 0x48bb78, alpha: 0.22 });
  silhueta.stroke({ color: 0x68d391, width: 1.5 });

  const marcaAncora = new Graphics();
  marcaAncora.moveTo(x - 12, y);
  marcaAncora.lineTo(x + 12, y);
  marcaAncora.stroke({ color: 0xf6ad55, width: 1.5 });

  const ponto = new Graphics();
  ponto.circle(x, y, 3);
  ponto.fill({ color: 0xf6ad55 });

  const rotulo = new Text({
    text: `(${tx}, ${ty})  64×96  ⚓(${SILHUETA_AX},${SILHUETA_AY})`,
    style: { fill: '#f6e05e', fontSize: 10, fontFamily: 'monospace' },
  });
  rotulo.x = esqX;
  rotulo.y = topoY - 14;

  app.stage.addChild(silhueta, marcaAncora, ponto, rotulo);
}

// ─── Modo Jogo ────────────────────────────────────────────────────────────────
// Duplica a lógica do IsoRoomController (<60 linhas) para evitar dependência
// do pacote @lifesim/game dentro de dev-tools.

function desenharComodoJogo(app: Application, comodo: IsoRoomDefinition): void {
  app.stage.removeChildren();

  const titulo = new Text({
    text: `${comodo.nome} — Jogo`,
    style: { fill: '#c4f0ff', fontSize: 14, fontFamily: 'monospace', fontWeight: 'bold' },
  });
  titulo.x = 16;
  titulo.y = 16;
  app.stage.addChild(titulo);

  const hw = 32;
  const hh = 16;
  const H  = ALTURA_PAREDE_PX;

  // 1. Paredes do fundo (ty=0)
  for (let tx = 0; tx < comodo.larguraTiles; tx += 1) {
    if (comodo.tiles[0]?.[tx]?.estado === 'vazio') continue;
    const { x, y } = pontoTile(comodo, tx, 0);
    const g = new Graphics();
    g.poly([x - hw, y - hh - H, x + hw, y - hh - H, x + hw, y - hh, x - hw, y - hh]);
    g.fill({ color: COR_JOGO.PAREDE_FUNDO });
    for (let h = 32; h < H; h += 32) {
      g.moveTo(x - hw, y - hh - h).lineTo(x + hw, y - hh - h);
    }
    g.moveTo(x, y - hh - H).lineTo(x, y - hh);
    g.stroke({ color: COR_JOGO.PAREDE_FUNDO_B, width: 0.5, alpha: 0.5 });
    app.stage.addChild(g);
  }

  // 2. Paredes esquerda (tx=0)
  for (let ty = 0; ty < comodo.alturaTiles; ty += 1) {
    if (comodo.tiles[ty]?.[0]?.estado === 'vazio') continue;
    const { x, y } = pontoTile(comodo, 0, ty);
    const g = new Graphics();
    g.poly([x - hw, y - hh - H, x, y + hh - H, x, y + hh, x - hw, y - hh]);
    g.fill({ color: COR_JOGO.PAREDE_ESQ });
    for (let h = 32; h < H; h += 32) {
      g.moveTo(x - hw, y - hh - h).lineTo(x, y + hh - h);
    }
    g.stroke({ color: COR_JOGO.PAREDE_ESQ_B, width: 0.5, alpha: 0.5 });
    app.stage.addChild(g);
  }

  // 3. Pilar no canto
  if (comodo.tiles[0]?.[0]?.estado !== 'vazio') {
    const { x, y } = pontoTile(comodo, 0, 0);
    const g = new Graphics();
    g.rect(x - 4, y - hh - H, 8, H + hh);
    g.fill({ color: COR_JOGO.PILAR });
    app.stage.addChild(g);
  }

  // 4. Chão
  for (let ty = 0; ty < comodo.tiles.length; ty += 1) {
    const linha = comodo.tiles[ty];
    if (linha === undefined) continue;
    for (let tx = 0; tx < linha.length; tx += 1) {
      const tile = linha[tx];
      if (tile === undefined || tile.estado === 'vazio') continue;
      const { x, y } = pontoTile(comodo, tx, ty);
      const caminhavel = tile.estado === 'caminhavel';
      const corF = caminhavel ? ((tx + ty) % 2 === 0 ? COR_JOGO.CHAO_CLARO : COR_JOGO.CHAO_ESCURO) : COR_JOGO.CHAO_BLOQUEADO;
      const corB = caminhavel ? ((tx + ty) % 2 === 0 ? COR_JOGO.CHAO_BORDA_CLARA : COR_JOGO.CHAO_BORDA_ESC) : COR_JOGO.CHAO_BLOQ_BORDA;
      const g = new Graphics();
      g.poly([x, y - hh, x + hw, y, x, y + hh, x - hw, y]);
      g.fill({ color: corF, alpha: caminhavel ? 0.9 : 0.75 });
      g.stroke({ color: corB, width: 1 });
      app.stage.addChild(g);
    }
  }

  // 5. Objetos — cubo 3 faces
  for (const objeto of comodo.objetos) {
    const { x, y } = pontoTile(comodo, objeto.tileX, objeto.tileY);
    const OH = 28;
    const topo = new Graphics();
    topo.poly([x, y - hh - OH, x + hw, y - OH, x, y + hh - OH, x - hw, y - OH]);
    topo.fill({ color: COR_JOGO.OBJETO_TOPO });
    topo.stroke({ color: COR_JOGO.OBJETO_BORDA, width: 1 });
    const frente = new Graphics();
    frente.poly([x - hw, y - OH, x, y + hh - OH, x, y + hh, x - hw, y]);
    frente.fill({ color: COR_JOGO.OBJETO_FRENTE });
    frente.stroke({ color: COR_JOGO.OBJETO_BORDA, width: 1 });
    const lado = new Graphics();
    lado.poly([x, y + hh - OH, x + hw, y - OH, x + hw, y, x, y + hh]);
    lado.fill({ color: COR_JOGO.OBJETO_LADO });
    lado.stroke({ color: COR_JOGO.OBJETO_BORDA, width: 1 });
    const rotulo = new Text({
      text: objeto.furnitureId,
      style: { fill: '#e8f4f8', fontSize: 9, fontFamily: 'monospace' },
    });
    rotulo.anchor.set(0.5, 1);
    rotulo.position.set(x, y - hh - OH - 2);
    app.stage.addChild(topo, frente, lado, rotulo);
  }

  // 6. Saídas
  for (const saida of comodo.saidas) {
    const { x, y } = pontoTile(comodo, saida.tileX, saida.tileY);
    const g = new Graphics();
    g.poly([x, y - hh, x + hw, y, x, y + hh, x - hw, y]);
    g.fill({ color: COR_JOGO.SAIDA, alpha: 0.8 });
    g.stroke({ color: COR_JOGO.SAIDA_BORDA, width: 2 });
    app.stage.addChild(g);
  }
}
