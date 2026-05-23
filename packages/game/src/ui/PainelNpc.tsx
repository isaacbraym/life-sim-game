import { useState } from 'react';
import type { Npc } from '@lifesim/core';
import { calcularModificador } from '@lifesim/core';
import './PainelNpc.css';

// ---------------------------------------------------------------------------
// Tipos locais
// ---------------------------------------------------------------------------

type AbaId = 'aparencia' | 'bio' | 'relacionamento' | 'atributos' | 'timeline';

type ConfiguracaoAba = {
  readonly id: AbaId;
  readonly rotulo: string;
};

export type PainelNpcProps = {
  readonly npc: Npc;
  readonly anoAtual: number;
  readonly aoFechar: () => void;
  readonly aoInteragir?: (npc: Npc) => void;
  readonly aoVisitar?: (npc: Npc) => void;
};

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const ABAS: readonly ConfiguracaoAba[] = [
  { id: 'aparencia',      rotulo: 'Aparência' },
  { id: 'bio',            rotulo: 'Bio' },
  { id: 'relacionamento', rotulo: 'Relacionamento' },
  { id: 'atributos',      rotulo: 'Atributos' },
  { id: 'timeline',       rotulo: 'Linha do tempo' },
] as const;

const MESES_PT: readonly string[] = [
  '', 'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
] as const;

const ROTULO_VINCULO: Record<string, string> = {
  familia_pai:      'Pai',
  familia_mae:      'Mãe',
  familia_irmao:    'Irmão / Irmã',
  familia_filho:    'Filho / Filha',
  familia_conjuge:  'Cônjuge',
  familia_extendida:'Família',
  amigo_proximo:    'Amigo próximo',
  amigo_casual:     'Amigo casual',
  colega_trabalho:  'Colega de trabalho',
  colega_escola:    'Colega de escola',
  chefe:            'Chefe',
  subordinado:      'Subordinado',
  romance_atual:    'Romance atual',
  ex_romance:       'Ex-romance',
  inimigo:          'Inimigo',
  rival:            'Rival',
  profissional:     'Contato profissional',
  conhecido:        'Conhecido',
};

const ROTULO_FINANCEIRO: Record<string, string> = {
  pobre:      'Baixa',
  medio:      'Média',
  rico:       'Alta',
  milionario: 'Milionária',
};

const EMOJI_GENERO: Record<string, string> = { M: '👨', F: '👩', outro: '🧑' };

// ---------------------------------------------------------------------------
// Helpers puros
// ---------------------------------------------------------------------------

function calcularIdadeNpc(npc: Npc, anoAtual: number): number {
  return anoAtual - npc.dataNascimento.ano;
}

function formatarMesAno(mes: number, ano: number): string {
  const rotuloMes = MESES_PT[mes] ?? String(mes);
  return `${rotuloMes}. ${ano}`;
}

function formatarModificador(mod: number): string {
  return mod >= 0 ? `+${mod}` : String(mod);
}

/** Converte afeto (−100..+100) para largura de barra (0..100%) */
function afetoParaLargura(afeto: number): number {
  return ((afeto + 100) / 200) * 100;
}

function corAfetoValor(afeto: number): string {
  if (afeto >= 40)  return 'var(--pnpc-green)';
  if (afeto >= 0)   return 'var(--pnpc-yellow)';
  return 'var(--pnpc-red)';
}

// ---------------------------------------------------------------------------
// Sub-componentes de aba
// ---------------------------------------------------------------------------

