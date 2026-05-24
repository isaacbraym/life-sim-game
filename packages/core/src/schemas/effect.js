import { z } from 'zod';
export const AtributoRPG = z.enum([
    'forca', 'inteligencia', 'carisma', 'constituicao', 'sorte',
]);
export const StatusPersonagem = z.enum([
    'doente', 'preso', 'casado', 'separado', 'aposentado',
]);
export const Effect = z.discriminatedUnion('tipo', [
    z.object({
        tipo: z.literal('alterar_atributo'),
        atributo: AtributoRPG,
        delta: z.number().int(),
    }).strict(),
    z.object({
        tipo: z.literal('alterar_dinheiro'),
        delta: z.number(),
    }).strict(),
    z.object({
        tipo: z.literal('adicionar_flag'),
        flag: z.string(),
    }).strict(),
    z.object({
        tipo: z.literal('remover_flag'),
        flag: z.string(),
    }).strict(),
    z.object({
        tipo: z.literal('alterar_relacionamento'),
        npcId: z.string(),
        delta: z.number().int(),
    }).strict(),
    z.object({
        tipo: z.literal('matar_npc'),
        npcId: z.string(),
        causa: z.string(),
    }).strict(),
    z.object({
        tipo: z.literal('mudar_profissao'),
        profissao: z.string(),
        salario: z.number().optional(),
    }).strict(),
    z.object({
        tipo: z.literal('alterar_saude'),
        delta: z.number().int(),
    }).strict(),
    z.object({
        tipo: z.literal('alterar_humor'),
        delta: z.number().int(),
    }).strict(),
    z.object({
        tipo: z.literal('aplicar_status'),
        status: StatusPersonagem,
        duracao: z.number().int().optional(),
    }).strict(),
    z.object({
        tipo: z.literal('disparar_evento'),
        eventoId: z.string(),
        atrasoMeses: z.number().int().min(0).default(0),
    }).strict(),
]);
//# sourceMappingURL=effect.js.map