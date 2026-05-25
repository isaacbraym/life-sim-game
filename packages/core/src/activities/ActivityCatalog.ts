// @deprecated Use ActivityBridge.converterAtividadeParaAcao para converter para ActionDefinition.
import { z } from 'zod';
import { Effect } from '../schemas/effect';
import type { Effect as Efeito } from '../schemas/effect';

export type CategoriaAtividade = 'trabalho' | 'estudo' | 'lazer' | 'social' | 'saude';

export type Atividade = {
  readonly id: string;
  readonly rotulo: string;
  readonly categoria: CategoriaAtividade;
  readonly icone: string;
  readonly hint: string;
  readonly idadeMinima: number;
  readonly custoDinheiro: number;
  readonly efeitos: readonly Efeito[];
};

export const AtividadeSchema = z.object({
  id: z.string().min(1),
  rotulo: z.string().min(1),
  categoria: z.enum(['trabalho', 'estudo', 'lazer', 'social', 'saude']),
  icone: z.string().min(1),
  hint: z.string().min(1),
  idadeMinima: z.number().int().min(0),
  custoDinheiro: z.number(),
  efeitos: z.array(Effect),
}).strict();

export const ATIVIDADES_BASE: readonly Atividade[] = z.array(AtividadeSchema).parse([
  {
    id: 'academia',
    rotulo: 'Academia',
    categoria: 'saude',
    icone: 'dumbbell',
    hint: '-R$ 80; +Saude; +Forca',
    idadeMinima: 12,
    custoDinheiro: -80,
    efeitos: [
      { tipo: 'alterar_dinheiro', delta: -80 },
      { tipo: 'alterar_saude', delta: 8 },
      { tipo: 'alterar_humor', delta: 2 },
      { tipo: 'alterar_atributo', atributo: 'forca', delta: 1 },
    ],
  },
  {
    id: 'estudar',
    rotulo: 'Estudar',
    categoria: 'estudo',
    icone: 'book',
    hint: '+Inteligencia; -Humor',
    idadeMinima: 4,
    custoDinheiro: 0,
    efeitos: [
      { tipo: 'alterar_atributo', atributo: 'inteligencia', delta: 1 },
      { tipo: 'alterar_humor', delta: -2 },
    ],
  },
  {
    id: 'sair_noite',
    rotulo: 'Sair a noite',
    categoria: 'lazer',
    icone: 'glass',
    hint: '-R$ 120; +Humor; -Saude',
    idadeMinima: 18,
    custoDinheiro: -120,
    efeitos: [
      { tipo: 'alterar_dinheiro', delta: -120 },
      { tipo: 'alterar_humor', delta: 12 },
      { tipo: 'alterar_saude', delta: -4 },
      { tipo: 'alterar_atributo', atributo: 'carisma', delta: 1 },
    ],
  },
  {
    id: 'consulta_medica',
    rotulo: 'Consulta medica',
    categoria: 'saude',
    icone: 'cross',
    hint: '-R$ 220; +Saude',
    idadeMinima: 0,
    custoDinheiro: -220,
    efeitos: [
      { tipo: 'alterar_dinheiro', delta: -220 },
      { tipo: 'alterar_saude', delta: 18 },
      { tipo: 'alterar_humor', delta: -1 },
    ],
  },
  {
    id: 'ver_pessoas',
    rotulo: 'Ver pessoas',
    categoria: 'social',
    icone: 'people',
    hint: '+Humor; +Carisma',
    idadeMinima: 0,
    custoDinheiro: 0,
    efeitos: [
      { tipo: 'alterar_humor', delta: 5 },
      { tipo: 'alterar_atributo', atributo: 'carisma', delta: 1 },
    ],
  },
  {
    id: 'meditar',
    rotulo: 'Meditar',
    categoria: 'saude',
    icone: 'heart',
    hint: '+Humor; +Saude',
    idadeMinima: 8,
    custoDinheiro: 0,
    efeitos: [
      { tipo: 'alterar_humor', delta: 8 },
      { tipo: 'alterar_saude', delta: 2 },
    ],
  },
  {
    id: 'ler_livro',
    rotulo: 'Ler livro',
    categoria: 'estudo',
    icone: 'book',
    hint: '-R$ 35; +Inteligencia',
    idadeMinima: 6,
    custoDinheiro: -35,
    efeitos: [
      { tipo: 'alterar_dinheiro', delta: -35 },
      { tipo: 'alterar_atributo', atributo: 'inteligencia', delta: 1 },
      { tipo: 'alterar_humor', delta: 3 },
    ],
  },
  {
    id: 'sair_correr',
    rotulo: 'Sair para correr',
    categoria: 'saude',
    icone: 'dumbbell',
    hint: '+Saude; +Constituicao',
    idadeMinima: 8,
    custoDinheiro: 0,
    efeitos: [
      { tipo: 'alterar_saude', delta: 6 },
      { tipo: 'alterar_humor', delta: 2 },
      { tipo: 'alterar_atributo', atributo: 'constituicao', delta: 1 },
    ],
  },
  {
    id: 'terapia',
    rotulo: 'Terapia',
    categoria: 'saude',
    icone: 'heart',
    hint: '-R$ 180; +Humor',
    idadeMinima: 12,
    custoDinheiro: -180,
    efeitos: [
      { tipo: 'alterar_dinheiro', delta: -180 },
      { tipo: 'alterar_humor', delta: 14 },
      { tipo: 'alterar_saude', delta: 4 },
    ],
  },
  {
    id: 'voluntariado',
    rotulo: 'Voluntariado',
    categoria: 'social',
    icone: 'people',
    hint: '+Humor; +Carisma',
    idadeMinima: 14,
    custoDinheiro: 0,
    efeitos: [
      { tipo: 'alterar_humor', delta: 6 },
      { tipo: 'alterar_atributo', atributo: 'carisma', delta: 1 },
    ],
  },
]);