function AbaAparencia({ npc }: { readonly npc: Npc }) {
  const { tracosFisicos: fixos, tracosVariaveis: variaveis } = npc;

  return (
    <>
      {/* Preview do rig — placeholder até PixiJS ser integrado aqui */}
      <div className="painel-npc__rig-preview">
        <svg width="70" height="130" viewBox="0 0 70 130" aria-label="Silhueta do NPC">
          <ellipse cx="35" cy="18" rx="14" ry="16" fill={fixos.corPele} />
          <rect x="29" y="32" width="12" height="10" rx="3" fill={fixos.corPele} />
          <path
            d="M16 42 Q35 36 54 42 L51 82 Q35 86 19 82Z"
            fill="#3a5fa0"
          />
          <path d="M16 44 L7 72 Q5 75 9 76 L16 77 L20 52Z" fill="#3a5fa0" />
          <path d="M54 44 L63 72 Q65 75 61 76 L54 77 L50 52Z" fill="#3a5fa0" />
          <rect x="19" y="82" width="13" height="42" rx="4" fill="#2a3a60" />
          <rect x="38" y="82" width="13" height="42" rx="4" fill="#2a3a60" />
        </svg>
        <span className="painel-npc__rig-preview-label">PREVIEW</span>
      </div>

      <div className="painel-npc__secao">
        <div className="painel-npc__secao-titulo">Traços imutáveis</div>
        <div className="painel-npc__cartao">
          <LinhaFisica rotulo="Cor de pele">
            <span
              className="painel-npc__cor-swatch"
              style={{ background: fixos.corPele }}
            />
            {fixos.corPele}
          </LinhaFisica>
          <LinhaFisica rotulo="Cor dos olhos">
            <span
              className="painel-npc__cor-swatch"
              style={{ background: fixos.corOlhos }}
            />
            {fixos.corOlhos}
          </LinhaFisica>
          <LinhaFisica rotulo="Formato do rosto">{fixos.formatoRosto}</LinhaFisica>
          <LinhaFisica rotulo="Formato do nariz">{fixos.formatoNariz}</LinhaFisica>
          <LinhaFisica rotulo="Formato da boca">{fixos.formatoBoca}</LinhaFisica>
          <LinhaFisica rotulo="Estilo corporal">{fixos.estiloCorporalBase}</LinhaFisica>
          <LinhaFisica rotulo="Altura base">{fixos.alturaBase.toFixed(2)} m</LinhaFisica>
        </div>
      </div>

      <div className="painel-npc__secao">
        <div className="painel-npc__secao-titulo">Aparência atual</div>
        <div className="painel-npc__cartao">
          <LinhaFisica rotulo="Cor do cabelo">
            <span
              className="painel-npc__cor-swatch"
              style={{ background: variaveis.corCabelo }}
            />
            {variaveis.corCabelo}
          </LinhaFisica>
          <LinhaFisica rotulo="Estilo do cabelo">{variaveis.estiloCabelo}</LinhaFisica>
          <LinhaFisica rotulo="Peso atual">{variaveis.pesoAtual} kg</LinhaFisica>
          <LinhaFisica rotulo="Altura atual">{variaveis.alturaAtual.toFixed(2)} m</LinhaFisica>
          <LinhaFisica rotulo="Grisalho">{variaveis.temGrisalho ? 'Sim' : 'Não'}</LinhaFisica>
          <LinhaFisica rotulo="Rugas">{variaveis.temRugas ? 'Sim' : 'Não'}</LinhaFisica>
          <LinhaFisica rotulo="Olheiras">{variaveis.temOlheiras ? 'Sim' : 'Não'}</LinhaFisica>
          <LinhaFisica rotulo="Usa óculos">{variaveis.usaOculos ? 'Sim' : 'Não'}</LinhaFisica>
        </div>
      </div>
    </>
  );
}

