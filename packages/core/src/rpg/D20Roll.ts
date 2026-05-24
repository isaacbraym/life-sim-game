export type TierResultado = 'falha_critica' | 'falha' | 'sucesso' | 'sucesso_critico';

export const TIER_FALHA_CRITICA = 1;
export const TIER_FALHA_MAX = 9;
export const TIER_SUCESSO_MIN = 10;
export const TIER_SUCESSO_CRITICO = 20;

import type { Atributos } from '../schemas/character';
import type { AtributoRPG } from '../schemas/effect';
import { calcularModificador } from './Attributes';

export function rolarD20(aleatorio: () => number = Math.random): number {
  return Math.floor(aleatorio() * 20) + 1;
}

export function classificarResultado(roll: number, modificador: number, dc: number): TierResultado {
  if (roll === TIER_FALHA_CRITICA) return 'falha_critica';
  if (roll === TIER_SUCESSO_CRITICO) return 'sucesso_critico';
  const efetivo = roll + modificador;
  return efetivo >= dc ? 'sucesso' : 'falha';
}

export type ResultadoRolagem = {
  readonly rolagem: number;
  readonly modificador: number;
  readonly total: number;
  readonly dificuldade: number;
  readonly passou: boolean;
  readonly critico: boolean;
  readonly falhaGrave: boolean;
};

export function rolarD20ComModificador(
  valorAtributo: number,
  dificuldade: number,
  aleatorio: () => number = Math.random,
): ResultadoRolagem {
  const rolagem = rolarD20(aleatorio);
  const modificador = calcularModificador(valorAtributo);
  const total = rolagem + modificador;

  return {
    rolagem,
    modificador,
    total,
    dificuldade,
    passou: total >= dificuldade || rolagem === TIER_SUCESSO_CRITICO,
    critico: rolagem === TIER_SUCESSO_CRITICO,
    falhaGrave: rolagem === TIER_FALHA_CRITICA,
  };
}

export function atributoCheck(
  atributos: Atributos,
  atributo: AtributoRPG,
  dificuldade: number,
  aleatorio: () => number = Math.random,
): ResultadoRolagem {
  return rolarD20ComModificador(atributos[atributo], dificuldade, aleatorio);
}
