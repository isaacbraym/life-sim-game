import type { Atributos } from '../schemas/character';
import type { AtributoRPG } from '../schemas/effect';
export declare const ATRIBUTO_MINIMO = 1;
export declare const ATRIBUTO_MAXIMO = 20;
export declare function gerarAtributosIniciais(): Atributos;
export declare function clampAtributo(valor: number): number;
export declare function calcularModificador(valorAtributo: number): number;
export declare function modificadorDe(atributos: Atributos, atributo: AtributoRPG): number;
//# sourceMappingURL=Attributes.d.ts.map