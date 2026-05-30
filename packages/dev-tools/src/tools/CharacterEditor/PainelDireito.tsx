import { SLOTS_ORDENADOS, anchorEfetivo, direcaoDoSlot, slotDisponivel, type ParteCarregada } from './types';

export type PainelDireitoProps = {
  readonly parte: ParteCarregada | undefined;
  readonly slotAtual: number;
  readonly onSlotChange: (slot: number) => void;
  readonly onAnchorChange: (slot: number, x: number, y: number) => void;
  readonly playingWalk: boolean;
  readonly onTogglePlay: () => void;
  readonly velocidade: number;
  readonly onVelocidadeChange: (v: number) => void;
  readonly onSalvar: () => void;
  readonly statusSalvar: string | undefined;
};

export function PainelDireito({
  parte,
  slotAtual,
  onSlotChange,
  onAnchorChange,
  playingWalk,
  onTogglePlay,
  velocidade,
  onVelocidadeChange,
  onSalvar,
  statusSalvar,
}: PainelDireitoProps) {
  if (parte === undefined) {
    return (
      <section style={estiloPainel}>
        <div style={{ color: '#718096', fontSize: 13 }}>Nenhuma parte selecionada.</div>
      </section>
    );
  }

  const ef = anchorEfetivo(parte, slotAtual);
  const meta = parte.metadata;
  const navegar = (delta: number) => {
    const proximo = ((slotAtual - 1 + delta + 8) % 8) + 1;
    onSlotChange(proximo);
  };

  return (
    <section style={estiloPainel}>
      {/* 5a — info */}
      <div style={estiloSecao}>
        <strong style={{ color: '#90cdf4', fontSize: 15 }}>{meta.partId}</strong>
        <Campo rotulo="tipo" valor={meta.tipo} />
        <Campo rotulo="canvas" valor={`${meta.canvasLargura}×${meta.canvasAltura}px`} />
        <Campo rotulo="slots" valor={meta.direcoes.join(', ')} />
      </div>

      {/* 5c — navegador de slots */}
      <div style={estiloSecao}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={estiloRotulo}>Rotação</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button style={estiloBotaoNav} onClick={() => navegar(-1)} title="Anterior">↺</button>
            <button style={estiloBotaoNav} onClick={() => navegar(1)} title="Próximo">↻</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
          {SLOTS_ORDENADOS.map(({ direcao, slot }) => {
            const url = parte.spritesPorSlot[slot];
            const atual = slot === slotAtual;
            const disp = slotDisponivel(parte, slot);
            return (
              <div
                key={slot}
                onClick={() => onSlotChange(slot)}
                style={estiloThumb(atual)}
                title={`${direcao} (slot ${slot})${disp ? '' : ' — indisponível'}`}
              >
                {url !== undefined ? (
                  <img
                    src={url}
                    alt={direcao}
                    style={{ width: '100%', height: 40, objectFit: 'contain', imageRendering: 'pixelated' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.15'; }}
                  />
                ) : (
                  <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5568', fontSize: 10 }}>—</div>
                )}
                <div style={{ fontSize: 10, textAlign: 'center', color: disp ? '#cbd5e0' : '#4a5568' }}>{direcao}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5b — editor de anchor */}
      <div style={estiloSecao}>
        <span style={estiloRotulo}>Anchor (slot {slotAtual} · {direcaoDoSlot(slotAtual)})</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <label style={estiloCampoNum}>
            X
            <input
              type="number"
              value={ef.x}
              onChange={(e) => onAnchorChange(slotAtual, Number(e.target.value), ef.y)}
              style={estiloInput}
            />
          </label>
          <label style={estiloCampoNum}>
            Y
            <input
              type="number"
              value={ef.y}
              onChange={(e) => onAnchorChange(slotAtual, ef.x, Number(e.target.value))}
              style={estiloInput}
            />
          </label>
        </div>
        <span style={{ fontSize: 11, color: '#718096' }}>Também arrastável no canvas (modo Sprite)</span>
      </div>

      {/* 5d — walk cycle */}
      <div style={estiloSecao}>
        <button onClick={onTogglePlay} style={playingWalk ? estiloBotaoStop : estiloBotaoPlay}>
          {playingWalk ? '⏹ Stop' : '▶ Play walk cycle'}
        </button>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 11, color: '#a0aec0' }}>
          Velocidade: {velocidade}ms/frame
          <input
            type="range"
            min={100}
            max={600}
            step={20}
            value={velocidade}
            onChange={(e) => onVelocidadeChange(Number(e.target.value))}
          />
        </label>
      </div>

      {/* 5e — salvar */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <button onClick={onSalvar} style={estiloBotaoSalvar}>💾 Salvar metadata</button>
        {statusSalvar !== undefined && (
          <span style={{ fontSize: 11, color: statusSalvar.startsWith('Erro') ? '#fc8181' : '#9ae6b4' }}>
            {statusSalvar}
          </span>
        )}
      </div>
    </section>
  );
}

function Campo({ rotulo, valor }: { readonly rotulo: string; readonly valor: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: '0.4rem', fontSize: 12 }}>
      <span style={{ color: '#718096' }}>{rotulo}</span>
      <span style={{ color: '#e2e8f0', wordBreak: 'break-word' }}>{valor}</span>
    </div>
  );
}

const estiloPainel: React.CSSProperties = {
  background: '#1a202c',
  border: '1px solid #4a5568',
  borderRadius: 6,
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  color: '#e2e8f0',
  minHeight: 0,
  overflowY: 'auto',
};

const estiloSecao: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const estiloRotulo: React.CSSProperties = { color: '#a0aec0', fontSize: 12 };

function estiloThumb(atual: boolean): React.CSSProperties {
  return {
    border: atual ? '2px solid #63b3ed' : '1px solid #4a5568',
    borderRadius: 4,
    cursor: 'pointer',
    padding: 2,
    background: atual ? '#2a3a4d' : '#11161f',
  };
}

const estiloCampoNum: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  fontSize: 11,
  color: '#a0aec0',
  flex: 1,
};

const estiloInput: React.CSSProperties = {
  background: '#11161f',
  color: '#e2e8f0',
  border: '1px solid #4a5568',
  borderRadius: 4,
  padding: '0.3rem',
  fontFamily: 'monospace',
};

const estiloBotaoNav: React.CSSProperties = {
  background: '#2d3748',
  color: '#90cdf4',
  border: '1px solid #4a5568',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 14,
  padding: '0.1rem 0.6rem',
};

const estiloBotaoPlay: React.CSSProperties = {
  background: '#3182ce',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '0.45rem',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'monospace',
};

const estiloBotaoStop: React.CSSProperties = { ...estiloBotaoPlay, background: '#c53030' };

const estiloBotaoSalvar: React.CSSProperties = {
  background: '#2f855a',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '0.5rem',
  cursor: 'pointer',
  fontSize: 13,
  fontFamily: 'monospace',
};
