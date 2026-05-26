import type { Application, Container, FederatedPointerEvent } from 'pixi.js';

type PosicaoXY = { readonly x: number; readonly y: number };

type CallbackPosicaoAtualizada = (
  objetoId: string,
  novaPosicao: PosicaoXY,
  novaPosicaoDeInteracao: PosicaoXY,
) => void;

export function configurarDragAndDrop(
  app: Application,
  container: Container,
  objetoId: string,
  posicaoInicial: PosicaoXY,
  posicaoDeInteracaoInicial: PosicaoXY,
  onPosicaoAtualizada: CallbackPosicaoAtualizada,
): () => void {
  // offset fixo entre posicao e posicaoDeInteracao — mantido durante o drag
  const offsetInteracao: PosicaoXY = {
    x: posicaoDeInteracaoInicial.x - posicaoInicial.x,
    y: posicaoDeInteracaoInicial.y - posicaoInicial.y,
  };

  let arrastando = false;
  let offsetDrag: PosicaoXY = { x: 0, y: 0 };

  const aoIniciarDrag = (e: FederatedPointerEvent) => {
    arrastando = true;
    e.stopPropagation();
    offsetDrag = {
      x: e.globalX - container.x,
      y: e.globalY - container.y,
    };
    app.stage.on('pointermove', aoMoverDrag);
    app.stage.on('pointerup', aoSoltarDrag);
    app.stage.on('pointerupoutside', aoSoltarDrag);
    container.cursor = 'grabbing';
  };

  const aoMoverDrag = (e: FederatedPointerEvent) => {
    if (!arrastando) return;
    container.x = e.globalX - offsetDrag.x;
    container.y = e.globalY - offsetDrag.y;
  };

  const aoSoltarDrag = () => {
    if (!arrastando) return;
    arrastando = false;
    app.stage.off('pointermove', aoMoverDrag);
    app.stage.off('pointerup', aoSoltarDrag);
    app.stage.off('pointerupoutside', aoSoltarDrag);
    container.cursor = 'grab';

    const novaPosicao: PosicaoXY = {
      x: Math.round(container.x),
      y: Math.round(container.y),
    };
    const novaPosicaoDeInteracao: PosicaoXY = {
      x: novaPosicao.x + offsetInteracao.x,
      y: novaPosicao.y + offsetInteracao.y,
    };

    onPosicaoAtualizada(objetoId, novaPosicao, novaPosicaoDeInteracao);
  };

  container.eventMode = 'static';
  container.cursor = 'grab';
  container.on('pointerdown', aoIniciarDrag);

  return () => {
    container.off('pointerdown', aoIniciarDrag);
    app.stage.off('pointermove', aoMoverDrag);
    app.stage.off('pointerup', aoSoltarDrag);
    app.stage.off('pointerupoutside', aoSoltarDrag);
  };
}
