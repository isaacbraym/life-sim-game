import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Application, Graphics } from 'pixi.js';
import { gsap } from 'gsap';
import type { ActionDefinition } from '@core/schemas/action';
import type { EstadoDeJogo } from '@core/events/EstadoDeJogo';
import { salvarParaEstadoDeJogo } from '@core/events/EstadoDeJogo';
import { resolverAcao } from '@core/interaction/ActionResolver';
import { interactionLock } from '@core/interaction/InteractionLock';
import { persistirLogsDeAcao } from '@core/log/LogPersistenceHook';
import { carregarCatalogoAcoes, obterAcao, acaoFallback } from '@game/content/actionCatalog';
import { efeitoParaTexto, efeitoParaCor } from '@game/ui/efeitoParaTexto';
import { carregarComodoIso } from '../content/isoRoomCatalog';
import { IsoRoomController, ALTURA_PAREDE_PX } from '../stage/IsoRoomController';
import type { ObjetoInterativoIso } from '../stage/IsoRoomController';
import { IsoCharacterController } from '../stage/IsoCharacterController';
import { MarnieCharacterController } from '../stage/MarnieCharacterController';
import { useExplorationStore } from '../state/explorationStore';
import { useHudStore } from '../state/hudStore';
import { ActionBubble } from '../ui/ActionBubble';
import { mostrarFeedback } from '../ui/VisualFeedback';

/** Destino de uma saída iso — `{ tipo: 'comodo' | 'mapa', comodoId? }`. */
type DestinoSaidaIso = {
  readonly tipo: 'comodo' | 'mapa';
  readonly comodoId?: string;
};

/** Monta o EstadoDeJogo atual a partir do HUD (igual à ExplorationScene legada). */
function estadoAtualDoJogo(): EstadoDeJogo {
  const estadoHud = useHudStore.getState();
  const saveAtual = estadoHud.saveAtual;

  if (saveAtual !== undefined) {
    return salvarParaEstadoDeJogo(saveAtual, saveAtual.estadoMundo.anoAtual);
  }

  return {
    anoNascimento: estadoHud.anoAtual - estadoHud.idadeAnos,
    anoAtual: estadoHud.anoAtual,
    humor: estadoHud.humor,
    saude: estadoHud.saude,
    dinheiro: estadoHud.dinheiro,
    atributos: estadoHud.atributos.reduce<Record<string, number>>((atributos, atributo) => ({
      ...atributos,
      [atributo.nome.toLowerCase()]: atributo.valor,
    }), {}),
    flags: [],
    cooldownRegistry: {},
  };
}

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
  readonly onSaida?: (destino: DestinoSaidaIso) => void;
};

