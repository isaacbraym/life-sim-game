import React from 'react';
import type { AtributoRpg } from '../state/hudStore';
import './HudLateral.css';
type PropsHudLateral = {
    readonly nomePersonagem: string;
    readonly profissaoAtual: string;
    readonly idadeAnos: number;
    readonly anoAtual: number;
    readonly humor: number;
    readonly saude: number;
    readonly dinheiro: number;
    readonly atributos: readonly AtributoRpg[];
    readonly aoClicarAtividade: (idAtividade: string) => void;
    readonly aoNovoJogo?: () => void;
};
export declare function HudLateral({ nomePersonagem, profissaoAtual, idadeAnos, anoAtual, humor, saude, dinheiro, atributos, aoClicarAtividade, aoNovoJogo, }: PropsHudLateral): React.JSX.Element;
export {};
//# sourceMappingURL=HudLateral.d.ts.map