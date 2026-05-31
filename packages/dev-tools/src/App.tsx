import { lazy, Suspense, useEffect, useState } from 'react';
import { VisualizadorDeMovel } from './tools/FurnitureViewer';
import { ValidadorDeComodo } from './tools/RoomValidator';
import { ProoferDeCena } from './tools/SceneProofer';
import { EditorDePersonagem } from './tools/CharacterEditor';
import { GrafoDeEventos } from './tools/EventGraph';
import { ErrorBoundary } from './shared/ErrorBoundary';
import { selecionarPastaRaiz, SUPORTA_FILE_SYSTEM_ACCESS } from './shared/ProjetoHandle';

const AnimationProofer = lazy(() => import('./tools/AnimationProofer'));

type Ferramenta = 'movel' | 'comodo' | 'cena' | 'personagem' | 'eventos' | 'animacao';

type DefFerramenta = {
  readonly id: Ferramenta;
  readonly rotulo: string;
  readonly icone: string;
  readonly badge: string;
  readonly corBadge: string;
};

const FERRAMENTAS: readonly DefFerramenta[] = [
  { id: 'movel', rotulo: 'Furniture Viewer', icone: '🪑', badge: '✓', corBadge: '#48bb78' },
  { id: 'comodo', rotulo: 'Room Validator', icone: '🏠', badge: '✓', corBadge: '#48bb78' },
  { id: 'personagem', rotulo: 'Character Editor', icone: '👤', badge: '✓', corBadge: '#48bb78' },
  { id: 'cena', rotulo: 'Scene Proofer', icone: '🎬', badge: '✓', corBadge: '#48bb78' },
  { id: 'eventos', rotulo: 'Event Graph', icone: '📊', badge: '✓', corBadge: '#48bb78' },
  { id: 'animacao', rotulo: 'Animation Proofer', icone: 'AP', badge: 'OK', corBadge: '#48bb78' },
];

const NOMES_FERRAMENTA: Record<Ferramenta, string> = {
  movel: 'Furniture Viewer',
  comodo: 'Room Validator',
  cena: 'Scene Proofer',
  personagem: 'Character Editor',
  eventos: 'Event Graph',
  animacao: 'Animation Proofer',
};

// Atalhos Ctrl+1..6
const ATALHOS: Record<string, Ferramenta> = {
  '1': 'movel', '2': 'comodo', '3': 'personagem', '4': 'cena', '5': 'eventos', '6': 'animacao',
};

const estiloNavBar: React.CSSProperties = {
  width: 200,
  minWidth: 200,
  background: '#1a1a2e',
  padding: '1rem 0.75rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
  borderRight: '1px solid #4a5568',
};

export function App() {
  const [ferramentaAtiva, setFerramentaAtiva] = useState<Ferramenta>('movel');
  const [nomePastaRaiz, setNomePastaRaiz] = useState<string | undefined>();
  const [erroPastaRaiz, setErroPastaRaiz] = useState<string | undefined>();

  // Título do browser por ferramenta (6c)
  useEffect(() => {
    document.title = `${NOMES_FERRAMENTA[ferramentaAtiva]} — Vida 2.5D Dev Tools`;
  }, [ferramentaAtiva]);

  // Atalhos globais Ctrl+1..6 (6d)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;
      const ferramenta = ATALHOS[e.key];
      if (ferramenta !== undefined) {
        e.preventDefault();
        setFerramentaAtiva(ferramenta);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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
        <div style={{ padding: '0 0.4rem 0.6rem' }}>
          <div style={{ color: '#90cdf4', fontSize: 14, fontWeight: 'bold' }}>🎮 Vida 2.5D</div>
          <div style={{ color: '#718096', fontSize: 11 }}>Dev Tools v1.12</div>
        </div>

        <div style={{ color: '#4a5568', fontSize: 10, padding: '0.3rem 0.4rem', letterSpacing: 1 }}>─── FERRAMENTAS</div>
        {FERRAMENTAS.map(({ id, rotulo, icone, badge, corBadge }) => {
          const ativo = ferramentaAtiva === id;
          return (
            <button key={id} onClick={() => setFerramentaAtiva(id)} style={estiloBotao(ativo)}>
              <span style={{ fontSize: 14 }}>{icone}</span>
              <span style={{ flex: 1, textAlign: 'left' }}>{rotulo}</span>
              <span style={{ color: corBadge, fontSize: 11 }}>{badge}</span>
            </button>
          );
        })}

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4, padding: '0.5rem 0.4rem 0' }}>
          <div style={{ color: '#4a5568', fontSize: 10, letterSpacing: 1 }}>─── STATUS</div>
          <div style={{ fontSize: 10, color: '#68d391' }}>● dev:5174</div>
          <div style={{ fontSize: 10, color: '#4a5568' }}>
            v1.12 · Sprint 1.12<br />
            main · Vida 2.5D
          </div>
        </div>
      </nav>

      <main style={{ flex: 1, overflow: 'auto', background: '#2d3748', display: 'flex', flexDirection: 'column' }}>
        <BannerSessao
          nomePastaRaiz={nomePastaRaiz}
          erro={erroPastaRaiz}
          onSelecionar={aoSelecionarPastaRaiz}
        />
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {ferramentaAtiva === 'movel' && (
            <ErrorBoundary nomeFerramenta="Furniture Viewer"><VisualizadorDeMovel /></ErrorBoundary>
          )}
          {ferramentaAtiva === 'comodo' && (
            <ErrorBoundary nomeFerramenta="Room Validator"><ValidadorDeComodo /></ErrorBoundary>
          )}
          {ferramentaAtiva === 'cena' && (
            <ErrorBoundary nomeFerramenta="Scene Proofer"><ProoferDeCena /></ErrorBoundary>
          )}
          {ferramentaAtiva === 'personagem' && (
            <ErrorBoundary nomeFerramenta="Character Editor">
              <EditorDePersonagem pastaRaizSelecionada={nomePastaRaiz !== undefined} />
            </ErrorBoundary>
          )}
          {ferramentaAtiva === 'eventos' && (
            <ErrorBoundary nomeFerramenta="Event Graph"><GrafoDeEventos /></ErrorBoundary>
          )}
          {ferramentaAtiva === 'animacao' && (
            <ErrorBoundary nomeFerramenta="Animation Proofer">
              <Suspense fallback={<div style={{ padding: '1rem', color: '#a0aec0' }}>Carregando Animation Proofer...</div>}>
                <AnimationProofer />
              </Suspense>
            </ErrorBoundary>
          )}
        </div>
      </main>
    </div>
  );
}

function estiloBotao(ativo: boolean): React.CSSProperties {
  return {
    background: ativo ? '#2d3748' : 'transparent',
    color: ativo ? '#90cdf4' : '#a0aec0',
    border: ativo ? '1px solid #4a5568' : '1px solid transparent',
    padding: '0.45rem 0.6rem',
    cursor: 'pointer',
    borderRadius: 4,
    fontSize: 12.5,
    fontFamily: 'monospace',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'background 0.15s',
  };
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
