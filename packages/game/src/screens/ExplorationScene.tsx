import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Application, Container, Graphics, Text } from 'pixi.js';
import { gsap } from 'gsap';
import type { ComodoDefinition } from '@core/schemas/location';
import { CharacterController } from '@game/stage/CharacterController';
import { RoomController } from '@game/stage/RoomController';
import { useExplorationStore } from '@game/state/explorationStore';
import { ActionBubble } from '@game/ui/ActionBubble';
import { mostrarFeedback } from '@game/ui/VisualFeedback';

type DestinoSaida = ComodoDefinition['pontosDeSaida'][number]['destino'];

export type ExplorationSceneProps = {
  readonly onSaida: (destino: DestinoSaida) => void;
};

const COMODO_TESTE = {
  id: 'sala_teste',
  localId: 'casa',
  nome: 'Sala de Teste',
  backgroundAsset: 'placeholder',
  tamanho: { largura: 960, altura: 540 },
  navZonas: [
    {
      id: 'zona_principal',
      poligono: [
        { x: 80, y: 280 },
        { x: 880, y: 280 },
        { x: 880, y: 460 },
        { x: 80, y: 460 },
      ],
    },
  ],
  pontosDeSaida: [
    {
      id: 'saida_mapa',
      posicao: { x: 50, y: 380 },
      destino: { tipo: 'mapa' },
      rotulo: 'Sair',
    },
  ],
  objetos: [
    {
      id: 'sofa',
      tipo: 'assento',
      posicao: { x: 300, y: 310 },
      tamanho: { largura: 120, altura: 60 },
      posicaoDeInteracao: { x: 360, y: 380 },
      assetId: 'placeholder',
      acoes: ['descansar', 'conversar'],
    },
    {
      id: 'tv',
      tipo: 'entretenimento',
      posicao: { x: 600, y: 290 },
      tamanho: { largura: 80, altura: 50 },
      posicaoDeInteracao: { x: 600, y: 370 },
      assetId: 'placeholder',
      acoes: ['assistir_tv'],
    },
  ],
  npcsElegiveis: [],
  ambientTags: ['casa'],
} satisfies ComodoDefinition;

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

export function ExplorationScene({ onSaida }: ExplorationSceneProps): React.JSX.Element {
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

  const aoEscolherAcao = useCallback((acaoId: string) => {
    const app = appRef.current;
    const personagem = personagemRef.current;
    const { setInteractionLock, desfocarObjeto } = useExplorationStore.getState();

    if (app === undefined || personagem === undefined) return;

    setInteractionLock(true);
    mostrarFeedback({
      app,
      posicaoMundo: { x: personagem.x, y: personagem.y - 72 },
      texto: `+${acaoId}`,
      cor: 0x7bd389,
    });

    const timer = window.setTimeout(() => {
      desfocarObjeto();
      setInteractionLock(false);
    }, 450);
    timersRef.current.push(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null || appRef.current !== undefined) return;

    let desmontado = false;
    const app = new Application();
    const personagem = criarPersonagemPlaceholder();
    const characterController = new CharacterController();
    const fade = criarOverlayFade(COMODO_TESTE);
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
      width: COMODO_TESTE.tamanho.largura,
      height: COMODO_TESTE.tamanho.altura,
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
      roomController.carregarComodo(app, COMODO_TESTE);
      app.stage.addChild(personagem);
      app.stage.addChild(fade);
      useExplorationStore.getState().entrarEmExploracao(COMODO_TESTE.localId, COMODO_TESTE.id);
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
  }, [limparTimers, onSaida]);

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
} satisfies Record<string, React.CSSProperties>;
