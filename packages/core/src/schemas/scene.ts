import { z } from 'zod';
import { Pose, ExpressaoFacial } from './pose';

export const PapelAtor = z.enum([
  'protagonista',
  'npc_primario',
  'npc_secundario',
  'npc_terciario',
]);

export const Background = z.enum([
  'sala_estar', 'cozinha', 'quarto', 'banheiro',
  'rua_residencial', 'centro_comercial', 'praca',
  'escola_sala', 'escola_corredor', 'escola_patio',
  'escritorio_open', 'escritorio_sala_reuniao',
  'restaurante', 'bar', 'balada',
  'hospital_quarto', 'hospital_corredor',
  'parque', 'praia', 'shopping',
  'igreja', 'cemiterio',
  'fundo_vazio',
]);

export const FramingCamera = z.enum(['wide', 'medium', 'close', 'closeup']);

export const HumorCena = z.enum([
  'comico', 'tenso', 'melancolico', 'intimo',
  'caotico', 'neutro', 'romantico', 'agressivo',
]);

export const Ator = z.object({
  papel: PapelAtor,
  posicao: z.object({
    x: z.number().min(-1).max(1),  // -1 = esquerda, 1 = direita
    y: z.number().min(0).max(1),   // 0 = chão, 1 = topo
    facing: z.enum(['L', 'R']),
  }),
  pose: Pose,
  zOrder: z.number().int().default(0),
}).strict();

export const Contato = z.object({
  // âncora entre rigs (mão de A toca ombro de B)
  fromAtorPapel: PapelAtor,
  fromSocket: z.string(),  // ex: 'right_hand_socket'
  toAtorPapel: PapelAtor,
  toSocket: z.string(),    // ex: 'left_shoulder_socket'
}).strict();

export const BeatNarracao = z.object({
  tipo: z.literal('narracao'),
  texto: z.string().min(1).max(500),
  tags: z.array(z.string()).default([]),
}).strict();

export const BeatDialogo = z.object({
  tipo: z.literal('dialogo'),
  papelAtor: PapelAtor,
  texto: z.string().min(1).max(500),
  mudancaExpressao: ExpressaoFacial.optional(),  // muda expressão durante o diálogo
}).strict();

export const BeatTransicao = z.object({
  tipo: z.literal('transicao'),
  efeito: z.enum(['fade', 'cut', 'dissolve', 'slide_L', 'slide_R']),
  duracaoMs: z.number().int().min(0).max(5000),
}).strict();

export const BeatDiretiva = z.object({
  tipo: z.literal('diretiva'),
  comando: z.enum([
    'mudar_pose', 'mover_ator', 'mudar_expressao',
    'mudar_camera', 'tocar_som', 'pausar',
  ]),
  parametros: z.record(z.unknown()),  // validados por handler específico
}).strict();

export const OpcaoEscolha = z.object({
  texto: z.string().min(1).max(200),
  requisitos: z.unknown().optional(),  // PredicateTree, definido abaixo
  atributoCheck: z.object({
    atributo: z.enum(['forca', 'inteligencia', 'carisma', 'constituicao', 'sorte']),
    dificuldade: z.number().int().min(1).max(30),
  }).optional(),
  efeitos: z.array(z.unknown()),  // Effect[], definido abaixo
  proximoEventoId: z.string().optional(),
}).strict();

export const BeatEscolha = z.object({
  tipo: z.literal('escolha'),
  opcoes: z.array(OpcaoEscolha).min(2).max(5),
}).strict();

export const Beat = z.discriminatedUnion('tipo', [
  BeatNarracao, BeatDialogo, BeatTransicao,
  BeatDiretiva, BeatEscolha,
]);

export const Scene = z.object({
  schemaVersion: z.literal('1.0.0'),
  sceneId: z.string().regex(/^[a-z][a-z0-9_]*$/),
  descricaoCurta: z.string().min(3).max(200),

  background: Background,
  framing: FramingCamera,
  humor: HumorCena,

  atores: z.array(Ator).min(1).max(4),
  contatos: z.array(Contato).default([]),

  beats: z.array(Beat).min(1),

  metadata: z.object({
    criadoEm: z.string().datetime(),
    criadoPor: z.enum(['humano', 'ia', 'ia_validada']),
    aprovadoEm: z.string().datetime().optional(),
    versao: z.number().int().min(1).default(1),
  }),
}).strict();

export type Scene = z.infer<typeof Scene>;
