import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import type { Joint, Ponto } from '@core/rig/Joint';
import { LIMITES_ANATOMICOS } from '@core/rig/constraints';
import { Esqueleto } from '@core/rig/Skeleton';
import type { JointId } from '@core/schemas/pose';
import { RigRenderer } from '../rendering/RigRenderer';

export type PixiStageProps = {
  readonly debugMode?: boolean;
};

type DimensoesCanvas = {
  readonly width: number;
  readonly height: number;
};

type DefinicaoJoint = readonly [
  id: JointId,
  parentId: JointId | null,
  localPosition: Ponto,
];

function comprimento(localPosition: Ponto): number {
  return Math.hypot(localPosition.x, localPosition.y);
}

function criarJoint(
  id: JointId,
  parentId: JointId | null,
  localPosition: Ponto,
): Joint {
  return {
    id,
    parentId,
    localPosition,
    rotacaoLocal: 0,
    comprimento: comprimento(localPosition),
    limites: LIMITES_ANATOMICOS[id],
  };
}

function criarEsqueletoPoseT(): Esqueleto {
  const definicoes: readonly DefinicaoJoint[] = [
    ['root_pelvis', null, { x: 0, y: 0 }],
    ['spine', 'root_pelvis', { x: 0, y: -45 }],
    ['neck', 'spine', { x: 0, y: -45 }],
    ['head', 'neck', { x: 0, y: -28 }],
    ['shoulder_L', 'spine', { x: -32, y: -36 }],
    ['elbow_L', 'shoulder_L', { x: -48, y: 0 }],
    ['wrist_L', 'elbow_L', { x: -42, y: 0 }],
    ['shoulder_R', 'spine', { x: 32, y: -36 }],
    ['elbow_R', 'shoulder_R', { x: 48, y: 0 }],
    ['wrist_R', 'elbow_R', { x: 42, y: 0 }],
    ['hip_L', 'root_pelvis', { x: -18, y: 8 }],
    ['knee_L', 'hip_L', { x: 0, y: 58 }],
    ['ankle_L', 'knee_L', { x: 0, y: 50 }],
    ['hip_R', 'root_pelvis', { x: 18, y: 8 }],
    ['knee_R', 'hip_R', { x: 0, y: 58 }],
  ];
  const juntas = new Map<JointId, Joint>();

  for (const [id, parentId, localPosition] of definicoes) {
    juntas.set(id, criarJoint(id, parentId, localPosition));
  }

  return new Esqueleto(juntas);
}

function obterDimensoes(container: HTMLDivElement): DimensoesCanvas {
  const rect = container.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width || window.innerWidth));
  const height = Math.max(1, Math.floor(rect.height || window.innerHeight));
  return { width, height };
}

function reposicionarRig(
  renderer: RigRenderer,
  esqueleto: Esqueleto,
  dimensoes: DimensoesCanvas,
): void {
  const escala = Math.min(Math.max(Math.min(dimensoes.width, dimensoes.height) / 430, 0.72), 1.35);
  renderer.definirEscala(escala);
  renderer.containerPixi.position.set(dimensoes.width / 2, dimensoes.height * 0.56);
  renderer.renderizar(esqueleto);
}

export function PixiStage({ debugMode = false }: PixiStageProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const rigRendererRef = useRef<RigRenderer | null>(null);
  const esqueletoRef = useRef<Esqueleto | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null || appRef.current !== null) return;

    let desmontado = false;
    let resizeObserver: ResizeObserver | undefined;
    const app = new PIXI.Application();
    const rigRenderer = new RigRenderer({ debugMode });
    const esqueleto = criarEsqueletoPoseT();
    const dimensoes = obterDimensoes(container);

    void app.init({
      width: dimensoes.width,
      height: dimensoes.height,
      backgroundColor: 0x1a1a2e,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio,
    }).then(() => {
      if (desmontado) {
        rigRenderer.destruir();
        app.destroy();
        return;
      }

      appRef.current = app;
      rigRendererRef.current = rigRenderer;
      esqueletoRef.current = esqueleto;
      app.canvas.style.display = 'block';
      app.canvas.style.width = '100%';
      app.canvas.style.height = '100%';
      container.appendChild(app.canvas);
      app.stage.addChild(rigRenderer.containerPixi);
      reposicionarRig(rigRenderer, esqueleto, dimensoes);

      resizeObserver = new ResizeObserver(() => {
        const novasDimensoes = obterDimensoes(container);
        app.renderer.resize(novasDimensoes.width, novasDimensoes.height);
        reposicionarRig(rigRenderer, esqueleto, novasDimensoes);
      });
      resizeObserver.observe(container);
    });

    return () => {
      desmontado = true;
      resizeObserver?.disconnect();
      rigRendererRef.current?.destruir();
      rigRendererRef.current = null;
      esqueletoRef.current = null;

      if (appRef.current !== null) {
        appRef.current.destroy();
        appRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const rigRenderer = rigRendererRef.current;
    const esqueleto = esqueletoRef.current;

    if (rigRenderer === null || esqueleto === null) {
      return;
    }

    rigRenderer.definirDebugMode(debugMode);
    rigRenderer.renderizar(esqueleto);
  }, [debugMode]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden' }}
    />
  );
}
