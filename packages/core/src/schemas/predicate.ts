import { z } from 'zod';

const OperadorComparacao = z.enum(['==', '!=', '>', '<', '>=', '<=']);

// Predicado base (referência variável)
const PredicadoVariavel = z.object({
  tipo: z.literal('var'),
  caminho: z.string(),  // ex: 'personagem.atributos.forca', 'npc:mae.relacionamento.afeto'
  operador: OperadorComparacao,
  valor: z.union([z.number(), z.string(), z.boolean()]),
}).strict();

const PredicadoFlag = z.object({
  tipo: z.literal('flag'),
  flag: z.string(),  // ex: 'casou_com_alice', 'tem_filho'
  presente: z.boolean().default(true),
}).strict();

const PredicadoRelacionamento = z.object({
  tipo: z.literal('relacionamento'),
  comNpcRole: z.string(),
  tipoVinculo: z.enum(['familia', 'amigo', 'romance', 'inimizade', 'profissional']),
  nivelMinimo: z.number().min(-100).max(100).optional(),
}).strict();

const PredicadoIdade = z.object({
  tipo: z.literal('idade'),
  minimo: z.number().int().min(0).max(120).optional(),
  maximo: z.number().int().min(0).max(120).optional(),
}).strict();

// Composição
const PredicadoFolha = z.union([
  PredicadoVariavel, PredicadoFlag,
  PredicadoRelacionamento, PredicadoIdade,
]);

export type PredicateTree =
  | { tipo: 'todos'; predicados: PredicateTree[] }
  | { tipo: 'algum'; predicados: PredicateTree[] }
  | { tipo: 'nao'; predicado: PredicateTree }
  | z.infer<typeof PredicadoFolha>;

export const PredicateTreeSchema: z.ZodType<PredicateTree> = z.lazy(() =>
  z.union([
    z.object({
      tipo: z.literal('todos'),
      predicados: z.array(PredicateTreeSchema),
    }).strict(),
    z.object({
      tipo: z.literal('algum'),
      predicados: z.array(PredicateTreeSchema),
    }).strict(),
    z.object({
      tipo: z.literal('nao'),
      predicado: PredicateTreeSchema,
    }).strict(),
    PredicadoFolha,
  ])
);
