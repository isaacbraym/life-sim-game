/* ============================================================================
   BarraSuperior — identidade + chips + carteira + ações globais
   ----------------------------------------------------------------------------
   ▸ Destino: packages/game/src/ui/BarraSuperior.tsx
   ▸ Componente NOVO (antes a identidade ficava dentro de HudLateral)
   ============================================================================ */

import React from 'react';
import { IconBase } from './IconBase';
import './BarraSuperior.css';

type PropsBarraSuperior = {
  readonly nomePersonagem: string;
  readonly profissaoAtual: string;
  readonly idadeAnos: number;
  readonly anoAtual: number;
  readonly dinheiro: number;
  readonly aoNovoJogo?: () => void;
  readonly aoAbrirSave?: () => void;
  readonly aoAbrirConfig?: () => void;
};

function formatarDinheiro(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

export function BarraSuperior({
  nomePersonagem,
  profissaoAtual,
  idadeAnos,
  anoAtual,
  dinheiro,
  aoNovoJogo,
  aoAbrirSave,
  aoAbrirConfig,
}: PropsBarraSuperior): React.JSX.Element {
  return (
    <header className="vida-topbar" role="banner">
      {aoNovoJogo && (
        <button
          className="vida-topbar__icone"
          onClick={aoNovoJogo}
          aria-label="Novo jogo"
          title="Novo jogo"
        >
          <IconBase name="menu" size={16} />
        </button>
      )}

      <div className="vida-topbar__identidade">
        <div className="vida-topbar__avatar" aria-hidden="true">
          {/* PixiJS mini-preview pode plugar aqui depois — placeholder por enquanto */}
        </div>
        <div className="vida-topbar__nome-bloco">
          <div className="vida-topbar__nome">{nomePersonagem}</div>
          <div className="vida-topbar__profissao">{profissaoAtual}</div>
        </div>
      </div>

      <div className="vida-topbar__divisor" />

      <div className="vida-topbar__chips" role="group" aria-label="Status temporal">
        <span className="vida-topbar__chip">
          <IconBase name="calendar" size={11} />
          {idadeAnos} anos
        </span>
        <span className="vida-topbar__chip vida-topbar__chip--mono">
          {anoAtual}
        </span>
      </div>

      <div className="vida-topbar__direita">
        <div className="vida-topbar__carteira" aria-label="Dinheiro atual">
          <div className="vida-topbar__carteira-rotulo">Carteira</div>
          <div className="vida-topbar__carteira-valor">{formatarDinheiro(dinheiro)}</div>
        </div>

        {aoAbrirSave && (
          <button
            className="vida-topbar__icone"
            onClick={aoAbrirSave}
            aria-label="Saves"
            title="Saves"
          >
            <IconBase name="save" size={16} />
          </button>
        )}
        {aoAbrirConfig && (
          <button
            className="vida-topbar__icone"
            onClick={aoAbrirConfig}
            aria-label="Configurações"
            title="Configurações"
          >
            <IconBase name="settings" size={16} />
          </button>
        )}
      </div>
    </header>
  );
}
