import React, { useState } from 'react';
import type { SaveSlot } from '@lifesim/core';
import './LoadGameScreen.css';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type PropsLoadGameScreen = {
  readonly saves: readonly SaveSlot[];
  readonly aoContinuar: (saveId: string) => void;
  readonly aoDeletar:   (saveId: string) => void;
  readonly aoNovoJogo:  () => void;
};

// ---------------------------------------------------------------------------
// Helpers de formatação
// ---------------------------------------------------------------------------

const FORMATADOR_DINHEIRO = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

function formatarDinheiro(valor: number): string {
  return FORMATADOR_DINHEIRO.format(valor);
}

function dois(valor: number): string {
  return valor.toString().padStart(2, '0');
}

function formatarDataIso(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '—';
  const dia  = dois(data.getDate());
  const mes  = dois(data.getMonth() + 1);
  const ano  = data.getFullYear();
  const hora = dois(data.getHours());
  const min  = dois(data.getMinutes());
  return `${dia}/${mes}/${ano} ${hora}:${min}`;
}

function calcularIdadeAnos(idadeMeses: number): number {
  return Math.floor(idadeMeses / 12);
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function LoadGameScreen({
  saves,
  aoContinuar,
  aoDeletar,
  aoNovoJogo,
}: PropsLoadGameScreen): React.JSX.Element {
  const [idConfirmandoDelete, setIdConfirmandoDelete] = useState<string | undefined>(undefined);

  // ── Estado vazio ─────────────────────────────────────────────────────────
  if (saves.length === 0) {
    return (
      <div className="lg-tela">
        <div className="lg-vazio-card">
          <h1 className="lg-titulo">Bem-vindo ao Vida 2.5D</h1>
          <p className="lg-vazio-mensagem">
            Você ainda não tem nenhuma vida salva. Comece a sua agora.
          </p>
          <button
            className="lg-btn-primario lg-btn-grande"
            onClick={aoNovoJogo}
          >
            Começar primeira vida
          </button>
        </div>
      </div>
    );
  }

  // ── Lista de saves ───────────────────────────────────────────────────────
  return (
    <div className="lg-tela">
      <div className="lg-card">

        <header className="lg-cabecalho">
          <h1 className="lg-titulo">Continuar</h1>
          <p className="lg-subtitulo">Selecione uma vida para continuar.</p>
        </header>

        <ul className="lg-lista vida-scroll" aria-label="Lista de saves">
          {saves.map((save) => {
            const idadeAnos     = calcularIdadeAnos(save.protagonista.idadeAtualMeses);
            const ano           = save.estadoMundo.anoAtual;
            const dinheiro      = formatarDinheiro(save.protagonista.dinheiro);
            const ultimaPartida = formatarDataIso(save.ultimaPartida);
            const confirmando   = idConfirmandoDelete === save.saveId;

            return (
              <li key={save.saveId} className="lg-item">
                <div className="lg-item-info">
                  <div className="lg-item-nome">{save.nomeSlot}</div>
                  <div className="lg-item-meta">
                    <span className="lg-meta-pill">{idadeAnos} anos</span>
                    <span className="lg-meta-pill">{ano}</span>
                    <span className="lg-meta-pill lg-meta-pill--dinheiro">{dinheiro}</span>
                  </div>
                  <div className="lg-item-ultima">Última partida: {ultimaPartida}</div>
                </div>

                {confirmando ? (
                  <div className="lg-confirma">
                    <span className="lg-confirma-texto">Apagar esta vida?</span>
                    <button
                      className="lg-btn-perigo"
                      onClick={() => {
                        aoDeletar(save.saveId);
                        setIdConfirmandoDelete(undefined);
                      }}
                    >
                      Apagar
                    </button>
                    <button
                      className="lg-btn-secundario"
                      onClick={() => setIdConfirmandoDelete(undefined)}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="lg-acoes">
                    <button
                      className="lg-btn-primario"
                      onClick={() => aoContinuar(save.saveId)}
                    >
                      Continuar
                    </button>
                    <button
                      className="lg-btn-secundario"
                      onClick={() => setIdConfirmandoDelete(save.saveId)}
                      aria-label={`Deletar ${save.nomeSlot}`}
                    >
                      Deletar
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <footer className="lg-rodape">
          <button
            className="lg-btn-primario lg-btn-grande"
            onClick={aoNovoJogo}
          >
            Nova vida
          </button>
        </footer>

      </div>
    </div>
  );
}
