import { z } from 'zod';
export const JointId = z.enum([
    'root_pelvis', 'spine', 'neck', 'head',
    'shoulder_L', 'elbow_L', 'wrist_L',
    'shoulder_R', 'elbow_R', 'wrist_R',
    'hip_L', 'knee_L', 'ankle_L',
    'hip_R', 'knee_R',
]);
export const ExpressaoFacial = z.enum([
    'neutra', 'feliz', 'triste', 'raiva', 'surpresa', 'medo',
    'nojo', 'flertando', 'cansada', 'desconfiada', 'arrogante',
]);
export const PresetMao = z.enum([
    'relaxada', 'aberta', 'fechada', 'apontando',
    'joinha', 'palma_aberta', 'segurando_objeto', 'dedo_do_meio',
]);
export const PresetPe = z.enum([
    'descalco', 'tenis', 'sapato_social', 'bota',
    'salto_alto', 'na_ponta', 'relaxado_no_chao',
]);
export const RotacaoJoint = z.object({
    jointId: JointId,
    rotacaoGraus: z.number().min(-180).max(180),
}).strict();
export const CategoriaPose = z.enum(['basic', 'interactions', 'emotional', 'action']);
export const MetadataPose = z.object({
    criadoEm: z.string().datetime(),
    criadoPor: z.enum(['humano', 'ia', 'ia_validada']),
    aprovadoEm: z.string().datetime().optional(),
    versao: z.number().int().min(1).default(1),
}).strict();
export const Pose = z.object({
    schemaVersion: z.literal('1.0.0'),
    poseId: z.string().regex(/^[a-z][a-z0-9_]*$/),
    categoria: CategoriaPose,
    descricao: z.string().min(3).max(200),
    rotacoes: z.array(RotacaoJoint),
    expressaoFacial: ExpressaoFacial,
    intensidadeExpressao: z.number().min(0).max(100).default(50),
    maoEsquerda: PresetMao.default('relaxada'),
    maoDireita: PresetMao.default('relaxada'),
    peEsquerdo: PresetPe.default('descalco'),
    peDireito: PresetPe.default('descalco'),
    metadata: MetadataPose,
}).strict();
//# sourceMappingURL=pose.js.map