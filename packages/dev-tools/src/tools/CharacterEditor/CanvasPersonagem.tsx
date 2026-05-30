import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Application, Assets, Container, Graphics, Rectangle, Sprite, Text, Texture,
  type FederatedPointerEvent,
} from 'pixi.js';
import { ORDEM_CAMADAS } from '@core/schemas/characterPart';
import { PixiCanvas } from '../../shared/PixiCanvas';
import { anchorEfetivo, direcaoDoSlot, type ModoCanvas, type ParteCarregada } from './types';

export type CanvasPersonagemProps = {
  readonly partePrincipal: ParteCarregada | undefined;
  readonly camadasAtivas: readonly ParteCarregada[];
  readonly slotAtual: number;
  readonly modo: ModoCanvas;
  readonly onAnchorChange: (slot: number, x: number, y: number) => void;
};

const LARGURA = 520;
const ALTURA = 460;
const ESCALA_SPRITE = 3;   // ampliação no modo sprite (edição de anchor)
const ESCALA_COMP = 3;     // ampliação no modo composição
const ESCALA_COMODO = 2;   // personagem no mini cômodo

const COR_FUNDO_CLARO = 0xcccccc;
const COR_FUNDO_ESCURO = 0x999999;

type Transform = { ox: number; oy: number; escala: number; w: number; h: number };

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function criarFundoXadrez(): Graphics {
  const g = new Graphics();
  const tam = 16;
  for (let y = 0; y < ALTURA; y += tam) {
    for (let x = 0; x < LARGURA; x += tam) {
      const claro = (Math.floor(x / tam) + Math.floor(y / tam)) % 2 === 0;
      g.rect(x, y, tam, tam).fill({ color: claro ? COR_FUNDO_CLARO : COR_FUNDO_ESCURO });
    }
  }
  return g;
}

function bordaTracejada(g: Graphics, x: number, y: number, w: number, h: number, cor: number): void {
  const dash = 6;
  const gap = 4;
  const segmento = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len === 0) return;
    const ux = dx / len;
    const uy = dy / len;
    let d = 0;
    while (d < len) {
      const e = Math.min(d + dash, len);
      g.moveTo(x1 + ux * d, y1 + uy * d).lineTo(x1 + ux * e, y1 + uy * e);
      d += dash + gap;
    }
  };
  segmento(x, y, x + w, y);
  segmento(x + w, y, x + w, y + h);
  segmento(x + w, y + h, x, y + h);
  segmento(x, y + h, x, y);
  g.stroke({ color: cor, width: 1, alpha: 0.85 });
}

function texto(conteudo: string, x: number, y: number, cor: string, tamanho = 11): Text {
  const t = new Text({ text: conteudo, style: { fill: cor, fontSize: tamanho, fontFamily: 'monospace' } });
  t.position.set(x, y);
  return t;
}

/** Coleta URLs de todos os slots de uma parte (para pré-carregar texturas). */
function urlsDaParte(parte: ParteCarregada | undefined): string[] {
  if (parte === undefined) return [];
  return Object.values(parte.spritesPorSlot).filter((u): u is string => typeof u === 'string');
}

export function CanvasPersonagem(props: CanvasPersonagemProps) {
  const appRef = useRef<Application | undefined>();
  const conteudoRef = useRef<Container | undefined>();
  const texturasRef = useRef<Map<string, Texture | null>>(new Map());
  const propsRef = useRef(props);
  const transformRef = useRef<Transform | undefined>();
  const arrastandoRef = useRef(false);
  const [versaoTexturas, setVersaoTexturas] = useState(0);

  useEffect(() => { propsRef.current = props; }, [props]);

  // Pré-carrega texturas (todos os slots da parte principal + camadas ativas).
  useEffect(() => {
    let cancelado = false;
    const urls = new Set<string>([
      ...urlsDaParte(props.partePrincipal),
      ...props.camadasAtivas.flatMap(urlsDaParte),
    ]);
    const pendentes = [...urls].filter((u) => !texturasRef.current.has(u));
    if (pendentes.length === 0) return;

    void (async () => {
      await Promise.all(pendentes.map(async (url) => {
        try {
          const tex = await Assets.load<Texture>(url);
          texturasRef.current.set(url, tex);
        } catch {
          texturasRef.current.set(url, null);
        }
      }));
      if (!cancelado) setVersaoTexturas((v) => v + 1);
    })();

    return () => { cancelado = true; };
  }, [props.partePrincipal, props.camadasAtivas]);

  const desenhar = useCallback(() => {
    const app = appRef.current;
    const conteudo = conteudoRef.current;
    if (app === undefined || conteudo === undefined) return;
    conteudo.removeChildren();

    const { partePrincipal, camadasAtivas, slotAtual, modo } = propsRef.current;

    if (modo === 'comodo') {
      desenharComodo(conteudo, texturasRef.current, partePrincipal, camadasAtivas, slotAtual);
      return;
    }

    conteudo.addChild(criarFundoXadrez());

    if (modo === 'composicao') {
      desenharComposicao(conteudo, texturasRef.current, partePrincipal, camadasAtivas, slotAtual);
      return;
    }

    // modo 'sprite' — edição de anchor
    transformRef.current = desenharSprite(conteudo, texturasRef.current, partePrincipal, slotAtual);
  }, []);

  const aoInicializar = useCallback((app: Application) => {
    appRef.current = app;
    const conteudo = new Container();
    conteudoRef.current = conteudo;
    app.stage.addChild(conteudo);

    // Stage interativo para o arraste da mira de anchor.
    app.stage.eventMode = 'static';
    app.stage.hitArea = new Rectangle(0, 0, LARGURA, ALTURA);

    const aoMover = (e: FederatedPointerEvent) => {
      if (!arrastandoRef.current) return;
      const { partePrincipal, slotAtual, modo, onAnchorChange } = propsRef.current;
      const t = transformRef.current;
      if (modo !== 'sprite' || partePrincipal === undefined || t === undefined) return;
      const ax = clamp(Math.round((e.global.x - t.ox) / t.escala), 0, t.w);
      const ay = clamp(Math.round((e.global.y - t.oy) / t.escala), 0, t.h);
      onAnchorChange(slotAtual, ax, ay);
    };
    const aoSoltar = () => { arrastandoRef.current = false; };

    app.stage.on('pointermove', aoMover);
    app.stage.on('pointerup', aoSoltar);
    app.stage.on('pointerupoutside', aoSoltar);

    // expõe o setter de arraste para a mira criada em desenharSprite
    (app.stage as unknown as { __iniciarArraste?: () => void }).__iniciarArraste = () => {
      arrastandoRef.current = true;
    };

    desenhar();
  }, [desenhar]);

  // Redesenha quando props ou texturas mudam.
  useEffect(() => { desenhar(); }, [props, versaoTexturas, desenhar]);

  return <PixiCanvas largura={LARGURA} altura={ALTURA} aoInicializar={aoInicializar} />;
}

