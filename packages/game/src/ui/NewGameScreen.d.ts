import React from 'react';
import type { Atributos } from '@lifesim/core';
import './NewGameScreen.css';
export type DadosNovoPersonagem = {
    readonly nome: string;
    readonly sobrenome: string;
    readonly genero: 'M' | 'F' | 'outro';
    readonly ritmo: 'mensal' | 'semestral' | 'anual';
    readonly atributos: Atributos;
};
type PropsNewGameScreen = {
    readonly aoConfirmar: (dados: DadosNovoPersonagem) => void;
    readonly aoCancelar?: () => void;
};
export declare function NewGameScreen({ aoConfirmar, aoCancelar }: PropsNewGameScreen): React.JSX.Element;
export {};
//# sourceMappingURL=NewGameScreen.d.ts.map