import type { Atributos } from '../schemas/character';
import type { AtributoRPG } from '../schemas/effect';

export const ATRIBUTO_MINIMO = 1;
export const ATRIBUTO_MAXIMO = 20;

export function gerarAtributosIniciais(): Atributos {
  return {
    forca:        rolarQuatroDadosSeisSemMenor(),
    inteligencia: rolarQuatroDadosSeisSemMenor(),
    carisma:      rolarQuatroDadosSeisSemMenor(),
    constituicao: rolarQuatroDadosSeisSemMenor(),
    sorte:        rolarQuatroDadosSeisSemMenor(),
  };
}

function rolarQuatroDadosSeisSemMenor(): number {
  const rolagens = [rolarD6(), rolarD6(), rolarD6(), rolarD6()];
  const menorValor = Math.min(...rolagens);
  const somaSemMenor = rolagens.reduce((soma, dado) => soma + dado, 0) - menorValor;
  return clampAtributo(somaSemMenor);
}

function rolarD6(): number {
  return Math.floor(Math.random() * 6) + 1;
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