export function IsoExplorationScene({ comodoId, onSaida }: IsoExplorationSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [erro, setErro] = useState<string | undefined>();
  const [posicao, setPosicao] = useState<{ tx: number; ty: number }>({ tx: 1, ty: 1 });
  const [portalNode, setPortalNode] = useState<HTMLDivElement | undefined>();

  // Refs para acesso nos callbacks sem stale closure
  const appRef        = useRef<Application | undefined>();
  const personagemRef = useRef<ControladorPersonagem | undefined>();
  const npcRef        = useRef<MarnieCharacterController | undefined>();
  const salaRef       = useRef<IsoRoomController | undefined>();
  const fadeRef       = useRef<Graphics | undefined>();

  const definirPortalNode = useCallback((node: HTMLDivElement | null) => {
    setPortalNode(node ?? undefined);
  }, []);

  // Resolve uma ação escolhida no ActionBubble (igual à ExplorationScene legada).
  const aoEscolherAcao = useCallback(async (acaoId: string): Promise<void> => {
    const app = appRef.current;
    const personagem = personagemRef.current;
    const { setInteractionLock, desfocarObjeto } = useExplorationStore.getState();

    if (app === undefined || personagem === undefined || interactionLock.estaLocked()) return;

    setInteractionLock(true);
    try {
      const estadoHud = useHudStore.getState();
      const estadoExploracao = useExplorationStore.getState();
      const acaoDefinida: ActionDefinition = obterAcao(acaoId) ?? acaoFallback(acaoId);

      const resultado = await resolverAcao(acaoDefinida, {
        estado: estadoAtualDoJogo(),
        progressao: { contadores: {}, marcadores: {}, ultimoReset: {} },
        anoJogo: estadoHud.saveAtual?.estadoMundo.anoAtual ?? estadoHud.anoAtual,
        mesJogo: estadoHud.saveAtual?.estadoMundo.mesAtual ?? 1,
        localId: estadoExploracao.localAtualId,
      });

      // Persistir logs no IndexedDB — fire-and-forget, não bloqueia UI
      const saveId = useHudStore.getState().saveIdAtivo;
      if (saveId !== undefined) {
        persistirLogsDeAcao(saveId, resultado);
      }

      const container = personagem.obterContainer();
      const posicaoFeedback = { x: container.x, y: container.y - 72 };

      // Um floating label por efeito visível, escalonados para não se sobrepor.
      let offsetY = 0;
      for (const efeito of resultado.efeitosAplicados) {
        const texto = efeitoParaTexto(efeito);
        if (texto === undefined) continue;
        mostrarFeedback({
          app,
          posicaoMundo: { x: posicaoFeedback.x, y: posicaoFeedback.y + offsetY },
          texto,
          cor: efeitoParaCor(efeito),
          duracao: 1.8,
        });
        offsetY -= 28;
      }

      // Fallback: ação sem efeito visível (ex.: só flags) ainda dá confirmação.
      if (offsetY === 0) {
        mostrarFeedback({
          app,
          posicaoMundo: posicaoFeedback,
          texto: resultado.desfecho === 'direto' ? `✓ ${acaoDefinida.rotulo}` : '+Ação',
          cor: 0x4ade80,
        });
      }
    } catch (erroAcao) {
      console.error('[IsoExplorationScene] Falha ao resolver ação:', erroAcao);
      const container = personagemRef.current?.obterContainer();
      if (app !== undefined && container !== undefined) {
        mostrarFeedback({
          app,
          posicaoMundo: { x: container.x, y: container.y - 72 },
          texto: 'Ação falhou',
          cor: 0xf87171,
        });
      }
    } finally {
      desfocarObjeto();
      setInteractionLock(false);
    }
  }, []);

  useEffect(() => {
    if (canvasRef.current === null) return;

    let cancelado = false;

    // Catálogo de ações ISO — fire-and-forget, idempotente.
    void carregarCatalogoAcoes();

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

      // Overlay de fade (preto) para transição de saída. Rect superdimensionado
      // p/ cobrir a tela apesar do zoom/translação aplicados ao stage.
      const fade = new Graphics();
      fade.rect(-10000, -10000, 20000, 20000).fill({ color: 0x000000 });
      fade.alpha = 0;
      fade.zIndex = 1_000_000;
      app.stage.addChild(fade);
      fadeRef.current = fade;

      const comodo = await carregarComodoIso(comodoId);
      if (cancelado) return; // app.destroy já será chamado pelo cleanup

      if (comodo === undefined) {
        setErro(`Cômodo "${comodoId}" não encontrado.`);
        return;
      }

      // Transição de saída: fade para preto e então dispara onSaida(destino).
      const realizarSaida = (destino: DestinoSaidaIso) => {
        const overlay = fadeRef.current;
        if (overlay !== undefined) {
          gsap.to(overlay, {
            alpha: 1,
            duration: 0.3,
            ease: 'power1.out',
            onComplete: () => { onSaida?.(destino); },
          });
        } else {
          onSaida?.(destino);
        }
      };

      sala.carregarComodo(
        app,
        comodo,
        (tx, ty) => {
          const char = personagemRef.current;
          const rm   = salaRef.current;
          if (char === undefined || rm === undefined) return;
          if (char.estaEmMovimento()) return;
          if (interactionLock.estaLocked() || useExplorationStore.getState().interactionLock) return;

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
              // 2c: personagem chegou a uma saída → fade + transição automática
              const comodoAtual = rm.obterComodo();
              if (comodoAtual !== undefined) {
                const saidaAlcancada = comodoAtual.saidas.find(
                  s => s.tileX === pos.tx && s.tileY === pos.ty,
                );
                if (saidaAlcancada !== undefined) {
                  realizarSaida(saidaAlcancada.destino);
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
        (saidaId) => {
          const saida = comodo.saidas.find(s => s.id === saidaId);
          if (saida !== undefined) realizarSaida(saida.destino);
        },
        // Clique em móvel → anda até o tile de interação e abre o ActionBubble.
        (objeto: ObjetoInterativoIso) => {
          const char = personagemRef.current;
          const rm   = salaRef.current;
          if (char === undefined || rm === undefined) return;
          if (char.estaEmMovimento()) return;
          if (interactionLock.estaLocked() || useExplorationStore.getState().interactionLock) return;

          const estado = useExplorationStore.getState();
          estado.setInteractionLock(true);
          estado.desfocarObjeto();
          rm.mostrarMarcadorDestino(objeto.tileInteracaoX, objeto.tileInteracaoY);

          void char.moverPara(
            { tx: objeto.tileInteracaoX, ty: objeto.tileInteracaoY },
            rm.obterGrid(),
          ).then(() => {
            if (personagemRef.current === undefined) return;
            const pos = char.obterPosicao();
            rm.atualizarGrid([{ tileX: pos.tx, tileY: pos.ty }]);
            setPosicao(pos);

            const container = char.obterContainer();
            const sprite    = rm.obterSpriteDeObjeto(objeto.id);
            const posGlobal = sprite?.toGlobal({ x: 0, y: -18 })
              ?? { x: container.x, y: container.y - 24 };

            useExplorationStore.getState().focarObjeto({
              id: objeto.id,
              posicao: { x: posGlobal.x, y: posGlobal.y },
              acoes: objeto.acoes,
            });
            useExplorationStore.getState().setInteractionLock(false);
          });
        },
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
      const fadeAtual = fadeRef.current;
      if (fadeAtual !== undefined) gsap.killTweensOf(fadeAtual);

      // Limpar refs antes de destruir para impedir callbacks órfãos
      personagemRef.current = undefined;
      npcRef.current        = undefined;
      salaRef.current       = undefined;
      appRef.current        = undefined;
      fadeRef.current       = undefined;

      char?.destruir();
      npcAtual?.destruir();
      sala.destruir();
      app.destroy(true);

      useExplorationStore.getState().sairDeExploracao();
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

      {/* Overlay do ActionBubble (React portal sobre o canvas) */}
      <div
        ref={definirPortalNode}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      />
      {portalNode !== undefined && createPortal(
        <ActionBubble onAcaoEscolhida={aoEscolherAcao} />,
        portalNode,
      )}
    </div>
  );
}
