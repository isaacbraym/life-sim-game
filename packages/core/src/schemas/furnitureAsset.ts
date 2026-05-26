import { z } from 'zod';

export const RotacaoMovel = z.union([
  z.literal(0),
  z.literal(45),
  z.literal(90),
  z.literal(135),
  z.literal(180),
  z.literal(225),
  z.literal(270),
  z.literal(315),
]);

export const FurnitureAssetMetadata = z.object({
  assetId: z.string(),
  anchorX: z.number().min(0).max(1),
  anchorY: z.number().min(0).max(1),
  escalaBase: z.number().positive(),
  rotacoesDisponiveis: z.array(RotacaoMovel).min(1),
  footprintPorRotacao: z.record(
    z.string(),
    z.object({
      largura: z.number().int().positive(),
      altura: z.number().int().positive(),
    })
  ),
  spritesPorRotacao: z.record(z.string(), z.string()).optional(),
  material: z.string().optional(),
  era: z.string().optional(),
  tags: z.array(z.string()),
});
export type RotacaoMovel = z.infer<typeof RotacaoMovel>;
export type FurnitureAssetMetadata = z.infer<typeof FurnitureAssetMetadata>;
