import { useEffect, useMemo, useState } from 'react';
import { useCharacterParts } from './useCharacterParts';
import { CanvasPersonagem } from './CanvasPersonagem';
import { PainelEsquerdo } from './PainelEsquerdo';
import { PainelDireito } from './PainelDireito';
import { direcaoDoSlot, type ModoCanvas, type ParteCarregada, type Ponto } from './types';

type PropsEditor = {
  // Mantido por compatibilidade com App.tsx (a gravação usa a rota de dev-tools).
  readonly pastaRaizSelecionada?: boolean;
};

type OverridesPorParte = Record<string, Record<number, Ponto>>;

const MODOS: ReadonlyArray<{ readonly id: ModoCanvas; readonly rotulo: string }> = [
  { id: 'sprite', rotulo: '🖼 Sprite' },
  { id: 'composicao', rotulo: '👤 Composição' },
  { id: 'comodo', rotulo: '🏠 Cômodo' },
];

/** Aplica overrides de anchor (por caminho) a uma parte carregada. */
function comOverrides(parte: ParteCarregada, overrides: OverridesPorParte): ParteCarregada {
  const o = overrides[parte.caminho];
  return o === undefined ? parte : { ...parte, anchorOverrides: o };
}

export function EditorDePersonagem(_props: PropsEditor) {
  const { partes, carregando, recarregar } = useCharacterParts();

  const [selCaminho, setSelCaminho] = useState<string | undefined>();
  const [camadasCaminhos, setCamadasCaminhos] = useState<readonly string[]>([]);
  const [overrides, setOverrides] = useState<OverridesPorParte>({});
  const [slotAtual, setSlotAtual] = useState(5); // S (frente)
  const [modo, setModo] = useState<ModoCanvas>('sprite');
  const [playingWalk, setPlayingWalk] = useState(false);
  const [velocidade, setVelocidade] = useState(300);
  const [statusSalvar, setStatusSalvar] = useState<string | undefined>();

  // Seleciona automaticamente — preferindo o corpo_base de referência.
  useEffect(() => {
    if (partes.length > 0 && selCaminho === undefined) {
      const inicial = partes.find((p) => p.metadata.partId === 'adulto_neutro') ?? partes[0];
      setSelCaminho(inicial?.caminho);
    }
  }, [partes, selCaminho]);

  // Walk cycle: avança o slot em loop.
  useEffect(() => {
    if (!playingWalk) return;
    const id = setInterval(() => setSlotAtual((s) => (s === 8 ? 1 : s + 1)), velocidade);
    return () => clearInterval(id);
  }, [playingWalk, velocidade]);

  const parteSelecionada = useMemo(() => {
    const base = partes.find((p) => p.caminho === selCaminho);
    return base === undefined ? undefined : comOverrides(base, overrides);
  }, [partes, selCaminho, overrides]);

  const camadasAtivas = useMemo(
    () => camadasCaminhos
      .map((c) => partes.find((p) => p.caminho === c))
      .filter((p): p is ParteCarregada => p !== undefined)
      .map((p) => comOverrides(p, overrides)),
    [camadasCaminhos, partes, overrides],
  );

  const aoAlterarAnchor = (slot: number, x: number, y: number) => {
    if (selCaminho === undefined) return;
    setOverrides((atual) => ({
      ...atual,
      [selCaminho]: { ...(atual[selCaminho] ?? {}), [slot]: { x, y } },
    }));
  };

  const aoToggleCamada = (parte: ParteCarregada) => {
    setCamadasCaminhos((atual) =>
      atual.includes(parte.caminho)
        ? atual.filter((c) => c !== parte.caminho)
        : [...atual, parte.caminho],
    );
  };

  const aoSalvar = () => { void salvar(); };

  const salvar = async () => {
    if (parteSelecionada === undefined) return;
    setStatusSalvar('Salvando...');
    const meta = parteSelecionada.metadata;

    const offsetsAtuais: Record<string, { x: number; y: number }> = { ...(meta.offsetsPorDirecao ?? {}) };
    for (const [slotStr, ponto] of Object.entries(parteSelecionada.anchorOverrides)) {
      if (ponto === undefined) continue;
      const dir = direcaoDoSlot(Number(slotStr));
      offsetsAtuais[dir] = { x: ponto.x - meta.anchorPixelX, y: ponto.y - meta.anchorPixelY };
    }
    const metadataAtualizado = Object.keys(offsetsAtuais).length > 0
      ? { ...meta, offsetsPorDirecao: offsetsAtuais }
      : meta;

    const [tipo, partId] = parteSelecionada.caminho.split('/');
    if (tipo === undefined || partId === undefined) { setStatusSalvar('Erro: caminho inválido'); return; }

    try {
      const res = await fetch('/__devtools/character/update-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, partId, metadata: metadataAtualizado }),
      });
      const dados = (await res.json().catch(() => ({}))) as { ok?: boolean; erro?: string };
      if (res.ok && dados.ok === true) { setStatusSalvar('Salvo ✓'); return; }
      throw new Error(dados.erro ?? `HTTP ${res.status}`);
    } catch {
      // Fallback: download do metadata.json
      const blob = new Blob([JSON.stringify(metadataAtualizado, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'metadata.json';
      a.click();
      URL.revokeObjectURL(url);
      setStatusSalvar('Erro no servidor — baixado metadata.json');
    }
  };

  if (carregando) {
    return <div style={{ color: '#a0aec0', padding: '1rem', fontFamily: 'monospace' }}>Carregando partes...</div>;
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      gap: '0.75rem',
      padding: '0.75rem',
      boxSizing: 'border-box',
      fontFamily: 'monospace',
      minHeight: 0,
    }}>
      <div style={{ width: 240, flex: '0 0 240px', minHeight: 0 }}>
        <PainelEsquerdo
          partes={partes}
          parteSelecionada={parteSelecionada}
          camadasAtivas={camadasAtivas}
          onSelecionarParte={(p) => setSelCaminho(p.caminho)}
          onToggleCamada={aoToggleCamada}
          onRecarregar={recarregar}
        />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {MODOS.map(({ id, rotulo }) => (
            <button
              key={id}
              onClick={() => setModo(id)}
              style={{
                background: modo === id ? '#3182ce' : '#2d3748',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                padding: '0.35rem 0.9rem',
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: 'monospace',
              }}
            >
              {rotulo}
            </button>
          ))}
        </div>
        <CanvasPersonagem
          partePrincipal={parteSelecionada}
          camadasAtivas={camadasAtivas}
          slotAtual={slotAtual}
          modo={modo}
          onAnchorChange={aoAlterarAnchor}
        />
      </div>

      <div style={{ width: 320, flex: '0 0 320px', minHeight: 0 }}>
        <PainelDireito
          parte={parteSelecionada}
          slotAtual={slotAtual}
          onSlotChange={setSlotAtual}
          onAnchorChange={aoAlterarAnchor}
          playingWalk={playingWalk}
          onTogglePlay={() => setPlayingWalk((p) => !p)}
          velocidade={velocidade}
          onVelocidadeChange={setVelocidade}
          onSalvar={aoSalvar}
          statusSalvar={statusSalvar}
        />
      </div>
    </div>
  );
}
