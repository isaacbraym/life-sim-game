import { z } from 'zod';
import { DirecaoVisual } from './direction';

export const CamadaPersonagem = z.enum([
  'sombra', 'sapato', 'calca', 'corpo_base', 'camisa',
  'acessorio_corpo', 'cabelo_atras', 'cabeca', 'rosto',
  'cabelo_frente', 'chapeu', 'acessorio_mao',
]);
export type CamadaPersonagem = z.infer<typeof CamadaPersonagem>;

export const CharacterPartMetadata = z.object({
  partId:        z.string(),
  tipo:          CamadaPersonagem,
  direcoes:      z.array(DirecaoVisual).min(1),
  canvasLargura: z.number().int().positive(),
  canvasAltura:  z.number().int().positive(),
  anchorPixelX:  z.number().int(),
  anchorPixelY:  z.number().int(),
  offsetsPorDirecao: z.record(
    z.string(),
    z.object({ x: z.number().int(), y: z.number().int() }),
  ).optional(),
  jointsDeEncaixe: z.array(z.string()).optional(),
  camada:        CamadaPersonagem,
  era:           z.string().optional(),
  tags:          z.array(z.string()),
  variacao:      z.string().optional(),
});
export type CharacterPartMetadata = z.infer<typeof CharacterPartMetadata>;

/** Ordem de renderização das camadas (z-index crescente = na frente). */
export const ORDEM_CAMADAS: readonly CamadaPersonagem[] = [
  'sombra', 'sapato', 'calca', 'corpo_base', 'camisa',
  'acessorio_corpo', 'cabelo_atras', 'cabeca', 'rosto',
  'cabelo_frente', 'chapeu', 'acessorio_mao',
] as const;

/** Canvas padrão de personagem — todos os assets usam essas dimensões. */
export const CHARACTER_CANVAS = {
  largura:      64,
  altura:       96,
  anchorPixelX: 32,
  anchorPixelY: 90,
} as const;
