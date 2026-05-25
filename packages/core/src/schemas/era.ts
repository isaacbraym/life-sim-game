import { z } from 'zod';

export const EraDefinition = z.object({
  id: z.string(),
  nome: z.string(),
  startYear: z.number().int(),
  endYear: z.number().int(),
  tecnologiasDisponiveis: z.array(z.string()),
  estiloRoupa: z.string(),
  estiloMovel: z.string(),
  musicaAmbiente: z.string().optional(),
  descricao: z.string(),
});
export type EraDefinition = z.infer<typeof EraDefinition>;

export const YearContext = z.object({
  ano: z.number().int(),
  eraId: z.string(),
  tecnologiasAtivas: z.array(z.string()),
  eventoHistoricosDoAno: z.array(z.string()),
  modificadoresEconomicos: z.object({
    inflacao: z.number(),
    desemprego: z.number(),
    custoVidaMultiplicador: z.number(),
  }),
});
export type YearContext = z.infer<typeof YearContext>;
