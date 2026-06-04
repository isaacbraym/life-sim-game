import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { configurarObservadorResultadoAcao } from '@core/interaction/ActionResolver';
import './styles/tokens.css';
import './index.css';
import { App } from './app/App';
import { IsoExplorationScene } from './screens/IsoExplorationScene';
import { BarraSuperior } from './ui/BarraSuperior';
import { RailVitais } from './ui/RailVitais';
import { useExplorationStore } from './state/explorationStore';
import { useHudStore } from './state/hudStore';

// Dev shortcut: ?iso=quarto_simples_iso carrega direto a cena iso sem boot
const isoDevComodo = new URLSearchParams(window.location.search).get('iso');

configurarObservadorResultadoAcao((resultado) => {
  useHudStore.getState().aplicarResultadoAcao(resultado);
});

function IsoDevApp({ comodoId }: { readonly comodoId: string }): React.JSX.Element {
  const {
    nomePersonagem,
    profissaoAtual,
    idadeAnos,
    anoAtual,
    dinheiro,
    humor,
    saude,
    atributos,
  } = useHudStore();

  useEffect(() => {
    useExplorationStore.getState().entrarEmExploracao('dev_iso', comodoId);

    return () => {
      useExplorationStore.getState().sairDeExploracao();
    };
  }, [comodoId]);

  return (
    <div style={estilosIsoDev.raiz}>
      <IsoExplorationScene comodoId={comodoId} />
      <div style={estilosIsoDev.topbar}>
        <BarraSuperior
          nomePersonagem={nomePersonagem}
          profissaoAtual={profissaoAtual}
          idadeAnos={idadeAnos}
          anoAtual={anoAtual}
          dinheiro={dinheiro}
        />
      </div>
      <div style={estilosIsoDev.rail}>
        <RailVitais humor={humor} saude={saude} atributos={atributos} />
      </div>
    </div>
  );
}

const estilosIsoDev = {
  raiz: {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    background: '#1a2330',
  },
  topbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    pointerEvents: 'auto',
  },
  rail: {
    position: 'absolute',
    top: 76,
    left: 16,
    bottom: 16,
    zIndex: 90,
    pointerEvents: 'auto',
    display: 'flex',
  },
} satisfies Record<string, React.CSSProperties>;

ReactDOM.createRoot(document.getElementById('root')!).render(
  isoDevComodo !== null
    ? <IsoDevApp comodoId={isoDevComodo} />
    : <App />,
);
