export type TierResultado = 'falha_critica' | 'falha' | 'sucesso' | 'sucesso_critico';

export const TIER_FALHA_CRITICA = 1;
export const TIER_FALHA_MAX = 9;
export const TIER_SUCESSO_MIN = 10;
export const TIER_SUCESSO_CRITICO = 20;

export function rolarD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

export function classificarResultado(roll: number, modificador: number, dc: number): TierResultado {
  if (roll === TIER_FALHA_CRITICA) return 'falha_critica';
  if (roll === TIER_SUCESSO_CRITICO) return 'sucesso_critico';
  const efetivo = roll + modificador;
  return efetivo >= dc ? 'sucesso' : 'falha';
}
