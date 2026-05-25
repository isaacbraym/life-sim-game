import React from 'react';

type LocalDemo = {
  readonly id: string;
  readonly nome: string;
  readonly icone: string;
  readonly comodoEntrada: string;
};

export type WorldMapScreenProps = {
  readonly onLocalEscolhido: (localId: string, comodoId: string) => void;
};

const LOCAIS_DEMO: readonly LocalDemo[] = [
  { id: 'casa', nome: 'Casa', icone: '🏠', comodoEntrada: 'quarto_simples' },
  { id: 'escola', nome: 'Escola', icone: '🏫', comodoEntrada: 'sala_de_aula' },
  { id: 'academia', nome: 'Academia', icone: '💪', comodoEntrada: 'area_musculacao' },
];

export function WorldMapScreen({ onLocalEscolhido }: WorldMapScreenProps): React.JSX.Element {
  return (
    <main style={estilos.tela}>
      <section style={estilos.conteudo} aria-label="Escolha de local">
        <h1 style={estilos.titulo}>Escolha um local</h1>
        <div style={estilos.grid}>
          {LOCAIS_DEMO.map((local) => (
            <button
              key={local.id}
              type="button"
              style={estilos.card}
              onClick={() => onLocalEscolhido(local.id, local.comodoEntrada)}
            >
              <span style={estilos.icone} aria-hidden="true">{local.icone}</span>
              <span style={estilos.nome}>{local.nome}</span>
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
  icone: {
    fontSize: 34,
    lineHeight: 1,
  },
  nome: {
    fontSize: 18,
    fontWeight: 700,
  },
} satisfies Record<string, React.CSSProperties>;
