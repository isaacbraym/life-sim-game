export type TierResultado = 'falha_critica' | 'falha' | 'sucesso' | 'sucesso_critico';

export function rolarD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

export interface ResolverRolagemParams {
  rolagem: number;
  modificador: number;
  dificuldade: number;
}

export function resolverRolagem(params: ResolverRolagemParams): TierResultado {
  const { rolagem, modificador, dificuldade } = params;
  
  if (rolagem === 1) return 'falha_critica';
  if (rolagem === 20) return 'sucesso_critico';
  
  const total = rolagem + modificador;
  if (total >= dificuldade) {
    return 'sucesso';
  }
  
  return 'falha';
}
