import type { Atributos } from '../schemas/character';
import type { AtributoRPG } from '../schemas/effect';

export const ATRIBUTO_MINIMO = 1;
export const ATRIBUTO_MAXIMO = 20;

export function gerarAtributosIniciais(): Atributos {
  throw new Error('not implemented');
}

export function clampAtributo(valor: number): number {
  return Math.min(ATRIBUTO_MAXIMO, Math.max(ATRIBUTO_MINIMO, valor));
}

export function calcularModificador(valorAtributo: number): number {
  return Math.floor((valorAtributo - 10) / 2);
}

export function modificadorDe(atributos: Atributos, atributo: AtributoRPG): number {
  return calcularModificador(atributos[atributo]);
}
