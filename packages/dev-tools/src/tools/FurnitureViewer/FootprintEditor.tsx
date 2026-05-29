import { useState, useEffect, useCallback, useRef } from 'react';
import { Application, Assets, Graphics, Sprite, Texture } from 'pixi.js';
import type { FurnitureAssetMetadata, RotacaoMovel } from '@core/schemas/furnitureAsset';
import { PixiCanvas } from '../../shared/PixiCanvas';
import { urlImagemAsset } from '../../shared/SchemaLoader';

const TILE_W = 64;
const TILE_H = 32;
const LARGURA_CANVAS = 520;
const ALTURA_CANVAS = 380;
const CENTRO_TX = 4;
const CENTRO_TY = 4;
const OFFSET_X = LARGURA_CANVAS / 2;
const OFFSET_Y = LARGURA_CANVAS / 2 - 40;

type HandleId =
  | 'topo-esq' | 'topo-cen' | 'topo-dir'
  | 'meio-esq' | 'meio-dir'
  | 'base-esq' | 'base-cen' | 'base-dir';

type EstadoEditor = {
  readonly rotacaoAtual: RotacaoMovel;
  readonly escalaAtual: number;
  readonly footprintLargura: number;
  readonly footprintAltura: number;
};

export type FootprintEditorProps = {
  readonly metadata: FurnitureAssetMetadata;
  readonly onSalvar: (novoMetadata: FurnitureAssetMetadata) => Promise<void>;
};

const ROTACOES_ORDENADAS: RotacaoMovel[] = [0, 45, 90, 135, 180, 225, 270, 315];
const DIRECOES_POR_ROTACAO: Record<number, string> = {
  0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW',
};

function tileParaTela(tx: number, ty: number): { x: number; y: number } {
  return {
    x: (tx - ty) * (TILE_W / 2),
    y: (tx + ty) * (TILE_H / 2),
  };
}

function posicaoTileNaCanvas(tx: number, ty: number): { x: number; y: number } {
  const { x, y } = tileParaTela(tx - CENTRO_TX, ty - CENTRO_TY);
  return { x: x + OFFSET_X, y: y + OFFSET_Y };
}

function calcularTilesOcupados(largura: number, altura: number): Array<{ tx: number; ty: number }> {
  const tiles: Array<{ tx: number; ty: number }> = [];
  const inicioX = CENTRO_TX - Math.floor(largura / 2);
  const inicioY = CENTRO_TY - Math.floor(altura / 2);
  for (let dy = 0; dy < altura; dy++) {
    for (let dx = 0; dx < largura; dx++) {
      tiles.push({ tx: inicioX + dx, ty: inicioY + dy });
    }
  }
  return tiles;
}

function footprintParaDirecao(
  rotacao: RotacaoMovel,
  larguraBase: number,
  alturaBase: number,
): { largura: number; altura: number } {
  if ([90, 270].includes(rotacao)) {
    return { largura: alturaBase, altura: larguraBase };
  }
  return { largura: larguraBase, altura: alturaBase };
}

function cursorPorHandle(handle: HandleId): string {
  const cursores: Record<HandleId, string> = {
    'topo-esq': 'nw-resize',
    'topo-cen': 'n-resize',
    'topo-dir': 'ne-resize',
    'meio-esq': 'w-resize',
    'meio-dir': 'e-resize',
    'base-esq': 'sw-resize',
    'base-cen': 's-resize',
    'base-dir': 'se-resize',
  };
  return cursores[handle];
}

function inicializarFootprint(
  metadata: FurnitureAssetMetadata,
  rotacao: RotacaoMovel,
): { largura: number; altura: number } {
  const fromMeta = metadata.footprintPorRotacao[String(rotacao)];
  if (fromMeta) return fromMeta;
  const base135 = metadata.footprintPorRotacao['135'] ?? { largura: 1, altura: 1 };
  return footprintParaDirecao(rotacao, base135.largura, base135.altura);
}

