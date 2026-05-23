import React from 'react';
import { PixiStage } from '../stage/PixiStage';

export function App(): React.JSX.Element {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a2e' }}>
      <PixiStage />
    </div>
  );
}
