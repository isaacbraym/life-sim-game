import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Application, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { z } from 'zod';
import { DirecaoVisual, type DirecaoVisual as TipoDirecaoVisual } from '@lifesim/core';
import { PixiCanvas } from '../../shared/PixiCanvas';
import { escreverArquivo, garantirPasta, obterPastaRaiz } from '../../shared/ProjetoHandle';

const DIRECOES_VISUAIS: readonly TipoDirecaoVisual[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

const CamadaPersonagem = z.enum([
  'sombra',
  'sapato',
  'calca',
  'corpo_base',
  'camisa',
  'acessorio_corpo',
  'cabelo_atras',
  'cabeca',
  'rosto',
  'cabelo_frente',
  'chapeu',
  'acessorio_mao',
]);

const CharacterPartMetadata = z.object({
  partId: z.string(),
  tipo: CamadaPersonagem,
  direcoes: z.array(DirecaoVisual).min(1),
  canvasLargura: z.number().int().positive(),
  canvasAltura: z.number().int().positive(),
  anchorPixelX: z.number().int(),
  anchorPixelY: z.number().int(),
  offsetsPorDirecao: z.record(
    z.string(),
    z.object({ x: z.number().int(), y: z.number().int() }),
  ).optional(),
  jointsDeEncaixe: z.array(z.string()).optional(),
  camada: CamadaPersonagem,
  era: z.string().optional(),
  tags: z.array(z.string()),
  variacao: z.string().optional(),
});

type CharacterPartMetadata = z.infer<typeof CharacterPartMetadata>;

type EstadoComposicao = {
  readonly parteCarregada: CharacterPartMetadata | undefined;
  readonly direcaoAtual: TipoDirecaoVisual;
  readonly spriteCarregado: HTMLImageElement | undefined;
  readonly mostrarJoints: boolean;
  readonly offsetX: number;
  readonly offsetY: number;
};

type PropsEditorDePersonagem = {
  readonly pastaRaizSelecionada: boolean;
};

const ANCHOR_PREVIEW = { x: 160, y: 304 } as const;

export function EditorDePersonagem({ pastaRaizSelecionada }: PropsEditorDePersonagem) {
  const [estado, setEstado] = useState<EstadoComposicao>({
    parteCarregada: undefined,
    direcaoAtual: 'S',
    spriteCarregado: undefined,
    mostrarJoints: true,
    offsetX: 0,
    offsetY: 0,
  });
  const [mensagem, setMensagem] = useState<string>('Carregue um metadata.json para iniciar.');
  const [erro, setErro] = useState<string | undefined>();
  const inputMetadataRef = useRef<HTMLInputElement>(null);
  const inputSpriteRef = useRef<HTMLInputElement>(null);
  const urlSpriteRef = useRef<string | undefined>();

  useEffect(() => () => {
    if (urlSpriteRef.current !== undefined) URL.revokeObjectURL(urlSpriteRef.current);
  }, []);

  const carregarMetadata = async (arquivo: File) => {
    setErro(undefined);
    const texto = await arquivo.text();
    const dados: unknown = JSON.parse(texto);
    const resultado = CharacterPartMetadata.safeParse(dados);
    if (!resultado.success) {
      const primeiroErro = resultado.error.issues[0];
      setErro(primeiroErro
        ? `${primeiroErro.path.join('.') || 'raiz'}: ${primeiroErro.message}`
        : 'Schema invalido');
      return;
    }

    const primeiraDirecao = resultado.data.direcoes[0] ?? 'S';
    setEstado((atual) => ({
      ...atual,
      parteCarregada: resultado.data,
      direcaoAtual: primeiraDirecao,
      spriteCarregado: undefined,
      offsetX: resultado.data.offsetsPorDirecao?.[primeiraDirecao]?.x ?? 0,
      offsetY: resultado.data.offsetsPorDirecao?.[primeiraDirecao]?.y ?? 0,
    }));
    setMensagem(`Metadata carregado: ${resultado.data.partId}. Carregue o sprite ${primeiraDirecao}.webp ou ${primeiraDirecao}.png.`);
  };

  const aoSelecionarMetadata = (evento: ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0];
    if (arquivo !== undefined) {
      void carregarMetadata(arquivo).catch((falha: unknown) => {
        setErro(falha instanceof Error ? falha.message : String(falha));
      });
    }
    evento.target.value = '';
  };

  const aoSelecionarSprite = (evento: ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0];
    if (arquivo === undefined) return;

    if (urlSpriteRef.current !== undefined) URL.revokeObjectURL(urlSpriteRef.current);
    const url = URL.createObjectURL(arquivo);
    urlSpriteRef.current = url;

    const imagem = new Image();
    imagem.onload = () => {
      setEstado((atual) => ({ ...atual, spriteCarregado: imagem }));
      setMensagem(`Sprite carregado: ${arquivo.name}`);
    };
    imagem.onerror = () => setErro(`Nao foi possivel carregar ${arquivo.name}`);
    imagem.src = url;
    evento.target.value = '';
  };

  const alterarDirecao = (direcao: TipoDirecaoVisual) => {
    setEstado((atual) => ({
      ...atual,
      direcaoAtual: direcao,
      spriteCarregado: undefined,
      offsetX: atual.parteCarregada?.offsetsPorDirecao?.[direcao]?.x ?? 0,
      offsetY: atual.parteCarregada?.offsetsPorDirecao?.[direcao]?.y ?? 0,
    }));
    setMensagem(`Direcao ${direcao} selecionada. Carregue ${direcao}.webp ou ${direcao}.png.`);
  };

  const salvarParte = async () => {
    const metadata = estado.parteCarregada;
    if (metadata === undefined) return;

    setErro(undefined);
    try {
      const raiz = obterPastaRaiz();
      const pasta = await garantirPasta(
        raiz,
        'content',
        'character-parts',
        metadata.tipo,
        metadata.partId,
      );
      await escreverArquivo(pasta, 'metadata.json', JSON.stringify(metadata, null, 2));
      setMensagem(`Salvo em content/character-parts/${metadata.tipo}/${metadata.partId}/metadata.json`);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : String(falha));
    }
  };

  return (
    <div style={{
      flex: 1,
      minHeight: 0,
      display: 'grid',
      gridTemplateColumns: '260px minmax(360px, 1fr) 320px',
      gap: '1rem',
      padding: '1rem',
      color: '#e2e8f0',
      overflow: 'auto',
    }}>
      <section style={estiloPainel}>
        <h2 style={estiloTitulo}>Character Proofer</h2>
        <button style={estiloBotaoPrimario} onClick={() => inputMetadataRef.current?.click()}>
          Carregar parte
        </button>
        <input ref={inputMetadataRef} type="file" accept=".json" onChange={aoSelecionarMetadata} style={{ display: 'none' }} />

        <button style={estiloBotaoPrimario} onClick={() => inputSpriteRef.current?.click()}>
          Carregar sprite
        </button>
        <input ref={inputSpriteRef} type="file" accept=".webp,.png" onChange={aoSelecionarSprite} style={{ display: 'none' }} />

        <div style={estiloGrupo}>
          <span style={estiloRotulo}>Direcao</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
            {DIRECOES_VISUAIS.map((direcao) => {
              const disponivel = estado.parteCarregada?.direcoes.includes(direcao) ?? false;
              const ativa = estado.direcaoAtual === direcao;
              return (
                <button
                  key={direcao}
                  disabled={!disponivel}
                  onClick={() => alterarDirecao(direcao)}
                  style={estiloBotaoDirecao(ativa, disponivel)}
                >
                  {direcao}
                </button>
              );
            })}
          </div>
        </div>

        <label style={{ ...estiloRotulo, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={estado.mostrarJoints}
            onChange={(evento) => setEstado((atual) => ({ ...atual, mostrarJoints: evento.target.checked }))}
          />
          Mostrar joints
        </label>

        <div style={{ fontSize: 12, color: erro !== undefined ? '#fc8181' : '#a0aec0', lineHeight: 1.5 }}>
          {erro ?? mensagem}
        </div>
      </section>

      <section style={{ ...estiloPainel, alignItems: 'center' }}>
        <PixiPreview estado={estado} />
        <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <ControleOffset
            rotulo="offsetX"
            valor={estado.offsetX}
            onAlterar={(valor) => setEstado((atual) => ({ ...atual, offsetX: valor }))}
          />
          <ControleOffset
            rotulo="offsetY"
            valor={estado.offsetY}
            onAlterar={(valor) => setEstado((atual) => ({ ...atual, offsetY: valor }))}
          />
          <button
            style={estiloBotaoSecundario}
            onClick={() => setEstado((atual) => ({ ...atual, offsetX: 0, offsetY: 0 }))}
          >
            Resetar offsets
          </button>
        </div>
      </section>

      <section style={estiloPainel}>
        <PainelInformacoes metadata={estado.parteCarregada} />
        <button
          disabled={!pastaRaizSelecionada || estado.parteCarregada === undefined}
          onClick={() => void salvarParte()}
          style={{
            ...estiloBotaoPrimario,
            opacity: pastaRaizSelecionada && estado.parteCarregada !== undefined ? 1 : 0.45,
            cursor: pastaRaizSelecionada && estado.parteCarregada !== undefined ? 'pointer' : 'not-allowed',
          }}
        >
          Salvar parte
        </button>
      </section>
    </div>
  );
}

function PixiPreview({ estado }: { readonly estado: EstadoComposicao }) {
  const appRef = useRef<Application | undefined>();
  const estadoRef = useRef(estado);

  useEffect(() => {
    estadoRef.current = estado;
  }, [estado]);

  const desenhar = useCallback((app: Application) => {
    renderizarPreview(app, estadoRef.current);
  }, []);

  const aoInicializar = useCallback((app: Application) => {
    appRef.current = app;
    desenhar(app);
  }, [desenhar]);

  useEffect(() => {
    if (appRef.current !== undefined) desenhar(appRef.current);
  }, [estado, desenhar]);

  return <PixiCanvas largura={320} altura={480} aoInicializar={aoInicializar} />;
}

function renderizarPreview(app: Application, estado: EstadoComposicao) {
  app.stage.removeChildren();

  desenharGradeDimetrica(app);

  const metadata = estado.parteCarregada;
  const imagem = estado.spriteCarregado;
  if (metadata !== undefined && imagem !== undefined) {
    const sprite = new Sprite(Texture.from(imagem));
    sprite.x = ANCHOR_PREVIEW.x - metadata.anchorPixelX + estado.offsetX;
    sprite.y = ANCHOR_PREVIEW.y - metadata.anchorPixelY + estado.offsetY;
    sprite.width = metadata.canvasLargura;
    sprite.height = metadata.canvasAltura;
    app.stage.addChild(sprite);
  }

  const anchor = new Graphics();
  anchor.circle(ANCHOR_PREVIEW.x + estado.offsetX, ANCHOR_PREVIEW.y + estado.offsetY, 3);
  anchor.fill({ color: 0xffd700, alpha: 1 });
  app.stage.addChild(anchor);

  if (metadata !== undefined && estado.mostrarJoints) {
    const joints = metadata.jointsDeEncaixe ?? [];
    joints.forEach((joint, indice) => {
      const x = ANCHOR_PREVIEW.x + estado.offsetX;
      const y = ANCHOR_PREVIEW.y - 66 + indice * 14 + estado.offsetY;
      const ponto = new Graphics();
      ponto.circle(x, y, 4);
      ponto.fill({ color: 0xffd700, alpha: 1 });
      ponto.stroke({ color: 0x1a202c, width: 1 });
      app.stage.addChild(ponto);

      const label = new Text({
        text: joint,
        style: { fill: '#fbd38d', fontSize: 10, fontFamily: 'monospace' },
      });
      label.x = x + 7;
      label.y = y - 7;
      app.stage.addChild(label);
    });
  }
}

function desenharGradeDimetrica(app: Application) {
  const grade = new Graphics();
  for (let ty = -2; ty <= 3; ty += 1) {
    for (let tx = -2; tx <= 3; tx += 1) {
      const x = ANCHOR_PREVIEW.x + (tx - ty) * 32;
      const y = ANCHOR_PREVIEW.y + (tx + ty) * 16;
      grade.poly([
        x, y - 16,
        x + 32, y,
        x, y + 16,
        x - 32, y,
      ]);
      grade.fill({ color: 0x2d3748, alpha: 0.75 });
      grade.stroke({ color: 0x4a5568, width: 1 });
    }
  }
  app.stage.addChild(grade);
}

function ControleOffset({
  rotulo,
  valor,
  onAlterar,
}: {
  readonly rotulo: string;
  readonly valor: number;
  readonly onAlterar: (valor: number) => void;
}) {
  return (
    <label style={{ display: 'grid', gridTemplateColumns: '72px 1fr 48px', gap: '0.5rem', alignItems: 'center', fontSize: 12 }}>
      <span>{rotulo}</span>
      <input
        type="range"
        min={-32}
        max={32}
        step={1}
        value={valor}
        onChange={(evento) => onAlterar(Number(evento.target.value))}
      />
      <span style={{ color: '#90cdf4' }}>{valor}px</span>
    </label>
  );
}

function PainelInformacoes({ metadata }: { readonly metadata: CharacterPartMetadata | undefined }) {
  if (metadata === undefined) {
    return <div style={{ color: '#718096', fontSize: 13 }}>Nenhuma parte carregada.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: 12, lineHeight: 1.45 }}>
      <CampoInfo rotulo="partId" valor={metadata.partId} />
      <CampoInfo rotulo="tipo" valor={metadata.tipo} />
      <CampoInfo rotulo="direcoes" valor={metadata.direcoes.join(', ')} />
      <CampoInfo rotulo="canvas" valor={`${metadata.canvasLargura} x ${metadata.canvasAltura}`} />
      <CampoInfo rotulo="anchor" valor={`${metadata.anchorPixelX} / ${metadata.anchorPixelY}`} />
      <CampoInfo rotulo="joints" valor={(metadata.jointsDeEncaixe ?? []).join(', ') || '-'} />
      <CampoInfo rotulo="camada" valor={metadata.camada} />
      <CampoInfo rotulo="era" valor={metadata.era ?? '-'} />
      <CampoInfo rotulo="tags" valor={metadata.tags.join(', ') || '-'} />
      {metadata.variacao !== undefined && <CampoInfo rotulo="variacao" valor={metadata.variacao} />}
    </div>
  );
}

