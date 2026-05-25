import React from 'react';
import type { ActionDefinition } from '@core/schemas/action';
import { useExplorationStore } from '@game/state/explorationStore';

export type ActionBubbleProps = {
  readonly onAcaoEscolhida: (acaoId: string) => void;
};

const ACOES_DEMO = [
  {
    id: 'descansar',
    rotulo: 'descansar',
    resolutionMode: 'direct',
    narrativeWeight: 'routine',
  },
  {
    id: 'conversar',
    rotulo: 'conversar',
    resolutionMode: 'direct',
    narrativeWeight: 'routine',
  },
  {
    id: 'assistir_tv',
    rotulo: 'assistir_tv',
    resolutionMode: 'direct',
    narrativeWeight: 'routine',
  },
] satisfies readonly Pick<ActionDefinition, 'id' | 'rotulo' | 'resolutionMode' | 'narrativeWeight'>[];

function obterAcaoDemo(acaoId: string): Pick<ActionDefinition, 'id' | 'rotulo'> {
  return ACOES_DEMO.find((acao) => acao.id === acaoId) ?? { id: acaoId, rotulo: acaoId };
}

export function ActionBubble({ onAcaoEscolhida }: ActionBubbleProps): React.JSX.Element | null {
  const bubblePos = useExplorationStore((estado) => estado.bubblePos);
  const bubbleAcoes = useExplorationStore((estado) => estado.bubbleAcoes);
  const interactionLock = useExplorationStore((estado) => estado.interactionLock);
  const desfocarObjeto = useExplorationStore((estado) => estado.desfocarObjeto);

  if (bubblePos === undefined || bubbleAcoes.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        ...estilos.bubble,
        left: bubblePos.x,
        top: bubblePos.y,
        transform: 'translateX(-50%)',
      }}
    >
      <div style={estilos.acoes}>
        {bubbleAcoes.map((acaoId) => {
          const acao = obterAcaoDemo(acaoId);

          return (
            <button
              key={acao.id}
              type="button"
              style={estilos.botao}
              disabled={interactionLock}
              onClick={() => onAcaoEscolhida(acao.id)}
            >
              {acao.rotulo}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Fechar ações"
        style={estilos.fechar}
        disabled={interactionLock}
        onClick={desfocarObjeto}
      >
        ✕
      </button>
    </div>
  );
}

const estilos = {
  bubble: {
    position: 'absolute',
    zIndex: 20,
    display: 'flex',
    alignItems: 'stretch',
    gap: 6,
    padding: 8,
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderRadius: 8,
    background: 'rgba(25, 28, 36, 0.96)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.28)',
    pointerEvents: 'auto',
  },
  acoes: {
    display: 'flex',
    gap: 6,
  },
  botao: {
    minHeight: 34,
    border: '1px solid rgba(255, 255, 255, 0.14)',
    borderRadius: 6,
    padding: '0 12px',
    background: '#eef2f7',
    color: '#1b1f29',
    cursor: 'pointer',
    font: '600 13px Arial, sans-serif',
    letterSpacing: 0,
  },
  fechar: {
    width: 34,
    minHeight: 34,
    border: '1px solid rgba(255, 255, 255, 0.14)',
    borderRadius: 6,
    background: '#3b414f',
    color: '#ffffff',
    cursor: 'pointer',
    font: '700 14px Arial, sans-serif',
    letterSpacing: 0,
  },
} satisfies Record<string, React.CSSProperties>;
