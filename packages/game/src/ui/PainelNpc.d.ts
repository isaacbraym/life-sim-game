import type { Npc } from '@lifesim/core';
import './PainelNpc.css';
export type PainelNpcProps = {
    readonly npc: Npc;
    readonly anoAtual: number;
    readonly aoFechar: () => void;
    readonly aoInteragir?: (npc: Npc) => void;
    readonly aoVisitar?: (npc: Npc) => void;
};
export declare function PainelNpc({ npc, anoAtual, aoFechar, aoInteragir, aoVisitar, }: PainelNpcProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=PainelNpc.d.ts.map