// ─────────────────────────────────────────────────────────── modo sprite ──

function desenharSprite(
  conteudo: Container,
  texturas: Map<string, Texture | null>,
  parte: ParteCarregada | undefined,
  slot: number,
): Transform | undefined {
  if (parte === undefined) {
    conteudo.addChild(texto('Selecione uma parte no painel esquerdo.', 16, 16, '#2d3748', 13));
    return undefined;
  }

  const { canvasLargura: w, canvasAltura: h } = parte.metadata;
  const escala = ESCALA_SPRITE;
  const ox = Math.round((LARGURA - w * escala) / 2);
  const oy = Math.round((ALTURA - h * escala) / 2);

  const url = parte.spritesPorSlot[slot];
  const tex = url !== undefined ? texturas.get(url) : undefined;

  if (tex instanceof Texture) {
    const s = new Sprite(tex);
    s.position.set(ox, oy);
    s.width = w * escala;
    s.height = h * escala;
    conteudo.addChild(s);
  } else {
    const ph = new Graphics();
    ph.rect(ox, oy, w * escala, h * escala).fill({ color: 0x000000, alpha: 0.06 });
    conteudo.addChild(ph);
    conteudo.addChild(texto(`sem sprite (${direcaoDoSlot(slot)})`, ox + 8, oy + 8, '#a0344a', 12));
  }

  // bounding box tracejado
  const bbox = new Graphics();
  bordaTracejada(bbox, ox, oy, w * escala, h * escala, 0x2b6cb0);
  conteudo.addChild(bbox);

  // mira de anchor
  const ef = anchorEfetivo(parte, slot);
  const ax = ox + ef.x * escala;
  const ay = oy + ef.y * escala;
  const mira = new Graphics();
  mira.moveTo(ax - 16, ay).lineTo(ax + 16, ay);
  mira.moveTo(ax, ay - 16).lineTo(ax, ay + 16);
  mira.stroke({ color: 0xe53e3e, width: 1.5 });
  mira.circle(ax, ay, 5).stroke({ color: 0xe53e3e, width: 1.5 });
  mira.circle(ax, ay, 14).fill({ color: 0xe53e3e, alpha: 0.001 }); // área de toque
  mira.eventMode = 'static';
  mira.cursor = 'grab';
  mira.on('pointerdown', (e: FederatedPointerEvent) => {
    const iniciar = (e.currentTarget?.parent?.parent as unknown as { __iniciarArraste?: () => void })?.__iniciarArraste;
    iniciar?.();
  });
  conteudo.addChild(mira);

  conteudo.addChild(texto(
    `Slot ${slot} · ${direcaoDoSlot(slot)}  |  Anchor (${ef.x}, ${ef.y})`,
    12, 12, '#1a202c', 12,
  ));

  return { ox, oy, escala, w, h };
}

// ──────────────────────────────────────────────────────── modo composição ──

function ordenarPorCamada(partes: readonly ParteCarregada[]): ParteCarregada[] {
  return [...partes].sort(
    (a, b) => ORDEM_CAMADAS.indexOf(a.metadata.camada) - ORDEM_CAMADAS.indexOf(b.metadata.camada),
  );
}