export function FootprintEditor({ metadata, onSalvar }: FootprintEditorProps) {
  const rotacaoInicial: RotacaoMovel = metadata.rotacoesDisponiveis.includes(135)
    ? 135
    : (metadata.rotacoesDisponiveis[0] ?? 135);

  const fpInicial = inicializarFootprint(metadata, rotacaoInicial);
  const [estado, setEstado] = useState<EstadoEditor>({
    rotacaoAtual: rotacaoInicial,
    escalaAtual: metadata.escalaBase,
    footprintLargura: fpInicial.largura,
    footprintAltura: fpInicial.altura,
  });

  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState<string | undefined>();

  // Referências PixiJS para manipulação imperativa
  const appRef = useRef<Application | undefined>();
  const gradeRef = useRef<Graphics | undefined>();
  const footprintRef = useRef<Graphics | undefined>();
  const spriteRef = useRef<Sprite | undefined>();
  const bboxRef = useRef<Graphics | undefined>();
  const handlesRef = useRef<Graphics | undefined>();

  // Estado de arraste dos handles (fora do estado React para performance)
  const arrasteRef = useRef<{
    ativo: boolean;
    handle: HandleId | undefined;
    inicioX: number;
    inicioY: number;
    escalaBase: number;
    fpLargBase: number;
    fpAltBase: number;
  }>({
    ativo: false,
    handle: undefined,
    inicioX: 0,
    inicioY: 0,
    escalaBase: 1,
    fpLargBase: 1,
    fpAltBase: 1,
  });

  // Versão do estado em ref para acessar nos callbacks PixiJS sem stale closure
  const estadoRef = useRef(estado);
  useEffect(() => { estadoRef.current = estado; }, [estado]);

  const aoInicializarPixi = useCallback((app: Application) => {
    appRef.current = app;

    const grade = new Graphics();
    app.stage.addChild(grade);
    gradeRef.current = grade;

    const footprintGfx = new Graphics();
    app.stage.addChild(footprintGfx);
    footprintRef.current = footprintGfx;

    const sprite = new Sprite();
    sprite.anchor.set(0.5, 1);
    app.stage.addChild(sprite);
    spriteRef.current = sprite;

    const bbox = new Graphics();
    app.stage.addChild(bbox);
    bboxRef.current = bbox;

    const handles = new Graphics();
    app.stage.addChild(handles);
    handlesRef.current = handles;

    desenharGrade(grade);
    atualizarCena(app, grade, footprintGfx, sprite, bbox, handles, estadoRef.current, metadata);
  }, []); // SAFETY: apenas inicialização, metadata não muda após mount

  // Re-desenha quando o estado muda
  useEffect(() => {
    const app = appRef.current;
    const grade = gradeRef.current;
    const footprintGfx = footprintRef.current;
    const sprite = spriteRef.current;
    const bbox = bboxRef.current;
    const handles = handlesRef.current;
    if (!app || !grade || !footprintGfx || !sprite || !bbox || !handles) return;
    atualizarCena(app, grade, footprintGfx, sprite, bbox, handles, estado, metadata);
  }, [estado, metadata]);

  const rotacaoAnterior = () => {
    setEstado((s) => {
      const idx = ROTACOES_ORDENADAS.indexOf(s.rotacaoAtual);
      const novaRot = ROTACOES_ORDENADAS[(idx - 1 + 8) % 8]!;
      const fp = inicializarFootprint(metadata, novaRot);
      return { ...s, rotacaoAtual: novaRot, footprintLargura: fp.largura, footprintAltura: fp.altura };
    });
  };

  const proximaRotacao = () => {
    setEstado((s) => {
      const idx = ROTACOES_ORDENADAS.indexOf(s.rotacaoAtual);
      const novaRot = ROTACOES_ORDENADAS[(idx + 1) % 8]!;
      const fp = inicializarFootprint(metadata, novaRot);
      return { ...s, rotacaoAtual: novaRot, footprintLargura: fp.largura, footprintAltura: fp.altura };
    });
  };

  const ajustarLargura = (delta: number) => {
    setEstado((s) => ({ ...s, footprintLargura: Math.max(1, s.footprintLargura + delta) }));
  };

  const ajustarAltura = (delta: number) => {
    setEstado((s) => ({ ...s, footprintAltura: Math.max(1, s.footprintAltura + delta) }));
  };

  const resetarEscala = () => {
    setEstado((s) => ({ ...s, escalaAtual: 1.0 }));
  };

  const salvarFootprint = async () => {
    setSalvando(true);
    try {
      const { escalaAtual, footprintLargura, footprintAltura } = estado;
      const metadataAtualizado: FurnitureAssetMetadata = {
        ...metadata,
        escalaBase: escalaAtual,
        footprintPorRotacao: {
          '0':   footprintParaDirecao(0,   footprintLargura, footprintAltura),
          '45':  footprintParaDirecao(45,  footprintLargura, footprintAltura),
          '90':  footprintParaDirecao(90,  footprintLargura, footprintAltura),
          '135': footprintParaDirecao(135, footprintLargura, footprintAltura),
          '180': footprintParaDirecao(180, footprintLargura, footprintAltura),
          '225': footprintParaDirecao(225, footprintLargura, footprintAltura),
          '270': footprintParaDirecao(270, footprintLargura, footprintAltura),
          '315': footprintParaDirecao(315, footprintLargura, footprintAltura),
        },
      };
      await onSalvar(metadataAtualizado);
      setToast('Footprint salvo ✓');
      setTimeout(() => setToast(undefined), 3000);
    } catch (err) {
      setToast(`Erro: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSalvando(false);
    }
  };

  const indiceSlot = ROTACOES_ORDENADAS.indexOf(estado.rotacaoAtual) + 1;
  const direcaoNome = DIRECOES_POR_ROTACAO[estado.rotacaoAtual] ?? '?';

  // Registrar pointer events no canvas para arrastar handles
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onPointerMove = (e: PointerEvent) => {
      const arr = arrasteRef.current;
      if (!arr.ativo || arr.handle === undefined) return;

      const rect = container.getBoundingClientRect();
      const novoX = e.clientX - rect.left;
      const novoY = e.clientY - rect.top;

      const deltaX = novoX - arr.inicioX;
      const deltaY = novoY - arr.inicioY;
      const deltaPx = Math.hypot(deltaX, deltaY) * (deltaX + deltaY > 0 ? 1 : -1);

      const handle = arr.handle;

      if (handle === 'topo-esq' || handle === 'topo-dir' || handle === 'base-esq' || handle === 'base-dir') {
        // canto → escala uniforme
        const novaEscala = Math.max(0.2, Math.min(4.0, arr.escalaBase + deltaPx / 120));
        const larguraPx = 96 * novaEscala;
        const novaLargura = Math.max(1, Math.round(larguraPx / TILE_W));
        const novaAltura = Math.max(1, Math.round(larguraPx / TILE_W));
        setEstado((s) => ({ ...s, escalaAtual: novaEscala, footprintLargura: novaLargura, footprintAltura: novaAltura }));
      } else if (handle === 'meio-esq' || handle === 'meio-dir') {
        const novaEscala = Math.max(0.2, Math.min(4.0, arr.escalaBase + deltaX / 120));
        const novaLargura = Math.max(1, Math.round((96 * novaEscala) / TILE_W));
        setEstado((s) => ({ ...s, escalaAtual: novaEscala, footprintLargura: novaLargura }));
      } else {
        // topo-cen / base-cen → só altura
        const novaEscala = Math.max(0.2, Math.min(4.0, arr.escalaBase + deltaY / 120));
        const novaAltura = Math.max(1, Math.round((96 * novaEscala) / TILE_W));
        setEstado((s) => ({ ...s, escalaAtual: novaEscala, footprintAltura: novaAltura }));
      }
    };

    const onPointerUp = () => {
      arrasteRef.current.ativo = false;
      arrasteRef.current.handle = undefined;
    };

    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointerleave', onPointerUp);

    return () => {
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointerleave', onPointerUp);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        ref={containerRef}
        style={{ position: 'relative', display: 'inline-block', cursor: 'default', touchAction: 'none' }}
      >
        <PixiCanvas largura={LARGURA_CANVAS} altura={ALTURA_CANVAS} aoInicializar={aoInicializarPixi} />

        {/* Handles HTML sobrepostos — mais simples e confiáveis que PixiJS eventMode */}
        <HandlesOverlay
          estado={estado}
          metadata={metadata}
          arrasteRef={arrasteRef}
        />
      </div>

      {/* Controles */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: 13, color: '#c4c4cc' }}>
        <button onClick={rotacaoAnterior} className="btn-secondary" style={{ padding: '4px 10px' }}>↺</button>
        <span style={{ minWidth: 70, textAlign: 'center', fontWeight: 600 }}>
          {direcaoNome} · {indiceSlot}/8
        </span>
        <button onClick={proximaRotacao} className="btn-secondary" style={{ padding: '4px 10px' }}>↻</button>

        <span style={{ marginLeft: 12 }}>Footprint:</span>
        <button onClick={() => ajustarLargura(-1)} className="btn-secondary" style={{ padding: '4px 8px' }}>−</button>
        <span style={{ minWidth: 30, textAlign: 'center' }}>{estado.footprintLargura}×{estado.footprintAltura}</span>
        <button onClick={() => ajustarLargura(+1)} className="btn-secondary" style={{ padding: '4px 8px' }}>+</button>
        <span>×</span>
        <button onClick={() => ajustarAltura(-1)} className="btn-secondary" style={{ padding: '4px 8px' }}>−</button>
        <button onClick={() => ajustarAltura(+1)} className="btn-secondary" style={{ padding: '4px 8px' }}>+</button>

        <span style={{ marginLeft: 12 }}>Escala: {(estado.escalaAtual * 100).toFixed(0)}%</span>
        <button onClick={resetarEscala} className="btn-secondary" style={{ padding: '4px 8px' }}>Reset</button>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={() => { void salvarFootprint(); }}
          disabled={salvando}
          className="btn-primary"
          style={{ padding: '8px 20px', opacity: salvando ? 0.6 : 1 }}
        >
          {salvando ? 'Salvando...' : 'Salvar footprint'}
        </button>
        {toast !== undefined && (
          <span style={{ fontSize: 12, color: toast.startsWith('Erro') ? '#f87171' : '#34d399' }}>
            {toast}
          </span>
        )}
      </div>
    </div>
  );
}

// --- Handles HTML overlay ---

type PropsHandlesOverlay = {
  readonly estado: EstadoEditor;
  readonly metadata: FurnitureAssetMetadata;
  readonly arrasteRef: React.MutableRefObject<{
    ativo: boolean;
    handle: HandleId | undefined;
    inicioX: number;
    inicioY: number;
    escalaBase: number;
    fpLargBase: number;
    fpAltBase: number;
  }>;
};

const HANDLES: { id: HandleId; top: string; left: string }[] = [
  { id: 'topo-esq', top: '0%',   left: '0%'   },
  { id: 'topo-cen', top: '0%',   left: '50%'  },
  { id: 'topo-dir', top: '0%',   left: '100%' },
  { id: 'meio-esq', top: '50%',  left: '0%'   },
  { id: 'meio-dir', top: '50%',  left: '100%' },
  { id: 'base-esq', top: '100%', left: '0%'   },
  { id: 'base-cen', top: '100%', left: '50%'  },
  { id: 'base-dir', top: '100%', left: '100%' },
];

function HandlesOverlay({ estado, metadata, arrasteRef }: PropsHandlesOverlay) {
  const { escalaAtual } = estado;

  const anchorPos = posicaoTileNaCanvas(CENTRO_TX, CENTRO_TY);

  // Dimensão visual do sprite escalado (estimativa baseada em canvas padrão 96×80px)
  const larguraEscalada = 96 * escalaAtual;
  const alturaEscalada  = 80 * escalaAtual;

  // Bounding box relativo ao canvas — clampar para não sair do canvas
  const clampX = (v: number) => Math.max(0, Math.min(v, LARGURA_CANVAS));
  const clampY = (v: number) => Math.max(0, Math.min(v, ALTURA_CANVAS));

  const bboxLeftRaw  = anchorPos.x - larguraEscalada * metadata.anchorX;
  const bboxTopRaw   = anchorPos.y - alturaEscalada  * metadata.anchorY;
  const bboxLeft     = clampX(bboxLeftRaw);
  const bboxTop      = clampY(bboxTopRaw);
  const bboxWidth    = Math.min(larguraEscalada,  LARGURA_CANVAS - bboxLeft);
  const bboxHeight   = Math.min(alturaEscalada,   ALTURA_CANVAS  - bboxTop);

  return (
    <div
      style={{
        position: 'absolute',
        left: bboxLeft,
        top: bboxTop,
        width: bboxWidth,
        height: bboxHeight,
        pointerEvents: 'none',
      }}
    >
      {/* Bounding box tracejado */}
      <div style={{
        position: 'absolute',
        inset: 0,
        border: '1.5px dashed rgba(255,255,255,0.7)',
        pointerEvents: 'none',
      }} />

      {HANDLES.map((h) => (
        <div
          key={h.id}
          onPointerDown={(e) => {
            e.stopPropagation();
            arrasteRef.current = {
              ativo: true,
              handle: h.id,
              inicioX: e.clientX,
              inicioY: e.clientY,
              escalaBase: estado.escalaAtual,
              fpLargBase: estado.footprintLargura,
              fpAltBase: estado.footprintAltura,
            };
          }}
          style={{
            position: 'absolute',
            left: h.left,
            top: h.top,
            transform: 'translate(-50%, -50%)',
            width: 10,
            height: 10,
            background: '#ffffff',
            border: '2px solid #63b3ed',
            cursor: cursorPorHandle(h.id),
            pointerEvents: 'all',
            zIndex: 10,
          }}
        />
      ))}
    </div>
  );
}

// --- Funções de desenho PixiJS ---

function desenharGrade(grade: Graphics): void {
  grade.clear();

  for (let ty = 0; ty < 9; ty++) {
    for (let tx = 0; tx < 9; tx++) {
      const p0 = posicaoTileNaCanvas(tx, ty);
      const pR = posicaoTileNaCanvas(tx + 1, ty);
      const pB = posicaoTileNaCanvas(tx, ty + 1);
      const pBR = posicaoTileNaCanvas(tx + 1, ty + 1);

      grade.poly([p0.x, p0.y, pR.x, pR.y, pBR.x, pBR.y, pB.x, pB.y]);
      grade.fill({ color: 0x2d3748, alpha: 1 });
      grade.stroke({ color: 0x3d5a73, width: 1, alpha: 1 });
    }
  }
}

function desenharFootprint(footprintGfx: Graphics, largura: number, altura: number): void {
  footprintGfx.clear();
  const tiles = calcularTilesOcupados(largura, altura);

  for (const { tx, ty } of tiles) {
    const p0 = posicaoTileNaCanvas(tx, ty);
    const pR = posicaoTileNaCanvas(tx + 1, ty);
    const pB = posicaoTileNaCanvas(tx, ty + 1);
    const pBR = posicaoTileNaCanvas(tx + 1, ty + 1);

    footprintGfx.poly([p0.x, p0.y, pR.x, pR.y, pBR.x, pBR.y, pB.x, pB.y]);
    footprintGfx.fill({ color: 0xf6ad55, alpha: 0.55 });
    footprintGfx.stroke({ color: 0xed8936, width: 2, alpha: 1 });
  }
}

function atualizarSprite(
  _app: Application,
  sprite: Sprite,
  estado: EstadoEditor,
  metadata: FurnitureAssetMetadata,
): void {
  const url = urlImagemAsset(metadata.assetId, estado.rotacaoAtual, metadata);
  const anchorPos = posicaoTileNaCanvas(CENTRO_TX, CENTRO_TY);

  void (async () => {
    try {
      const texture: Texture = await Assets.load(url);
      if (sprite.destroyed) return;
      sprite.texture = texture;
      sprite.anchor.set(metadata.anchorX, metadata.anchorY);
      sprite.scale.set(estado.escalaAtual);
      sprite.position.set(anchorPos.x, anchorPos.y);
    } catch {
      // sprite sem imagem — ignora silenciosamente
    }
  })();

  sprite.scale.set(estado.escalaAtual);
  sprite.position.set(anchorPos.x, anchorPos.y);
}

function atualizarCena(
  app: Application,
  grade: Graphics,
  footprintGfx: Graphics,
  sprite: Sprite,
  _bbox: Graphics,
  _handles: Graphics,
  estado: EstadoEditor,
  metadata: FurnitureAssetMetadata,
): void {
  desenharGrade(grade);
  desenharFootprint(footprintGfx, estado.footprintLargura, estado.footprintAltura);
  atualizarSprite(app, sprite, estado, metadata);
}
