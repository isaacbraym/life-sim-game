import { z } from 'zod';
import { TracosFisicos, TracosVariaveis, Atributos, DataNascimento } from './character';

export const PersistenciaNpc = z.enum(['permanente', 'recorrente', 'descartavel']);
export type PersistenciaNpc = z.infer<typeof PersistenciaNpc>;

export const TipoVinculo = z.enum([
  'familia_pai', 'familia_mae', 'familia_irmao', 'familia_filho',
  'familia_conjuge', 'familia_extendida',
  'amigo_proximo', 'amigo_casual', 'colega_trabalho', 'colega_escola',
  'chefe', 'subordinado',
  'romance_atual', 'ex_romance',
  'inimigo', 'rival',
  'profissional', 'conhecido',
]);
export type TipoVinculo = z.infer<typeof TipoVinculo>;

export const Relacionamento = z.object({
  tipo: TipoVinculo,
  afeto: z.number().int().min(-100).max(100).default(0),
  conhecidoDesde: z.object({
    ano: z.number().int(),
    mes: z.number().int().min(1).max(12),
  }).strict(),
  ultimaInteracao: z.object({
    ano: z.number().int(),
    mes: z.number().int().min(1).max(12),
    eventoId: z.string(),
  }).strict().optional(),
}).strict();
export type Relacionamento = z.infer<typeof Relacionamento>;

export const Npc = z.object({
  schemaVersion: z.literal('1.0.0'),
  npcId: z.string().uuid(),
  nome: z.string().min(1).max(100),
  sobrenome: z.string().min(1).max(100),
  genero: z.enum(['M', 'F', 'outro']),
  dataNascimento: DataNascimento,
  tracosFisicos: TracosFisicos,
  tracosVariaveis: TracosVariaveis,
  atributos: Atributos.optional(),
  persistencia: PersistenciaNpc,
  tags: z.array(z.string()).default([]),
  profissaoAtual: z.string().optional(),
  statusFinanceiro: z.enum(['pobre', 'medio', 'rico', 'milionario']).default('medio'),
  relacionamentoComJogador: Relacionamento,
  relacionamentosComOutrosNpcs: z.record(z.string(), Relacionamento).default({}),
  vivo: z.boolean().default(true),
  dataMorte: z.object({
    ano: z.number().int(),
    mes: z.number().int().min(1).max(12),
    causa: z.string(),
  }).strict().optional(),
  historicoInteracoes: z.array(z.object({
    eventoId: z.string(),
    ano: z.number().int(),
    mes: z.number().int(),
  }).strict()).default([]),
}).strict();
export type Npc = z.infer<typeof Npc>;
