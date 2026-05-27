import { PixiStage } from './stage/PixiStage';
import { IsoExplorationScene } from './screens/IsoExplorationScene';

const urlParams    = new URLSearchParams(window.location.search);
const isoDevComodo = urlParams.get('iso');

export default function App() {
  if (isoDevComodo !== null) {
    return <IsoExplorationScene comodoId={isoDevComodo} />;
  }
  return <PixiStage />;
}
