import React from 'react';
import { useHudStore } from '../state/hudStore';
import './EventLog.css';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type EventLogProps = { readonly className?: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_ENTRADAS = 50;

function formatarEntrada(eventoId: string): string {
  return eventoId
    .replace(/_/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
}

/** Opacidade decrescente para entradas mais antigas (índice 0 = mais recente). */
function opacidadeEntrada(indice: number, total: number): number {
  if (total <= 1) return 1;
  const minOpacidade = 0.35;
  return 1 - (indice / (total - 1)) * (1 - minOpacidade);
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function EventLog({ className }: EventLogProps): React.JSX.Element {
  const eventosVividos = useHudStore((s) => s.eventosVividos);

  // Mais recente no topo, máximo 50
  const entradas = [...eventosVividos].reverse().slice(0, MAX_ENTRADAS);

  if (entradas.length === 0) {
    return (
      <div className={`ev-log ev-log--vazio${className !== undefined ? ` ${className}` : ''}`}>
        <span className="ev-log__vazio-texto">Nenhum evento registrado ainda.</span>
      </div>
    );
  }

  const exibirFade = eventosVividos.length > MAX_ENTRADAS;

  return (
    <div
      className={`ev-log${className !== undefined ? ` ${className}` : ''}${exibirFade ? ' ev-log--fade' : ''}`}
      aria-label="Histórico de eventos"
      role="log"
      aria-live="polite"
    >
      {entradas.map((eventoId, i) => (
        <div
          key={`${eventoId}-${i}`}
          className={`ev-log__entrada${i === 0 ? ' ev-log__entrada--recente' : ''}`}
          style={{ opacity: opacidadeEntrada(i, entradas.length) }}
        >
          <span className="ev-log__icone" aria-hidden="true">📋</span>
          <span className="ev-log__texto">{formatarEntrada(eventoId)}</span>
        </div>
      ))}
    </div>
  );
}
