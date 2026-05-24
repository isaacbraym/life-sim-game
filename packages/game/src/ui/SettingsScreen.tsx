import React, { useRef, useState } from 'react';
import { exportarSave, importarSave } from '@core/persistence/SaveManager';
import { useHudStore } from '../state/hudStore';
import './SettingsScreen.css';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type SettingsScreenProps = {
  readonly aoFechar: () => void;
  readonly aoMenuPrincipal: () => void;
};

type StatusExport = 'idle' | 'carregando' | 'ok' | 'erro';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROTULO_RITMO: Readonly<Record<string, string>> = {
  mensal:    'Mensal',
  semestral: 'Semestral',
  anual:     'Anual',
};

function nomeArquivoExport(): string {
  const data = new Date().toISOString().slice(0, 10);
  return `vida2d_save_${data}.json`;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function SettingsScreen({ aoFechar, aoMenuPrincipal }: SettingsScreenProps): React.JSX.Element {
  const {
    conteudoAdultoAtivo,
    alterarConteudoAdulto,
    saveIdAtivo,
    ritmoAtual,
    inicializarEngine,
  } = useHudStore();

  const [statusExport, setStatusExport]   = useState<StatusExport>('idle');
  const [msgExport,    setMsgExport]      = useState<string | undefined>(undefined);
  const [msgImport,    setMsgImport]      = useState<string | undefined>(undefined);

  const inputFileRef = useRef<HTMLInputElement>(null);

  // ── Exportar ──────────────────────────────────────────────────────────────

  async function handleExportar(): Promise<void> {
    if (saveIdAtivo === undefined) {
      setStatusExport('erro');
      setMsgExport('Nenhum save ativo para exportar.');
      return;
    }
    setStatusExport('carregando');
    setMsgExport(undefined);
    try {
      const json = await exportarSave(saveIdAtivo);
      const blob = new Blob([json], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = nomeArquivoExport();
      link.click();
      URL.revokeObjectURL(url);
      setStatusExport('ok');
    } catch (erro) {
      setStatusExport('erro');
      setMsgExport(erro instanceof Error ? erro.message : 'Erro desconhecido ao exportar.');
    }
  }

  // ── Importar ──────────────────────────────────────────────────────────────

  async function handleImportar(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const arquivo = e.target.files?.[0];
    if (arquivo === undefined) return;
    setMsgImport(undefined);
    try {
      const texto         = await arquivo.text();
      const saveImportado = await importarSave(texto);
      inicializarEngine(saveImportado);
      aoFechar();
    } catch (erro) {
      setMsgImport(erro instanceof Error ? erro.message : 'Arquivo inválido ou corrompido.');
    }
    // Limpar input para permitir reimportação do mesmo arquivo
    if (inputFileRef.current !== null) {
      inputFileRef.current.value = '';
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="sett-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Configurações"
      onClick={(e) => { if (e.target === e.currentTarget) aoFechar(); }}
    >
      <div className="sett-card">

        {/* Cabeçalho */}
        <div className="sett-header">
          <span className="sett-titulo">Configurações</span>
          <button className="sett-fechar" onClick={aoFechar} aria-label="Fechar configurações">
            ✕
          </button>
        </div>

        {/* ── Seção: Jogo ── */}
        <div className="sett-secao-titulo">Jogo</div>

        {/* Toggle conteúdo adulto */}
        <div className="sett-linha">
          <div className="sett-linha-texto">
            <span className="sett-linha-label">Conteúdo adulto</span>
            <span className="sett-linha-sub">Habilita eventos e escolhas +18</span>
          </div>
          <button
            role="switch"
            aria-checked={conteudoAdultoAtivo}
            className={`sett-toggle${conteudoAdultoAtivo ? ' sett-toggle--ativo' : ''}`}
            onClick={() => alterarConteudoAdulto(!conteudoAdultoAtivo)}
            aria-label="Alternar conteúdo adulto"
          >
            <span className="sett-toggle-thumb" />
          </button>
        </div>

        {/* Ritmo (read-only) */}
        <div className="sett-linha sett-linha--coluna">
          <div className="sett-linha-topo">
            <span className="sett-linha-label">Ritmo de jogo</span>
            {ritmoAtual !== undefined && (
              <span className="sett-badge">{ROTULO_RITMO[ritmoAtual] ?? ritmoAtual}</span>
            )}
          </div>
          <span className="sett-linha-sub">
            O ritmo só pode ser alterado ao iniciar uma nova partida.
          </span>
        </div>

        <div className="sett-divisor" />

        {/* ── Seção: Dados ── */}
        <div className="sett-secao-titulo">Dados</div>

        {/* Exportar */}
        <div className="sett-linha sett-linha--coluna">
          <button
            className={`sett-btn${statusExport === 'ok' ? ' sett-btn--ok' : ''}`}
            onClick={() => { void handleExportar(); }}
            disabled={statusExport === 'carregando'}
          >
            {statusExport === 'carregando' && '⏳ Exportando…'}
            {statusExport === 'ok'         && '✓ Exportado!'}
            {(statusExport === 'idle' || statusExport === 'erro') && '⬇ Exportar save'}
          </button>
          {statusExport === 'erro' && msgExport !== undefined && (
            <span className="sett-msg-erro">{msgExport}</span>
          )}
        </div>

        {/* Importar */}
        <div className="sett-linha sett-linha--coluna">
          <input
            ref={inputFileRef}
            type="file"
            accept=".json"
            className="sett-input-file"
            aria-label="Selecionar arquivo de save para importar"
            onChange={(e) => { void handleImportar(e); }}
          />
          <button
            className="sett-btn"
            onClick={() => inputFileRef.current?.click()}
          >
            ⬆ Importar save
          </button>
          {msgImport !== undefined && (
            <span className="sett-msg-erro">{msgImport}</span>
          )}
        </div>

        <div className="sett-divisor" />

        {/* ── Seção: Sobre ── */}
        <div className="sett-secao-titulo">Sobre</div>
        <div className="sett-sobre">
          <p>Vida 2.5D — versão 0.1.0-alpha</p>
          <p>Feito com TypeScript, React e PixiJS</p>
        </div>

        <div className="sett-divisor" />

        {/* Voltar ao menu */}
        <div className="sett-linha">
          <button
            className="sett-btn sett-btn--menu"
            onClick={aoMenuPrincipal}
          >
            ← Voltar ao menu
          </button>
        </div>

      </div>
    </div>
  );
}
