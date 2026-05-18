import { z } from 'zod';
import { Scene } from './scene';
import { PredicateTreeSchema } from './predicate';

export const CategoriaEvento = z.enum([
  'childhood', 'education', 'career', 'relationship',
  'crime', 'health', 'hobby', 'mortality',
  'finance', 'travel', 'historic',
]);

export const TagConteudo = z.enum([
  'violence', 'sexual', 'substance', 'language',
  'death', 'trauma', 'religious', 'political',
]);

export const TipoNpcEvento = z.enum([
  'relacional',     // prefere NPC do roster com tags
  'sempre_novo',    // cria NPC efêmero sempre
]);

export const SelectorNpc = z.object({
  papel: z.string(),  // ex: 'best_friend', 'boss', 'father'
  tipo: TipoNpcEvento,
  persistenciaApos: z.enum(['permanente', 'recorrente', 'descartavel']).default('descartavel'),
  constraints: z.object({
    genero: z.enum(['M', 'F', 'qualquer']).optional(),
    idadeMin: z.number().int().min(0).max(120).optional(),
    idadeMax: z.number().int().min(0).max(120).optional(),
    tomDePele: z.enum(['claro', 'medio', 'escuro', 'qualquer']).optional(),
    estiloCorporal: z.enum(['atletico', 'magro', 'gordo', 'medio', 'qualquer']).optional(),
    profissao: z.string().optional(),
    atributoMinimo: z.object({
      atributo: z.enum(['forca', 'inteligencia', 'carisma', 'constituicao', 'sorte']),
      minimo: z.number().int(),
    }).optional(),
  }).default({}),
}).strict();

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
  }),

  cast: z.array(SelectorNpc).default([]),

  scene: Scene,

  metadata: z.object({
    criadoEm: z.string().datetime(),
    criadoPor: z.enum(['humano', 'ia_assistido', 'ia_validada']),
    revisadoPor: z.string().optional(),
    versao: z.number().int().min(1).default(1),
  }),
}).strict();

export type Event = z.infer<typeof Event>;
