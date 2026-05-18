import { Atributos } from '../schemas/character';

export { Atributos };

export function calcularModificador(valorAtributo: number): number {
  return Math.floor((valorAtributo - 10) / 2);
}

export function calcularModificadorNome(atributos: Atributos, nome: keyof Atributos): number {
  return calcularModificador(atributos[nome]);
}
