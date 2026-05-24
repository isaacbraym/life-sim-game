import React from 'react';
import { useHudStore } from '../state/hudStore';
import type { EntradaLog } from '../state/hudStore';
import './EventLog.css';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type EventLogProps = { readonly className?: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_ENTRADAS = 50;

const TIER_CONFIG: Readonly<Record<NonNullable<EntradaLog['tier']>, { rotulo: string; classe: string }>> = {
  sucesso_critico: { rotulo: 'Crítico!', classe: 'ev-log__chip--critico'       },
  sucesso:         { rotulo: 'Sucesso',  classe: 'ev-log__chip--sucesso'        },
  falha:           { rotulo: 'Falha',    classe: 'ev-log__chip--falha'          },
  falha_critica:   { rotulo: 'Falha!',   classe: 'ev-log__chip--falha-critica'  },
};

const BORDA_TIER: Readonly<Record<NonNullable<EntradaLog['tier']>, string>> = {
  sucesso_critico: 'ev-log__entrada--critico',
  sucesso:         'ev-log__entrada--sucesso',
  falha:           'ev-log__entrada--falha',
  falha_critica:   'ev-log__entrada--falha-critica',
};

function formatarEventoId(eventoId: string): string {
  return eventoId
    .replace(/_/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
}

function opacidadeEntrada(indice: number, total: number): number {
  if (total <= 1) return 1;
  const minOpacidade = 0.35;
  return 1 - (indice / (total - 1)) * (1 - minOpacidade);
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function EventLog({ className }: EventLogProps): React.JSX.Element {
  const logEventos = useHudStore((s) => s.logEventos);

  const entradas = [...logEventos].reverse().slice(0, MAX_ENTRADAS);

  if (entradas.length === 0) {
    return (
      <div className={`ev-log ev-log--vazio${className !== undefined ? ` ${className}` : ''}`}>
        <span className="ev-log__vazio-texto">Nenhum evento registrado ainda.</span>
      </div>
    );
  }

  const exibirFade = logEventos.length > MAX_ENTRADAS;

  return (
    <div
      className={`ev-log${className !== undefined ? ` ${className}` : ''}${exibirFade ? ' ev-log--fade' : ''}`}
      aria-label="Histórico de eventos"
      role="log"
      aria-live="polite"
    >
      {entradas.map((entrada, i) => {
        const tierCfg  = entrada.tier !== undefined ? TIER_CONFIG[entrada.tier]  : undefined;
        const bordaCls = entrada.tier !== undefined ? BORDA_TIER[entrada.tier]   : '';
        return (
          <div
            key={`${entrada.eventoId}-${entrada.anoEvento}-${entrada.mesEvento}-${i}`}
            className={`ev-log__entrada${i === 0 ? ' ev-log__entrada--recente' : ''}${bordaCls !== '' ? ` ${bordaCls}` : ''}`}
            style={{ opacity: opacidadeEntrada(i, entradas.length) }}
          >
            <span
              className="ev-log__data"
              aria-label={`Ano ${entrada.anoEvento}, mês ${entrada.mesEvento}`}
            >
              {entrada.anoEvento}/{String(entrada.mesEvento).padStart(2, '0')}
            </span>
            <span className="ev-log__texto">{formatarEventoId(entrada.eventoId)}</span>
            {tierCfg !== undefined && (
              <span className={`ev-log__chip ${tierCfg.classe}`}>{tierCfg.rotulo}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
