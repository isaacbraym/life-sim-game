import React from 'react';
import type { AtributoRpg } from '../state/hudStore';
import './PainelAtributos.css';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type PropsPainelAtributos = {
  readonly atributos: readonly AtributoRpg[];
};

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const ABREVIACOES: Readonly<Record<string, string>> = {
  Força:        'FOR',
  Inteligência: 'INT',
  Carisma:      'CAR',
  Constituição: 'CON',
  Sorte:        'SOR',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calcularModificador(valor: number): string {
  const mod = Math.floor((valor - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function classeModificador(valor: number): string {
  const mod = Math.floor((valor - 10) / 2);
  if (mod > 0) return 'positivo';
  if (mod < 0) return 'negativo';
  return 'zero';
}

// ---------------------------------------------------------------------------
// Sub-componente
// ---------------------------------------------------------------------------

function CardAtributo({ atributo }: { readonly atributo: AtributoRpg }): React.JSX.Element {
  const abrev = ABREVIACOES[atributo.nome] ?? atributo.nome.slice(0, 3).toUpperCase();
  const modificador = calcularModificador(atributo.valor);
  const classeMod = classeModificador(atributo.valor);
  const ehSorte = atributo.nome === 'Sorte';

  return (
    <div className={`painel-atrib-card${ehSorte ? ' painel-atrib-card--sorte' : ''}`}>
      <span className="painel-atrib-abrev">{abrev}</span>
      <span className="painel-atrib-valor">{atributo.valor}</span>
      <span className={`painel-atrib-mod painel-atrib-mod--${classeMod}`}>{modificador}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function PainelAtributos({ atributos }: PropsPainelAtributos): React.JSX.Element {
  return (
    <div className="painel-atributos">
      {atributos.map((atributo) => (
        <CardAtributo key={atributo.nome} atributo={atributo} />
      ))}
    </div>
  );
}
