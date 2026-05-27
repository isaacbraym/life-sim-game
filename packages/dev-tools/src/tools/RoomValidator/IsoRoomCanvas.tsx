import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { Application, Graphics, Text } from 'pixi.js';
import { tileParaTela, telaParaTile, type IsoRoomDefinition } from '@lifesim/core';
import { PixiCanvas } from '../../shared/PixiCanvas';

type PropsCanvasIso = {
  readonly comodo: IsoRoomDefinition;
};

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

export function CanvasIsoDoComodo({ comodo }: PropsCanvasIso) {
  const appRef    = useRef<Application | undefined>();
  const comodoRef = useRef(comodo);
  const tamanhoCanvas = useMemo(() => calcularTamanhoCanvas(comodo), [comodo]);

  const [mostrarReferencia, setMostrarReferencia] = useState(false);
  const [tileRef, setTileRef]                     = useState<{ tx: number; ty: number } | undefined>();

  useEffect(() => {
    comodoRef.current = comodo;
    setTileRef(undefined);
  }, [comodo]);

  const renderizarTudo = useCallback((app: Application) => {
    desenharComodoIso(app, comodoRef.current);
    if (mostrarReferencia && tileRef !== undefined) {
      desenharSilhuetaPersonagem(app, comodoRef.current, tileRef.tx, tileRef.ty);
    }
  }, [mostrarReferencia, tileRef]);

  const aoInicializar = useCallback((app: Application) => {
    appRef.current = app;
    renderizarTudo(app);
  }, [renderizarTudo]);

  useEffect(() => {
    if (appRef.current !== undefined) renderizarTudo(appRef.current);
  }, [comodo, renderizarTudo]);

  const aoClicarCanvas = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!mostrarReferencia) return;
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
  }, [mostrarReferencia]);

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
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
          👤 Referência de escala {mostrarReferencia ? '(ativo — clique num tile)' : ''}
        </button>
      </div>
      <div onClick={aoClicarCanvas} style={{ cursor: mostrarReferencia ? 'crosshair' : 'default' }}>
        <PixiCanvas
          largura={tamanhoCanvas.largura}
          altura={tamanhoCanvas.altura}
          aoInicializar={aoInicializar}
        />
      </div>
    </div>
  );
}

function calcularTamanhoCanvas(comodo: IsoRoomDefinition): { largura: number; altura: number } {
  return {
    largura: Math.max(560, (comodo.larguraTiles + comodo.alturaTiles) * 32 + 160),
    altura: Math.max(420, (comodo.larguraTiles + comodo.alturaTiles) * 16 + 180),
  };
}

function origemDoComodo(comodo: IsoRoomDefinition): { x: number; y: number } {
  return {
    x: comodo.alturaTiles * 32 + 80,
    y: 64,
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

function desenharComodoIso(app: Application, comodo: IsoRoomDefinition) {
  app.stage.removeChildren();

  const titulo = new Text({
    text: `${comodo.nome} (${comodo.larguraTiles}x${comodo.alturaTiles})`,
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
  grafico.poly([
    x, y - 16,
    x + 32, y,
    x, y + 16,
    x - 32, y,
  ]);
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
  // O âncora do personagem (SILHUETA_AX, SILHUETA_AY) coincide com o centro do tile
  const esqX = x - SILHUETA_AX;
  const topoY = y - SILHUETA_AY;

  // Retângulo da silhueta 64×96
  const silhueta = new Graphics();
  silhueta.rect(esqX, topoY, SILHUETA_W, SILHUETA_H);
  silhueta.fill({ color: 0x48bb78, alpha: 0.22 });
  silhueta.stroke({ color: 0x68d391, width: 1.5 });

  // Linha do âncora (chão)
  const marcaAncora = new Graphics();
  marcaAncora.moveTo(x - 12, y);
  marcaAncora.lineTo(x + 12, y);
  marcaAncora.stroke({ color: 0xf6ad55, width: 1.5 });

  // Ponto de âncora
  const ponto = new Graphics();
  ponto.circle(x, y, 3);
  ponto.fill({ color: 0xf6ad55 });

  // Rótulo com coordenadas
  const rotulo = new Text({
    text: `(${tx}, ${ty})  64×96  ⚓(${SILHUETA_AX},${SILHUETA_AY})`,
    style: { fill: '#f6e05e', fontSize: 10, fontFamily: 'monospace' },
  });
  rotulo.x = esqX;
  rotulo.y = topoY - 14;

  app.stage.addChild(silhueta, marcaAncora, ponto, rotulo);
}
