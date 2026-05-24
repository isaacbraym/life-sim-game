import { z } from 'zod';
export declare const CategoriaEvento: z.ZodEnum<["childhood", "education", "career", "relationship", "crime", "health", "hobby", "mortality", "finance", "travel"]>;
export type CategoriaEvento = z.infer<typeof CategoriaEvento>;
export declare const TagConteudo: z.ZodEnum<["violence", "sexual", "substance", "language", "death", "trauma", "religious", "political"]>;
export type TagConteudo = z.infer<typeof TagConteudo>;
export declare const TipoNpcEvento: z.ZodEnum<["relacional", "sempre_novo"]>;
export declare const SelectorNpc: z.ZodObject<{
    papel: z.ZodString;
    tipo: z.ZodEnum<["relacional", "sempre_novo"]>;
    persistenciaApos: z.ZodDefault<z.ZodEnum<["permanente", "recorrente", "descartavel"]>>;
    constraints: z.ZodDefault<z.ZodObject<{
        genero: z.ZodOptional<z.ZodEnum<["M", "F", "qualquer"]>>;
        idadeMin: z.ZodOptional<z.ZodNumber>;
        idadeMax: z.ZodOptional<z.ZodNumber>;
        estiloCorporal: z.ZodOptional<z.ZodEnum<["atletico", "magro", "gordo", "medio", "qualquer"]>>;
        profissao: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        profissao?: string | undefined;
        genero?: "M" | "F" | "qualquer" | undefined;
        idadeMin?: number | undefined;
        idadeMax?: number | undefined;
        estiloCorporal?: "atletico" | "magro" | "gordo" | "medio" | "qualquer" | undefined;
    }, {
        profissao?: string | undefined;
        genero?: "M" | "F" | "qualquer" | undefined;
        idadeMin?: number | undefined;
        idadeMax?: number | undefined;
        estiloCorporal?: "atletico" | "magro" | "gordo" | "medio" | "qualquer" | undefined;
    }>>;
}, "strict", z.ZodTypeAny, {
    tipo: "relacional" | "sempre_novo";
    papel: string;
    persistenciaApos: "permanente" | "recorrente" | "descartavel";
    constraints: {
        profissao?: string | undefined;
        genero?: "M" | "F" | "qualquer" | undefined;
        idadeMin?: number | undefined;
        idadeMax?: number | undefined;
        estiloCorporal?: "atletico" | "magro" | "gordo" | "medio" | "qualquer" | undefined;
    };
}, {
    tipo: "relacional" | "sempre_novo";
    papel: string;
    persistenciaApos?: "permanente" | "recorrente" | "descartavel" | undefined;
    constraints?: {
        profissao?: string | undefined;
        genero?: "M" | "F" | "qualquer" | undefined;
        idadeMin?: number | undefined;
        idadeMax?: number | undefined;
        estiloCorporal?: "atletico" | "magro" | "gordo" | "medio" | "qualquer" | undefined;
    } | undefined;
}>;
export type SelectorNpc = z.infer<typeof SelectorNpc>;
export declare const Event: z.ZodObject<{
    schemaVersion: z.ZodLiteral<"1.0.0">;
    eventoId: z.ZodString;
    categoria: z.ZodEnum<["childhood", "education", "career", "relationship", "crime", "health", "hobby", "mortality", "finance", "travel"]>;
    titulo: z.ZodString;
    descricaoCurta: z.ZodString;
    contentTags: z.ZodDefault<z.ZodArray<z.ZodEnum<["violence", "sexual", "substance", "language", "death", "trauma", "religious", "political"]>, "many">>;
    triggers: z.ZodObject<{
        idadeRange: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
        requisitos: z.ZodOptional<z.ZodType<import("./predicate").PredicateTree, z.ZodTypeDef, unknown>>;
        peso: z.ZodDefault<z.ZodNumber>;
        cooldownMeses: z.ZodDefault<z.ZodNumber>;
        uniqueOnce: z.ZodDefault<z.ZodBoolean>;
    }, "strict", z.ZodTypeAny, {
        peso: number;
        cooldownMeses: number;
        uniqueOnce: boolean;
        requisitos?: import("./predicate").PredicateTree | undefined;
        idadeRange?: [number, number] | undefined;
    }, {
        requisitos?: unknown;
        idadeRange?: [number, number] | undefined;
        peso?: number | undefined;
        cooldownMeses?: number | undefined;
        uniqueOnce?: boolean | undefined;
    }>;
    cast: z.ZodDefault<z.ZodArray<z.ZodObject<{
        papel: z.ZodString;
        tipo: z.ZodEnum<["relacional", "sempre_novo"]>;
        persistenciaApos: z.ZodDefault<z.ZodEnum<["permanente", "recorrente", "descartavel"]>>;
        constraints: z.ZodDefault<z.ZodObject<{
            genero: z.ZodOptional<z.ZodEnum<["M", "F", "qualquer"]>>;
            idadeMin: z.ZodOptional<z.ZodNumber>;
            idadeMax: z.ZodOptional<z.ZodNumber>;
            estiloCorporal: z.ZodOptional<z.ZodEnum<["atletico", "magro", "gordo", "medio", "qualquer"]>>;
            profissao: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
            profissao?: string | undefined;
            genero?: "M" | "F" | "qualquer" | undefined;
            idadeMin?: number | undefined;
            idadeMax?: number | undefined;
            estiloCorporal?: "atletico" | "magro" | "gordo" | "medio" | "qualquer" | undefined;
        }, {
            profissao?: string | undefined;
            genero?: "M" | "F" | "qualquer" | undefined;
            idadeMin?: number | undefined;
            idadeMax?: number | undefined;
            estiloCorporal?: "atletico" | "magro" | "gordo" | "medio" | "qualquer" | undefined;
        }>>;
    }, "strict", z.ZodTypeAny, {
        tipo: "relacional" | "sempre_novo";
        papel: string;
        persistenciaApos: "permanente" | "recorrente" | "descartavel";
        constraints: {
            profissao?: string | undefined;
            genero?: "M" | "F" | "qualquer" | undefined;
            idadeMin?: number | undefined;
            idadeMax?: number | undefined;
            estiloCorporal?: "atletico" | "magro" | "gordo" | "medio" | "qualquer" | undefined;
        };
    }, {
        tipo: "relacional" | "sempre_novo";
        papel: string;
        persistenciaApos?: "permanente" | "recorrente" | "descartavel" | undefined;
        constraints?: {
            profissao?: string | undefined;
            genero?: "M" | "F" | "qualquer" | undefined;
            idadeMin?: number | undefined;
            idadeMax?: number | undefined;
            estiloCorporal?: "atletico" | "magro" | "gordo" | "medio" | "qualquer" | undefined;
        } | undefined;
    }>, "many">>;
    scene: z.ZodObject<{
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
    metadata: z.ZodObject<{
        criadoEm: z.ZodString;
        criadoPor: z.ZodEnum<["humano", "ia_assistido", "ia_validada"]>;
        revisadoPor: z.ZodOptional<z.ZodString>;
        versao: z.ZodDefault<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        criadoEm: string;
        criadoPor: "humano" | "ia_validada" | "ia_assistido";
        versao: number;
        revisadoPor?: string | undefined;
    }, {
        criadoEm: string;
        criadoPor: "humano" | "ia_validada" | "ia_assistido";
        versao?: number | undefined;
        revisadoPor?: string | undefined;
    }>;
}, "strict", z.ZodTypeAny, {
    schemaVersion: "1.0.0";
    categoria: "childhood" | "education" | "career" | "relationship" | "crime" | "health" | "hobby" | "mortality" | "finance" | "travel";
    metadata: {
        criadoEm: string;
        criadoPor: "humano" | "ia_validada" | "ia_assistido";
        versao: number;
        revisadoPor?: string | undefined;
    };
    eventoId: string;
    descricaoCurta: string;
    titulo: string;
    contentTags: ("violence" | "sexual" | "substance" | "language" | "death" | "trauma" | "religious" | "political")[];
    triggers: {
        peso: number;
        cooldownMeses: number;
        uniqueOnce: boolean;
        requisitos?: import("./predicate").PredicateTree | undefined;
        idadeRange?: [number, number] | undefined;
    };
    cast: {
        tipo: "relacional" | "sempre_novo";
        papel: string;
        persistenciaApos: "permanente" | "recorrente" | "descartavel";
        constraints: {
            profissao?: string | undefined;
            genero?: "M" | "F" | "qualquer" | undefined;
            idadeMin?: number | undefined;
            idadeMax?: number | undefined;
            estiloCorporal?: "atletico" | "magro" | "gordo" | "medio" | "qualquer" | undefined;
        };
    }[];
    scene: {
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
    };
}, {
    schemaVersion: "1.0.0";
    categoria: "childhood" | "education" | "career" | "relationship" | "crime" | "health" | "hobby" | "mortality" | "finance" | "travel";
    metadata: {
        criadoEm: string;
        criadoPor: "humano" | "ia_validada" | "ia_assistido";
        versao?: number | undefined;
        revisadoPor?: string | undefined;
    };
    eventoId: string;
    descricaoCurta: string;
    titulo: string;
    triggers: {
        requisitos?: unknown;
        idadeRange?: [number, number] | undefined;
        peso?: number | undefined;
        cooldownMeses?: number | undefined;
        uniqueOnce?: boolean | undefined;
    };
    scene: {
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
    };
    contentTags?: ("violence" | "sexual" | "substance" | "language" | "death" | "trauma" | "religious" | "political")[] | undefined;
    cast?: {
        tipo: "relacional" | "sempre_novo";
        papel: string;
        persistenciaApos?: "permanente" | "recorrente" | "descartavel" | undefined;
        constraints?: {
            profissao?: string | undefined;
            genero?: "M" | "F" | "qualquer" | undefined;
            idadeMin?: number | undefined;
            idadeMax?: number | undefined;
            estiloCorporal?: "atletico" | "magro" | "gordo" | "medio" | "qualquer" | undefined;
        } | undefined;
    }[] | undefined;
}>;
export type Event = z.infer<typeof Event>;
//# sourceMappingURL=event.d.ts.map