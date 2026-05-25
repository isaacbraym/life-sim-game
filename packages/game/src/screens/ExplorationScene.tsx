import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Application, Container, Graphics, Text } from 'pixi.js';
import { gsap } from 'gsap';
import type { ComodoDefinition } from '@core/schemas/location';
import type { ActionDefinition } from '@core/schemas/action';
import type { EstadoDeJogo } from '@core/events/EstadoDeJogo';
import { salvarParaEstadoDeJogo } from '@core/events/EstadoDeJogo';
import { resolverAcao } from '@core/interaction/ActionResolver';
import { interactionLock } from '@core/interaction/InteractionLock';
import { CharacterController } from '@game/stage/CharacterController';
import { RoomController } from '@game/stage/RoomController';
import { obterComodo } from '@game/content/locationCatalog';
import { useExplorationStore } from '@game/state/explorationStore';
import { useHudStore } from '@game/state/hudStore';
import { ActionBubble } from '@game/ui/ActionBubble';
import { mostrarFeedback } from '@game/ui/VisualFeedback';

type DestinoSaida = ComodoDefinition['pontosDeSaida'][number]['destino'];

export type ExplorationSceneProps = {
  readonly comodoId: string;
  readonly onSaida: (destino: DestinoSaida) => void;
};

function criarPersonagemPlaceholder(): Container {
  const personagem = new Container();
  const sombra = new Graphics();
  const corpo = new Graphics();
  const cabeca = new Graphics();
  const label = new Text({
    text: 'Jogador',
    style: {
      fill: 0xffffff,
      fontFamily: 'Arial, sans-serif',
      fontSize: 12,
      fontWeight: '700',
    },
  });

  sombra.ellipse(0, 22, 24, 8).fill({ color: 0x000000, alpha: 0.25 });
  corpo.roundRect(-14, -26, 28, 48, 10).fill({ color: 0x7bd389 });
  cabeca.circle(0, -40, 14).fill({ color: 0xf2c6a0 });
  label.anchor.set(0.5, 1);
  label.position.set(0, -58);

  personagem.label = 'personagem:jogador';
  personagem.position.set(180, 390);
  personagem.addChild(sombra, corpo, cabeca, label);

  return personagem;
}

function criarOverlayFade(comodo: ComodoDefinition): Graphics {
  const overlay = new Graphics();

  overlay
    .rect(0, 0, comodo.tamanho.largura, comodo.tamanho.altura)
    .fill({ color: 0x000000 });
  overlay.alpha = 0;

  return overlay;
}

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

