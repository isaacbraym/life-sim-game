import { useEffect, useMemo, useRef, useState } from 'react';
import { Application } from 'pixi.js';
import {
  ManifestoPersonagemTeste as SchemaManifesto,
  type ManifestoPersonagemTeste,
  type VariantePersonagemTeste,
} from '@core/schemas/testCharacter';
import type { DirecaoVisual } from '@core/schemas/direction';
import { FrameSequenceAnimator } from '@game/stage/FrameSequenceAnimator';

const DIRECOES: readonly DirecaoVisual[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const URL_MANIFESTO = '/content/test-characters/marnie/manifest.json';
const ESCALA = 4;

export function VisualizadorMarnie() {
  const [manifesto, setManifesto] = useState<ManifestoPersonagemTeste | undefined>();
  const [mensagem, setMensagem] = useState('Carregando manifesto...');
  const [varianteId, setVarianteId] = useState<string | undefined>();
  const [clipId, setClipId] = useState<string | undefined>();
  const [direcao, setDirecao] = useState<DirecaoVisual>('S');
  const [pausado, setPausado] = useState(false);
  const [appPronto, setAppPronto] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | undefined>();
  const animatorRef = useRef<FrameSequenceAnimator | undefined>();

  const variante: VariantePersonagemTeste | undefined = useMemo(
    () => manifesto?.variantes.find((v) => v.varianteId === varianteId),
    [manifesto, varianteId],
  );

  // Carrega o manifesto uma vez.
  useEffect(() => {
    let ativo = true;
    void (async () => {
      try {
        const res = await fetch(URL_MANIFESTO);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const dados: unknown = await res.json();
        const parsed = SchemaManifesto.safeParse(dados);
        if (!ativo) return;
        if (!parsed.success) {
          setMensagem(`Manifesto inválido: ${parsed.error.issues[0]?.message ?? 'schema'}`);
          return;
        }
        setManifesto(parsed.data);
        const primeira = parsed.data.variantes[0];
        setVarianteId(primeira?.varianteId);
        setClipId(primeira?.clips[0]?.clipId);
        setMensagem('');
      } catch (erro) {
        if (ativo) {
          setMensagem(
            `Falha ao carregar ${URL_MANIFESTO}: ${erro instanceof Error ? erro.message : String(erro)}. `
            + 'Rode: python scripts/blender/bake_marnie.py',
          );
        }
      }
    })();
    return () => { ativo = false; };
  }, []);

  // Inicializa a Application PixiJS uma vez.
  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return undefined;
    let cancelado = false;
    let appLocal: Application | undefined;
    const app = new Application();

    void (async () => {
      await app.init({
        width: 64 * ESCALA,
        height: 96 * ESCALA,
        backgroundColor: 0x2d2f38,
        antialias: false,
      });
      // StrictMode pode desmontar antes do init resolver: aborta e destrói.
      if (cancelado) { app.destroy(); return; }
      appLocal = app;
      appRef.current = app;
      container.appendChild(app.canvas as HTMLCanvasElement);
      setAppPronto(true);
    })();

    return () => {
      cancelado = true;
      animatorRef.current?.destruir();
      animatorRef.current = undefined;
      appRef.current = undefined;
      setAppPronto(false);
      // Só toca o canvas/destroy se o init completou (evita acessar renderer nulo).
      if (appLocal !== undefined) {
        const canvas = appLocal.canvas as HTMLCanvasElement | undefined;
        if (canvas?.parentNode) canvas.parentNode.removeChild(canvas);
        appLocal.destroy();
      }
    };
  }, []);

  // (Re)cria o animator quando a variante muda (ou quando o app fica pronto).
  useEffect(() => {
    const app = appRef.current;
    if (!appPronto || app === undefined || manifesto === undefined || variante === undefined) return;

    animatorRef.current?.destruir();
    const animator = new FrameSequenceAnimator(
      manifesto.personagemId, variante.varianteId, manifesto.canvas, variante.clips,
    );
    const cont = animator.obterContainer();
    cont.scale.set(ESCALA);
    cont.position.set((manifesto.canvas.largura / 2) * ESCALA, manifesto.canvas.anchorY * ESCALA);
    app.stage.addChild(cont);
    animatorRef.current = animator;

    return () => {
      animator.destruir();
      if (animatorRef.current === animator) animatorRef.current = undefined;
    };
  }, [manifesto, variante, appPronto]);

  // Reproduz o clip/direção selecionados.
  useEffect(() => {
    const animator = animatorRef.current;
    if (animator === undefined || clipId === undefined) return;
    void animator.reproduzir(clipId, direcao).then((ok) => {
      if (!ok) setMensagem(`Sem frames para ${clipId}/${direcao}.`);
    });
  }, [clipId, direcao, variante]);

  // Pausa/retoma.
  useEffect(() => {
    const animator = animatorRef.current;
    if (animator === undefined) return;
    if (pausado) animator.pausar();
    else animator.retomar();
  }, [pausado]);

  return (
    <div style={estilos.raiz}>
      <section style={estilos.colunaEsquerda}>
        <h2 style={estilos.titulo}>Personagem de teste</h2>
        {manifesto !== undefined && (
          <>
            <div style={estilos.bloco}>
              <div style={estilos.rotulo}>Variante</div>
              {manifesto.variantes.map((v) => (
                <button
                  key={v.varianteId}
                  type="button"
                  onClick={() => { setVarianteId(v.varianteId); setClipId(v.clips[0]?.clipId); }}
                  style={estiloItem(v.varianteId === varianteId)}
                >
                  {v.nome} <span style={estilos.tagPapel}>{v.papel}</span>
                </button>
              ))}
            </div>

            <div style={estilos.bloco}>
              <div style={estilos.rotulo}>Animações</div>
              {variante?.clips.map((c) => (
                <button
                  key={c.clipId}
                  type="button"
                  onClick={() => setClipId(c.clipId)}
                  style={estiloItem(c.clipId === clipId)}
                >
                  {c.clipId}
                  <span style={estilos.detalhe}>{c.frames}f · {c.fps}fps · {c.loop ? '🔄' : '✗'}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {mensagem !== '' && <p style={estilos.mensagem}>{mensagem}</p>}
      </section>

      <section style={estilos.colunaCentral}>
        <h2 style={estilos.titulo}>Preview</h2>
        <div style={estilos.preview} ref={containerRef} />

        <div style={estilos.grupoDirecoes}>
          {DIRECOES.map((d) => (
            <button key={d} type="button" onClick={() => setDirecao(d)} style={estiloBotao(d === direcao)}>
              {d}
            </button>
          ))}
        </div>
        <div style={estilos.grupoBotoes}>
          <button type="button" onClick={() => setPausado(false)} style={estiloBotao(false)}>▶ Play</button>
          <button type="button" onClick={() => setPausado(true)} style={estiloBotao(false)}>⏸ Pause</button>
        </div>
        <div style={estilos.info}>
          {variante?.nome} · {clipId} · {direcao}
        </div>
      </section>
    </div>
  );
}

function estiloBotao(ativo: boolean): React.CSSProperties {
  return {
    background: ativo ? '#3182ce' : '#2d3748',
    color: '#f7fafc',
    border: ativo ? '1px solid #90cdf4' : '1px solid #4a5568',
    borderRadius: 4,
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: 12,
    padding: '0.4rem 0.6rem',
  };
}

function estiloItem(ativo: boolean): React.CSSProperties {
  return {
    background: ativo ? '#1e3a5f' : '#202938',
    border: ativo ? '1px solid #63b3ed' : '1px solid #4a5568',
    borderRadius: 6,
    color: '#e2e8f0',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    gap: 6,
    fontFamily: 'monospace',
    fontSize: 12.5,
    padding: '0.5rem 0.6rem',
    textAlign: 'left',
  };
}

const estilos: Record<string, React.CSSProperties> = {
  raiz: {
    display: 'grid',
    gridTemplateColumns: '260px 1fr',
    height: '100%',
    minHeight: 0,
    background: '#2d3748',
    color: '#e2e8f0',
    fontFamily: 'monospace',
  },
  colunaEsquerda: {
    borderRight: '1px solid #4a5568',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    minHeight: 0,
    overflow: 'auto',
    padding: '1rem',
  },
  colunaCentral: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    minHeight: 0,
    overflow: 'auto',
    padding: '1rem',
  },
  titulo: { color: '#90cdf4', fontSize: 16, margin: 0 },
  bloco: { display: 'flex', flexDirection: 'column', gap: 6 },
  rotulo: { color: '#a0aec0', fontSize: 11, letterSpacing: 1 },
  tagPapel: { color: '#fbd38d', fontSize: 10 },
  detalhe: { color: '#a0aec0', fontSize: 10 },
  mensagem: { color: '#fbd38d', fontSize: 12, lineHeight: 1.4 },
  preview: {
    background: '#1a1a1a',
    border: '1px solid #4a5568',
    borderRadius: 6,
    lineHeight: 0,
    imageRendering: 'pixelated',
  },
  grupoDirecoes: { display: 'grid', gap: 6, gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', width: '100%', maxWidth: 420 },
  grupoBotoes: { display: 'flex', gap: 8 },
  info: { color: '#fbd38d', fontSize: 12 },
};

export default VisualizadorMarnie;
