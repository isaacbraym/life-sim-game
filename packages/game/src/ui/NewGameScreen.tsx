import React, { useState } from 'react';
import type { Atributos } from '@lifesim/core';
import { calcularModificador } from '@lifesim/core';
import type { BirthProfile, ClasseSocial, EstruturaFamiliar } from '@core/schemas/birthprofile';
import type { EstadoInicialDeJogo } from '@core/engine/NewGameGenerator';
import { gerarNovoJogo } from '@core/engine/NewGameGenerator';
import './NewGameScreen.css';

export type DadosNovoPersonagem = {
  readonly nome: string;
  readonly sobrenome: string;
  readonly genero: 'M' | 'F' | 'outro';
  readonly ritmo: 'mensal' | 'semestral' | 'anual';
  readonly perfilNascimento: BirthProfile;
  readonly estadoInicial: EstadoInicialDeJogo;
  readonly atributos: Atributos;
};

type OpcaoGenero = { readonly valor: 'M' | 'F' | 'outro'; readonly rotulo: string };
type OpcaoRitmo = {
  readonly valor: 'mensal' | 'semestral' | 'anual';
  readonly rotulo: string;
  readonly descricao: string;
};
type EntradaAtributo = { readonly chave: keyof Atributos; readonly rotulo: string };
type OpcaoSelect<TValor extends string | number> = {
  readonly valor: TValor;
  readonly rotulo: string;
};

const GENEROS: readonly OpcaoGenero[] = [
  { valor: 'M', rotulo: 'Masculino' },
  { valor: 'F', rotulo: 'Feminino' },
  { valor: 'outro', rotulo: 'Outro' },
];

const RITMOS: readonly OpcaoRitmo[] = [
  { valor: 'anual', rotulo: 'Anual', descricao: 'Uma decisao por ano de vida' },
  { valor: 'semestral', rotulo: 'Semestral', descricao: 'Uma decisao a cada 6 meses' },
  { valor: 'mensal', rotulo: 'Mensal', descricao: 'Uma decisao por mes' },
];

const ANOS_NASCIMENTO: readonly number[] = Array.from({ length: 16 }, (_, indice) => 1985 + indice);

const CLASSES_SOCIAIS: readonly OpcaoSelect<ClasseSocial>[] = [
  { valor: 'baixa', rotulo: 'Baixa' },
  { valor: 'media_baixa', rotulo: 'Media baixa' },
  { valor: 'media', rotulo: 'Media' },
  { valor: 'media_alta', rotulo: 'Media alta' },
  { valor: 'alta', rotulo: 'Alta' },
];

const ESTRUTURAS_FAMILIARES: readonly OpcaoSelect<EstruturaFamiliar>[] = [
  { valor: 'pais_casados', rotulo: 'Pais casados' },
  { valor: 'pais_divorciados', rotulo: 'Pais divorciados' },
  { valor: 'mae_solo', rotulo: 'Mae solo' },
  { valor: 'pai_solo', rotulo: 'Pai solo' },
  { valor: 'pai_ausente', rotulo: 'Pai ausente' },
  { valor: 'mae_falecida', rotulo: 'Mae falecida' },
  { valor: 'pai_falecido', rotulo: 'Pai falecido' },
  { valor: 'avos_tutores', rotulo: 'Avos tutores' },
  { valor: 'orfanato', rotulo: 'Orfanato' },
  { valor: 'familia_adotiva', rotulo: 'Familia adotiva' },
];

const CONDICOES_HABITACIONAIS: readonly OpcaoSelect<BirthProfile['condicaoHabitacional']>[] = [
  { valor: 'mocorongo', rotulo: 'Mocorongo' },
  { valor: 'simples', rotulo: 'Simples' },
  { valor: 'media', rotulo: 'Media' },
  { valor: 'boa', rotulo: 'Boa' },
  { valor: 'luxo', rotulo: 'Luxo' },
];

const ENTRADAS_ATRIBUTO: readonly EntradaAtributo[] = [
  { chave: 'forca', rotulo: 'Forca' },
  { chave: 'inteligencia', rotulo: 'Inteligencia' },
  { chave: 'carisma', rotulo: 'Carisma' },
  { chave: 'constituicao', rotulo: 'Constituicao' },
  { chave: 'sorte', rotulo: 'Sorte' },
];

