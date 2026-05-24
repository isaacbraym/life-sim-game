import { z } from 'zod';
import { AtributoRPG } from './effect';
const OperadorComparacao = z.enum(['==', '!=', '>', '<', '>=', '<=']);
const PredicadoVariavel = z.object({
    tipo: z.literal('var'),
    caminho: z.string(),
    operador: OperadorComparacao,
    valor: z.union([z.number(), z.string(), z.boolean()]),
}).strict();
const PredicadoFlag = z.object({
    tipo: z.literal('flag'),
    flag: z.string(),
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
const PredicadoAtributo = z.object({
    tipo: z.literal('atributo'),
    atributo: AtributoRPG,
    operador: OperadorComparacao,
    valor: z.number().int(),
}).strict();
const PredicadoFolha = z.union([
    PredicadoVariavel,
    PredicadoFlag,
    PredicadoRelacionamento,
    PredicadoIdade,
    PredicadoAtributo,
]);
export const PredicateTreeSchema = z.lazy(() => z.union([
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
]));
//# sourceMappingURL=predicate.js.map