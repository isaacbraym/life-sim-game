import { z } from 'zod';
import { DirecaoVisual } from './direction';

/**
 * Personagem de TESTE com sprites de animação pré-bakeadas (sequência de frames
 * WebP por direção), em oposição ao sistema de composição por camadas do runtime.
 *
 * Usada para validar o pipeline Mixamo→Blender→WebP com um modelo 3D real
 * (ex.: Marnie) antes de existirem assets de camadas próprios do jogo. Os frames
 * vivem em `content/test-characters/{personagemId}/{varianteId}/{clipId}/frames/{direcao}/frame_NNN.webp`.
 */

export const ClipPersonagemTeste = z.object({
  clipId: z.string(),                 // ex.: "andar", "sentado"
  fps:    z.number().int().positive(),
  loop:   z.boolean().default(true),
  frames: z.number().int().nonnegative(), // nº de frames por direção
  rootVertical: z.boolean().optional(),
});
export type ClipPersonagemTeste = z.infer<typeof ClipPersonagemTeste>;

export const VariantePersonagemTeste = z.object({
  varianteId: z.string(),             // ex.: "base", "gym"
  nome:       z.string(),
  papel:      z.enum(['jogador', 'npc']),
  clips:      z.array(ClipPersonagemTeste),
});
export type VariantePersonagemTeste = z.infer<typeof VariantePersonagemTeste>;

export const CanvasPersonagemTeste = z.object({
  largura: z.number().int().positive(),
  altura:  z.number().int().positive(),
  anchorX: z.number().int(),
  anchorY: z.number().int(),
});
export type CanvasPersonagemTeste = z.infer<typeof CanvasPersonagemTeste>;

export const ManifestoPersonagemTeste = z.object({
  personagemId: z.string(),
  nome:         z.string(),
  fonte:        z.string().optional(),
  canvas:       CanvasPersonagemTeste,
  variantes:    z.array(VariantePersonagemTeste).min(1),
});
export type ManifestoPersonagemTeste = z.infer<typeof ManifestoPersonagemTeste>;

export const DIRECOES_PERSONAGEM_TESTE: readonly DirecaoVisual[] = [
  'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW',
];

/** Caminho da pasta de frames de um clip/direção (relativo à raiz servida). */
export function caminhoFramesPersonagemTeste(
  personagemId: string,
  varianteId: string,
  clipId: string,
  direcao: DirecaoVisual,
): string {
  return `/content/test-characters/${personagemId}/${varianteId}/${clipId}/frames/${direcao}`;
}
