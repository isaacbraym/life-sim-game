import React, { useState } from 'react';
import type { Atributos } from '@lifesim/core';
import { calcularModificador } from '@lifesim/core';
import './NewGameScreen.css';

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

export type DadosNovoPersonagem = {
  readonly nome: string;
  readonly sobrenome: string;
  readonly genero: 'M' | 'F' | 'outro';
  readonly ritmo: 'mensal' | 'semestral' | 'anual';
  readonly atributos: Atributos;
};

// ---------------------------------------------------------------------------
// Constantes de UI
// ---------------------------------------------------------------------------

type OpcaoGenero = { readonly valor: 'M' | 'F' | 'outro'; readonly rotulo: string };
type OpcaoRitmo  = {
  readonly valor: 'mensal' | 'semestral' | 'anual';
  readonly rotulo: string;
  readonly descricao: string;
};
type EntradaAtributo = { readonly chave: keyof Atributos; readonly rotulo: string };

const GENEROS: readonly OpcaoGenero[] = [
  { valor: 'M',     rotulo: 'Masculino' },
  { valor: 'F',     rotulo: 'Feminino'  },
  { valor: 'outro', rotulo: 'Outro'     },
];

const RITMOS: readonly OpcaoRitmo[] = [
  { valor: 'anual',     rotulo: 'Anual',     descricao: 'Uma decisão por ano de vida (recomendado)' },
  { valor: 'semestral', rotulo: 'Semestral', descricao: 'Uma decisão a cada 6 meses'                },
  { valor: 'mensal',    rotulo: 'Mensal',    descricao: 'Uma decisão por mês (intenso)'             },
];

const ENTRADAS_ATRIBUTO: readonly EntradaAtributo[] = [
  { chave: 'forca',        rotulo: 'Força'        },
  { chave: 'inteligencia', rotulo: 'Inteligência' },
  { chave: 'carisma',      rotulo: 'Carisma'      },
  { chave: 'constituicao', rotulo: 'Constituição' },
  { chave: 'sorte',        rotulo: 'Sorte'        },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// gerarAtributosIniciais() de @core/rpg/Attributes ainda não está implementada.
// Usamos esta versão local com o método 4d6-drop-lowest do D&D 5e.
function rolarAtributos(): Atributos {
  function rolar4d6(): number {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const d3 = Math.floor(Math.random() * 6) + 1;
    const d4 = Math.floor(Math.random() * 6) + 1;
    return d1 + d2 + d3 + d4 - Math.min(d1, d2, d3, d4);
  }
  return {
    forca:        rolar4d6(),
    inteligencia: rolar4d6(),
    carisma:      rolar4d6(),
    constituicao: rolar4d6(),
    sorte:        rolar4d6(),
  };
}

function formatarModificador(valor: number): string {
  const mod = calcularModificador(valor);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

type PropsNewGameScreen = {
  readonly aoConfirmar: (dados: DadosNovoPersonagem) => void;
  readonly aoCancelar?: () => void;
};

export function NewGameScreen({ aoConfirmar, aoCancelar }: PropsNewGameScreen): React.JSX.Element {
  const [nomeSelecionado,      setNomeSelecionado]      = useState('');
  const [sobrenomeSelecionado, setSobrenomeSelecionado] = useState('');
  const [generoSelecionado,    setGeneroSelecionado]    = useState<'M' | 'F' | 'outro'>('M');
  const [ritmoSelecionado,     setRitmoSelecionado]     = useState<'mensal' | 'semestral' | 'anual'>('anual');
  const [atributos,            setAtributos]            = useState<Atributos>(rolarAtributos);
  const [erroNome,             setErroNome]             = useState<string | undefined>(undefined);

  const podeConfirmar =
    nomeSelecionado.trim().length > 0 && sobrenomeSelecionado.trim().length > 0;

  function handleConfirmar(): void {
    if (nomeSelecionado.trim().length < 2 || sobrenomeSelecionado.trim().length < 2) {
      setErroNome('Nome e sobrenome devem ter pelo menos 2 caracteres.');
      return;
    }
    setErroNome(undefined);
    aoConfirmar({
      nome:      nomeSelecionado.trim(),
      sobrenome: sobrenomeSelecionado.trim(),
      genero:    generoSelecionado,
      ritmo:     ritmoSelecionado,
      atributos,
    });
  }

  return (
    <div className="ng-tela">
      <div className="ng-card">

        <h1 className="ng-titulo">Novo Personagem</h1>

        {/* ── Identidade ── */}
        <section className="ng-secao">
          <div className="ng-inputs">
            <div className="ng-campo">
              <label className="ng-label" htmlFor="ng-nome">Nome</label>
              <input
                id="ng-nome"
                className="ng-input"
                type="text"
                value={nomeSelecionado}
                onChange={e => setNomeSelecionado(e.target.value)}
                placeholder="Ex: Lucas"
              />
            </div>
            <div className="ng-campo">
              <label className="ng-label" htmlFor="ng-sobrenome">Sobrenome</label>
              <input
                id="ng-sobrenome"
                className="ng-input"
                type="text"
                value={sobrenomeSelecionado}
                onChange={e => setSobrenomeSelecionado(e.target.value)}
                placeholder="Ex: Mendes"
              />
            </div>
          </div>
          {erroNome !== undefined && (
            <p className="ng-erro" role="alert">{erroNome}</p>
          )}
        </section>

        {/* ── Gênero ── */}
        <section className="ng-secao">
          <div className="ng-secao-titulo">Gênero</div>
          <div className="ng-toggle-grupo" role="group" aria-label="Gênero">
            {GENEROS.map(g => (
              <button
                key={g.valor}
                className={`ng-toggle-btn${generoSelecionado === g.valor ? ' ng-toggle-btn--ativo' : ''}`}
                onClick={() => setGeneroSelecionado(g.valor)}
              >
                {g.rotulo}
              </button>
            ))}
          </div>
        </section>

        {/* ── Ritmo ── */}
        <section className="ng-secao">
          <div className="ng-secao-titulo">Ritmo de jogo</div>
          <div className="ng-ritmo-grupo" role="group" aria-label="Ritmo de jogo">
            {RITMOS.map(r => (
              <button
                key={r.valor}
                className={`ng-ritmo-btn${ritmoSelecionado === r.valor ? ' ng-ritmo-btn--ativo' : ''}`}
                onClick={() => setRitmoSelecionado(r.valor)}
              >
                <span className="ng-ritmo-nome">{r.rotulo}</span>
                <span className="ng-ritmo-desc">{r.descricao}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Atributos ── */}
        <section className="ng-secao">
          <div className="ng-secao-titulo-row">
            <span className="ng-secao-titulo">Atributos</span>
            <button
              className="ng-rolar-btn"
              onClick={() => setAtributos(rolarAtributos())}
            >
              🎲 Rolar novamente
            </button>
          </div>
          <div className="ng-atrib-grid">
            {ENTRADAS_ATRIBUTO.map(({ chave, rotulo }) => (
              <div key={chave} className="ng-atrib-card">
                <span className="ng-atrib-nome">{rotulo}</span>
                <span className="ng-atrib-valor">{atributos[chave]}</span>
                <span className="ng-atrib-mod">{formatarModificador(atributos[chave])}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Ações ── */}
        <div className="ng-acoes">
          {aoCancelar !== undefined && (
            <button className="ng-btn-cancelar" onClick={aoCancelar}>
              Cancelar
            </button>
          )}
          <button
            className="ng-btn-comecar"
            onClick={handleConfirmar}
            disabled={!podeConfirmar}
          >
            Começar
          </button>
        </div>

      </div>
    </div>
  );
}
