import React, { useMemo, useState } from 'react';
import type { LogCamadaEnum } from '@core/log/LifeLog';
import { LogCamadaEnum as LogCamadaSchema } from '@core/log/LifeLog';
import { useHudStore } from '../state/hudStore';
import './LifeLogPanel.css';

type CamadaVisivel = Exclude<LogCamadaEnum, 'feedback'>;
type FiltroLog = 'tudo' | CamadaVisivel;

type EntradaLogNarrativo = {
  readonly id: string;
  readonly camada: CamadaVisivel;
  readonly anoJogo: number;
  readonly mesJogo: number;
  readonly texto: string;
  readonly timestamp: number;
  readonly tags: string[];
};

type PropsLifeLogPanel = {
  readonly aberto: boolean;
  readonly aoFechar: () => void;
};

type AbaLog = {
  readonly id: FiltroLog;
  readonly rotulo: string;
};

const ABAS_LOG: readonly AbaLog[] = [
  { id: 'tudo', rotulo: 'Tudo' },
  { id: 'acao_simples', rotulo: 'Acoes' },
  { id: 'consequencia', rotulo: 'Consequencias' },
  { id: 'evento_importante', rotulo: 'Eventos' },
  { id: 'resumo_periodico', rotulo: 'Resumos' },
];

const ROTULOS_CAMADA: Readonly<Record<CamadaVisivel, string>> = {
  acao_simples: 'Acao',
  consequencia: 'Consequencia',
  evento_importante: 'Evento importante',
  resumo_periodico: 'Resumo',
};

function ehFiltroCamada(valor: FiltroLog): valor is CamadaVisivel {
  return valor !== 'tudo' && LogCamadaSchema.options.includes(valor);
}

function formatarData(entrada: EntradaLogNarrativo): string {
  return `${String(entrada.mesJogo).padStart(2, '0')}/${entrada.anoJogo}`;
}

function ehCamadaVisivel(camada: LogCamadaEnum): camada is CamadaVisivel {
  return camada !== 'feedback';
}

export function LifeLogPanel({ aberto, aoFechar }: PropsLifeLogPanel): React.JSX.Element | null {
  const [filtro, setFiltro] = useState<FiltroLog>('tudo');
  const logNarrativo = useHudStore((estado) => estado.logNarrativo);
  const entradasFiltradas = useMemo(() => (
    ehFiltroCamada(filtro)
      ? logNarrativo.filter((entrada): entrada is EntradaLogNarrativo => (
          ehCamadaVisivel(entrada.camada) && entrada.camada === filtro
        ))
      : logNarrativo.filter((entrada): entrada is EntradaLogNarrativo => ehCamadaVisivel(entrada.camada))
  ).slice().sort((a, b) => b.timestamp - a.timestamp), [filtro, logNarrativo]);

  if (!aberto) return null;

  return (
    <aside className="life-log" aria-label="Log narrativo">
      <div className="life-log__topo">
        <div>
          <h2 className="life-log__titulo">Log narrativo</h2>
          <p className="life-log__subtitulo">Historico do personagem</p>
        </div>
        <button
          type="button"
          className="life-log__fechar"
          onClick={aoFechar}
          aria-label="Fechar log narrativo"
        >
          x
        </button>
      </div>

      <div className="life-log__abas" role="tablist" aria-label="Filtros do log">
        {ABAS_LOG.map((aba) => (
          <button
            key={aba.id}
            type="button"
            className={`life-log__aba${filtro === aba.id ? ' life-log__aba--ativa' : ''}`}
            onClick={() => setFiltro(aba.id)}
          >
            {aba.rotulo}
          </button>
        ))}
      </div>

      <div className="life-log__lista" aria-live="polite">
        {entradasFiltradas.length === 0 && (
          <p className="life-log__vazio">Nenhuma acao registrada nesta sessao.</p>
        )}
        {entradasFiltradas.map((entrada) => (
          <article
            key={entrada.id}
            className={`life-log__entrada life-log__entrada--${entrada.camada}`}
          >
            <div className="life-log__entrada-meta">
              <span>{ROTULOS_CAMADA[entrada.camada]}</span>
              <time>{formatarData(entrada)}</time>
            </div>
            <p className="life-log__entrada-texto">{entrada.texto}</p>
          </article>
        ))}
      </div>
    </aside>
  );
}