function CampoInfo({ rotulo, valor }: { readonly rotulo: string; readonly valor: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr', gap: '0.5rem' }}>
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
  gap: '0.8rem',
};

const estiloTitulo: React.CSSProperties = {
  margin: 0,
  color: '#90cdf4',
  fontSize: 16,
};

const estiloGrupo: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
};

const estiloRotulo: React.CSSProperties = {
  color: '#a0aec0',
  fontSize: 12,
};

const estiloBotaoPrimario: React.CSSProperties = {
  background: '#3182ce',
  color: '#ffffff',
  border: 'none',
  borderRadius: 4,
  padding: '0.45rem 0.75rem',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'monospace',
};

const estiloBotaoSecundario: React.CSSProperties = {
  background: '#2d3748',
  color: '#e2e8f0',
  border: '1px solid #4a5568',
  borderRadius: 4,
  padding: '0.45rem 0.75rem',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'monospace',
};

function estiloBotaoDirecao(ativo: boolean, disponivel: boolean): React.CSSProperties {
  return {
    background: ativo ? '#2b6cb0' : '#2d3748',
    color: disponivel ? '#e2e8f0' : '#718096',
    border: `1px solid ${ativo ? '#63b3ed' : '#4a5568'}`,
    borderRadius: 4,
    padding: '0.35rem 0',
    cursor: disponivel ? 'pointer' : 'not-allowed',
    fontSize: 12,
    fontFamily: 'monospace',
  };
}
