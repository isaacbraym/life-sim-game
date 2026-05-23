import { z } from 'zod';
import { Character } from './character';
import { Npc } from './npc';

export const RitmoJogo = z.enum(['mensal', 'semestral', 'anual']);
export type RitmoJogo = z.infer<typeof RitmoJogo>;

export const ConfiguracoesSave = z.object({
  ritmo: RitmoJogo,
  conteudoAdultoLiberado: z.boolean().default(false),
  idioma: z.enum(['pt-BR', 'en-US']).default('pt-BR'),
}).strict();

export const EstadoMundo = z.object({
  anoAtual: z.number().int(),
  mesAtual: z.number().int().min(1).max(12),
  flagsGlobais: z.array(z.string()).default([]),
}).strict();

export const SaveSlot = z.object({
  schemaVersion: z.literal('1.0.0'),
  saveId: z.string().uuid(),
  nomeSlot: z.string().min(1).max(50),
  criadoEm: z.string().datetime(),
  ultimaPartida: z.string().datetime(),
  tempoJogadoMs: z.number().int().min(0).default(0),
  configuracoes: ConfiguracoesSave,
  protagonista: Character,
  roster: z.array(Npc),
  estadoMundo: EstadoMundo,
}).strict();
export type SaveSlot = z.infer<typeof SaveSlot>;
