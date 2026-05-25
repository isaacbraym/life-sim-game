import { z } from 'zod';

export const ClasseSocial = z.enum([
  'baixa',
  'media_baixa',
  'media',
  'media_alta',
  'alta',
]);
export type ClasseSocial = z.infer<typeof ClasseSocial>;

export const EstruturaFamiliar = z.enum([
  'pais_casados',
  'pais_divorciados',
  'mae_solo',
  'pai_solo',
  'pai_ausente',
  'mae_falecida',
  'pai_falecido',
  'avos_tutores',
  'orfanato',
  'familia_adotiva',
]);
export type EstruturaFamiliar = z.infer<typeof EstruturaFamiliar>;

export const BirthProfile = z.object({
  anoNascimento: z.number().int().min(1985).max(2000),
  classeSocial: ClasseSocial,
  estruturaFamiliar: EstruturaFamiliar,
  qualidadeEducacaoInicial: z.enum(['baixa', 'media', 'alta']),
  bairroInicial: z.string(),
  condicaoHabitacional: z.enum(['mocorongo', 'simples', 'media', 'boa', 'luxo']),
  atributosGeneticos: z.object({
    forca: z.number().int().min(6).max(14),
    inteligencia: z.number().int().min(6).max(14),
    carisma: z.number().int().min(6).max(14),
    constituicao: z.number().int().min(6).max(14),
    sorte: z.number().int().min(6).max(14),
  }),
});
export type BirthProfile = z.infer<typeof BirthProfile>;