function AbaBio({ npc, anoAtual }: { readonly npc: Npc; readonly anoAtual: number }) {
  const idadeAtual = calcularIdadeNpc(npc, anoAtual);
  const dataNasc   = `${npc.dataNascimento.dia.toString().padStart(2, '0')}/${npc.dataNascimento.mes.toString().padStart(2, '0')}/${npc.dataNascimento.ano}`;

  const rotuloGenero: Record<string, string> = { M: 'Masculino', F: 'Feminino', outro: 'Outro' };

  return (
    <>
      <div className="painel-npc__secao">
        <div className="painel-npc__secao-titulo">Identificação</div>
        <div className="painel-npc__grid-bio">
          <div className="painel-npc__bio-item painel-npc__bio-item--full">
            <div className="painel-npc__bi-label">Nome completo</div>
            <div className="painel-npc__bi-valor" style={{ fontSize: 16 }}>
              {npc.nome} {npc.sobrenome}
            </div>
          </div>
          <div className="painel-npc__bio-item">
            <div className="painel-npc__bi-label">Gênero</div>
            <div className="painel-npc__bi-valor">{rotuloGenero[npc.genero] ?? npc.genero}</div>
          </div>
          <div className="painel-npc__bio-item">
            <div className="painel-npc__bi-label">Nascimento</div>
            <div className="painel-npc__bi-valor">{dataNasc}</div>
          </div>
          <div className="painel-npc__bio-item">
            <div className="painel-npc__bi-label">Idade atual</div>
            <div className="painel-npc__bi-valor">{idadeAtual} anos</div>
          </div>
          <div className="painel-npc__bio-item">
            <div className="painel-npc__bi-label">Status</div>
            <div
              className="painel-npc__bi-valor"
              style={{ color: npc.vivo ? 'var(--pnpc-green)' : 'var(--pnpc-red)' }}
            >
              {npc.vivo ? '✓ Vivo' : '✕ Falecido'}
            </div>
          </div>
        </div>
      </div>

      <div className="painel-npc__secao">
        <div className="painel-npc__secao-titulo">Vida profissional</div>
        <div className="painel-npc__grid-bio">
          <div className="painel-npc__bio-item painel-npc__bio-item--full">
            <div className="painel-npc__bi-label">Profissão atual</div>
            <div className="painel-npc__bi-valor">
              {npc.profissaoAtual ?? 'Sem registro'}
            </div>
          </div>
          <div className="painel-npc__bio-item">
            <div className="painel-npc__bi-label">Situação financeira</div>
            <div className="painel-npc__bi-valor">
              {ROTULO_FINANCEIRO[npc.statusFinanceiro] ?? npc.statusFinanceiro}
            </div>
          </div>
          <div className="painel-npc__bio-item">
            <div className="painel-npc__bi-label">Persistência</div>
            <div className="painel-npc__bi-valor" style={{ textTransform: 'capitalize' }}>
              {npc.persistencia}
            </div>
          </div>
        </div>
      </div>

      {npc.tags.length > 0 && (
        <div className="painel-npc__secao">
          <div className="painel-npc__secao-titulo">Tags</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {npc.tags.map(tag => (
              <span key={tag} className="painel-npc__tl-tag">{tag}</span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function AbaRelacionamento({ npc }: { readonly npc: Npc }) {
  const { relacionamentoComJogador: rel } = npc;
  const rotuloTipo = ROTULO_VINCULO[rel.tipo] ?? rel.tipo;
  const larguraBarra = afetoParaLargura(rel.afeto);
  const corAfeto = corAfetoValor(rel.afeto);
  const desde = formatarMesAno(rel.conhecidoDesde.mes, rel.conhecidoDesde.ano);

  return (
    <>
      <div className="painel-npc__rel-tipo">
        <span className="painel-npc__rel-icone">🤝</span>
        <div className="painel-npc__rel-info">
          <h4>{rotuloTipo}</h4>
          <p>
            Conhecido(a) desde {desde}
            {rel.ultimaInteracao && (
              <> · Última interação: {formatarMesAno(rel.ultimaInteracao.mes, rel.ultimaInteracao.ano)}</>
            )}
          </p>
        </div>
      </div>

      <div className="painel-npc__afeto-bloco">
        <div className="painel-npc__afeto-header">
          <span className="painel-npc__afeto-label">Afeto</span>
          <span className="painel-npc__afeto-valor" style={{ color: corAfeto }}>
            {rel.afeto >= 0 ? '+' : ''}{rel.afeto} / 100
          </span>
        </div>
        <div className="painel-npc__afeto-barra-bg">
          <div
            className="painel-npc__afeto-barra-fill"
            style={{ width: `${larguraBarra}%` }}
          />
        </div>
      </div>

      {npc.historicoInteracoes.length > 0 && (
        <div className="painel-npc__secao">
          <div className="painel-npc__secao-titulo">Histórico de interações</div>
          <div className="painel-npc__cartao">
            {npc.historicoInteracoes
              .slice()
              .sort((a, b) => b.ano !== a.ano ? b.ano - a.ano : b.mes - a.mes)
              .map((interacao, indice) => (
                <div key={`${interacao.eventoId}-${indice}`} className="painel-npc__historico-item">
                  <div className="painel-npc__rel-dot" />
                  <div className="painel-npc__rel-text">
                    <strong>{formatarMesAno(interacao.mes, interacao.ano)}</strong>
                    {' — '}
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
                      {interacao.eventoId}
                    </span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </>
  );
}

function AbaAtributos({ npc }: { readonly npc: Npc }) {
  if (!npc.atributos) {
    return (
      <p className="painel-npc__sem-atributos">
        Este NPC não possui atributos registrados.
      </p>
    );
  }

  const { atributos } = npc;

  return (
    <>
      <div className="painel-npc__secao">
        <div className="painel-npc__secao-titulo">Status atual</div>
        <div className="painel-npc__status-pills">
          <span className="painel-npc__status-pill painel-npc__status-pill--vivo">
            {npc.vivo ? '✓ Vivo' : '✕ Falecido'}
          </span>
          {npc.profissaoAtual && (
            <span className="painel-npc__status-pill painel-npc__status-pill--emprego">
              {npc.profissaoAtual}
            </span>
          )}
          <span className="painel-npc__status-pill painel-npc__status-pill--financ">
            💰 {ROTULO_FINANCEIRO[npc.statusFinanceiro] ?? npc.statusFinanceiro}
          </span>
        </div>
      </div>

      <div className="painel-npc__secao">
        <div className="painel-npc__secao-titulo">Atributos RPG</div>
        <div className="painel-npc__attr-grid">
          <CartaoAtributo
            nome="Força"
            valor={atributos.forca}
            modificador={calcularModificador(atributos.forca)}
            classeExtra="painel-npc__attr-card--forca"
          />
          <CartaoAtributo
            nome="Inteligência"
            valor={atributos.inteligencia}
            modificador={calcularModificador(atributos.inteligencia)}
            classeExtra="painel-npc__attr-card--int"
          />
          <CartaoAtributo
            nome="Carisma"
            valor={atributos.carisma}
            modificador={calcularModificador(atributos.carisma)}
            classeExtra="painel-npc__attr-card--car"
          />
          <CartaoAtributo
            nome="Constituição"
            valor={atributos.constituicao}
            modificador={calcularModificador(atributos.constituicao)}
            classeExtra="painel-npc__attr-card--con"
          />
          <CartaoAtributo
            nome="Sorte"
            valor={atributos.sorte}
            modificador={calcularModificador(atributos.sorte)}
            classeExtra="painel-npc__attr-card--sor painel-npc__attr-card--full"
          />
        </div>
      </div>
    </>
  );
}

function AbaTimeline({ npc }: { readonly npc: Npc }) {
  const interacoesOrdenadas = npc.historicoInteracoes
    .slice()
    .sort((a, b) => b.ano !== a.ano ? b.ano - a.ano : b.mes - a.mes);

  if (interacoesOrdenadas.length === 0) {
    return (
      <p className="painel-npc__sem-atributos">
        Nenhuma interação registrada ainda.
      </p>
    );
  }

  return (
    <div className="painel-npc__secao">
      <div className="painel-npc__secao-titulo">Eventos compartilhados</div>
      {interacoesOrdenadas.map((interacao, indice) => {
        const ehUltimo = indice === interacoesOrdenadas.length - 1;
        return (
          <div key={`${interacao.eventoId}-${indice}`} className="painel-npc__timeline-item">
            <div className="painel-npc__tl-esquerda">
              <div className="painel-npc__tl-ano">{interacao.ano}</div>
              <div className="painel-npc__tl-dot" />
              {!ehUltimo && <div className="painel-npc__tl-linha" />}
            </div>
            <div className="painel-npc__tl-conteudo">
              <div className="painel-npc__tl-titulo">
                {formatarMesAno(interacao.mes, interacao.ano)}
              </div>
              <div className="painel-npc__tl-desc">{interacao.eventoId}</div>
              <span className="painel-npc__tl-tag">evento</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Micro-componentes reutilizáveis
// ---------------------------------------------------------------------------

function LinhaFisica({
  rotulo,
  children,
}: {
  readonly rotulo: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="painel-npc__atributo-fisico">
      <span className="painel-npc__af-label">{rotulo}</span>
      <span className="painel-npc__af-valor">{children}</span>
    </div>
  );
}

function CartaoAtributo({
  nome,
  valor,
  modificador,
  classeExtra,
}: {
  readonly nome: string;
  readonly valor: number;
  readonly modificador: number;
  readonly classeExtra: string;
}) {
  return (
    <div className={`painel-npc__attr-card ${classeExtra}`}>
      <div className="painel-npc__a-nome">{nome}</div>
      <div className="painel-npc__a-val">{valor}</div>
      <div className="painel-npc__a-mod">mod {formatarModificador(modificador)}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function PainelNpc({
  npc,
  anoAtual,
  aoFechar,
  aoInteragir,
  aoVisitar,
}: PainelNpcProps) {
  const [abaAtiva, definirAba] = useState<AbaId>('aparencia');

  const idadeAtual    = calcularIdadeNpc(npc, anoAtual);
  const emojiGenero   = EMOJI_GENERO[npc.genero] ?? '🧑';
  const rotuloVinculo = ROTULO_VINCULO[npc.relacionamentoComJogador.tipo] ?? npc.relacionamentoComJogador.tipo;

  function fecharAoClicarOverlay(evento: React.MouseEvent<HTMLDivElement>) {
    if (evento.target === evento.currentTarget) aoFechar();
  }

  return (
    <div
      className="painel-npc-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Painel de NPC: ${npc.nome} ${npc.sobrenome}`}
      onClick={fecharAoClicarOverlay}
    >
      <div className="painel-npc">

        {/* Header */}
        <div className="painel-npc__header">
          <button
            className="painel-npc__btn-fechar"
            onClick={aoFechar}
            aria-label="Fechar painel"
          >
            ✕
          </button>

          <div className="painel-npc__identidade">
            <div className="painel-npc__avatar-wrap">
              <div className="painel-npc__avatar">{emojiGenero}</div>
              <span
                className={`painel-npc__badge-persistencia painel-npc__badge-persistencia--${npc.persistencia}`}
              >
                {npc.persistencia.toUpperCase()}
              </span>
            </div>

            <div className="painel-npc__nome-bloco">
              <h2>{npc.nome} {npc.sobrenome}</h2>
              <div className="painel-npc__papel">{rotuloVinculo}</div>
              <div className="painel-npc__dados-rapidos">
                <span className="painel-npc__dado">👤 {idadeAtual} anos</span>
                {npc.profissaoAtual && (
                  <span className="painel-npc__dado">💼 {npc.profissaoAtual}</span>
                )}
                <span
                  className="painel-npc__dado"
                  style={{ color: npc.vivo ? 'var(--pnpc-green)' : 'var(--pnpc-red)' }}
                >
                  {npc.vivo ? '💚 Vivo' : '💀 Falecido'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Abas */}
        <div className="painel-npc__abas" role="tablist">
          {ABAS.map(aba => (
            <button
              key={aba.id}
              role="tab"
              aria-selected={abaAtiva === aba.id}
              className={`painel-npc__aba${abaAtiva === aba.id ? ' painel-npc__aba--ativa' : ''}`}
              onClick={() => definirAba(aba.id)}
            >
              {aba.rotulo}
            </button>
          ))}
        </div>

        {/* Conteúdo da aba ativa */}
        <div className="painel-npc__conteudo" role="tabpanel">
          {abaAtiva === 'aparencia'      && <AbaAparencia npc={npc} />}
          {abaAtiva === 'bio'            && <AbaBio npc={npc} anoAtual={anoAtual} />}
          {abaAtiva === 'relacionamento' && <AbaRelacionamento npc={npc} />}
          {abaAtiva === 'atributos'      && <AbaAtributos npc={npc} />}
          {abaAtiva === 'timeline'       && <AbaTimeline npc={npc} />}
        </div>

        {/* Footer */}
        <div className="painel-npc__footer">
          <button
            className="painel-npc__btn painel-npc__btn--sec"
            onClick={() => aoVisitar?.(npc)}
            disabled={!aoVisitar}
          >
            Visitar
          </button>
          <button
            className="painel-npc__btn painel-npc__btn--primario"
            onClick={() => aoInteragir?.(npc)}
            disabled={!aoInteragir}
          >
            Interagir
          </button>
        </div>

      </div>
    </div>
  );
}