function gerarValorAtributoGenetico(): number {
  return 6 + Math.floor(Math.random() * 9);
}

function gerarAtributosGeneticos(): Atributos {
  return {
    forca: gerarValorAtributoGenetico(),
    inteligencia: gerarValorAtributoGenetico(),
    carisma: gerarValorAtributoGenetico(),
    constituicao: gerarValorAtributoGenetico(),
    sorte: gerarValorAtributoGenetico(),
  };
}

function resolverQualidadeEducacaoInicial(classeSocial: ClasseSocial): BirthProfile['qualidadeEducacaoInicial'] {
  if (classeSocial === 'alta' || classeSocial === 'media_alta') return 'alta';
  if (classeSocial === 'media') return 'media';
  return 'baixa';
}

function resolverBairroInicial(classeSocial: ClasseSocial): string {
  if (classeSocial === 'alta' || classeSocial === 'media_alta') return 'bairro_nobre';
  if (classeSocial === 'media') return 'bairro_residencial';
  return 'bairro_popular';
}

function formatarModificador(valor: number): string {
  const mod = calcularModificador(valor);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

type PropsNewGameScreen = {
  readonly aoConfirmar: (dados: DadosNovoPersonagem) => void;
  readonly aoCancelar?: () => void;
};

export function NewGameScreen({ aoConfirmar, aoCancelar }: PropsNewGameScreen): React.JSX.Element {
  const [nomeSelecionado, setNomeSelecionado] = useState('');
  const [sobrenomeSelecionado, setSobrenomeSelecionado] = useState('');
  const [generoSelecionado, setGeneroSelecionado] = useState<'M' | 'F' | 'outro'>('M');
  const [ritmoSelecionado, setRitmoSelecionado] = useState<'mensal' | 'semestral' | 'anual'>('anual');
  const [anoNascimento, setAnoNascimento] = useState(1992);
  const [classeSocial, setClasseSocial] = useState<ClasseSocial>('media');
  const [estruturaFamiliar, setEstruturaFamiliar] = useState<EstruturaFamiliar>('pais_casados');
  const [condicaoHabitacional, setCondicaoHabitacional] = useState<BirthProfile['condicaoHabitacional']>('simples');
  const [atributosGeneticos, setAtributosGeneticos] = useState<Atributos>(gerarAtributosGeneticos);
  const [erroNome, setErroNome] = useState<string | undefined>(undefined);

  const podeConfirmar = nomeSelecionado.trim().length >= 2;

  function handleConfirmar(): void {
    const nome = nomeSelecionado.trim();
    const sobrenome = sobrenomeSelecionado.trim() || 'Silva';

    if (nome.length < 2) {
      setErroNome('Nome deve ter pelo menos 2 caracteres.');
      return;
    }

    const perfilNascimento: BirthProfile = {
      anoNascimento,
      classeSocial,
      estruturaFamiliar,
      qualidadeEducacaoInicial: resolverQualidadeEducacaoInicial(classeSocial),
      bairroInicial: resolverBairroInicial(classeSocial),
      condicaoHabitacional,
      atributosGeneticos,
    };
    const estadoInicial = gerarNovoJogo(perfilNascimento);

    setErroNome(undefined);
    aoConfirmar({
      nome,
      sobrenome,
      genero: generoSelecionado,
      ritmo: ritmoSelecionado,
      perfilNascimento,
      estadoInicial,
      atributos: estadoInicial.protagonista.atributos,
    });
  }

  return (
    <div className="ng-tela">
      <div className="ng-card">
        <h1 className="ng-titulo">Novo Personagem</h1>

        <section className="ng-secao">
          <div className="ng-inputs">
            <div className="ng-campo">
              <label className="ng-label" htmlFor="ng-nome">Nome</label>
              <input
                id="ng-nome"
                className="ng-input"
                type="text"
                value={nomeSelecionado}
                onChange={(evento) => setNomeSelecionado(evento.target.value)}
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
                onChange={(evento) => setSobrenomeSelecionado(evento.target.value)}
                placeholder="Ex: Mendes"
              />
            </div>
          </div>
          {erroNome !== undefined && (
            <p className="ng-erro" role="alert">{erroNome}</p>
          )}
        </section>

        <section className="ng-secao">
          <div className="ng-secao-titulo">Nascimento</div>
          <div className="ng-inputs">
            <div className="ng-campo">
              <label className="ng-label" htmlFor="ng-ano">Ano</label>
              <select
                id="ng-ano"
                className="ng-input"
                value={anoNascimento}
                onChange={(evento) => setAnoNascimento(Number(evento.target.value))}
              >
                {ANOS_NASCIMENTO.map((ano) => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
            </div>
            <div className="ng-campo">
              <label className="ng-label" htmlFor="ng-classe">Classe social</label>
              <select
                id="ng-classe"
                className="ng-input"
                value={classeSocial}
                onChange={(evento) => setClasseSocial(evento.target.value as ClasseSocial)}
              >
                {CLASSES_SOCIAIS.map((opcao) => (
                  <option key={opcao.valor} value={opcao.valor}>{opcao.rotulo}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="ng-inputs">
            <div className="ng-campo">
              <label className="ng-label" htmlFor="ng-familia">Estrutura familiar</label>
              <select
                id="ng-familia"
                className="ng-input"
                value={estruturaFamiliar}
                onChange={(evento) => setEstruturaFamiliar(evento.target.value as EstruturaFamiliar)}
              >
                {ESTRUTURAS_FAMILIARES.map((opcao) => (
                  <option key={opcao.valor} value={opcao.valor}>{opcao.rotulo}</option>
                ))}
              </select>
            </div>
            <div className="ng-campo">
              <label className="ng-label" htmlFor="ng-casa">Condicao habitacional</label>
              <select
                id="ng-casa"
                className="ng-input"
                value={condicaoHabitacional}
                onChange={(evento) => setCondicaoHabitacional(
                  evento.target.value as BirthProfile['condicaoHabitacional'],
                )}
              >
                {CONDICOES_HABITACIONAIS.map((opcao) => (
                  <option key={opcao.valor} value={opcao.valor}>{opcao.rotulo}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="ng-secao">
          <div className="ng-secao-titulo">Genero</div>
          <div className="ng-toggle-grupo" role="group" aria-label="Genero">
            {GENEROS.map((genero) => (
              <button
                key={genero.valor}
                type="button"
                className={`ng-toggle-btn${generoSelecionado === genero.valor ? ' ng-toggle-btn--ativo' : ''}`}
                onClick={() => setGeneroSelecionado(genero.valor)}
              >
                {genero.rotulo}
              </button>
            ))}
          </div>
        </section>

        <section className="ng-secao">
          <div className="ng-secao-titulo">Ritmo de jogo</div>
          <div className="ng-ritmo-grupo" role="group" aria-label="Ritmo de jogo">
            {RITMOS.map((ritmo) => (
              <button
                key={ritmo.valor}
                type="button"
                className={`ng-ritmo-btn${ritmoSelecionado === ritmo.valor ? ' ng-ritmo-btn--ativo' : ''}`}
                onClick={() => setRitmoSelecionado(ritmo.valor)}
              >
                <span className="ng-ritmo-nome">{ritmo.rotulo}</span>
                <span className="ng-ritmo-desc">{ritmo.descricao}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="ng-secao">
          <div className="ng-secao-titulo-row">
            <span className="ng-secao-titulo">Atributos geneticos</span>
            <button
              type="button"
              className="ng-rolar-btn"
              onClick={() => setAtributosGeneticos(gerarAtributosGeneticos())}
            >
              Rolar novamente
            </button>
          </div>
          <div className="ng-atrib-grid">
            {ENTRADAS_ATRIBUTO.map(({ chave, rotulo }) => (
              <div key={chave} className="ng-atrib-card">
                <span className="ng-atrib-nome">{rotulo}</span>
                <span className="ng-atrib-valor">{atributosGeneticos[chave]}</span>
                <span className="ng-atrib-mod">{formatarModificador(atributosGeneticos[chave])}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="ng-acoes">
          {aoCancelar !== undefined && (
            <button type="button" className="ng-btn-cancelar" onClick={aoCancelar}>
              Cancelar
            </button>
          )}
          <button
            type="button"
            className="ng-btn-comecar"
            onClick={handleConfirmar}
            disabled={!podeConfirmar}
          >
            Comecar
          </button>
        </div>
      </div>
    </div>
  );
}

