import { useEffect, useRef, useCallback } from 'react';
import { Application, Graphics, Text, Container } from 'pixi.js';
import type { ComodoDefinition } from '@core/schemas/location';
import { PixiCanvas } from '../../shared/PixiCanvas';
import { configurarDragAndDrop } from './ObjectDragger';

const CORES_TIPO: Record<string, number> = {
  quarto: 0x4a5568,
  sala: 0x553c2e,
  cozinha: 0x3c4f33,
  banheiro: 0x2e4a53,
  academia: 0x4a3c2e,
  escritorio: 0x3c3c50,
};

function corFundo(comodoId: string): number {
  for (const [chave, cor] of Object.entries(CORES_TIPO)) {
    if (comodoId.includes(chave)) return cor;
  }
  return 0x374151;
}

type PropsCanvasDoComodo = {
  readonly comodo: ComodoDefinition;
  readonly onAtualizar: (novoComodo: ComodoDefinition) => void;
};

export function CanvasDoComodo({ comodo, onAtualizar }: PropsCanvasDoComodo) {
  const appRef = useRef<Application | undefined>();
  const comodoRef = useRef(comodo);
  const onAtualizarRef = useRef(onAtualizar);

  useEffect(() => {
    comodoRef.current = comodo;
    onAtualizarRef.current = onAtualizar;
  });

  const renderizar = useCallback((app: Application) => {
    desenharComodo(app, comodoRef.current, (objetoId, novaPosicao, novaPosicaoDeInteracao) => {
      const atual = comodoRef.current;
      const novosObjetos = atual.objetos.map((obj) =>
        obj.id === objetoId
          ? { ...obj, posicao: novaPosicao, posicaoDeInteracao: novaPosicaoDeInteracao }
          : obj,
      );
      onAtualizarRef.current({ ...atual, objetos: novosObjetos });
    });
  }, []);

  const aoInicializar = useCallback((app: Application) => {
    appRef.current = app;
    app.stage.eventMode = 'dynamic';
    app.stage.hitArea = app.screen;
    renderizar(app);
  }, [renderizar]);

  useEffect(() => {
    const app = appRef.current;
    if (!app) return;
    app.stage.hitArea = app.screen;
    renderizar(app);
  }, [comodo, renderizar]);

  return (
    <PixiCanvas
      largura={comodo.tamanho.largura}
      altura={comodo.tamanho.altura}
      aoInicializar={aoInicializar}
    />
  );
}

type CallbackDrag = (
  objetoId: string,
  novaPosicao: { x: number; y: number },
  novaPosicaoDeInteracao: { x: number; y: number },
) => void;

function desenharComodo(app: Application, comodo: ComodoDefinition, onDrag: CallbackDrag) {
  app.stage.removeChildren();

  // Fundo
  const fundo = new Graphics();
  fundo.rect(0, 0, comodo.tamanho.largura, comodo.tamanho.altura);
  fundo.fill(corFundo(comodo.id));
  app.stage.addChild(fundo);

  const rotuloComodo = new Text({
    text: comodo.nome,
    style: { fill: '#e2e8f0', fontSize: 16, fontFamily: 'monospace', fontWeight: 'bold' },
  });
  rotuloComodo.x = 10;
  rotuloComodo.y = 10;
  app.stage.addChild(rotuloComodo);

  // NavZonas
  for (const zona of comodo.navZonas) {
    const g = new Graphics();
    g.poly(zona.poligono);
    g.fill({ color: 0x48bb78, alpha: 0.25 });
    g.stroke({ color: 0x48bb78, width: 1 });
    app.stage.addChild(g);
  }

  // PontosDeSaida
  for (const ponto of comodo.pontosDeSaida) {
    const g = new Graphics();
    g.rect(ponto.posicao.x - 14, ponto.posicao.y - 14, 28, 28);
    g.fill({ color: 0xed8936, alpha: 0.9 });
    g.stroke({ color: 0xdd6b20, width: 1 });
    app.stage.addChild(g);

    const destino = ponto.destino.tipo === 'comodo' ? ponto.destino.comodoId : 'mapa';
    const label = new Text({
      text: destino,
      style: { fill: '#ffffff', fontSize: 9, fontFamily: 'monospace' },
    });
    label.x = ponto.posicao.x - 14;
    label.y = ponto.posicao.y + 16;
    app.stage.addChild(label);
  }

  // InteractableObjects
  for (const objeto of comodo.objetos) {
    const container = new Container();
    container.x = objeto.posicao.x;
    container.y = objeto.posicao.y;

    const posicaoInteracaoIgualPosicao =
      objeto.posicaoDeInteracao.x === objeto.posicao.x &&
      objeto.posicaoDeInteracao.y === objeto.posicao.y;

    const corObjeto = posicaoInteracaoIgualPosicao ? 0xe53e3e : 0x4299e1;
    const corBorda = posicaoInteracaoIgualPosicao ? 0xc53030 : 0x2b6cb0;

    const g = new Graphics();
    g.rect(0, 0, objeto.tamanho.largura, objeto.tamanho.altura);
    g.fill({ color: corObjeto, alpha: 0.5 });
    g.stroke({ color: corBorda, width: 1 });
    container.addChild(g);

    const label = new Text({
      text: `${objeto.tipo}\n${objeto.id}`,
      style: { fill: '#e2e8f0', fontSize: 9, fontFamily: 'monospace', wordWrap: false },
    });
    label.x = 3;
    label.y = 3;
    container.addChild(label);

    app.stage.addChild(container);

    // Círculo amarelo na posicaoDeInteracao (coordenadas absolutas)
    const circulo = new Graphics();
    circulo.circle(objeto.posicaoDeInteracao.x, objeto.posicaoDeInteracao.y, 5);
    circulo.fill({ color: posicaoInteracaoIgualPosicao ? 0xff4444 : 0xffd700, alpha: 1 });
    circulo.stroke({ color: 0x000000, width: 1 });
    app.stage.addChild(circulo);

    configurarDragAndDrop(app, container, objeto.id, objeto.posicao, objeto.posicaoDeInteracao, onDrag);
  }
}
