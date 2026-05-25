import { z } from 'zod';

export const FurnitureDefinition = z.object({
  id: z.string(),
  nome: z.string(),
  categoria: z.enum([
    'assento', 'mesa', 'cama', 'tecnologia',
    'eletrodomestico', 'decoracao', 'treino', 'outro',
  ]),
  assetId: z.string(),
  tamanhoGrid: z.object({
    largura: z.number().int(),
    altura: z.number().int(),
  }),
  preco: z.number(),
  valorDeRevenda: z.number(),
  acoes: z.array(z.string()),
  efeitos: z.object({
    conforto: z.number().optional(),
    humor: z.number().optional(),
    energia: z.number().optional(),
    statusSocial: z.number().optional(),
  }).optional(),
  availability: z.object({
    startYear: z.number().int(),
    endYear: z.number().int().optional(),
  }),
  tags: z.array(z.string()),
  descricao: z.string().optional(),
});
export type FurnitureDefinition = z.infer<typeof FurnitureDefinition>;

export const PlacedFurniture = z.object({
  furnitureId: z.string(),
  comodoId: z.string(),
  gridX: z.number().int(),
  gridY: z.number().int(),
  rotacao: z.number().int().multipleOf(90),
  instanceId: z.string(),
});
export type PlacedFurniture = z.infer<typeof PlacedFurniture>;

export const HomeSaveState = z.object({
  houseId: z.string(),
  movelComprados: z.array(z.string()),
  movelVendidos: z.array(z.string()),
  movelPosicionados: z.array(PlacedFurniture),
  valorEstimadoImovel: z.number(),
  aluguelMensal: z.number().optional(),
});
export type HomeSaveState = z.infer<typeof HomeSaveState>;
