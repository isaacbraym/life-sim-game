import { useState } from 'react';
import { VisualizadorDeMovel } from './tools/FurnitureViewer';
import { ValidadorDeComodo } from './tools/RoomValidator';
import { ProoferDeCena } from './tools/SceneProofer';
import { EditorDePersonagem } from './tools/CharacterEditor';
import { GrafoDeEventos } from './tools/EventGraph';

type Ferramenta = 'movel' | 'comodo' | 'cena' | 'personagem' | 'eventos';

const FERRAMENTAS: ReadonlyArray<{ readonly id: Ferramenta; readonly rotulo: string }> = [
  { id: 'movel', rotulo: 'Furniture Viewer' },
  { id: 'comodo', rotulo: 'Room Validator' },
  { id: 'cena', rotulo: 'Scene Proofer' },
  { id: 'personagem', rotulo: 'Character Editor' },
  { id: 'eventos', rotulo: 'Event Graph' },
];

const estiloNavBar: React.CSSProperties = {
  width: 190,
  minWidth: 190,
  background: '#1a1a2e',
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
  borderRight: '1px solid #4a5568',
};

const estiloTitulo: React.CSSProperties = {
  color: '#90cdf4',
  fontSize: 13,
  fontWeight: 'bold',
  margin: '0 0 0.8rem',
  lineHeight: 1.4,
};

function estiloBotao(ativo: boolean): React.CSSProperties {
  return {
    background: ativo ? '#2d3748' : 'transparent',
    color: ativo ? '#90cdf4' : '#a0aec0',
    border: ativo ? '1px solid #4a5568' : '1px solid transparent',
    padding: '0.4rem 0.6rem',
    cursor: 'pointer',
    textAlign: 'left',
    borderRadius: 4,
    fontSize: 13,
    fontFamily: 'monospace',
    transition: 'background 0.15s',
  };
}

export function App() {
  const [ferramentaAtiva, setFerramentaAtiva] = useState<Ferramenta>('movel');

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'monospace', overflow: 'hidden' }}>
      <nav style={estiloNavBar}>
        <h2 style={estiloTitulo}>
          Vida 2.5D<br />Dev Tools
        </h2>
        {FERRAMENTAS.map(({ id, rotulo }) => (
          <button
            key={id}
            onClick={() => setFerramentaAtiva(id)}
            style={estiloBotao(ferramentaAtiva === id)}
          >
            {rotulo}
          </button>
        ))}
      </nav>
      <main style={{ flex: 1, overflow: 'auto', background: '#2d3748' }}>
        {ferramentaAtiva === 'movel' && <VisualizadorDeMovel />}
        {ferramentaAtiva === 'comodo' && <ValidadorDeComodo />}
        {ferramentaAtiva === 'cena' && <ProoferDeCena />}
        {ferramentaAtiva === 'personagem' && <EditorDePersonagem />}
        {ferramentaAtiva === 'eventos' && <GrafoDeEventos />}
      </main>
    </div>
  );
}
