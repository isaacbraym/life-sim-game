/* ============================================================================
   RailVitais — humor, saúde, atributos, roster
   ----------------------------------------------------------------------------
   ▸ Destino: packages/game/src/ui/RailVitais.tsx
   ▸ Substitui a metade-superior do antigo HudLateral (vitais + atributos).
   ▸ HudLateral pode ser removido após esta migração (todo seu conteúdo
     migra para BarraSuperior + RailVitais + RailAtividades).
   ============================================================================ */

import React, { useState } from 'react';
import type { AtributoRpg } from '../state/hudStore';
import { PainelAtributos } from './PainelAtributos';
import { EventLog } from './EventLog';
import './RailVitais.css';

type PropsRailVitais = {
  readonly humor: number;
  readonly saude: number;
  readonly atributos: readonly AtributoRpg[];
};

function comentarioVital(valor: number): string {
  if (valor >= 70) return 'estável';
  if (valor >= 40) return 'instável';
  return 'crítico';
}

function corVital(valor: number): 'verde' | 'amarelo' | 'vermelho' {
  if (valor >= 70) return 'verde';
  if (valor >= 40) return 'amarelo';
  return 'vermelho';
}

/** Stat radial: anel SVG + valor central + comentário textual. */
function StatRadial({
  rotulo,
  valor,
}: {
  readonly rotulo: string;
  readonly valor: number;
}) {
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (valor / 100) * circ;
  const cor = corVital(valor);

  return (
    <div className="vida-rail-vitais__stat">
      <svg width="50" height="50" viewBox="0 0 56 56" aria-hidden="true">
        <circle cx="28" cy="28" r={radius} fill="none" strokeWidth="4"
                className="vida-rail-vitais__stat-fundo" />
        <circle cx="28" cy="28" r={radius} fill="none" strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                transform="rotate(-90 28 28)"
                className={`vida-rail-vitais__stat-anel vida-rail-vitais__stat-anel--${cor}`} />
        <text x="28" y="33" textAnchor="middle"
              className="vida-rail-vitais__stat-num">
          {valor}
        </text>
      </svg>
      <div className="vida-rail-vitais__stat-texto">
        <div className="vida-rail-vitais__stat-rotulo">{rotulo}</div>
        <div className="vida-rail-vitais__stat-coment">{comentarioVital(valor)}</div>
      </div>
    </div>
  );
}

export function RailVitais({
  humor,
  saude,
  atributos,
}: PropsRailVitais): React.JSX.Element {
  const [historicoAberto, setHistoricoAberto] = useState(false);

  return (
    <aside
      className="vida-rail-vitais vida-scroll"
      aria-label="Vitais e atributos"
    >
      <div className="vida-rail-vitais__caps">Vitais</div>
      <StatRadial rotulo="Humor" valor={humor} />
      <StatRadial rotulo="Saúde" valor={saude} />

      <div className="vida-rail-vitais__caps">Atributos</div>
      <PainelAtributos atributos={atributos} />

      {/* Roster preview — pode plugar dados reais depois (estado de NPCs próximos) */}
      <div className="vida-rail-vitais__caps">Roster · em breve</div>
      <p className="vida-rail-vitais__placeholder">
        Lista de NPCs próximos aparecerá aqui na Sprint 1.5.
      </p>

      {/* [NEW] Histórico de eventos colapsável */}
      <button
        className="vida-rail-vitais__historico-toggle"
        onClick={() => setHistoricoAberto((v) => !v)}
        aria-expanded={historicoAberto}
      >
        <span>📋 Histórico</span>
        <span className="vida-rail-vitais__historico-seta">
          {historicoAberto ? '▲' : '▼'}
        </span>
      </button>
      {historicoAberto && <EventLog className="vida-rail-vitais__historico" />}
    </aside>
  );
}
