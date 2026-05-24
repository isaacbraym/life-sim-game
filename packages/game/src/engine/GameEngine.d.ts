import type { SaveSlot } from '@lifesim/core';
import type { ResultadoRolagem } from '@core/rpg/D20Roll';
export type { ResultadoRolagem };
export type EfeitoOpcaoDoTurno = {
    readonly tipo: string;
    readonly [chave: string]: unknown;
};
export type OpcaoDoTurno = {
    readonly texto: string;
    readonly efeitos: readonly EfeitoOpcaoDoTurno[];
    readonly atributoCheck?: {
        readonly atributo: string;
        readonly dificuldade: number;
    };
};
export type EventoDoTurno = {
    readonly eventoId: string;
    readonly titulo: string;
    readonly descricao: string;
    readonly icone: string;
    readonly opcoes: readonly OpcaoDoTurno[];
    readonly resultadoRolagem?: ResultadoRolagem;
};
export declare class GameEngine {
    private saveAtivo;
    private rosterDeNpcs;
    private readonly eventLoader;
    constructor(saveAtivo: SaveSlot);
    avancarTurno(): Promise<EventoDoTurno | undefined>;
    obterEstadoAtual(): SaveSlot;
    registrarCooldown(eventoId: string, anoExpiracao: number): void;
    aplicarResultadoEfeitos(protagonistaAtualizado: import('@lifesim/core').Character, rosterAtualizado: readonly import('@lifesim/core').Npc[]): void;
    salvarEstadoAtual(): Promise<void>;
    salvar(): Promise<void>;
}
//# sourceMappingURL=GameEngine.d.ts.map