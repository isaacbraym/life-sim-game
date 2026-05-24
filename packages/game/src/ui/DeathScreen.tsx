import React from 'react';
import './DeathScreen.css';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type AtributosFinal = {
  readonly forca: number;
  readonly inteligencia: number;
  readonly carisma: number;
  readonly constituicao: number;
  readonly sorte: number;
};

export type DeathScreenProps = {
  readonly nomeCompleto: string;
  readonly anoNascimento: number;
  readonly anoMorte: number;
  readonly atributosFinal: AtributosFinal;
  readonly dinheirFinal: number;
  readonly totalEventosVividos: number;
  readonly profissaoFinal?: string;
  readonly aoNovaVida: () => void;
  readonly aoMenuPrincipal: () => void;
};

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

type ChaveAtributo = keyof AtributosFinal;

const CHAVES_ATRIBUTOS: readonly ChaveAtributo[] = [
  'forca', 'inteligencia', 'carisma', 'constituicao', 'sorte',
];

const NOMES_PT: Readonly<Record<ChaveAtributo, string>> = {
  forca:        'Força',
  inteligencia: 'Inteligência',
  carisma:      'Carisma',
  constituicao: 'Constituição',
  sorte:        'Sorte',
};

const CITACOES: readonly string[] = [
  'O tempo não mede uma vida — os momentos que ficam na memória dos outros é que a definem.',
  'Não importa quanto tempo durou, mas quanto dela foi vivido de verdade.',
  'Uma vida é como uma história: o que a faz boa não é o número de páginas, mas o que está escrito nelas.',
  'Partimos, mas o que amamos permanece no mundo como ecos que o tempo não consegue apagar.',
  'A medida de uma existência não está nos anos que a compuseram, mas nas escolhas que a tornaram única.',
];

const VALOR_MAX_ATRIBUTO = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatarDinheiro(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

function mediaAtributos(atributos: AtributosFinal): number {
  const soma = CHAVES_ATRIBUTOS.reduce((acc, chave) => acc + atributos[chave], 0);
  return soma / CHAVES_ATRIBUTOS.length;
}

function adjetivoVida(media: number): string {
  if (media > 14) return 'extraordinária';
  if (media > 10) return 'marcante';
  if (media > 6)  return 'comum';
  return 'difícil';
}

function corBarraAtrib(valor: number): string {
  if (valor > 14) return 'accent';
  if (valor > 10) return 'green';
  if (valor > 6)  return 'yellow';
  return 'red';
}

function chaveMaxMin(atributos: AtributosFinal): { maxima: ChaveAtributo; minima: ChaveAtributo } {
  let chaveMaxima: ChaveAtributo = 'forca';
  let chaveMinima: ChaveAtributo = 'forca';
  for (const chave of CHAVES_ATRIBUTOS) {
    if (atributos[chave] > atributos[chaveMaxima]) chaveMaxima = chave;
    if (atributos[chave] < atributos[chaveMinima]) chaveMinima = chave;
  }
  return { maxima: chaveMaxima, minima: chaveMinima };
}

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------

function BarraAtribMini({
  nome,
  valor,
}: {
  readonly nome: string;
  readonly valor: number;
}) {
  const pct = Math.round((valor / VALOR_MAX_ATRIBUTO) * 100);
  const cor  = corBarraAtrib(valor);

  return (
    <div className="dth-barra">
      <div className="dth-barra-topo">
        <span className="dth-barra-nome">{nome}</span>
        <span className={`dth-barra-valor dth-barra-valor--${cor}`}>{valor}</span>
      </div>
      <div className="dth-barra-trilho">
        <div
          className={`dth-barra-fill dth-barra-fill--${cor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function DeathScreen({
  nomeCompleto,
  anoNascimento,
  anoMorte,
  atributosFinal,
  dinheirFinal,
  totalEventosVividos,
  profissaoFinal,
  aoNovaVida,
  aoMenuPrincipal,
}: DeathScreenProps): React.JSX.Element {
  const idadeVivida        = anoMorte - anoNascimento;
  const media              = mediaAtributos(atributosFinal);
  const adjetivo           = adjetivoVida(media);
  const { maxima, minima } = chaveMaxMin(atributosFinal);

  const indiceCitacao = totalEventosVividos % CITACOES.length;
  const citacao       = CITACOES[indiceCitacao] ?? 'Uma vida singular.';

  return (
    <div className="dth-tela" role="main" aria-label="Fim de vida">

      {/* ── 1. Epitáfio ── */}
      <section className="dth-epitafio" aria-label="Epitáfio">
        <div className="dth-epitafio-nome">{nomeCompleto}</div>
        <div className="dth-epitafio-anos">
          <span className="dth-mono">{anoNascimento}</span>
          <span className="dth-epitafio-traco">—</span>
          <span className="dth-mono">{anoMorte}</span>
        </div>
        <div className="dth-epitafio-idade">viveu {idadeVivida} anos</div>
      </section>

      <div className="dth-divisor" />

      {/* ── 2. Estatísticas de vida ── */}
      <section className="dth-stats" aria-label="Estatísticas de vida">
        <div className="dth-stat-item">
          <span className="dth-stat-rotulo">Profissão</span>
          <span className="dth-stat-valor">{profissaoFinal ?? 'Sem profissão definida'}</span>
        </div>
        <div className="dth-stat-item">
          <span className="dth-stat-rotulo">Eventos vividos</span>
          <span className="dth-stat-valor dth-mono">{totalEventosVividos}</span>
        </div>
        <div className="dth-stat-item">
          <span className="dth-stat-rotulo">Dinheiro final</span>
          <span className="dth-stat-valor dth-mono">{formatarDinheiro(dinheirFinal)}</span>
        </div>
        <div className="dth-stat-item">
          <span className="dth-stat-rotulo">Ponto forte</span>
          <span className="dth-stat-valor">
            {NOMES_PT[maxima]} · <span className="dth-mono">{atributosFinal[maxima]}</span>
          </span>
        </div>
        <div className="dth-stat-item">
          <span className="dth-stat-rotulo">Ponto fraco</span>
          <span className="dth-stat-valor">
            {NOMES_PT[minima]} · <span className="dth-mono">{atributosFinal[minima]}</span>
          </span>
        </div>
        <div className="dth-stat-item">
          <span className="dth-stat-rotulo">Uma vida</span>
          <span className="dth-stat-valor dth-stat-valor--adjetivo">{adjetivo}</span>
        </div>
      </section>

      <div className="dth-divisor" />

      {/* ── 3. Barras de atributos finais ── */}
      <section className="dth-atributos" aria-label="Atributos finais">
        {CHAVES_ATRIBUTOS.map((chave) => (
          <BarraAtribMini
            key={chave}
            nome={NOMES_PT[chave]}
            valor={atributosFinal[chave]}
          />
        ))}
      </section>

      <div className="dth-divisor" />

      {/* ── 4. Citação ── */}
      <blockquote className="dth-citacao">
        "{citacao}"
      </blockquote>

      {/* ── 5. Ações ── */}
      <div className="dth-acoes">
        <button className="dth-btn dth-btn--primario" onClick={aoNovaVida}>
          Nova vida
        </button>
        <button className="dth-btn dth-btn--secundario" onClick={aoMenuPrincipal}>
          Menu principal
        </button>
      </div>

    </div>
  );
}
