import React from 'react';
import type { AtributoRpg } from '../state/hudStore';
import { PainelAtributos } from './PainelAtributos';
import './HudLateral.css';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type AtividadeLivre = {
  readonly id: string;
  readonly rotulo: string;
};

const ATIVIDADES_LIVRES: readonly AtividadeLivre[] = [
  { id: 'academia',        rotulo: '🏋️ Academia'       },
  { id: 'estudar',         rotulo: '📚 Estudar'          },
  { id: 'sair_noite',      rotulo: '🍺 Sair à noite'     },
  { id: 'consulta_medica', rotulo: '💊 Consulta médica'  },
  { id: 'ver_roster',      rotulo: '👥 Ver pessoas'       },
] as const;

type PropsHudLateral = {
  readonly nomePersonagem: string;
  readonly profissaoAtual: string;
  readonly idadeAnos: number;
  readonly anoAtual: number;
  readonly humor: number;
  readonly saude: number;
  readonly dinheiro: number;
  readonly atributos: readonly AtributoRpg[];
  readonly aoClicarAtividade: (idAtividade: string) => void;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatarDinheiro(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function corBarra(valor: number): string {
  if (valor >= 70) return 'verde';
  if (valor >= 40) return 'amarelo';
  return 'vermelho';
}

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------

function BarraStat({
  rotulo,
  valor,
}: {
  readonly rotulo: string;
  readonly valor: number;
}) {
  const cor = corBarra(valor);
  return (
    <div className="hud-stat-card">
      <div className="hud-stat-topo">
        <span className="hud-stat-rotulo">{rotulo}</span>
        <span className={`hud-stat-valor hud-stat-valor--${cor}`}>{valor}</span>
      </div>
      <div className="hud-barra-trilho">
        <div
          className={`hud-barra-fill hud-barra-fill--${cor}`}
          style={{ width: `${valor}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function HudLateral({
  nomePersonagem,
  profissaoAtual,
  idadeAnos,
  anoAtual,
  humor,
  saude,
  dinheiro,
  atributos,
  aoClicarAtividade,
}: PropsHudLateral): React.JSX.Element {
  return (
    <aside className="hud-lateral" aria-label="Status do personagem">

      {/* Identidade */}
      <div className="hud-identidade">
        <div className="hud-nome">{nomePersonagem}</div>
        <div className="hud-profissao">{profissaoAtual}</div>
        <div className="hud-badges">
          <span className="hud-badge">{idadeAnos} anos</span>
          <span className="hud-badge">{anoAtual}</span>
        </div>
      </div>

      <div className="hud-divisor" />

      {/* Status */}
      <div className="hud-secao-titulo">Status</div>

      <BarraStat rotulo="Humor" valor={humor} />
      <BarraStat rotulo="Saúde" valor={saude} />

      <div className="hud-dinheiro-card">
        <div className="hud-dinheiro-rotulo">Dinheiro</div>
        <div className="hud-dinheiro-valor">{formatarDinheiro(dinheiro)}</div>
      </div>

      <div className="hud-divisor" />

      {/* Atributos RPG */}
      <div className="hud-secao-titulo">Atributos</div>
      <PainelAtributos atributos={atributos} />

      <div className="hud-divisor" />

      {/* Atividades livres */}
      <div className="hud-secao-titulo">Atividades</div>

      {ATIVIDADES_LIVRES.map((atividade) => (
        <button
          key={atividade.id}
          className="hud-atividade-btn"
          onClick={() => aoClicarAtividade(atividade.id)}
        >
          {atividade.rotulo}
        </button>
      ))}

    </aside>
  );
}
