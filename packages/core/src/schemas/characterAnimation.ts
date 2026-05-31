import { z } from 'zod';
import { CamadaPersonagem } from './characterPart';
import { DirecaoVisual } from './direction';

export const KeyframeAnimacao = z.object({
  tempoMs:   z.number().int(),
  camada:    CamadaPersonagem,
  offsetX:   z.number().int().default(0),
  offsetY:   z.number().int().default(0),
  opacidade: z.number().min(0).max(1).default(1),
  escala:    z.number().positive().default(1),
});

export const AnimacaoPersonagem = z.object({
  animacaoId:    z.string(),
  direcao:       DirecaoVisual,
  duracaoMs:     z.number().int().positive(),
  loop:          z.boolean().default(false),
  keyframes:     z.array(KeyframeAnimacao),
  acaoVinculada: z.string().optional(),
});

export type KeyframeAnimacao   = z.infer<typeof KeyframeAnimacao>;
export type AnimacaoPersonagem = z.infer<typeof AnimacaoPersonagem>;
