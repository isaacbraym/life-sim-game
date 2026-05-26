import { z } from 'zod';
import { DirecaoVisual } from './direction';

export const TileEstado = z.enum(['caminhavel', 'bloqueado', 'vazio']);

export const TileDefinicao = z.object({
  estado:   TileEstado,
  elevacao: z.number().int().min(0).default(0),
  assetId:  z.string().optional(),
});

export const ObjetoIsoDefinicao = z.object({
  id:          z.string(),
  furnitureId: z.string(),
  tileX:       z.number().int(),
  tileY:       z.number().int(),
  direcao:     DirecaoVisual,
  bloqueaTiles: z.array(z.object({
    dx: z.number().int(),
    dy: z.number().int(),
  })),
});

export const SaidaIso = z.object({
  id:    z.string(),
  tileX: z.number().int(),
  tileY: z.number().int(),
  destino: z.object({
    tipo:     z.enum(['comodo', 'mapa']),
    comodoId: z.string().optional(),
  }),
});

export const IsoRoomDefinition = z.object({
  id:           z.string(),
  nome:         z.string(),
  larguraTiles: z.number().int().positive(),
  alturaTiles:  z.number().int().positive(),
  /** Grid plano: tiles[y][x]. Linha 0 = topo do cômodo. */
  tiles:         z.array(z.array(TileDefinicao)),
  objetos:       z.array(ObjetoIsoDefinicao),
  saidas:        z.array(SaidaIso),
  npcsElegiveis: z.array(z.string()),
  eraStyle:      z.string(),
});

export type IsoRoomDefinition  = z.infer<typeof IsoRoomDefinition>;
export type TileDefinicao      = z.infer<typeof TileDefinicao>;
export type ObjetoIsoDefinicao = z.infer<typeof ObjetoIsoDefinicao>;
export type SaidaIso           = z.infer<typeof SaidaIso>;
export type TileEstado         = z.infer<typeof TileEstado>;
