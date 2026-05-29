import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/tokens.css';
import './index.css';
import { App } from './app/App';
import { IsoExplorationScene } from './screens/IsoExplorationScene';

// Dev shortcut: ?iso=quarto_simples_iso carrega direto a cena iso sem boot
const isoDevComodo = new URLSearchParams(window.location.search).get('iso');

ReactDOM.createRoot(document.getElementById('root')!).render(
  isoDevComodo !== null
    ? <IsoExplorationScene comodoId={isoDevComodo} />
    : <App />,
);
