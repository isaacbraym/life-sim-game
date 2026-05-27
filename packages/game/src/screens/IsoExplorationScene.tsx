import { useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';
import { gsap } from 'gsap';
import { tileParaTela } from '@core/iso/IsoMath';
import { carregarComodoIso } from '../content/isoRoomCatalog';
import { IsoRoomController } from '../stage/IsoRoomController';
import { IsoCharacterController } from '../stage/IsoCharacterController';

const LARGURA_CANVAS = 900;
const ALTURA_CANVAS  = 600;
const OFFSET_CAMERA_Y = 60;

type PropsExploracaoIso = {
  readonly comodoId: string;
  readonly onSaida?: (saidaId: string) => void;
};

export function IsoExplorationScene({ comodoId, onSaida }: PropsExploracaoIso) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [erro, setErro] = useState<string | undefined>();

  useEffect(() => {
    if (canvasRef.current === null) return;

    let cancelado   = false;
    let appPronto   = false;
    const app        = new Application();
    const sala       = new IsoRoomController();
    const personagem = new IsoCharacterController();

    const inicializar = async () => {
      await app.init({
        canvas: canvasRef.current!,
        width:  LARGURA_CANVAS,
        height: ALTURA_CANVAS,
        background: 0x1a2330,
        antialias:  false,
      });

      if (cancelado) { app.destroy(); return; }
      appPronto = true;

      app.stage.sortableChildren = true;
      app.stage.alpha = 0;

      const comodo = await carregarComodoIso(comodoId);
      if (cancelado) return;

      if (comodo === undefined) {
        setErro(`Cômodo "${comodoId}" não encontrado.`);
        return;
      }

      sala.carregarComodo(
        app,
        comodo,
        (tx, ty) => {
          if (!personagem.estaEmMovimento()) {
            void personagem.moverPara({ tx, ty }, sala.obterGrid());
          }
        },
        (saidaId) => { onSaida?.(saidaId); },
      );

      // Centraliza câmera no meio do cômodo
      const { x: cx, y: cy } = tileParaTela(
        comodo.larguraTiles / 2,
        comodo.alturaTiles / 2,
      );
      app.stage.position.set(
        LARGURA_CANVAS / 2 - cx,
        ALTURA_CANVAS  / 2 - cy + OFFSET_CAMERA_Y,
      );

      personagem.posicionarEm(1, 1);
      app.stage.addChild(personagem.obterContainer());

      gsap.to(app.stage, { alpha: 1, duration: 0.4 });
    };

    inicializar().catch((err: unknown) => {
      if (!cancelado) setErro(String(err));
    });

    return () => {
      cancelado = true;
      if (appPronto) {
        gsap.killTweensOf(app.stage);
        personagem.destruir();
        sala.destruir();
        app.destroy();
      }
    };
  }, [comodoId, onSaida]);

  if (erro !== undefined) {
    return (
      <div style={{ padding: 24, color: '#f87171', fontFamily: 'monospace' }}>
        Erro ao carregar cômodo: {erro}
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', background: '#1a2330' }}
    />
  );
}
