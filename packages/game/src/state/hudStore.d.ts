import type { SaveSlot } from '@lifesim/core';
import { GameEngine } from '../engine/GameEngine';
export type AtributoRpg = {
    readonly nome: string;
    readonly valor: number;
};
type EstadoHud = {
    readonly nomePersonagem: string;
    readonly profissaoAtual: string;
    readonly idadeAnos: number;
    readonly anoAtual: number;
    readonly humor: number;
    readonly saude: number;
    readonly dinheiro: number;
    readonly eventoAtivo: EventoAtivo | undefined;
    readonly atributos: readonly AtributoRpg[];
    readonly engineAtivo: GameEngine | undefined;
};
export type OpcaoEvento = {
    readonly texto: string;
    readonly efeitos: readonly unknown[];
    readonly cooldownMeses?: number;
    readonly atributoCheck?: {
        readonly atributo: string;
        readonly dificuldade: number;
    };
};
export type EventoAtivo = {
    readonly eventoId: string;
    readonly titulo: string;
    readonly descricao: string;
    readonly icone: string;
    readonly opcoes: readonly OpcaoEvento[];
};
type AcoesHud = {
    readonly atualizarEstado: (parcial: Partial<EstadoHud>) => void;
    readonly resolverOpcao: (indice: number) => void;
    readonly avancarSemEvento: () => void;
    readonly inicializarEngine: (save: SaveSlot) => void;
    readonly avancarTurno: () => Promise<void>;
};
export declare const useHudStore: import("zustand").UseBoundStore<import("zustand").StoreApi<EstadoHud & AcoesHud>>;
export {};
//# sourceMappingURL=hudStore.d.ts.map