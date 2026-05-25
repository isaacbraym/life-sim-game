import { z } from 'zod';

export const LifePhaseEnum = z.enum([
  'bebe',
  'crianca',
  'adolescente',
  'jovem_adulto',
  'adulto',
  'idoso',
]);
export type LifePhaseEnum = z.infer<typeof LifePhaseEnum>;

export const LifePhaseDefinition = z.object({
  id: LifePhaseEnum,
  idadeMin: z.number().int(),
  idadeMax: z.number().int(),
  autonomia: z.enum(['nenhuma', 'limitada', 'parcial', 'plena']),
  locaisDisponiveis: z.array(z.string()),
  locaisBloqueados: z.array(z.string()),
  acoesDesfavor: z.array(z.string()),
  worldMapVisivel: z.boolean(),
  descricao: z.string(),
});
export type LifePhaseDefinition = z.infer<typeof LifePhaseDefinition>;
