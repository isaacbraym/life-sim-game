import React from 'react';
import type { EventoAtivo } from '../state/hudStore';
import './EventoBase.css';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type PropsEventoBase = {
  readonly evento: EventoAtivo | undefined;
  readonly aoEscolher: (indice: number) => void;
  readonly aoAvancar: () => void;
};

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function EventoBase({
  evento,
  aoEscolher,
  aoAvancar,
}: PropsEventoBase): React.JSX.Element {
  if (evento === undefined) {
    return (
      <div className="evento-base evento-base--vazio">
        <button className="evento-btn-avancar" onClick={aoAvancar}>
          Avançar →
        </button>
      </div>
    );
  }

  return (
    <div className="evento-base" role="region" aria-label="Evento atual">
      <div className="evento-header">
        <span className="evento-icone" aria-hidden="true">{evento.icone}</span>
        <span className="evento-titulo">{evento.titulo}</span>
      </div>

      <p className="evento-descricao">{evento.descricao}</p>

      <div className="evento-acoes" role="group" aria-label="Opções de resposta">
        {evento.opcoes.map((opcao, indice) => (
          <button
            key={indice}
            className="evento-btn-opcao"
            onClick={() => aoEscolher(indice)}
          >
            {opcao.texto}
          </button>
        ))}

        <button
          className="evento-btn-avancar"
          onClick={aoAvancar}
          aria-label="Avançar sem tomar decisão"
        >
          Avançar →
        </button>
      </div>
    </div>
  );
}
