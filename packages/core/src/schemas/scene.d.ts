import { z } from 'zod';
export declare const Background: z.ZodEnum<["sala_estar", "cozinha", "quarto", "banheiro", "rua_residencial", "centro_comercial", "praca", "escola_sala", "escola_corredor", "escola_patio", "escritorio_open", "escritorio_sala_reuniao", "restaurante", "bar", "balada", "hospital_quarto", "hospital_corredor", "parque", "praia", "shopping", "igreja", "cemiterio", "fundo_vazio"]>;
export type Background = z.infer<typeof Background>;
export declare const HumorCena: z.ZodEnum<["comico", "tenso", "melancolico", "intimo", "caotico", "neutro", "romantico", "agressivo"]>;
export type HumorCena = z.infer<typeof HumorCena>;
export declare const PapelAtor: z.ZodEnum<["protagonista", "npc_primario", "npc_secundario", "npc_terciario"]>;
export type PapelAtor = z.infer<typeof PapelAtor>;
export declare const FramingCamera: z.ZodEnum<["wide", "medium", "close", "closeup"]>;
export declare const Ator: z.ZodObject<{
    papel: z.ZodEnum<["protagonista", "npc_primario", "npc_secundario", "npc_terciario"]>;
    posicao: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        facing: z.ZodEnum<["L", "R"]>;
    }, "strict", z.ZodTypeAny, {
        x: number;
        y: number;
        facing: "L" | "R";
    }, {
        x: number;
        y: number;
        facing: "L" | "R";
    }>;
    pose: z.ZodObject<{
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
    zOrder: z.ZodDefault<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    papel: "protagonista" | "npc_primario" | "npc_secundario" | "npc_terciario";
    posicao: {
        x: number;
        y: number;
        facing: "L" | "R";
    };
    pose: {
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
    };
    zOrder: number;
}, {
    papel: "protagonista" | "npc_primario" | "npc_secundario" | "npc_terciario";
    posicao: {
        x: number;
        y: number;
        facing: "L" | "R";
    };
    pose: {
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
    };
    zOrder?: number | undefined;
}>;
export type Ator = z.infer<typeof Ator>;
export declare const Contato: z.ZodObject<{
    fromAtorPapel: z.ZodEnum<["protagonista", "npc_primario", "npc_secundario", "npc_terciario"]>;
    fromSocket: z.ZodString;
    toAtorPapel: z.ZodEnum<["protagonista", "npc_primario", "npc_secundario", "npc_terciario"]>;
    toSocket: z.ZodString;
}, "strict", z.ZodTypeAny, {
    fromAtorPapel: "protagonista" | "npc_primario" | "npc_secundario" | "npc_terciario";
    fromSocket: string;
    toAtorPapel: "protagonista" | "npc_primario" | "npc_secundario" | "npc_terciario";
    toSocket: string;
}, {
    fromAtorPapel: "protagonista" | "npc_primario" | "npc_secundario" | "npc_terciario";
    fromSocket: string;
    toAtorPapel: "protagonista" | "npc_primario" | "npc_secundario" | "npc_terciario";
    toSocket: string;
}>;
export declare const OpcaoEscolha: z.ZodObject<{
    texto: z.ZodString;
    requisitos: z.ZodOptional<z.ZodType<import("./predicate").PredicateTree, z.ZodTypeDef, unknown>>;
    atributoCheck: z.ZodOptional<z.ZodObject<{
        atributo: z.ZodEnum<["forca", "inteligencia", "carisma", "constituicao", "sorte"]>;
        dificuldade: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
        dificuldade: number;
    }, {
        atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
        dificuldade: number;
    }>>;
    efeitos: z.ZodArray<z.ZodDiscriminatedUnion<"tipo", [z.ZodObject<{
        tipo: z.ZodLiteral<"alterar_atributo">;
        atributo: z.ZodEnum<["forca", "inteligencia", "carisma", "constituicao", "sorte"]>;
        delta: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        tipo: "alterar_atributo";
        atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
        delta: number;
    }, {
        tipo: "alterar_atributo";
        atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
        delta: number;
    }>, z.ZodObject<{
        tipo: z.ZodLiteral<"alterar_dinheiro">;
        delta: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        tipo: "alterar_dinheiro";
        delta: number;
    }, {
        tipo: "alterar_dinheiro";
        delta: number;
    }>, z.ZodObject<{
        tipo: z.ZodLiteral<"adicionar_flag">;
        flag: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        tipo: "adicionar_flag";
        flag: string;
    }, {
        tipo: "adicionar_flag";
        flag: string;
    }>, z.ZodObject<{
        tipo: z.ZodLiteral<"remover_flag">;
        flag: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        tipo: "remover_flag";
        flag: string;
    }, {
        tipo: "remover_flag";
        flag: string;
    }>, z.ZodObject<{
        tipo: z.ZodLiteral<"alterar_relacionamento">;
        npcId: z.ZodString;
        delta: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        tipo: "alterar_relacionamento";
        delta: number;
        npcId: string;
    }, {
        tipo: "alterar_relacionamento";
        delta: number;
        npcId: string;
    }>, z.ZodObject<{
        tipo: z.ZodLiteral<"matar_npc">;
        npcId: z.ZodString;
        causa: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        tipo: "matar_npc";
        npcId: string;
        causa: string;
    }, {
        tipo: "matar_npc";
        npcId: string;
        causa: string;
    }>, z.ZodObject<{
        tipo: z.ZodLiteral<"mudar_profissao">;
        profissao: z.ZodString;
        salario: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        tipo: "mudar_profissao";
        profissao: string;
        salario?: number | undefined;
    }, {
        tipo: "mudar_profissao";
        profissao: string;
        salario?: number | undefined;
    }>, z.ZodObject<{
        tipo: z.ZodLiteral<"alterar_saude">;
        delta: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        tipo: "alterar_saude";
        delta: number;
    }, {
        tipo: "alterar_saude";
        delta: number;
    }>, z.ZodObject<{
        tipo: z.ZodLiteral<"alterar_humor">;
        delta: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        tipo: "alterar_humor";
        delta: number;
    }, {
        tipo: "alterar_humor";
        delta: number;
    }>, z.ZodObject<{
        tipo: z.ZodLiteral<"aplicar_status">;
        status: z.ZodEnum<["doente", "preso", "casado", "separado", "aposentado"]>;
        duracao: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        status: "doente" | "preso" | "casado" | "separado" | "aposentado";
        tipo: "aplicar_status";
        duracao?: number | undefined;
    }, {
        status: "doente" | "preso" | "casado" | "separado" | "aposentado";
        tipo: "aplicar_status";
        duracao?: number | undefined;
    }>, z.ZodObject<{
        tipo: z.ZodLiteral<"disparar_evento">;
        eventoId: z.ZodString;
        atrasoMeses: z.ZodDefault<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        tipo: "disparar_evento";
        eventoId: string;
        atrasoMeses: number;
    }, {
        tipo: "disparar_evento";
        eventoId: string;
        atrasoMeses?: number | undefined;
    }>]>, "many">;
    proximoEventoId: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    texto: string;
    efeitos: ({
        tipo: "alterar_atributo";
        atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
        delta: number;
    } | {
        tipo: "alterar_dinheiro";
        delta: number;
    } | {
        tipo: "adicionar_flag";
        flag: string;
    } | {
        tipo: "remover_flag";
        flag: string;
    } | {
        tipo: "alterar_relacionamento";
        delta: number;
        npcId: string;
    } | {
        tipo: "matar_npc";
        npcId: string;
        causa: string;
    } | {
        tipo: "mudar_profissao";
        profissao: string;
        salario?: number | undefined;
    } | {
        tipo: "alterar_saude";
        delta: number;
    } | {
        tipo: "alterar_humor";
        delta: number;
    } | {
        status: "doente" | "preso" | "casado" | "separado" | "aposentado";
        tipo: "aplicar_status";
        duracao?: number | undefined;
    } | {
        tipo: "disparar_evento";
        eventoId: string;
        atrasoMeses: number;
    })[];
    requisitos?: import("./predicate").PredicateTree | undefined;
    atributoCheck?: {
        atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
        dificuldade: number;
    } | undefined;
    proximoEventoId?: string | undefined;
}, {
    texto: string;
    efeitos: ({
        tipo: "alterar_atributo";
        atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
        delta: number;
    } | {
        tipo: "alterar_dinheiro";
        delta: number;
    } | {
        tipo: "adicionar_flag";
        flag: string;
    } | {
        tipo: "remover_flag";
        flag: string;
    } | {
        tipo: "alterar_relacionamento";
        delta: number;
        npcId: string;
    } | {
        tipo: "matar_npc";
        npcId: string;
        causa: string;
    } | {
        tipo: "mudar_profissao";
        profissao: string;
        salario?: number | undefined;
    } | {
        tipo: "alterar_saude";
        delta: number;
    } | {
        tipo: "alterar_humor";
        delta: number;
    } | {
        status: "doente" | "preso" | "casado" | "separado" | "aposentado";
        tipo: "aplicar_status";
        duracao?: number | undefined;
    } | {
        tipo: "disparar_evento";
        eventoId: string;
        atrasoMeses?: number | undefined;
    })[];
    requisitos?: unknown;
    atributoCheck?: {
        atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
        dificuldade: number;
    } | undefined;
    proximoEventoId?: string | undefined;
}>;
export type OpcaoEscolha = z.infer<typeof OpcaoEscolha>;
export declare const Beat: z.ZodDiscriminatedUnion<"tipo", [z.ZodObject<{
    tipo: z.ZodLiteral<"narracao">;
    texto: z.ZodString;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strict", z.ZodTypeAny, {
    tipo: "narracao";
    texto: string;
    tags: string[];
}, {
    tipo: "narracao";
    texto: string;
    tags?: string[] | undefined;
}>, z.ZodObject<{
    tipo: z.ZodLiteral<"dialogo">;
    papelAtor: z.ZodEnum<["protagonista", "npc_primario", "npc_secundario", "npc_terciario"]>;
    texto: z.ZodString;
    mudancaExpressao: z.ZodOptional<z.ZodEnum<["neutra", "feliz", "triste", "raiva", "surpresa", "medo", "nojo", "flertando", "cansada", "desconfiada", "arrogante"]>>;
}, "strict", z.ZodTypeAny, {
    tipo: "dialogo";
    texto: string;
    papelAtor: "protagonista" | "npc_primario" | "npc_secundario" | "npc_terciario";
    mudancaExpressao?: "neutra" | "feliz" | "triste" | "raiva" | "surpresa" | "medo" | "nojo" | "flertando" | "cansada" | "desconfiada" | "arrogante" | undefined;
}, {
    tipo: "dialogo";
    texto: string;
    papelAtor: "protagonista" | "npc_primario" | "npc_secundario" | "npc_terciario";
    mudancaExpressao?: "neutra" | "feliz" | "triste" | "raiva" | "surpresa" | "medo" | "nojo" | "flertando" | "cansada" | "desconfiada" | "arrogante" | undefined;
}>, z.ZodObject<{
    tipo: z.ZodLiteral<"transicao">;
    efeito: z.ZodEnum<["fade", "cut", "dissolve", "slide_L", "slide_R"]>;
    duracaoMs: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    tipo: "transicao";
    efeito: "fade" | "cut" | "dissolve" | "slide_L" | "slide_R";
    duracaoMs: number;
}, {
    tipo: "transicao";
    efeito: "fade" | "cut" | "dissolve" | "slide_L" | "slide_R";
    duracaoMs: number;
}>, z.ZodObject<{
    tipo: z.ZodLiteral<"escolha">;
    opcoes: z.ZodArray<z.ZodObject<{
        texto: z.ZodString;
        requisitos: z.ZodOptional<z.ZodType<import("./predicate").PredicateTree, z.ZodTypeDef, unknown>>;
        atributoCheck: z.ZodOptional<z.ZodObject<{
            atributo: z.ZodEnum<["forca", "inteligencia", "carisma", "constituicao", "sorte"]>;
            dificuldade: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
            dificuldade: number;
        }, {
            atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
            dificuldade: number;
        }>>;
        efeitos: z.ZodArray<z.ZodDiscriminatedUnion<"tipo", [z.ZodObject<{
            tipo: z.ZodLiteral<"alterar_atributo">;
            atributo: z.ZodEnum<["forca", "inteligencia", "carisma", "constituicao", "sorte"]>;
            delta: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            tipo: "alterar_atributo";
            atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
            delta: number;
        }, {
            tipo: "alterar_atributo";
            atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
            delta: number;
        }>, z.ZodObject<{
            tipo: z.ZodLiteral<"alterar_dinheiro">;
            delta: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            tipo: "alterar_dinheiro";
            delta: number;
        }, {
            tipo: "alterar_dinheiro";
            delta: number;
        }>, z.ZodObject<{
            tipo: z.ZodLiteral<"adicionar_flag">;
            flag: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            tipo: "adicionar_flag";
            flag: string;
        }, {
            tipo: "adicionar_flag";
            flag: string;
        }>, z.ZodObject<{
            tipo: z.ZodLiteral<"remover_flag">;
            flag: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            tipo: "remover_flag";
            flag: string;
        }, {
            tipo: "remover_flag";
            flag: string;
        }>, z.ZodObject<{
            tipo: z.ZodLiteral<"alterar_relacionamento">;
            npcId: z.ZodString;
            delta: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            tipo: "alterar_relacionamento";
            delta: number;
            npcId: string;
        }, {
            tipo: "alterar_relacionamento";
            delta: number;
            npcId: string;
        }>, z.ZodObject<{
            tipo: z.ZodLiteral<"matar_npc">;
            npcId: z.ZodString;
            causa: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            tipo: "matar_npc";
            npcId: string;
            causa: string;
        }, {
            tipo: "matar_npc";
            npcId: string;
            causa: string;
        }>, z.ZodObject<{
            tipo: z.ZodLiteral<"mudar_profissao">;
            profissao: z.ZodString;
            salario: z.ZodOptional<z.ZodNumber>;
        }, "strict", z.ZodTypeAny, {
            tipo: "mudar_profissao";
            profissao: string;
            salario?: number | undefined;
        }, {
            tipo: "mudar_profissao";
            profissao: string;
            salario?: number | undefined;
        }>, z.ZodObject<{
            tipo: z.ZodLiteral<"alterar_saude">;
            delta: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            tipo: "alterar_saude";
            delta: number;
        }, {
            tipo: "alterar_saude";
            delta: number;
        }>, z.ZodObject<{
            tipo: z.ZodLiteral<"alterar_humor">;
            delta: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            tipo: "alterar_humor";
            delta: number;
        }, {
            tipo: "alterar_humor";
            delta: number;
        }>, z.ZodObject<{
            tipo: z.ZodLiteral<"aplicar_status">;
            status: z.ZodEnum<["doente", "preso", "casado", "separado", "aposentado"]>;
            duracao: z.ZodOptional<z.ZodNumber>;
        }, "strict", z.ZodTypeAny, {
            status: "doente" | "preso" | "casado" | "separado" | "aposentado";
            tipo: "aplicar_status";
            duracao?: number | undefined;
        }, {
            status: "doente" | "preso" | "casado" | "separado" | "aposentado";
            tipo: "aplicar_status";
            duracao?: number | undefined;
        }>, z.ZodObject<{
            tipo: z.ZodLiteral<"disparar_evento">;
            eventoId: z.ZodString;
            atrasoMeses: z.ZodDefault<z.ZodNumber>;
        }, "strict", z.ZodTypeAny, {
            tipo: "disparar_evento";
            eventoId: string;
            atrasoMeses: number;
        }, {
            tipo: "disparar_evento";
            eventoId: string;
            atrasoMeses?: number | undefined;
        }>]>, "many">;
        proximoEventoId: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        texto: string;
        efeitos: ({
            tipo: "alterar_atributo";
            atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
            delta: number;
        } | {
            tipo: "alterar_dinheiro";
            delta: number;
        } | {
            tipo: "adicionar_flag";
            flag: string;
        } | {
            tipo: "remover_flag";
            flag: string;
        } | {
            tipo: "alterar_relacionamento";
            delta: number;
            npcId: string;
        } | {
            tipo: "matar_npc";
            npcId: string;
            causa: string;
        } | {
            tipo: "mudar_profissao";
            profissao: string;
            salario?: number | undefined;
        } | {
            tipo: "alterar_saude";
            delta: number;
        } | {
            tipo: "alterar_humor";
            delta: number;
        } | {
            status: "doente" | "preso" | "casado" | "separado" | "aposentado";
            tipo: "aplicar_status";
            duracao?: number | undefined;
        } | {
            tipo: "disparar_evento";
            eventoId: string;
            atrasoMeses: number;
        })[];
        requisitos?: import("./predicate").PredicateTree | undefined;
        atributoCheck?: {
            atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
            dificuldade: number;
        } | undefined;
        proximoEventoId?: string | undefined;
    }, {
        texto: string;
        efeitos: ({
            tipo: "alterar_atributo";
            atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
            delta: number;
        } | {
            tipo: "alterar_dinheiro";
            delta: number;
        } | {
            tipo: "adicionar_flag";
            flag: string;
        } | {
            tipo: "remover_flag";
            flag: string;
        } | {
            tipo: "alterar_relacionamento";
            delta: number;
            npcId: string;
        } | {
            tipo: "matar_npc";
            npcId: string;
            causa: string;
        } | {
            tipo: "mudar_profissao";
            profissao: string;
            salario?: number | undefined;
        } | {
            tipo: "alterar_saude";
            delta: number;
        } | {
            tipo: "alterar_humor";
            delta: number;
        } | {
            status: "doente" | "preso" | "casado" | "separado" | "aposentado";
            tipo: "aplicar_status";
            duracao?: number | undefined;
        } | {
            tipo: "disparar_evento";
            eventoId: string;
            atrasoMeses?: number | undefined;
        })[];
        requisitos?: unknown;
        atributoCheck?: {
            atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
            dificuldade: number;
        } | undefined;
        proximoEventoId?: string | undefined;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    tipo: "escolha";
    opcoes: {
        texto: string;
        efeitos: ({
            tipo: "alterar_atributo";
            atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
            delta: number;
        } | {
            tipo: "alterar_dinheiro";
            delta: number;
        } | {
            tipo: "adicionar_flag";
            flag: string;
        } | {
            tipo: "remover_flag";
            flag: string;
        } | {
            tipo: "alterar_relacionamento";
            delta: number;
            npcId: string;
        } | {
            tipo: "matar_npc";
            npcId: string;
            causa: string;
        } | {
            tipo: "mudar_profissao";
            profissao: string;
            salario?: number | undefined;
        } | {
            tipo: "alterar_saude";
            delta: number;
        } | {
            tipo: "alterar_humor";
            delta: number;
        } | {
            status: "doente" | "preso" | "casado" | "separado" | "aposentado";
            tipo: "aplicar_status";
            duracao?: number | undefined;
        } | {
            tipo: "disparar_evento";
            eventoId: string;
            atrasoMeses: number;
        })[];
        requisitos?: import("./predicate").PredicateTree | undefined;
        atributoCheck?: {
            atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
            dificuldade: number;
        } | undefined;
        proximoEventoId?: string | undefined;
    }[];
}, {
    tipo: "escolha";
    opcoes: {
        texto: string;
        efeitos: ({
            tipo: "alterar_atributo";
            atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
            delta: number;
        } | {
            tipo: "alterar_dinheiro";
            delta: number;
        } | {
            tipo: "adicionar_flag";
            flag: string;
        } | {
            tipo: "remover_flag";
            flag: string;
        } | {
            tipo: "alterar_relacionamento";
            delta: number;
            npcId: string;
        } | {
            tipo: "matar_npc";
            npcId: string;
            causa: string;
        } | {
            tipo: "mudar_profissao";
            profissao: string;
            salario?: number | undefined;
        } | {
            tipo: "alterar_saude";
            delta: number;
        } | {
            tipo: "alterar_humor";
            delta: number;
        } | {
            status: "doente" | "preso" | "casado" | "separado" | "aposentado";
            tipo: "aplicar_status";
            duracao?: number | undefined;
        } | {
            tipo: "disparar_evento";
            eventoId: string;
            atrasoMeses?: number | undefined;
        })[];
        requisitos?: unknown;
        atributoCheck?: {
            atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
            dificuldade: number;
        } | undefined;
        proximoEventoId?: string | undefined;
    }[];
}>]>;
export type Beat = z.infer<typeof Beat>;
export declare const Scene: z.ZodObject<{
    schemaVersion: z.ZodLiteral<"1.0.0">;
    sceneId: z.ZodString;
    descricaoCurta: z.ZodString;
    background: z.ZodEnum<["sala_estar", "cozinha", "quarto", "banheiro", "rua_residencial", "centro_comercial", "praca", "escola_sala", "escola_corredor", "escola_patio", "escritorio_open", "escritorio_sala_reuniao", "restaurante", "bar", "balada", "hospital_quarto", "hospital_corredor", "parque", "praia", "shopping", "igreja", "cemiterio", "fundo_vazio"]>;
    framing: z.ZodEnum<["wide", "medium", "close", "closeup"]>;
    humor: z.ZodEnum<["comico", "tenso", "melancolico", "intimo", "caotico", "neutro", "romantico", "agressivo"]>;
    atores: z.ZodArray<z.ZodObject<{
        papel: z.ZodEnum<["protagonista", "npc_primario", "npc_secundario", "npc_terciario"]>;
        posicao: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            facing: z.ZodEnum<["L", "R"]>;
        }, "strict", z.ZodTypeAny, {
            x: number;
            y: number;
            facing: "L" | "R";
        }, {
            x: number;
            y: number;
            facing: "L" | "R";
        }>;
        pose: z.ZodObject<{
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
        zOrder: z.ZodDefault<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        papel: "protagonista" | "npc_primario" | "npc_secundario" | "npc_terciario";
        posicao: {
            x: number;
            y: number;
            facing: "L" | "R";
        };
        pose: {
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
        };
        zOrder: number;
    }, {
        papel: "protagonista" | "npc_primario" | "npc_secundario" | "npc_terciario";
        posicao: {
            x: number;
            y: number;
            facing: "L" | "R";
        };
        pose: {
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
        };
        zOrder?: number | undefined;
    }>, "many">;
    contatos: z.ZodDefault<z.ZodArray<z.ZodObject<{
        fromAtorPapel: z.ZodEnum<["protagonista", "npc_primario", "npc_secundario", "npc_terciario"]>;
        fromSocket: z.ZodString;
        toAtorPapel: z.ZodEnum<["protagonista", "npc_primario", "npc_secundario", "npc_terciario"]>;
        toSocket: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        fromAtorPapel: "protagonista" | "npc_primario" | "npc_secundario" | "npc_terciario";
        fromSocket: string;
        toAtorPapel: "protagonista" | "npc_primario" | "npc_secundario" | "npc_terciario";
        toSocket: string;
    }, {
        fromAtorPapel: "protagonista" | "npc_primario" | "npc_secundario" | "npc_terciario";
        fromSocket: string;
        toAtorPapel: "protagonista" | "npc_primario" | "npc_secundario" | "npc_terciario";
        toSocket: string;
    }>, "many">>;
    beats: z.ZodArray<z.ZodDiscriminatedUnion<"tipo", [z.ZodObject<{
        tipo: z.ZodLiteral<"narracao">;
        texto: z.ZodString;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strict", z.ZodTypeAny, {
        tipo: "narracao";
        texto: string;
        tags: string[];
    }, {
        tipo: "narracao";
        texto: string;
        tags?: string[] | undefined;
    }>, z.ZodObject<{
        tipo: z.ZodLiteral<"dialogo">;
        papelAtor: z.ZodEnum<["protagonista", "npc_primario", "npc_secundario", "npc_terciario"]>;
        texto: z.ZodString;
        mudancaExpressao: z.ZodOptional<z.ZodEnum<["neutra", "feliz", "triste", "raiva", "surpresa", "medo", "nojo", "flertando", "cansada", "desconfiada", "arrogante"]>>;
    }, "strict", z.ZodTypeAny, {
        tipo: "dialogo";
        texto: string;
        papelAtor: "protagonista" | "npc_primario" | "npc_secundario" | "npc_terciario";
        mudancaExpressao?: "neutra" | "feliz" | "triste" | "raiva" | "surpresa" | "medo" | "nojo" | "flertando" | "cansada" | "desconfiada" | "arrogante" | undefined;
    }, {
        tipo: "dialogo";
        texto: string;
        papelAtor: "protagonista" | "npc_primario" | "npc_secundario" | "npc_terciario";
        mudancaExpressao?: "neutra" | "feliz" | "triste" | "raiva" | "surpresa" | "medo" | "nojo" | "flertando" | "cansada" | "desconfiada" | "arrogante" | undefined;
    }>, z.ZodObject<{
        tipo: z.ZodLiteral<"transicao">;
        efeito: z.ZodEnum<["fade", "cut", "dissolve", "slide_L", "slide_R"]>;
        duracaoMs: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        tipo: "transicao";
        efeito: "fade" | "cut" | "dissolve" | "slide_L" | "slide_R";
        duracaoMs: number;
    }, {
        tipo: "transicao";
        efeito: "fade" | "cut" | "dissolve" | "slide_L" | "slide_R";
        duracaoMs: number;
    }>, z.ZodObject<{
        tipo: z.ZodLiteral<"escolha">;
        opcoes: z.ZodArray<z.ZodObject<{
            texto: z.ZodString;
            requisitos: z.ZodOptional<z.ZodType<import("./predicate").PredicateTree, z.ZodTypeDef, unknown>>;
            atributoCheck: z.ZodOptional<z.ZodObject<{
                atributo: z.ZodEnum<["forca", "inteligencia", "carisma", "constituicao", "sorte"]>;
                dificuldade: z.ZodNumber;
            }, "strict", z.ZodTypeAny, {
                atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
                dificuldade: number;
            }, {
                atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
                dificuldade: number;
            }>>;
            efeitos: z.ZodArray<z.ZodDiscriminatedUnion<"tipo", [z.ZodObject<{
                tipo: z.ZodLiteral<"alterar_atributo">;
                atributo: z.ZodEnum<["forca", "inteligencia", "carisma", "constituicao", "sorte"]>;
                delta: z.ZodNumber;
            }, "strict", z.ZodTypeAny, {
                tipo: "alterar_atributo";
                atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
                delta: number;
            }, {
                tipo: "alterar_atributo";
                atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
                delta: number;
            }>, z.ZodObject<{
                tipo: z.ZodLiteral<"alterar_dinheiro">;
                delta: z.ZodNumber;
            }, "strict", z.ZodTypeAny, {
                tipo: "alterar_dinheiro";
                delta: number;
            }, {
                tipo: "alterar_dinheiro";
                delta: number;
            }>, z.ZodObject<{
                tipo: z.ZodLiteral<"adicionar_flag">;
                flag: z.ZodString;
            }, "strict", z.ZodTypeAny, {
                tipo: "adicionar_flag";
                flag: string;
            }, {
                tipo: "adicionar_flag";
                flag: string;
            }>, z.ZodObject<{
                tipo: z.ZodLiteral<"remover_flag">;
                flag: z.ZodString;
            }, "strict", z.ZodTypeAny, {
                tipo: "remover_flag";
                flag: string;
            }, {
                tipo: "remover_flag";
                flag: string;
            }>, z.ZodObject<{
                tipo: z.ZodLiteral<"alterar_relacionamento">;
                npcId: z.ZodString;
                delta: z.ZodNumber;
            }, "strict", z.ZodTypeAny, {
                tipo: "alterar_relacionamento";
                delta: number;
                npcId: string;
            }, {
                tipo: "alterar_relacionamento";
                delta: number;
                npcId: string;
            }>, z.ZodObject<{
                tipo: z.ZodLiteral<"matar_npc">;
                npcId: z.ZodString;
                causa: z.ZodString;
            }, "strict", z.ZodTypeAny, {
                tipo: "matar_npc";
                npcId: string;
                causa: string;
            }, {
                tipo: "matar_npc";
                npcId: string;
                causa: string;
            }>, z.ZodObject<{
                tipo: z.ZodLiteral<"mudar_profissao">;
                profissao: z.ZodString;
                salario: z.ZodOptional<z.ZodNumber>;
            }, "strict", z.ZodTypeAny, {
                tipo: "mudar_profissao";
                profissao: string;
                salario?: number | undefined;
            }, {
                tipo: "mudar_profissao";
                profissao: string;
                salario?: number | undefined;
            }>, z.ZodObject<{
                tipo: z.ZodLiteral<"alterar_saude">;
                delta: z.ZodNumber;
            }, "strict", z.ZodTypeAny, {
                tipo: "alterar_saude";
                delta: number;
            }, {
                tipo: "alterar_saude";
                delta: number;
            }>, z.ZodObject<{
                tipo: z.ZodLiteral<"alterar_humor">;
                delta: z.ZodNumber;
            }, "strict", z.ZodTypeAny, {
                tipo: "alterar_humor";
                delta: number;
            }, {
                tipo: "alterar_humor";
                delta: number;
            }>, z.ZodObject<{
                tipo: z.ZodLiteral<"aplicar_status">;
                status: z.ZodEnum<["doente", "preso", "casado", "separado", "aposentado"]>;
                duracao: z.ZodOptional<z.ZodNumber>;
            }, "strict", z.ZodTypeAny, {
                status: "doente" | "preso" | "casado" | "separado" | "aposentado";
                tipo: "aplicar_status";
                duracao?: number | undefined;
            }, {
                status: "doente" | "preso" | "casado" | "separado" | "aposentado";
                tipo: "aplicar_status";
                duracao?: number | undefined;
            }>, z.ZodObject<{
                tipo: z.ZodLiteral<"disparar_evento">;
                eventoId: z.ZodString;
                atrasoMeses: z.ZodDefault<z.ZodNumber>;
            }, "strict", z.ZodTypeAny, {
                tipo: "disparar_evento";
                eventoId: string;
                atrasoMeses: number;
            }, {
                tipo: "disparar_evento";
                eventoId: string;
                atrasoMeses?: number | undefined;
            }>]>, "many">;
            proximoEventoId: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
            texto: string;
            efeitos: ({
                tipo: "alterar_atributo";
                atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
                delta: number;
            } | {
                tipo: "alterar_dinheiro";
                delta: number;
            } | {
                tipo: "adicionar_flag";
                flag: string;
            } | {
                tipo: "remover_flag";
                flag: string;
            } | {
                tipo: "alterar_relacionamento";
                delta: number;
                npcId: string;
            } | {
                tipo: "matar_npc";
                npcId: string;
                causa: string;
            } | {
                tipo: "mudar_profissao";
                profissao: string;
                salario?: number | undefined;
            } | {
                tipo: "alterar_saude";
                delta: number;
            } | {
                tipo: "alterar_humor";
                delta: number;
            } | {
                status: "doente" | "preso" | "casado" | "separado" | "aposentado";
                tipo: "aplicar_status";
                duracao?: number | undefined;
            } | {
                tipo: "disparar_evento";
                eventoId: string;
                atrasoMeses: number;
            })[];
            requisitos?: import("./predicate").PredicateTree | undefined;
            atributoCheck?: {
                atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
                dificuldade: number;
            } | undefined;
            proximoEventoId?: string | undefined;
        }, {
            texto: string;
            efeitos: ({
                tipo: "alterar_atributo";
                atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
                delta: number;
            } | {
                tipo: "alterar_dinheiro";
                delta: number;
            } | {
                tipo: "adicionar_flag";
                flag: string;
            } | {
                tipo: "remover_flag";
                flag: string;
            } | {
                tipo: "alterar_relacionamento";
                delta: number;
                npcId: string;
            } | {
                tipo: "matar_npc";
                npcId: string;
                causa: string;
            } | {
                tipo: "mudar_profissao";
                profissao: string;
                salario?: number | undefined;
            } | {
                tipo: "alterar_saude";
                delta: number;
            } | {
                tipo: "alterar_humor";
                delta: number;
            } | {
                status: "doente" | "preso" | "casado" | "separado" | "aposentado";
                tipo: "aplicar_status";
                duracao?: number | undefined;
            } | {
                tipo: "disparar_evento";
                eventoId: string;
                atrasoMeses?: number | undefined;
            })[];
            requisitos?: unknown;
            atributoCheck?: {
                atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
                dificuldade: number;
            } | undefined;
            proximoEventoId?: string | undefined;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        tipo: "escolha";
        opcoes: {
            texto: string;
            efeitos: ({
                tipo: "alterar_atributo";
                atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
                delta: number;
            } | {
                tipo: "alterar_dinheiro";
                delta: number;
            } | {
                tipo: "adicionar_flag";
                flag: string;
            } | {
                tipo: "remover_flag";
                flag: string;
            } | {
                tipo: "alterar_relacionamento";
                delta: number;
                npcId: string;
            } | {
                tipo: "matar_npc";
                npcId: string;
                causa: string;
            } | {
                tipo: "mudar_profissao";
                profissao: string;
                salario?: number | undefined;
            } | {
                tipo: "alterar_saude";
                delta: number;
            } | {
                tipo: "alterar_humor";
                delta: number;
            } | {
                status: "doente" | "preso" | "casado" | "separado" | "aposentado";
                tipo: "aplicar_status";
                duracao?: number | undefined;
            } | {
                tipo: "disparar_evento";
                eventoId: string;
                atrasoMeses: number;
            })[];
            requisitos?: import("./predicate").PredicateTree | undefined;
            atributoCheck?: {
                atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
                dificuldade: number;
            } | undefined;
            proximoEventoId?: string | undefined;
        }[];
    }, {
        tipo: "escolha";
        opcoes: {
            texto: string;
            efeitos: ({
                tipo: "alterar_atributo";
                atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
                delta: number;
            } | {
                tipo: "alterar_dinheiro";
                delta: number;
            } | {
                tipo: "adicionar_flag";
                flag: string;
            } | {
                tipo: "remover_flag";
                flag: string;
            } | {
                tipo: "alterar_relacionamento";
                delta: number;
                npcId: string;
            } | {
                tipo: "matar_npc";
                npcId: string;
                causa: string;
            } | {
                tipo: "mudar_profissao";
                profissao: string;
                salario?: number | undefined;
            } | {
                tipo: "alterar_saude";
                delta: number;
            } | {
                tipo: "alterar_humor";
                delta: number;
            } | {
                status: "doente" | "preso" | "casado" | "separado" | "aposentado";
                tipo: "aplicar_status";
                duracao?: number | undefined;
            } | {
                tipo: "disparar_evento";
                eventoId: string;
                atrasoMeses?: number | undefined;
            })[];
            requisitos?: unknown;
            atributoCheck?: {
                atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
                dificuldade: number;
            } | undefined;
            proximoEventoId?: string | undefined;
        }[];
    }>]>, "many">;
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
    background: "sala_estar" | "cozinha" | "quarto" | "banheiro" | "rua_residencial" | "centro_comercial" | "praca" | "escola_sala" | "escola_corredor" | "escola_patio" | "escritorio_open" | "escritorio_sala_reuniao" | "restaurante" | "bar" | "balada" | "hospital_quarto" | "hospital_corredor" | "parque" | "praia" | "shopping" | "igreja" | "cemiterio" | "fundo_vazio";
    schemaVersion: "1.0.0";
    metadata: {
        criadoEm: string;
        criadoPor: "humano" | "ia" | "ia_validada";
        versao: number;
        aprovadoEm?: string | undefined;
    };
    sceneId: string;
    descricaoCurta: string;
    framing: "wide" | "medium" | "close" | "closeup";
    humor: "comico" | "tenso" | "melancolico" | "intimo" | "caotico" | "neutro" | "romantico" | "agressivo";
    atores: {
        papel: "protagonista" | "npc_primario" | "npc_secundario" | "npc_terciario";
        posicao: {
            x: number;
            y: number;
            facing: "L" | "R";
        };
        pose: {
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
        };
        zOrder: number;
    }[];
    contatos: {
        fromAtorPapel: "protagonista" | "npc_primario" | "npc_secundario" | "npc_terciario";
        fromSocket: string;
        toAtorPapel: "protagonista" | "npc_primario" | "npc_secundario" | "npc_terciario";
        toSocket: string;
    }[];
    beats: ({
        tipo: "narracao";
        texto: string;
        tags: string[];
    } | {
        tipo: "dialogo";
        texto: string;
        papelAtor: "protagonista" | "npc_primario" | "npc_secundario" | "npc_terciario";
        mudancaExpressao?: "neutra" | "feliz" | "triste" | "raiva" | "surpresa" | "medo" | "nojo" | "flertando" | "cansada" | "desconfiada" | "arrogante" | undefined;
    } | {
        tipo: "transicao";
        efeito: "fade" | "cut" | "dissolve" | "slide_L" | "slide_R";
        duracaoMs: number;
    } | {
        tipo: "escolha";
        opcoes: {
            texto: string;
            efeitos: ({
                tipo: "alterar_atributo";
                atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
                delta: number;
            } | {
                tipo: "alterar_dinheiro";
                delta: number;
            } | {
                tipo: "adicionar_flag";
                flag: string;
            } | {
                tipo: "remover_flag";
                flag: string;
            } | {
                tipo: "alterar_relacionamento";
                delta: number;
                npcId: string;
            } | {
                tipo: "matar_npc";
                npcId: string;
                causa: string;
            } | {
                tipo: "mudar_profissao";
                profissao: string;
                salario?: number | undefined;
            } | {
                tipo: "alterar_saude";
                delta: number;
            } | {
                tipo: "alterar_humor";
                delta: number;
            } | {
                status: "doente" | "preso" | "casado" | "separado" | "aposentado";
                tipo: "aplicar_status";
                duracao?: number | undefined;
            } | {
                tipo: "disparar_evento";
                eventoId: string;
                atrasoMeses: number;
            })[];
            requisitos?: import("./predicate").PredicateTree | undefined;
            atributoCheck?: {
                atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
                dificuldade: number;
            } | undefined;
            proximoEventoId?: string | undefined;
        }[];
    })[];
}, {
    background: "sala_estar" | "cozinha" | "quarto" | "banheiro" | "rua_residencial" | "centro_comercial" | "praca" | "escola_sala" | "escola_corredor" | "escola_patio" | "escritorio_open" | "escritorio_sala_reuniao" | "restaurante" | "bar" | "balada" | "hospital_quarto" | "hospital_corredor" | "parque" | "praia" | "shopping" | "igreja" | "cemiterio" | "fundo_vazio";
    schemaVersion: "1.0.0";
    metadata: {
        criadoEm: string;
        criadoPor: "humano" | "ia" | "ia_validada";
        aprovadoEm?: string | undefined;
        versao?: number | undefined;
    };
    sceneId: string;
    descricaoCurta: string;
    framing: "wide" | "medium" | "close" | "closeup";
    humor: "comico" | "tenso" | "melancolico" | "intimo" | "caotico" | "neutro" | "romantico" | "agressivo";
    atores: {
        papel: "protagonista" | "npc_primario" | "npc_secundario" | "npc_terciario";
        posicao: {
            x: number;
            y: number;
            facing: "L" | "R";
        };
        pose: {
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
        };
        zOrder?: number | undefined;
    }[];
    beats: ({
        tipo: "narracao";
        texto: string;
        tags?: string[] | undefined;
    } | {
        tipo: "dialogo";
        texto: string;
        papelAtor: "protagonista" | "npc_primario" | "npc_secundario" | "npc_terciario";
        mudancaExpressao?: "neutra" | "feliz" | "triste" | "raiva" | "surpresa" | "medo" | "nojo" | "flertando" | "cansada" | "desconfiada" | "arrogante" | undefined;
    } | {
        tipo: "transicao";
        efeito: "fade" | "cut" | "dissolve" | "slide_L" | "slide_R";
        duracaoMs: number;
    } | {
        tipo: "escolha";
        opcoes: {
            texto: string;
            efeitos: ({
                tipo: "alterar_atributo";
                atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
                delta: number;
            } | {
                tipo: "alterar_dinheiro";
                delta: number;
            } | {
                tipo: "adicionar_flag";
                flag: string;
            } | {
                tipo: "remover_flag";
                flag: string;
            } | {
                tipo: "alterar_relacionamento";
                delta: number;
                npcId: string;
            } | {
                tipo: "matar_npc";
                npcId: string;
                causa: string;
            } | {
                tipo: "mudar_profissao";
                profissao: string;
                salario?: number | undefined;
            } | {
                tipo: "alterar_saude";
                delta: number;
            } | {
                tipo: "alterar_humor";
                delta: number;
            } | {
                status: "doente" | "preso" | "casado" | "separado" | "aposentado";
                tipo: "aplicar_status";
                duracao?: number | undefined;
            } | {
                tipo: "disparar_evento";
                eventoId: string;
                atrasoMeses?: number | undefined;
            })[];
            requisitos?: unknown;
            atributoCheck?: {
                atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
                dificuldade: number;
            } | undefined;
            proximoEventoId?: string | undefined;
        }[];
    })[];
    contatos?: {
        fromAtorPapel: "protagonista" | "npc_primario" | "npc_secundario" | "npc_terciario";
        fromSocket: string;
        toAtorPapel: "protagonista" | "npc_primario" | "npc_secundario" | "npc_terciario";
        toSocket: string;
    }[] | undefined;
}>;
export type Scene = z.infer<typeof Scene>;
//# sourceMappingURL=scene.d.ts.map