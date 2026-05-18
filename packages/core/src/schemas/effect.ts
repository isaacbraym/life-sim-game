import { z } from 'zod';

export const Effect = z.discriminatedUnion('tipo', [
  z.object({
    tipo: z.literal('alterar_atributo'),
    atributo: z.enum(['forca', 'inteligencia', 'carisma', 'constituicao', 'sorte']),
    delta: z.number().int(),
  }).strict(),
  z.object({
    tipo: z.literal('alterar_dinheiro'),
    delta: z.number(),  // pode ser fracionado (centavos)
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
    delta: z.number().int(),  // -100 a 100
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
    delta: z.number().int(),  // -100 a 100
  }).strict(),
  z.object({
    tipo: z.literal('alterar_humor'),
    delta: z.number().int(),  // -100 a 100
  }).strict(),
  z.object({
    tipo: z.literal('aplicar_status'),
    status: z.enum(['doente', 'preso', 'casado', 'separado', 'aposentado']),
    duracao: z.number().int().optional(),  // em meses; undefined = permanente
  }).strict(),
  z.object({
    tipo: z.literal('disparar_evento'),
    eventoId: z.string(),
    atrasoMeses: z.number().int().min(0).default(0),
  }).strict(),
]);

export type Effect = z.infer<typeof Effect>;
