import type { SaveSlot } from '../schemas/save';
export type EstadoDeJogo = {
    readonly anoNascimento: number;
    readonly anoAtual: number;
    readonly humor: number;
    readonly saude: number;
    readonly dinheiro: number;
    readonly atributos: Readonly<Record<string, number>>;
    readonly flags: readonly string[];
    readonly cooldownRegistry: Readonly<Record<string, number>>;
};
export declare function salvarParaEstadoDeJogo(save: SaveSlot, anoAtual: number): EstadoDeJogo;
//# sourceMappingURL=EstadoDeJogo.d.ts.map