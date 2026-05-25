import React from 'react';
import type { Atributos } from '@core/schemas/character';
import { calcularFaseAtual } from '@core/lifephase/LifePhaseManager';
import type { LifePhaseEnum } from '@core/schemas/lifephase';
import type { AtributoRpg } from '../state/hudStore';
import { useHudStore } from '../state/hudStore';
import './PainelAtributos.css';

type PropsPainelAtributos = {
  readonly atributos?: readonly AtributoRpg[];
};

type AtributoExibicao = {
  readonly chave: keyof Atributos;
  readonly nome: string;
  readonly abreviacao: string;
};

const ATRIBUTOS_EXIBIDOS: readonly AtributoExibicao[] = [
  { chave: 'forca', nome: 'Forca', abreviacao: 'FOR' },
  { chave: 'inteligencia', nome: 'Inteligencia', abreviacao: 'INT' },
  { chave: 'carisma', nome: 'Carisma', abreviacao: 'CAR' },
  { chave: 'constituicao', nome: 'Constituicao', abreviacao: 'CON' },
  { chave: 'sorte', nome: 'Sorte', abreviacao: 'SOR' },
];

const ROTULOS_FASE: Readonly<Record<LifePhaseEnum, string>> = {
  bebe: 'Bebe',
  crianca: 'Crianca',
  adolescente: 'Adolescente',
  jovem_adulto: 'Jovem adulto',
  adulto: 'Adulto',
  idoso: 'Idoso',
};

function formatarDinheiro(valor: number | undefined): string {
  if (valor === undefined) return '--';
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

function formatarNumero(valor: number | undefined): string {
  return valor === undefined ? '--' : String(valor);
}

function formatarIdade(totalMeses: number | undefined, idadeAnosFallback: number): string {
  if (totalMeses === undefined) {
    return `${idadeAnosFallback} anos`;
  }

  const anos = Math.floor(totalMeses / 12);
  const meses = totalMeses % 12;
  return `${anos} anos e ${meses} meses`;
}

function obterFase(totalMeses: number | undefined, idadeAnosFallback: number): string {
  const idadeAnos = totalMeses === undefined ? idadeAnosFallback : Math.floor(totalMeses / 12);
  return ROTULOS_FASE[calcularFaseAtual(idadeAnos)];
}

function limitarPercentual(valor: number | undefined): number {
  if (valor === undefined) return 0;
  return Math.max(0, Math.min(100, (valor / 20) * 100));
}

function obterAtributoFallback(
  atributos: readonly AtributoRpg[],
  nome: string,
): number | undefined {
  return atributos.find((atributo) => atributo.nome === nome)?.valor;
}

function obterValorAtributo(
  chave: keyof Atributos,
  nome: string,
  atributosSave: Atributos | undefined,
  atributosHud: readonly AtributoRpg[],
  atributosExternos: readonly AtributoRpg[] | undefined,
): number | undefined {
  return atributosSave?.[chave]
    ?? obterAtributoFallback(atributosHud, nome)
    ?? obterAtributoFallback(atributosExternos ?? [], nome);
}

function CardAtributo({
  atributo,
  valor,
}: {
  readonly atributo: AtributoExibicao;
  readonly valor: number | undefined;
}): React.JSX.Element {
  return (
    <div className="painel-atrib-card">
      <div className="painel-atrib-card__topo">
        <span className="painel-atrib-abrev">{atributo.abreviacao}</span>
        <span className="painel-atrib-valor">{formatarNumero(valor)}</span>
      </div>
      <div className="painel-atrib-nome">{atributo.nome}</div>
      <div className="painel-atrib-barra" aria-hidden="true">
        <span style={{ width: `${limitarPercentual(valor)}%` }} />
      </div>
    </div>
  );
}

export function PainelAtributos({ atributos: atributosExternos }: PropsPainelAtributos): React.JSX.Element {
  const {
    atributos: atributosHud,
    dinheiro,
    idadeAnos,
    anoAtual,
    saveAtual,
  } = useHudStore();
  const protagonista = saveAtual?.protagonista;
  const idadeMeses = protagonista?.idadeAtualMeses;
  const dinheiroAtual = protagonista?.dinheiro ?? dinheiro;
  const anoJogo = saveAtual?.estadoMundo.anoAtual ?? anoAtual;
  const mesJogo = saveAtual?.estadoMundo.mesAtual;

  return (
    <div className="painel-atributos">
      <div className="painel-atributos__grid">
        {ATRIBUTOS_EXIBIDOS.map((atributo) => (
          <CardAtributo
            key={atributo.chave}
            atributo={atributo}
            valor={obterValorAtributo(
              atributo.chave,
              atributo.nome,
              protagonista?.atributos,
              atributosHud,
              atributosExternos,
            )}
          />
        ))}
      </div>

      <div className="painel-atributos__resumo">
        <div className="painel-atributos__linha">
          <span>Dinheiro</span>
          <strong>{formatarDinheiro(dinheiroAtual)}</strong>
        </div>
        <div className="painel-atributos__linha">
          <span>Idade</span>
          <strong>{formatarIdade(idadeMeses, idadeAnos)}</strong>
        </div>
        <div className="painel-atributos__linha">
          <span>Fase</span>
          <strong>{obterFase(idadeMeses, idadeAnos)}</strong>
        </div>
        <div className="painel-atributos__linha">
          <span>Calendario</span>
          <strong>{formatarNumero(mesJogo)}/{formatarNumero(anoJogo)}</strong>
        </div>
      </div>
    </div>
  );
}

