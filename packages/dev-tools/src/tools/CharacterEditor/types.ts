import type { DirecaoVisual } from '@core/schemas/direction';
import type { CharacterPartMetadata } from '@core/schemas/characterPart';

/** Modo de visualização do canvas central. */
export type ModoCanvas = 'sprite' | 'composicao' | 'comodo';

export type DirecaoSlot = {
  readonly direcao: DirecaoVisual;
  readonly slot: number; // 1–8
};

/**
 * Ordem dos slots de rotação (sentido horário a partir de N).
 * NB: o slot é apenas índice de UI/navegação — os arquivos de sprite são
 * nomeados por direção (`N.webp`…`NW.webp`), conforme o pipeline em
 * `instructions/14-character-pipeline.md`, NÃO por número.
 */
export const SLOTS_ORDENADOS: readonly DirecaoSlot[] = [
  { direcao: 'N',  slot: 1 },
  { direcao: 'NE', slot: 2 },
  { direcao: 'E',  slot: 3 },
  { direcao: 'SE', slot: 4 },
  { direcao: 'S',  slot: 5 },
  { direcao: 'SW', slot: 6 },
  { direcao: 'W',  slot: 7 },
  { direcao: 'NW', slot: 8 },
];

export type Ponto = { readonly x: number; readonly y: number };

export type ParteCarregada = {
  readonly metadata: CharacterPartMetadata;
  readonly caminho: string;                                  // ex: "corpo_base/adulto_neutro"
  readonly spritesPorSlot: Partial<Record<number, string>>;  // slot → URL do webp (por direção)
  readonly anchorOverrides: Partial<Record<number, Ponto>>;  // slot → anchor absoluto editado
};

/** Direção visual correspondente a um slot 1–8. */
export function direcaoDoSlot(slot: number): DirecaoVisual {
  return SLOTS_ORDENADOS.find((s) => s.slot === slot)?.direcao ?? 'S';
}

/** Slot 1–8 correspondente a uma direção. */
export function slotDaDirecao(direcao: DirecaoVisual): number {
  return SLOTS_ORDENADOS.find((s) => s.direcao === direcao)?.slot ?? 5;
}

/**
 * Anchor efetivo (em pixels do canvas) para um slot:
 * override editado > anchor base + offset da direção > anchor base.
 */
export function anchorEfetivo(parte: ParteCarregada, slot: number): Ponto {
  const override = parte.anchorOverrides[slot];
  if (override !== undefined) return override;

  const meta = parte.metadata;
  const offset = meta.offsetsPorDirecao?.[direcaoDoSlot(slot)];
  return {
    x: meta.anchorPixelX + (offset?.x ?? 0),
    y: meta.anchorPixelY + (offset?.y ?? 0),
  };
}

/** True se a direção do slot está declarada no metadata. */
export function slotDisponivel(parte: ParteCarregada, slot: number): boolean {
  return parte.metadata.direcoes.includes(direcaoDoSlot(slot));
}