export function ExplorationScene({ comodoId, onSaida }: ExplorationSceneProps): React.JSX.Element {
  const comodo = useMemo(() => obterComodo(comodoId), [comodoId]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | undefined>(undefined);
  const roomControllerRef = useRef<RoomController | undefined>(undefined);
  const characterControllerRef = useRef<CharacterController | undefined>(undefined);
  const personagemRef = useRef<Container | undefined>(undefined);
  const fadeRef = useRef<Graphics | undefined>(undefined);
  const timersRef = useRef<number[]>([]);
  const [portalNode, setPortalNode] = useState<HTMLDivElement | undefined>(undefined);

  const definirPortalNode = useCallback((node: HTMLDivElement | null) => {
    setPortalNode(node ?? undefined);
  }, []);

  const limparTimers = useCallback(() => {
    for (const timer of timersRef.current) {
      window.clearTimeout(timer);
    }
    timersRef.current = [];
  }, []);

  const aoEscolherAcao = useCallback(async (acaoId: string): Promise<void> => {
    const app = appRef.current;
    const personagem = personagemRef.current;
    const { setInteractionLock, desfocarObjeto } = useExplorationStore.getState();

    if (app === undefined || personagem === undefined || interactionLock.estaLocked()) return;

    setInteractionLock(true);

    try {
      const estadoHud = useHudStore.getState();
      const estadoExploracao = useExplorationStore.getState();
      const acaoDemo: ActionDefinition = {
        id: acaoId,
        rotulo: acaoId,
        resolutionMode: 'direct',
        narrativeWeight: 'routine',
        onSuccess: [{ tipo: 'alterar_humor', delta: 2 }],
        timeCost: { unidades: 1, tipo: 'periodo' },
      };

      const resultado = await resolverAcao(acaoDemo, {
        estado: estadoAtualDoJogo(),
        progressao: {
          contadores: {},
          marcadores: {},
          ultimoReset: {},
        },
        anoJogo: estadoHud.saveAtual?.estadoMundo.anoAtual ?? estadoHud.anoAtual,
        mesJogo: estadoHud.saveAtual?.estadoMundo.mesAtual ?? 1,
        localId: estadoExploracao.localAtualId,
      });

      mostrarFeedback({
        app,
        posicaoMundo: { x: personagem.x, y: personagem.y - 72 },
        texto: resultado.desfecho === 'direto' ? `✓ ${acaoId}` : '+Ação',
        cor: 0x4ade80,
      });
    } catch (erro) {
      console.error('[ExplorationScene] Falha ao resolver ação:', erro);
      mostrarFeedback({
        app,
        posicaoMundo: { x: personagem.x, y: personagem.y - 72 },
        texto: 'Ação falhou',
        cor: 0xf87171,
      });
    } finally {
      desfocarObjeto();
      setInteractionLock(false);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null || appRef.current !== undefined || comodo === undefined) return;

    let desmontado = false;
    const app = new Application();
    const personagem = criarPersonagemPlaceholder();
    const characterController = new CharacterController();
    const fade = criarOverlayFade(comodo);
    const roomController = new RoomController({
      onObjetoClicado: (objeto) => {
        const estado = useExplorationStore.getState();
        if (estado.interactionLock) return;

        estado.setInteractionLock(true);
        estado.desfocarObjeto();
        characterController.moveParaInteractionPoint(
          personagem,
          objeto.posicaoDeInteracao,
          () => {
            const spriteObjeto = roomController.obterSpriteDeObjeto(objeto.id);
            const posicaoBubble = spriteObjeto?.toGlobal({
              x: objeto.tamanho.largura / 2,
              y: -18,
            }) ?? { x: objeto.posicao.x, y: objeto.posicao.y - 24 };

            useExplorationStore.getState().focarObjeto({
              id: objeto.id,
              posicao: { x: posicaoBubble.x, y: posicaoBubble.y },
              acoes: objeto.acoes,
            });
            useExplorationStore.getState().setInteractionLock(false);
          },
        );
      },
      onSaidaClicada: (saida) => {
        const estado = useExplorationStore.getState();
        if (estado.interactionLock) return;

        estado.setInteractionLock(true);
        estado.desfocarObjeto();
        gsap.to(fade, {
          alpha: 1,
          duration: 0.3,
          ease: 'power1.out',
          onComplete: () => {
            onSaida(saida.destino);
            useExplorationStore.getState().setInteractionLock(false);
          },
        });
      },
    });

    void app.init({
      canvas,
      width: comodo.tamanho.largura,
      height: comodo.tamanho.altura,
      backgroundColor: 0x11151c,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio,
    }).then(() => {
      if (desmontado) {
        app.destroy();
        return;
      }

      appRef.current = app;
      roomControllerRef.current = roomController;
      characterControllerRef.current = characterController;
      personagemRef.current = personagem;
      fadeRef.current = fade;

      app.stage.sortableChildren = true;
      roomController.carregarComodo(app, comodo);
      app.stage.addChild(personagem);
      app.stage.addChild(fade);
    });

    return () => {
      desmontado = true;
      limparTimers();
      characterControllerRef.current?.cancelarMovimento();
      roomControllerRef.current?.destruir();
      fadeRef.current?.destroy();
      personagemRef.current?.destroy({ children: true });
      appRef.current?.destroy();
      appRef.current = undefined;
      roomControllerRef.current = undefined;
      characterControllerRef.current = undefined;
      personagemRef.current = undefined;
      fadeRef.current = undefined;
      useExplorationStore.getState().sairDeExploracao();
    };
  }, [comodo, limparTimers, onSaida]);

  if (comodo === undefined) {
    return (
      <div style={estilos.erro}>
        <h2 style={estilos.erroTitulo}>Comodo nao encontrado</h2>
        <p style={estilos.erroTexto}>{comodoId}</p>
        <button
          type="button"
          style={estilos.erroBotao}
          onClick={() => onSaida({ tipo: 'mapa' })}
        >
          Voltar ao mapa
        </button>
      </div>
    );
  }

  return (
    <div style={estilos.raiz}>
      <canvas ref={canvasRef} style={estilos.canvas} />
      <div
        ref={definirPortalNode}
        style={estilos.overlay}
      />
      {portalNode !== undefined && createPortal(
        <ActionBubble onAcaoEscolhida={aoEscolherAcao} />,
        portalNode,
      )}
    </div>
  );
}

const estilos = {
  raiz: {
    position: 'relative',
    width: '100%',
    height: '100%',
    minHeight: 540,
    overflow: 'hidden',
    background: '#11151c',
  },
  canvas: {
    width: '100%',
    height: '100%',
    display: 'block',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  },
  erro: {
    width: '100%',
    height: '100%',
    minHeight: 540,
    display: 'grid',
    alignContent: 'center',
    justifyItems: 'center',
    gap: 12,
    padding: 24,
    background: '#11151c',
    color: '#f5f0e8',
    textAlign: 'center',
  },
  erroTitulo: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
  },
  erroTexto: {
    margin: 0,
    color: '#cbd5e1',
    fontSize: 14,
  },
  erroBotao: {
    marginTop: 8,
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderRadius: 8,
    background: '#243043',
    color: '#f5f0e8',
    cursor: 'pointer',
    font: 'inherit',
    fontWeight: 700,
    padding: '10px 14px',
  },
} satisfies Record<string, React.CSSProperties>;
