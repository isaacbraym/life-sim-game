import { useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';
import { gsap } from 'gsap';
import { carregarComodoIso } from '../content/isoRoomCatalog';
import { IsoRoomController, ALTURA_PAREDE_PX } from '../stage/IsoRoomController';
import { IsoCharacterController } from '../stage/IsoCharacterController';
import { MarnieCharacterController } from '../stage/MarnieCharacterController';

/** Interface mínima comum aos controladores de personagem (layered ou frames). */
type ControladorPersonagem = Pick<
  IsoCharacterController,
  'inicializar' | 'posicionarEm' | 'estaEmMovimento' | 'obterPosicao' | 'moverPara' | 'obterContainer' | 'destruir'
>;

/**
 * No modo de exploração iso (dev), a Marnie é o personagem PADRÃO.
 * Use `?personagem=classico` para voltar ao personagem de camadas legado.
 */
function usarPersonagemMarnie(): boolean {
  if (typeof window === 'undefined') return true;
  return new URLSearchParams(window.location.search).get('personagem') !== 'classico';
}

type ComodoComMoveis = {
  readonly objetos: ReadonlyArray<{
    readonly tileX: number;
    readonly tileY: number;
    readonly bloqueaTiles: ReadonlyArray<{ readonly dx: number; readonly dy: number }>;
  }>;
};

/** Tile (tx,ty) está ocupado por algum móvel (âncora ou footprint bloqueado)? */
function tileEhMovel(comodo: ComodoComMoveis, tx: number, ty: number): boolean {
  return comodo.objetos.some((o) =>
    (o.tileX === tx && o.tileY === ty)
    || o.bloqueaTiles.some((off) => o.tileX + off.dx === tx && o.tileY + off.dy === ty),
  );
}

/** Tile caminhável mais próximo da preferência — evita nascer em parede/móvel. */
function acharTileCaminhavel(
  grid: ReadonlyArray<ReadonlyArray<boolean>>,
  prefTx: number,
  prefTy: number,
): { tx: number; ty: number } {
  let melhor: { tx: number; ty: number } | undefined;
  let menor = Infinity;
  for (let ty = 0; ty < grid.length; ty += 1) {
    const linha = grid[ty];
    if (linha === undefined) continue;
    for (let tx = 0; tx < linha.length; tx += 1) {
      if (linha[tx] !== true) continue;
      const d = Math.abs(tx - prefTx) + Math.abs(ty - prefTy);
      if (d < menor) { menor = d; melhor = { tx, ty }; }
    }
  }
  return melhor ?? { tx: prefTx, ty: prefTy };
}

const LARGURA_CANVAS  = 1280;
const ALTURA_CANVAS   = 760;
const MARGEM_ENQUADRAMENTO = 80;
const ZOOM_MAXIMO = 2.4;
const ZOOM_MINIMO = 0.6;

/** Calcula zoom (scale do stage) e posição para enquadrar o cômodo + paredes. */
function enquadrarComodo(larguraTiles: number, alturaTiles: number): {
  zoom: number; x: number; y: number;
} {
  const conteudoW = (larguraTiles + alturaTiles) * 32;
  const conteudoH = (larguraTiles + alturaTiles) * 16 + ALTURA_PAREDE_PX;
  const zoom = Math.max(ZOOM_MINIMO, Math.min(
    (LARGURA_CANVAS - MARGEM_ENQUADRAMENTO) / conteudoW,
    (ALTURA_CANVAS - MARGEM_ENQUADRAMENTO) / conteudoH,
    ZOOM_MAXIMO,
  ));
  // Bounding box do conteúdo em coords de stage (tileParaTela + paredes).
  const minX = -(alturaTiles - 1) * 32 - 32;
  const maxX = (larguraTiles - 1) * 32 + 32;
  const minY = -ALTURA_PAREDE_PX - 16;
  const maxY = (larguraTiles + alturaTiles - 2) * 16 + 16;
  const centroX = (minX + maxX) / 2;
  const centroY = (minY + maxY) / 2;
  return {
    zoom,
    x: LARGURA_CANVAS / 2 - zoom * centroX,
    y: ALTURA_CANVAS / 2 - zoom * centroY,
  };
}

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
  const personagemRef = useRef<ControladorPersonagem | undefined>();
  const npcRef        = useRef<MarnieCharacterController | undefined>();
  const salaRef       = useRef<IsoRoomController | undefined>();

  useEffect(() => {
    if (canvasRef.current === null) return;

    let cancelado = false;

    const usarMarnie = usarPersonagemMarnie();
    const app        = new Application();
    const sala       = new IsoRoomController();
    const personagem: ControladorPersonagem = usarMarnie
      ? new MarnieCharacterController('base')
      : new IsoCharacterController();
    // NPC de teste: a variante "gym" da Marnie sentada conversando (interação
    // das duas variações da mesma personagem).
    const npc = usarMarnie ? new MarnieCharacterController('gym') : undefined;

    appRef.current        = app;
    personagemRef.current = personagem;
    npcRef.current        = npc;
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
          if (char.estaEmMovimento()) return;

          // Assento: clique num tile ocupado por móvel → Marnie anda e senta.
          const comodoClicado = rm.obterComodo();
          if (
            char instanceof MarnieCharacterController
            && comodoClicado !== undefined
            && tileEhMovel(comodoClicado, tx, ty)
          ) {
            rm.mostrarMarcadorDestino(tx, ty);
            void char.irESentar({ tx, ty }, rm.obterGrid()).then(() => {
              if (personagemRef.current === undefined) return;
              setPosicao(char.obterPosicao());
            });
            return;
          }

          if (!char.estaEmMovimento()) {
            void char.moverPara({ tx, ty }, rm.obterGrid()).then(() => {
              if (personagemRef.current === undefined) return; // componente desmontou
              const pos = char.obterPosicao();
              rm.atualizarGrid([{ tileX: pos.tx, tileY: pos.ty }]);
              setPosicao(pos);
              // 2c: personagem chegou a uma saída → disparar transição automaticamente
              const comodoAtual = rm.obterComodo();
              if (comodoAtual !== undefined) {
                const saidaAlcancada = comodoAtual.saidas.find(
                  s => s.tileX === pos.tx && s.tileY === pos.ty,
                );
                if (saidaAlcancada !== undefined) {
                  onSaida?.(saidaAlcancada.id);
                }
              }
            });
            // Síncrono: _emMovimento já foi definido antes do primeiro await de moverPara
            if (char.estaEmMovimento()) {
              rm.mostrarMarcadorDestino(tx, ty);
            } else {
              rm.flashTileBloqueado(tx, ty);
            }
          }
        },
        (saidaId) => { onSaida?.(saidaId); },
      );

      // Zoom + centralização para o cômodo (com paredes) preencher a tela.
      const enq = enquadrarComodo(comodo.larguraTiles, comodo.alturaTiles);
      app.stage.scale.set(enq.zoom);
      app.stage.position.set(enq.x, enq.y);

      // Carrega os sprites WebP do personagem (async) antes de exibir
      await personagem.inicializar(app);
      if (cancelado) return; // cleanup destrói app/personagem

      const grid = sala.obterGrid();
      const spawn = acharTileCaminhavel(grid, 1, 1);
      personagem.posicionarEm(spawn.tx, spawn.ty);
      setPosicao(spawn);
      app.stage.addChild(personagem.obterContainer());

      // NPC de teste (gym): senta e conversa num tile caminhável, virada p/ jogadora.
      if (npc !== undefined) {
        await npc.inicializar(app);
        if (cancelado) return;
        const tileNpc = acharTileCaminhavel(grid, Math.floor(comodo.larguraTiles / 2), 2);
        npc.posicionarEm(tileNpc.tx, tileNpc.ty);
        app.stage.addChild(npc.obterContainer());
        void npc.reproduzirClip('conversar', 'W');
      }

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
      const npcAtual = npcRef.current;
      gsap.killTweensOf(app.stage);

      // Limpar refs antes de destruir para impedir callbacks órfãos
      personagemRef.current = undefined;
      npcRef.current        = undefined;
      salaRef.current       = undefined;
      appRef.current        = undefined;

      char?.destruir();
      npcAtual?.destruir();
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
