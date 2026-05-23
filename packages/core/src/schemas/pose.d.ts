import { z } from 'zod';
export declare const JointId: z.ZodEnum<["root_pelvis", "spine", "neck", "head", "shoulder_L", "elbow_L", "wrist_L", "shoulder_R", "elbow_R", "wrist_R", "hip_L", "knee_L", "ankle_L", "hip_R", "knee_R"]>;
export type JointId = z.infer<typeof JointId>;
export declare const ExpressaoFacial: z.ZodEnum<["neutra", "feliz", "triste", "raiva", "surpresa", "medo", "nojo", "flertando", "cansada", "desconfiada", "arrogante"]>;
export type ExpressaoFacial = z.infer<typeof ExpressaoFacial>;
export declare const PresetMao: z.ZodEnum<["relaxada", "aberta", "fechada", "apontando", "joinha", "palma_aberta", "segurando_objeto", "dedo_do_meio"]>;
export type PresetMao = z.infer<typeof PresetMao>;
export declare const PresetPe: z.ZodEnum<["descalco", "tenis", "sapato_social", "bota", "salto_alto", "na_ponta", "relaxado_no_chao"]>;
export type PresetPe = z.infer<typeof PresetPe>;
export declare const RotacaoJoint: z.ZodObject<{
    jointId: z.ZodEnum<["root_pelvis", "spine", "neck", "head", "shoulder_L", "elbow_L", "wrist_L", "shoulder_R", "elbow_R", "wrist_R", "hip_L", "knee_L", "ankle_L", "hip_R", "knee_R"]>;
    rotacaoGraus: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    jointId: "root_pelvis" | "spine" | "neck" | "head" | "shoulder_L" | "elbow_L" | "wrist_L" | "shoulder_R" | "elbow_R" | "wrist_R" | "hip_L" | "knee_L" | "ankle_L" | "hip_R" | "knee_R";
    rotacaoGraus: number;
}, {
    jointId: "root_pelvis" | "spine" | "neck" | "head" | "shoulder_L" | "elbow_L" | "wrist_L" | "shoulder_R" | "elbow_R" | "wrist_R" | "hip_L" | "knee_L" | "ankle_L" | "hip_R" | "knee_R";
    rotacaoGraus: number;
}>;
export type RotacaoJoint = z.infer<typeof RotacaoJoint>;
export declare const CategoriaPose: z.ZodEnum<["basic", "interactions", "emotional", "action"]>;
export type CategoriaPose = z.infer<typeof CategoriaPose>;
export declare const MetadataPose: z.ZodObject<{
    criadoEm: z.ZodString;
    criadoPor: z.ZodEnum<["humano", "ia", "ia_validada"]>;
    aprovadoEm: z.ZodOptional<z.ZodString>;
    versao: z.ZodDefault<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    criadoEm: string;
    criadoPor: "humano" | "ia" | "ia_validada";
    versao: number;
    aprovadoEm?: string | undefined;
}, {
    criadoEm: string;
    criadoPor: "humano" | "ia" | "ia_validada";
    aprovadoEm?: string | undefined;
    versao?: number | undefined;
}>;
export declare const Pose: z.ZodObject<{
    schemaVersion: z.ZodLiteral<"1.0.0">;
    poseId: z.ZodString;
    categoria: z.ZodEnum<["basic", "interactions", "emotional", "action"]>;
    descricao: z.ZodString;
    rotacoes: z.ZodArray<z.ZodObject<{
        jointId: z.ZodEnum<["root_pelvis", "spine", "neck", "head", "shoulder_L", "elbow_L", "wrist_L", "shoulder_R", "elbow_R", "wrist_R", "hip_L", "knee_L", "ankle_L", "hip_R", "knee_R"]>;
        rotacaoGraus: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        jointId: "root_pelvis" | "spine" | "neck" | "head" | "shoulder_L" | "elbow_L" | "wrist_L" | "shoulder_R" | "elbow_R" | "wrist_R" | "hip_L" | "knee_L" | "ankle_L" | "hip_R" | "knee_R";
        rotacaoGraus: number;
    }, {
        jointId: "root_pelvis" | "spine" | "neck" | "head" | "shoulder_L" | "elbow_L" | "wrist_L" | "shoulder_R" | "elbow_R" | "wrist_R" | "hip_L" | "knee_L" | "ankle_L" | "hip_R" | "knee_R";
        rotacaoGraus: number;
    }>, "many">;
    expressaoFacial: z.ZodEnum<["neutra", "feliz", "triste", "raiva", "surpresa", "medo", "nojo", "flertando", "cansada", "desconfiada", "arrogante"]>;
    intensidadeExpressao: z.ZodDefault<z.ZodNumber>;
    maoEsquerda: z.ZodDefault<z.ZodEnum<["relaxada", "aberta", "fechada", "apontando", "joinha", "palma_aberta", "segurando_objeto", "dedo_do_meio"]>>;
    maoDireita: z.ZodDefault<z.ZodEnum<["relaxada", "aberta", "fechada", "apontando", "joinha", "palma_aberta", "segurando_objeto", "dedo_do_meio"]>>;
    peEsquerdo: z.ZodDefault<z.ZodEnum<["descalco", "tenis", "sapato_social", "bota", "salto_alto", "na_ponta", "relaxado_no_chao"]>>;
    peDireito: z.ZodDefault<z.ZodEnum<["descalco", "tenis", "sapato_social", "bota", "salto_alto", "na_ponta", "relaxado_no_chao"]>>;
    metadata: z.ZodObject<{
        criadoEm: z.ZodString;
        criadoPor: z.ZodEnum<["humano", "ia", "ia_validada"]>;
        aprovadoEm: z.ZodOptional<z.ZodString>;
        versao: z.ZodDefault<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        criadoEm: string;
        criadoPor: "humano" | "ia" | "ia_validada";
        versao: number;
        aprovadoEm?: string | undefined;
    }, {
        criadoEm: string;
        criadoPor: "humano" | "ia" | "ia_validada";
        aprovadoEm?: string | undefined;
        versao?: number | undefined;
    }>;
}, "strict", z.ZodTypeAny, {
    schemaVersion: "1.0.0";
    poseId: string;
    categoria: "basic" | "interactions" | "emotional" | "action";
    descricao: string;
    rotacoes: {
        jointId: "root_pelvis" | "spine" | "neck" | "head" | "shoulder_L" | "elbow_L" | "wrist_L" | "shoulder_R" | "elbow_R" | "wrist_R" | "hip_L" | "knee_L" | "ankle_L" | "hip_R" | "knee_R";
        rotacaoGraus: number;
    }[];
    expressaoFacial: "neutra" | "feliz" | "triste" | "raiva" | "surpresa" | "medo" | "nojo" | "flertando" | "cansada" | "desconfiada" | "arrogante";
    intensidadeExpressao: number;
    maoEsquerda: "relaxada" | "aberta" | "fechada" | "apontando" | "joinha" | "palma_aberta" | "segurando_objeto" | "dedo_do_meio";
    maoDireita: "relaxada" | "aberta" | "fechada" | "apontando" | "joinha" | "palma_aberta" | "segurando_objeto" | "dedo_do_meio";
    peEsquerdo: "descalco" | "tenis" | "sapato_social" | "bota" | "salto_alto" | "na_ponta" | "relaxado_no_chao";
    peDireito: "descalco" | "tenis" | "sapato_social" | "bota" | "salto_alto" | "na_ponta" | "relaxado_no_chao";
    metadata: {
        criadoEm: string;
        criadoPor: "humano" | "ia" | "ia_validada";
        versao: number;
        aprovadoEm?: string | undefined;
    };
}, {
    schemaVersion: "1.0.0";
    poseId: string;
    categoria: "basic" | "interactions" | "emotional" | "action";
    descricao: string;
    rotacoes: {
        jointId: "root_pelvis" | "spine" | "neck" | "head" | "shoulder_L" | "elbow_L" | "wrist_L" | "shoulder_R" | "elbow_R" | "wrist_R" | "hip_L" | "knee_L" | "ankle_L" | "hip_R" | "knee_R";
        rotacaoGraus: number;
    }[];
    expressaoFacial: "neutra" | "feliz" | "triste" | "raiva" | "surpresa" | "medo" | "nojo" | "flertando" | "cansada" | "desconfiada" | "arrogante";
    metadata: {
        criadoEm: string;
        criadoPor: "humano" | "ia" | "ia_validada";
        aprovadoEm?: string | undefined;
        versao?: number | undefined;
    };
    intensidadeExpressao?: number | undefined;
    maoEsquerda?: "relaxada" | "aberta" | "fechada" | "apontando" | "joinha" | "palma_aberta" | "segurando_objeto" | "dedo_do_meio" | undefined;
    maoDireita?: "relaxada" | "aberta" | "fechada" | "apontando" | "joinha" | "palma_aberta" | "segurando_objeto" | "dedo_do_meio" | undefined;
    peEsquerdo?: "descalco" | "tenis" | "sapato_social" | "bota" | "salto_alto" | "na_ponta" | "relaxado_no_chao" | undefined;
    peDireito?: "descalco" | "tenis" | "sapato_social" | "bota" | "salto_alto" | "na_ponta" | "relaxado_no_chao" | undefined;
}>;
export type Pose = z.infer<typeof Pose>;
//# sourceMappingURL=pose.d.ts.map