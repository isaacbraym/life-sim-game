import React from 'react';
import { ATIVIDADES_BASE } from '@core/activities/ActivityCatalog';
import { IconBase, type IconName } from './IconBase';
import './RailAtividades.css';

type PropsRailAtividades = {
  readonly aoClicarAtividade: (idAtividade: string) => void;
  readonly idadeAnos: number;
};

const ICONES_SUPORTADOS: readonly IconName[] = [
  'menu',
  'settings',
  'save',
  'calendar',
  'wallet',
  'dice',
  'sparkle',
  'plus',
  'close',
  'pause',
  'play',
  'arrow-right',
  'arrow-left',
  'heart',
  'people',
  'dumbbell',
  'book',
  'glass',
  'cross',
];

function normalizarIcone(icone: string): IconName {
  return ICONES_SUPORTADOS.includes(icone as IconName) ? icone as IconName : 'sparkle';
}

export function RailAtividades({
  aoClicarAtividade,
  idadeAnos,
}: PropsRailAtividades): React.JSX.Element {
  const atividadesDisponiveis = ATIVIDADES_BASE.filter(
    (atividade) => idadeAnos >= atividade.idadeMinima,
  );

  return (
    <aside
      className="vida-rail-atividades vida-scroll"
      aria-label="Atividades livres"
    >
      <div className="vida-rail-atividades__caps">Atividades livres</div>
      {atividadesDisponiveis.map((at) => (
        <button
          key={at.id}
          className="vida-rail-atividades__card"
          onClick={() => aoClicarAtividade(at.id)}
        >
          <div className="vida-rail-atividades__topo">
            <span className="vida-rail-atividades__icone">
              <IconBase name={normalizarIcone(at.icone)} size={14} />
            </span>
            <span className="vida-rail-atividades__rotulo">{at.rotulo}</span>
          </div>
          <span className="vida-rail-atividades__hint">{at.hint}</span>
        </button>
      ))}
    </aside>
  );
}
