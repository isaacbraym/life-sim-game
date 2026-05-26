import { useState } from 'react';
import { VisualizadorDeMovel } from './tools/FurnitureViewer';
import { ValidadorDeComodo } from './tools/RoomValidator';
import { ProoferDeCena } from './tools/SceneProofer';
import { EditorDePersonagem } from './tools/CharacterEditor';
import { GrafoDeEventos } from './tools/EventGraph';
import { selecionarPastaRaiz, SUPORTA_FILE_SYSTEM_ACCESS } from './shared/ProjetoHandle';

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
  const [nomePastaRaiz, setNomePastaRaiz] = useState<string | undefined>();
  const [erroPastaRaiz, setErroPastaRaiz] = useState<string | undefined>();

  const aoSelecionarPastaRaiz = async () => {
    setErroPastaRaiz(undefined);
    try {
      const pasta = await selecionarPastaRaiz();
      setNomePastaRaiz(pasta.name);
    } catch (erro) {
      setErroPastaRaiz(erro instanceof Error ? erro.message : String(erro));
    }
  };

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
      <main style={{ flex: 1, overflow: 'auto', background: '#2d3748', display: 'flex', flexDirection: 'column' }}>
        <BannerSessao
          nomePastaRaiz={nomePastaRaiz}
          erro={erroPastaRaiz}
          onSelecionar={aoSelecionarPastaRaiz}
        />
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {ferramentaAtiva === 'movel' && <VisualizadorDeMovel />}
          {ferramentaAtiva === 'comodo' && <ValidadorDeComodo />}
          {ferramentaAtiva === 'cena' && <ProoferDeCena />}
          {ferramentaAtiva === 'personagem' && <EditorDePersonagem pastaRaizSelecionada={nomePastaRaiz !== undefined} />}
          {ferramentaAtiva === 'eventos' && <GrafoDeEventos />}
        </div>
      </main>
    </div>
  );
}

type PropsBannerSessao = {
  readonly nomePastaRaiz: string | undefined;
  readonly erro: string | undefined;
  readonly onSelecionar: () => void;
};

function BannerSessao({ nomePastaRaiz, erro, onSelecionar }: PropsBannerSessao) {
  const conectado = nomePastaRaiz !== undefined;

  return (
    <div style={{
      flexShrink: 0,
      padding: '0.65rem 1rem',
      background: conectado ? '#123524' : '#241f12',
      borderBottom: `1px solid ${conectado ? '#276749' : '#744210'}`,
      color: conectado ? '#c6f6d5' : '#fbd38d',
      display: 'flex',
      justifyContent: 'space-between',
      gap: '1rem',
      alignItems: 'center',
      fontSize: 12,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {!SUPORTA_FILE_SYSTEM_ACCESS ? (
          <span>File System Access API nao suportada - use Chrome/Edge. Download ZIP disponivel.</span>
        ) : conectado ? (
          <span>Conectado: .../{nomePastaRaiz}</span>
        ) : (
          <>
            <span>Pasta do projeto nao selecionada.</span>
            <span>Selecione para habilitar "Salvar no Projeto".</span>
          </>
        )}
        {erro !== undefined && <span style={{ color: '#fc8181' }}>{erro}</span>}
      </div>
      {SUPORTA_FILE_SYSTEM_ACCESS && (
        <button
          onClick={onSelecionar}
          style={{
            background: conectado ? '#2f855a' : '#d69e2e',
            color: '#ffffff',
            border: 'none',
            borderRadius: 4,
            padding: '0.35rem 0.75rem',
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
          }}
        >
          {conectado ? 'Trocar pasta' : 'Selecionar pasta'}
        </button>
      )}
    </div>
  );
}