function desenharPersonagemComposto(
  conteudo: Container,
  texturas: Map<string, Texture | null>,
  partes: readonly ParteCarregada[],
  slot: number,
  escala: number,
  ancoraX: number,
  ancoraY: number,
  destacarCaminho?: string,
): void {
  for (const parte of ordenarPorCamada(partes)) {
    const ef = anchorEfetivo(parte, slot);
    const { canvasLargura: w, canvasAltura: h } = parte.metadata;
    const sx = ancoraX - ef.x * escala;
    const sy = ancoraY - ef.y * escala;
    const url = parte.spritesPorSlot[slot];
    const tex = url !== undefined ? texturas.get(url) : undefined;

    if (tex instanceof Texture) {
      const s = new Sprite(tex);
      s.position.set(sx, sy);
      s.width = w * escala;
      s.height = h * escala;
      conteudo.addChild(s);
    } else {
      const ph = new Graphics();
      ph.rect(sx, sy, w * escala, h * escala).stroke({ color: 0xa0344a, width: 1, alpha: 0.6 });
      conteudo.addChild(ph);
    }

    if (destacarCaminho !== undefined && parte.caminho === destacarCaminho) {
      const hl = new Graphics();
      hl.rect(sx, sy, w * escala, h * escala).stroke({ color: 0x63b3ed, width: 2 });
      conteudo.addChild(hl);
    }
  }
}

function desenharComposicao(
  conteudo: Container,
  texturas: Map<string, Texture | null>,
  partePrincipal: ParteCarregada | undefined,
  camadasAtivas: readonly ParteCarregada[],
  slot: number,
): void {
  const partes = camadasAtivas.length > 0
    ? camadasAtivas
    : (partePrincipal !== undefined ? [partePrincipal] : []);

  if (partes.length === 0) {
    conteudo.addChild(texto('Ative camadas no painel esquerdo para compor.', 16, 16, '#2d3748', 13));
    return;
  }

  desenharPersonagemComposto(
    conteudo, texturas, partes, slot, ESCALA_COMP,
    Math.round(LARGURA / 2), Math.round(ALTURA * 0.62),
    partePrincipal?.caminho,
  );
}

// ───────────────────────────────────────────────────────────── modo cômodo ──

const GRADE = 5;
const HW = 32;
const HH = 16;
const PAREDE_H = 96;

function pontoGrade(ox: number, oy: number, tx: number, ty: number): { x: number; y: number } {
  return { x: ox + (tx - ty) * HW, y: oy + (tx + ty) * HH };
}

function desenharComodo(
  conteudo: Container,
  texturas: Map<string, Texture | null>,
  partePrincipal: ParteCarregada | undefined,
  camadasAtivas: readonly ParteCarregada[],
  slot: number,
): void {
  // fundo escuro do cômodo
  const fundo = new Graphics();
  fundo.rect(0, 0, LARGURA, ALTURA).fill({ color: 0x1a2330 });
  conteudo.addChild(fundo);

  const ox = Math.round(LARGURA / 2);
  const oy = 120;

  // paredes do fundo (ty = 0)
  for (let tx = 0; tx < GRADE; tx += 1) {
    const { x, y } = pontoGrade(ox, oy, tx, 0);
    const g = new Graphics();
    g.poly([x - HW, y - HH - PAREDE_H, x + HW, y - HH - PAREDE_H, x + HW, y - HH, x - HW, y - HH]);
    g.fill({ color: 0xccd9e4 });
    g.stroke({ color: 0x8aa0b0, width: 0.5, alpha: 0.5 });
    conteudo.addChild(g);
  }
  // parede esquerda (tx = 0)
  for (let ty = 0; ty < GRADE; ty += 1) {
    const { x, y } = pontoGrade(ox, oy, 0, ty);
    const g = new Graphics();
    g.poly([x - HW, y - HH - PAREDE_H, x, y + HH - PAREDE_H, x, y + HH, x - HW, y - HH]);
    g.fill({ color: 0xb8c8d6 });
    g.stroke({ color: 0x7e96a8, width: 0.5, alpha: 0.5 });
    conteudo.addChild(g);
  }
  // chão xadrez
  for (let ty = 0; ty < GRADE; ty += 1) {
    for (let tx = 0; tx < GRADE; tx += 1) {
      const { x, y } = pontoGrade(ox, oy, tx, ty);
      const par = (tx + ty) % 2 === 0;
      const g = new Graphics();
      g.poly([x, y - HH, x + HW, y, x, y + HH, x - HW, y]);
      g.fill({ color: par ? 0xb5c9d8 : 0x9ab3c5 });
      g.stroke({ color: par ? 0x8fb3c8 : 0x7a9aad, width: 1 });
      conteudo.addChild(g);
    }
  }

  // personagem no tile central (2,2)
  const partes = camadasAtivas.length > 0
    ? camadasAtivas
    : (partePrincipal !== undefined ? [partePrincipal] : []);
  if (partes.length === 0) return;

  const centro = pontoGrade(ox, oy, 2, 2);
  desenharPersonagemComposto(
    conteudo, texturas, partes, slot, ESCALA_COMODO, centro.x, centro.y,
  );
}
