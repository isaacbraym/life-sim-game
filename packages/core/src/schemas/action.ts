import { z } from 'zod';
import { Effect } from './effect';
import { PredicateTreeSchema } from './predicate';
import { LifePhaseEnum } from './lifephase';

export const ResolutionMode = z.enum(['direct', 'check']);
export type ResolutionMode = z.infer<typeof ResolutionMode>;

export const CheckDefinition = z.object({
  atributo: z.enum(['forca', 'inteligencia', 'carisma', 'constituicao', 'sorte']),
  dc: z.number().int().min(1).max(30),
  modificadoresExtras: z.array(z.object({
    origem: z.string(),
    valor: z.number().int(),
  })).optional(),
});
export type CheckDefinition = z.infer<typeof CheckDefinition>;

export const ProgressionRule = z.object({
  contadorId: z.string(),
  limiar: z.number().int(),
  periodoReset: z.enum(['semana', 'mes', 'semestre', 'ano', 'nunca']),
  efeito: z.array(Effect),
  narrativeWeight: z.enum(['routine', 'relevant', 'major']).default('relevant'),
  logAoAtigir: z.string().optional(),
});
export type ProgressionRule = z.infer<typeof ProgressionRule>;

export const ActionDefinition = z.object({
  id: z.string(),
  rotulo: z.string(),
  icone: z.string().optional(),

  requisitos: PredicateTreeSchema.optional(),
  faseDeVidaMinima: LifePhaseEnum.optional(),

  custos: z.array(Effect).optional(),

  resolutionMode: ResolutionMode,
  check: CheckDefinition.optional(),

  onAlways: z.array(Effect).optional(),
  onSuccess: z.array(Effect).optional(),
  onFailure: z.array(Effect).optional(),

  progression: ProgressionRule.optional(),

  logAcao: z.string().optional(),
  logSucesso: z.string().optional(),
  logFalha: z.string().optional(),
  narrativeWeight: z.enum(['routine', 'relevant', 'major']).default('routine'),

  eventHooks: z.array(z.object({
    condicao: z.enum(['onSuccess', 'onFailure', 'always']),
    eventoId: z.string(),
    chance: z.number().min(0).max(1).default(1),
  })).optional(),

  timeCost: z.object({
    unidades: z.number().int().min(0),
    tipo: z.enum(['acao', 'periodo', 'dia', 'noite']),
  }).optional(),
});
export type ActionDefinition = z.infer<typeof ActionDefinition>;
