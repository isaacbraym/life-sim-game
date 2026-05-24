import { z } from 'zod';
import { Pose, ExpressaoFacial } from './pose';
import { Effect } from './effect';
import { PredicateTreeSchema } from './predicate';
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
export const HumorCena = z.enum([
    'comico', 'tenso', 'melancolico', 'intimo',
    'caotico', 'neutro', 'romantico', 'agressivo',
]);
export const PapelAtor = z.enum([
    'protagonista', 'npc_primario', 'npc_secundario', 'npc_terciario',
]);
export const FramingCamera = z.enum(['wide', 'medium', 'close', 'closeup']);
export const Ator = z.object({
    papel: PapelAtor,
    posicao: z.object({
        x: z.number().min(-1).max(1),
        y: z.number().min(0).max(1),
        facing: z.enum(['L', 'R']),
    }).strict(),
    pose: Pose,
    zOrder: z.number().int().default(0),
}).strict();
export const Contato = z.object({
    fromAtorPapel: PapelAtor,
    fromSocket: z.string(),
    toAtorPapel: PapelAtor,
    toSocket: z.string(),
}).strict();
export const OpcaoEscolha = z.object({
    texto: z.string().min(1).max(200),
    requisitos: PredicateTreeSchema.optional(),
    atributoCheck: z.object({
        atributo: z.enum(['forca', 'inteligencia', 'carisma', 'constituicao', 'sorte']),
        dificuldade: z.number().int().min(1).max(30),
    }).strict().optional(),
    efeitos: z.array(Effect),
    proximoEventoId: z.string().optional(),
}).strict();
const BeatNarracao = z.object({
    tipo: z.literal('narracao'),
    texto: z.string().min(1).max(500),
    tags: z.array(z.string()).default([]),
}).strict();
const BeatDialogo = z.object({
    tipo: z.literal('dialogo'),
    papelAtor: PapelAtor,
    texto: z.string().min(1).max(500),
    mudancaExpressao: ExpressaoFacial.optional(),
}).strict();
const BeatTransicao = z.object({
    tipo: z.literal('transicao'),
    efeito: z.enum(['fade', 'cut', 'dissolve', 'slide_L', 'slide_R']),
    duracaoMs: z.number().int().min(0).max(5000),
}).strict();
const BeatEscolha = z.object({
    tipo: z.literal('escolha'),
    opcoes: z.array(OpcaoEscolha).min(2).max(5),
}).strict();
export const Beat = z.discriminatedUnion('tipo', [
    BeatNarracao,
    BeatDialogo,
    BeatTransicao,
    BeatEscolha,
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
    }).strict(),
}).strict();
//# sourceMappingURL=scene.js.map