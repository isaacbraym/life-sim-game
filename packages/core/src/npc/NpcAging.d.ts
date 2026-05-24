import type { Npc } from '../schemas/npc';
export type ResultadoEnvelhecimento = {
    readonly npc: Npc;
    /** true se algum traço variável mudou nesta chamada */
    readonly houveMudancaVisual: boolean;
};
export declare function envelhecerNpc(npc: Npc, anoAtual: number): Npc;
export declare function envelhecerRoster(roster: readonly Npc[], anoAtual: number): Npc[];
export declare function envelhecerRosterComRelatorio(roster: readonly Npc[], anoAtual: number): {
    readonly rosterAtualizado: Npc[];
    readonly npcsMudados: readonly string[];
};
//# sourceMappingURL=NpcAging.d.ts.map