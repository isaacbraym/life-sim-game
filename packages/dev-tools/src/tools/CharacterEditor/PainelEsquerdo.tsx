import { ORDEM_CAMADAS } from '@core/schemas/characterPart';
import type { ParteCarregada } from './types';

export type PainelEsquerdoProps = {
  readonly partes: readonly ParteCarregada[];
  readonly parteSelecionada: ParteCarregada | undefined;
  readonly camadasAtivas: readonly ParteCarregada[];
  readonly onSelecionarParte: (parte: ParteCarregada) => void;
  readonly onToggleCamada: (parte: ParteCarregada) => void;
  readonly onRecarregar: () => void;
};

function agruparPorTipo(
  partes: readonly ParteCarregada[],
): ReadonlyArray<readonly [string, readonly ParteCarregada[]]> {
  const mapa = new Map<string, ParteCarregada[]>();
  for (const parte of partes) {
    const lista = mapa.get(parte.metadata.tipo) ?? [];
    lista.push(parte);
    mapa.set(parte.metadata.tipo, lista);
  }
  // ordena os tipos pela ordem de camadas canônica
  return [...mapa.entries()].sort(
    ([a], [b]) => ORDEM_CAMADAS.indexOf(a as never) - ORDEM_CAMADAS.indexOf(b as never),
  );
}

export function PainelEsquerdo({
  partes,
  parteSelecionada,
  camadasAtivas,
  onSelecionarParte,
  onToggleCamada,
  onRecarregar,
}: PainelEsquerdoProps) {
  const grupos = agruparPorTipo(partes);
  const ativos = new Set(camadasAtivas.map((c) => c.caminho));

  return (
    <section style={estiloPainel}>
      <h2 style={estiloTitulo}>Partes</h2>

      {partes.length === 0 && (
        <div style={{ color: '#a0aec0', fontSize: 12 }}>
          Nenhuma parte encontrada em content/character-parts/.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', overflowY: 'auto' }}>
        {grupos.map(([tipo, lista]) => (
          <div key={tipo} style={estiloGrupo}>
            <span style={estiloRotuloTipo}>{tipo}</span>
            {lista.map((parte) => {
              const selecionada = parteSelecionada?.caminho === parte.caminho;
              const ativa = ativos.has(parte.caminho);
              return (
                <div key={parte.caminho} style={estiloLinhaParte(selecionada)}>
                  <input
                    type="checkbox"
                    checked={ativa}
                    onChange={() => onToggleCamada(parte)}
                    title="Incluir na composição"
                  />
                  <button
                    onClick={() => onSelecionarParte(parte)}
                    style={estiloBotaoParte(selecionada)}
                    title={parte.caminho}
                  >
                    {parte.metadata.partId}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <button onClick={onRecarregar} style={estiloBotaoRecarregar}>
        ↺ Recarregar partes
      </button>
    </section>
  );
}

const estiloPainel: React.CSSProperties = {
  background: '#1a202c',
  border: '1px solid #4a5568',
  borderRadius: 6,
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
  minHeight: 0,
  overflow: 'hidden',
};

const estiloTitulo: React.CSSProperties = { margin: 0, color: '#90cdf4', fontSize: 16 };

const estiloGrupo: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.25rem' };

const estiloRotuloTipo: React.CSSProperties = {
  color: '#718096',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

function estiloLinhaParte(selecionada: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    background: selecionada ? '#2d3748' : 'transparent',
    borderRadius: 4,
    padding: '0.1rem 0.25rem',
  };
}

function estiloBotaoParte(selecionada: boolean): React.CSSProperties {
  return {
    flex: 1,
    background: 'transparent',
    color: selecionada ? '#90cdf4' : '#cbd5e0',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: 'monospace',
    padding: '0.25rem',
  };
}

const estiloBotaoRecarregar: React.CSSProperties = {
  marginTop: 'auto',
  background: '#2d3748',
  color: '#a0aec0',
  border: '1px solid #4a5568',
  borderRadius: 4,
  padding: '0.4rem',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'monospace',
};
