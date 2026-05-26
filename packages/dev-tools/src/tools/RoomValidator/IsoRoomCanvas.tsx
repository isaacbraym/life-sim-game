import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Application, Graphics, Text } from 'pixi.js';
import { tileParaTela, type IsoRoomDefinition } from '@lifesim/core';
import { PixiCanvas } from '../../shared/PixiCanvas';

type PropsCanvasIso = {
  readonly comodo: IsoRoomDefinition;
};

const CORES_TILE: Record<IsoRoomDefinition['tiles'][number][number]['estado'], number> = {
  caminhavel: 0x4a5568,
  bloqueado: 0x742a2a,
  vazio: 0x000000,
};

export function CanvasIsoDoComodo({ comodo }: PropsCanvasIso) {
  const appRef = useRef<Application | undefined>();
  const comodoRef = useRef(comodo);
  const tamanhoCanvas = useMemo(() => calcularTamanhoCanvas(comodo), [comodo]);

  useEffect(() => {
    comodoRef.current = comodo;
  }, [comodo]);

  const renderizar = useCallback((app: Application) => {
    desenharComodoIso(app, comodoRef.current);
  }, []);

  const aoInicializar = useCallback((app: Application) => {
    appRef.current = app;
    renderizar(app);
  }, [renderizar]);

  useEffect(() => {
    if (appRef.current !== undefined) renderizar(appRef.current);
  }, [comodo, renderizar]);

  return (
    <PixiCanvas
      largura={tamanhoCanvas.largura}
      altura={tamanhoCanvas.altura}
      aoInicializar={aoInicializar}
    />
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
