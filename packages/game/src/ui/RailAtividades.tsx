/* ============================================================================
   RailAtividades — coluna direita com cards de atividade
   ----------------------------------------------------------------------------
   ▸ Destino: packages/game/src/ui/RailAtividades.tsx
   ▸ Componente NOVO. Substitui a metade-inferior do antigo HudLateral
     (a lista de atividades livres).
   ▸ Cada atividade vira card com ícone + título + hint (custo / efeito).
   ============================================================================ */

import React from 'react';
import { IconBase, type IconName } from './IconBase';
import './RailAtividades.css';

type Atividade = {
  readonly id: string;
  readonly rotulo: string;
  readonly icone: IconName;
  readonly hint: string;
};

const ATIVIDADES: readonly Atividade[] = [
  { id: 'academia',        rotulo: 'Academia',        icone: 'dumbbell', hint: '−R$ 80 · +Saúde'    },
  { id: 'estudar',         rotulo: 'Estudar',         icone: 'book',     hint: '+Inteligência'      },
  { id: 'sair_noite',      rotulo: 'Sair à noite',    icone: 'glass',    hint: '+Humor / −Saúde'    },
  { id: 'consulta_medica', rotulo: 'Consulta médica', icone: 'cross',    hint: '−R$ 220 · +Saúde'   },
  { id: 'ver_pessoas',     rotulo: 'Ver pessoas',     icone: 'people',   hint: '12 conhecidos'      },
] as const;

type PropsRailAtividades = {
  readonly aoClicarAtividade: (idAtividade: string) => void;
};

export function RailAtividades({
  aoClicarAtividade,
}: PropsRailAtividades): React.JSX.Element {
  return (
    <aside
      className="vida-rail-atividades vida-scroll"
      aria-label="Atividades livres"
    >
      <div className="vida-rail-atividades__caps">Atividades livres</div>
      {ATIVIDADES.map((at) => (
        <button
          key={at.id}
          className="vida-rail-atividades__card"
          onClick={() => aoClicarAtividade(at.id)}
        >
          <div className="vida-rail-atividades__topo">
            <span className="vida-rail-atividades__icone">
              <IconBase name={at.icone} size={14} />
            </span>
            <span className="vida-rail-atividades__rotulo">{at.rotulo}</span>
          </div>
          <span className="vida-rail-atividades__hint">{at.hint}</span>
        </button>
      ))}
    </aside>
  );
}
