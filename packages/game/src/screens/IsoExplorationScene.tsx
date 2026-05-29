import { useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';
import { gsap } from 'gsap';
import { tileParaTela } from '@core/iso/IsoMath';
import { carregarComodoIso } from '../content/isoRoomCatalog';
import { IsoRoomController, ALTURA_PAREDE_PX } from '../stage/IsoRoomController';
import { IsoCharacterController } from '../stage/IsoCharacterController';

const LARGURA_CANVAS  = 900;
const ALTURA_CANVAS   = 600;
// Câmera mais alta para revelar topo das paredes Habbo-style
const OFFSET_CAMERA_Y = ALTURA_PAREDE_PX + 80; // 176px

export type IsoExplorationSceneProps = {
  readonly comodoId: string;
  readonly onSaida?: (saidaId: string) => void;
};

export function IsoExplorationScene({ comodoId, onSaida }: IsoExplorationSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [erro, setErro] = useState<string | undefined>();
  const [posicao, setPosicao] = useState<{ tx: number; ty: number }>({ tx: 1, ty: 1 });

  // Refs para acesso nos callbacks sem stale closure
  const appRef        = useRef<Application | undefined>();
  const personagemRef = useRef<IsoCharacterController | undefined>();
  const salaRef       = useRef<IsoRoomController | undefined>();

  useEffect(() => {
    if (canvasRef.current === null) return;

    let cancelado = false;

    const app        = new Application();
    const sala       = new IsoRoomController();
    const personagem = new IsoCharacterController();

    appRef.current        = app;
    personagemRef.current = personagem;
    salaRef.current       = sala;

    const inicializar = async () => {
      await app.init({
        canvas:     canvasRef.current!,
        width:      LARGURA_CANVAS,
        height:     ALTURA_CANVAS,
        background: 0x1a2330,
        antialias:  true,
      });
      // Verificar cancelamento logo após o primeiro await pesado
      if (cancelado) { app.destroy(true); return; }

      app.stage.sortableChildren = true;
      app.stage.alpha = 0;

      const comodo = await carregarComodoIso(comodoId);
      if (cancelado) return; // app.destroy já será chamado pelo cleanup

      if (comodo === undefined) {
        setErro(`Cômodo "${comodoId}" não encontrado.`);
        return;
      }

      sala.carregarComodo(
        app,
        comodo,
        (tx, ty) => {
          const char = personagemRef.current;
          const rm   = salaRef.current;
          if (char === undefined || rm === undefined) return;
          if (!char.estaEmMovimento()) {
            void char.moverPara({ tx, ty }, rm.obterGrid()).then(() => {
              if (personagemRef.current === undefined) return; // componente desmontou
              const pos = char.obterPosicao();
              rm.atualizarGrid([{ tileX: pos.tx, tileY: pos.ty }]);
              setPosicao(pos);
            });
          }
        },
        (saidaId) => { onSaida?.(saidaId); },
      );

      // Centraliza câmera no meio do cômodo
      const { x: cx, y: cy } = tileParaTela(
        comodo.larguraTiles / 2,
        comodo.alturaTiles  / 2,
      );
      app.stage.position.set(
        LARGURA_CANVAS / 2 - cx,
        ALTURA_CANVAS  / 3 - cy + OFFSET_CAMERA_Y,
      );

      personagem.posicionarEm(1, 1);
      setPosicao({ tx: 1, ty: 1 });
      app.stage.addChild(personagem.obterContainer());

      gsap.to(app.stage, { alpha: 1, duration: 0.4 });
    };

    inicializar().catch((err: unknown) => {
      if (!cancelado) setErro(String(err));
    });

    return () => {
      cancelado = true;

      // Matar tweens antes de destruir o container
      const char = personagemRef.current;
      if (char !== undefined) {
        gsap.killTweensOf(char.obterContainer().position);
      }
      gsap.killTweensOf(app.stage);

      // Limpar refs antes de destruir para impedir callbacks órfãos
      personagemRef.current = undefined;
      salaRef.current       = undefined;
      appRef.current        = undefined;

      char?.destruir();
      sala.destruir();
      app.destroy(true);
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
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', background: '#1a2330' }}
      />
      {/* HUD de posição */}
      <div style={{
        position: 'absolute',
        top: 8,
        left: 8,
        background: 'rgba(0,0,0,0.55)',
        color: '#c4f0ff',
        fontFamily: 'monospace',
        fontSize: 12,
        padding: '4px 10px',
        borderRadius: 4,
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        {comodoId} | {posicao.tx},{posicao.ty}
      </div>
    </div>
  );
}
