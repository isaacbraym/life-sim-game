import React from 'react';
import './BotaoAvancarTempo.css';

type PropsBotaoAvancarTempo = {
  readonly ritmo: 'mensal' | 'semestral' | 'anual';
  readonly aoAvancar: () => void;
  readonly desabilitado: boolean;
};

const ROTULO: Readonly<Record<'mensal' | 'semestral' | 'anual', string>> = {
  mensal:    'Avançar mês',
  semestral: 'Avançar 6 meses',
  anual:     'Avançar 1 ano',
};

export function BotaoAvancarTempo({
  ritmo,
  aoAvancar,
  desabilitado,
}: PropsBotaoAvancarTempo): React.JSX.Element {
  return (
    <button
      className="btn-avancar-tempo"
      onClick={aoAvancar}
      disabled={desabilitado}
      aria-label={ROTULO[ritmo]}
      title={desabilitado ? 'Resolva o evento antes de avançar' : ROTULO[ritmo]}
    >
      <span className="btn-avancar-tempo__label">{ROTULO[ritmo]}</span>
      <svg
        className="btn-avancar-tempo__icone"
        width={14}
        height={14}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </button>
  );
}
