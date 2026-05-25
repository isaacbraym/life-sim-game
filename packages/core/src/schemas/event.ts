import { z } from 'zod';
import { Scene } from './scene';
import { PredicateTreeSchema } from './predicate';

export const CategoriaEvento = z.enum([
  'childhood', 'education', 'career', 'relationship',
  'crime', 'health', 'hobby', 'mortality', 'finance', 'travel',
]);
export type CategoriaEvento = z.infer<typeof CategoriaEvento>;

export const TagConteudo = z.enum([
  'violence', 'sexual', 'substance', 'language', 'death', 'trauma', 'religious', 'political',
]);
export type TagConteudo = z.infer<typeof TagConteudo>;

export const TipoNpcEvento = z.enum(['relacional', 'sempre_novo']);

export const SelectorNpc = z.object({
  papel: z.string(),
  tipo: TipoNpcEvento,
  persistenciaApos: z.enum(['permanente', 'recorrente', 'descartavel']).default('descartavel'),
  constraints: z.object({
    genero: z.enum(['M', 'F', 'qualquer']).optional(),
    idadeMin: z.number().int().min(0).max(120).optional(),
    idadeMax: z.number().int().min(0).max(120).optional(),
    estiloCorporal: z.enum(['atletico', 'magro', 'gordo', 'medio', 'qualquer']).optional(),
    profissao: z.string().optional(),
  }).strict().default({}),
}).strict();
export type SelectorNpc = z.infer<typeof SelectorNpc>;

export const Event = z.object({
  schemaVersion: z.literal('1.0.0'),
  eventoId: z.string().regex(/^[a-z][a-z0-9_]*$/),
  categoria: CategoriaEvento,
  titulo: z.string().min(3).max(100),
  descricaoCurta: z.string().min(3).max(300),
  contentTags: z.array(TagConteudo).default([]),
  triggers: z.object({
    idadeRange: z.tuple([z.number().int().min(0), z.number().int().min(0)]).optional(),
    requisitos: PredicateTreeSchema.optional(),
    peso: z.number().min(0).max(100).default(10),
    cooldownMeses: z.number().int().min(0).default(0),
    uniqueOnce: z.boolean().default(false),
  }).strict(),
  cast: z.array(SelectorNpc).default([]),
  scene: Scene,
  localContextId: z.string().optional(),
  narrativeWeight: z.enum(['routine', 'relevant', 'major']).optional(),
  eraDisponivel: z.object({
    startYear: z.number().int(),
    endYear: z.number().int().optional(),
  }).strict().optional(),
  metadata: z.object({
    criadoEm: z.string().datetime(),
    criadoPor: z.enum(['humano', 'ia_assistido', 'ia_validada']),
    revisadoPor: z.string().optional(),
    versao: z.number().int().min(1).default(1),
  }).strict(),
}).strict();
export type Event = z.infer<typeof Event>;
