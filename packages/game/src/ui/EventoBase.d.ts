import React from 'react';
import type { EventoAtivo } from '../state/hudStore';
import './EventoBase.css';
type PropsEventoBase = {
    readonly evento: EventoAtivo | undefined;
    readonly aoEscolher: (indice: number) => void;
};
export declare function EventoBase({ evento, aoEscolher, }: PropsEventoBase): React.JSX.Element;
export {};
//# sourceMappingURL=EventoBase.d.ts.map