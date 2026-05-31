import { useEffect, useMemo, useRef } from 'react';
import { Application, Assets, Sprite, Texture } from 'pixi.js';
import type { AnimacaoPersonagem, KeyframeAnimacao } from '@core/schemas/characterAnimation';
import type { DirecaoVisual } from '@core/schemas/direction';

export type CharacterPreviewProps = {
  readonly direcao: DirecaoVisual;
  readonly animacaoAtual?: AnimacaoPersonagem;
  readonly tempoAtualMs?: number;
  readonly largura?: number;
  readonly altura?: number;
};

type TransformacaoKeyframe = {
  readonly offsetX: number;
  readonly offsetY: number;
  readonly opacidade: number;
  readonly escala: number;
};

const TRANSFORMACAO_PADRAO: TransformacaoKeyframe = {
  offsetX: 0,
  offsetY: 0,
  opacidade: 1,
  escala: 1,
};

function interpolar(inicio: number, fim: number, t: number): number {
  return inicio + (fim - inicio) * t;
}

function calcularTransformacao(
  animacaoAtual: AnimacaoPersonagem | undefined,
  tempoAtualMs: number | undefined,
): TransformacaoKeyframe {
  if (animacaoAtual === undefined || tempoAtualMs === undefined) return TRANSFORMACAO_PADRAO;

  const keyframesCorpoBase = animacaoAtual.keyframes.filter((keyframe) => keyframe.camada === 'corpo_base');
  const keyframes = (keyframesCorpoBase.length > 0 ? keyframesCorpoBase : animacaoAtual.keyframes)
    .slice()
    .sort((a, b) => a.tempoMs - b.tempoMs);

  const primeiro = keyframes[0];
  if (primeiro === undefined) return TRANSFORMACAO_PADRAO;
  if (tempoAtualMs <= primeiro.tempoMs) return keyframeParaTransformacao(primeiro);

  const ultimo = keyframes[keyframes.length - 1];
  if (ultimo === undefined || tempoAtualMs >= ultimo.tempoMs) {
    return keyframeParaTransformacao(ultimo ?? primeiro);
  }

  for (let indice = 0; indice < keyframes.length - 1; indice += 1) {
    const atual = keyframes[indice];
    const proximo = keyframes[indice + 1];
    if (atual === undefined || proximo === undefined) continue;
    if (tempoAtualMs < atual.tempoMs || tempoAtualMs > proximo.tempoMs) continue;

    const duracaoTrecho = proximo.tempoMs - atual.tempoMs;
    if (duracaoTrecho <= 0) return keyframeParaTransformacao(atual);
    const t = (tempoAtualMs - atual.tempoMs) / duracaoTrecho;
    return {
      offsetX: interpolar(atual.offsetX, proximo.offsetX, t),
      offsetY: interpolar(atual.offsetY, proximo.offsetY, t),
      opacidade: interpolar(atual.opacidade, proximo.opacidade, t),
      escala: interpolar(atual.escala, proximo.escala, t),
    };
  }

  return keyframeParaTransformacao(primeiro);
}

function keyframeParaTransformacao(keyframe: KeyframeAnimacao): TransformacaoKeyframe {
  return {
    offsetX: keyframe.offsetX,
    offsetY: keyframe.offsetY,
    opacidade: keyframe.opacidade,
    escala: keyframe.escala,
  };
}

export function CharacterPreview({
  direcao,
  animacaoAtual,
  tempoAtualMs,
  largura = 64,
  altura = 96,
}: CharacterPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | undefined>();
  const spriteRef = useRef<Sprite | undefined>();
  const baseX = largura / 2;
  const baseY = altura / 2;
  const urlTextura = useMemo(
    () => `/content/character-parts/corpo_base/adulto_neutro/${direcao}.webp`,
    [direcao],
  );
  const transformacao = useMemo(
    () => calcularTransformacao(animacaoAtual, tempoAtualMs),
    [animacaoAtual, tempoAtualMs],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return undefined;

    let cancelado = false;
    const app = new Application();

    const inicializar = async () => {
      await app.init({
        width: largura,
        height: altura,
        background: '#1a1a1a',
        antialias: false,
      });
      if (cancelado) {
        app.destroy();
        return;
      }

      appRef.current = app;
      container.appendChild(app.canvas as HTMLCanvasElement);

      const sprite = new Sprite(Texture.EMPTY);
      sprite.anchor.set(0.5);
      sprite.x = baseX;
      sprite.y = baseY;
      spriteRef.current = sprite;
      app.stage.addChild(sprite);
    };

    void inicializar();

    return () => {
      cancelado = true;
      spriteRef.current = undefined;
      appRef.current = undefined;
      const canvas = app.canvas as HTMLCanvasElement | undefined;
      const parentNode = canvas?.parentNode;
      if (canvas !== undefined && parentNode !== null && parentNode !== undefined) {
        parentNode.removeChild(canvas);
      }
      app.destroy();
    };
  }, [altura, baseX, baseY, largura]);

  useEffect(() => {
    let cancelado = false;

    const carregarTextura = async () => {
      try {
        const textura: Texture = await Assets.load(urlTextura);
        if (cancelado) return;
        const sprite = spriteRef.current;
        if (sprite !== undefined) sprite.texture = textura;
      } catch {
        if (cancelado) return;
        const sprite = spriteRef.current;
        if (sprite !== undefined) sprite.texture = Texture.EMPTY;
      }
    };

    void carregarTextura();

    return () => {
      cancelado = true;
    };
  }, [urlTextura]);

  useEffect(() => {
    const sprite = spriteRef.current;
    if (sprite === undefined) return;

    sprite.x = baseX + transformacao.offsetX;
    sprite.y = baseY + transformacao.offsetY;
    sprite.alpha = transformacao.opacidade;
    sprite.scale.set(transformacao.escala);
  }, [baseX, baseY, transformacao]);

  return <div ref={containerRef} />;
}
