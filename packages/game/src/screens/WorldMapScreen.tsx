import React from 'react';
import { listarLocaisDisponiveis } from '@game/content/locationCatalog';

export type WorldMapScreenProps = {
  readonly onLocalEscolhido: (localId: string, comodoId: string) => void;
};

export function WorldMapScreen({ onLocalEscolhido }: WorldMapScreenProps): React.JSX.Element {
  const locais = listarLocaisDisponiveis();

  return (
    <main style={estilos.tela}>
      <section style={estilos.conteudo} aria-label="Escolha de local">
        <h1 style={estilos.titulo}>Escolha um local</h1>
        <div style={estilos.grid}>
          {locais.map((local) => (
            <button
              key={local.id}
              type="button"
              style={local.disponivel ? estilos.card : { ...estilos.card, ...estilos.cardDesabilitado }}
              disabled={!local.disponivel}
              onClick={() => onLocalEscolhido(local.id, local.comodoEntrada)}
            >
              <span style={estilos.icone} aria-hidden="true">{local.icone}</span>
              <span style={estilos.nome}>{local.nome}</span>
              {!local.disponivel && (
                <span style={estilos.status}>em breve</span>
              )}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

const estilos = {
  tela: {
    width: '100%',
    minHeight: '100%',
    display: 'grid',
    placeItems: 'center',
    padding: 24,
    background: '#16181f',
    color: '#f5f0e8',
  },
  conteudo: {
    width: 'min(720px, 100%)',
    display: 'grid',
    gap: 24,
    textAlign: 'center',
  },
  titulo: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 16,
  },
  card: {
    minHeight: 132,
    border: '1px solid rgba(255, 255, 255, 0.14)',
    borderRadius: 8,
    background: '#232733',
    color: '#f5f0e8',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    gap: 10,
    padding: 18,
    font: 'inherit',
  },
  cardDesabilitado: {
    cursor: 'not-allowed',
    opacity: 0.56,
  },
  icone: {
    fontSize: 34,
    lineHeight: 1,
  },
  nome: {
    fontSize: 18,
    fontWeight: 700,
  },
  status: {
    minHeight: 18,
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
} satisfies Record<string, React.CSSProperties>;

