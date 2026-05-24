import { z } from 'zod';
export declare const RitmoJogo: z.ZodEnum<["mensal", "semestral", "anual"]>;
export type RitmoJogo = z.infer<typeof RitmoJogo>;
export declare const ConfiguracoesSave: z.ZodObject<{
    ritmo: z.ZodEnum<["mensal", "semestral", "anual"]>;
    conteudoAdultoLiberado: z.ZodDefault<z.ZodBoolean>;
    idioma: z.ZodDefault<z.ZodEnum<["pt-BR", "en-US"]>>;
}, "strict", z.ZodTypeAny, {
    ritmo: "mensal" | "semestral" | "anual";
    conteudoAdultoLiberado: boolean;
    idioma: "pt-BR" | "en-US";
}, {
    ritmo: "mensal" | "semestral" | "anual";
    conteudoAdultoLiberado?: boolean | undefined;
    idioma?: "pt-BR" | "en-US" | undefined;
}>;
export declare const EstadoMundo: z.ZodObject<{
    anoAtual: z.ZodNumber;
    mesAtual: z.ZodNumber;
    flagsGlobais: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strict", z.ZodTypeAny, {
    anoAtual: number;
    mesAtual: number;
    flagsGlobais: string[];
}, {
    anoAtual: number;
    mesAtual: number;
    flagsGlobais?: string[] | undefined;
}>;
export declare const SaveSlot: z.ZodObject<{
    schemaVersion: z.ZodLiteral<"1.0.0">;
    saveId: z.ZodString;
    nomeSlot: z.ZodString;
    criadoEm: z.ZodString;
    ultimaPartida: z.ZodString;
    tempoJogadoMs: z.ZodDefault<z.ZodNumber>;
    configuracoes: z.ZodObject<{
        ritmo: z.ZodEnum<["mensal", "semestral", "anual"]>;
        conteudoAdultoLiberado: z.ZodDefault<z.ZodBoolean>;
        idioma: z.ZodDefault<z.ZodEnum<["pt-BR", "en-US"]>>;
    }, "strict", z.ZodTypeAny, {
        ritmo: "mensal" | "semestral" | "anual";
        conteudoAdultoLiberado: boolean;
        idioma: "pt-BR" | "en-US";
    }, {
        ritmo: "mensal" | "semestral" | "anual";
        conteudoAdultoLiberado?: boolean | undefined;
        idioma?: "pt-BR" | "en-US" | undefined;
    }>;
    protagonista: z.ZodObject<{
        schemaVersion: z.ZodLiteral<"1.0.0">;
        characterId: z.ZodString;
        nome: z.ZodString;
        sobrenome: z.ZodString;
        genero: z.ZodEnum<["M", "F", "outro"]>;
        dataNascimento: z.ZodObject<{
            ano: z.ZodNumber;
            mes: z.ZodNumber;
            dia: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            ano: number;
            mes: number;
            dia: number;
        }, {
            ano: number;
            mes: number;
            dia: number;
        }>;
        idadeAtualMeses: z.ZodNumber;
        tracosFisicos: z.ZodObject<{
            corPele: z.ZodString;
            corOlhos: z.ZodString;
            formatoRosto: z.ZodEnum<["oval", "redondo", "quadrado", "triangular", "coracao"]>;
            formatoNariz: z.ZodEnum<["reto", "arrebitado", "aquilino", "pequeno", "largo"]>;
            formatoBoca: z.ZodEnum<["fina", "cheia", "pequena", "larga"]>;
            estiloCorporalBase: z.ZodEnum<["atletico", "magro", "gordo", "medio"]>;
            alturaBase: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            corPele: string;
            corOlhos: string;
            formatoRosto: "oval" | "redondo" | "quadrado" | "triangular" | "coracao";
            formatoNariz: "reto" | "arrebitado" | "aquilino" | "pequeno" | "largo";
            formatoBoca: "fina" | "cheia" | "pequena" | "larga";
            estiloCorporalBase: "atletico" | "magro" | "gordo" | "medio";
            alturaBase: number;
        }, {
            corPele: string;
            corOlhos: string;
            formatoRosto: "oval" | "redondo" | "quadrado" | "triangular" | "coracao";
            formatoNariz: "reto" | "arrebitado" | "aquilino" | "pequeno" | "largo";
            formatoBoca: "fina" | "cheia" | "pequena" | "larga";
            estiloCorporalBase: "atletico" | "magro" | "gordo" | "medio";
            alturaBase: number;
        }>;
        tracosVariaveis: z.ZodObject<{
            corCabelo: z.ZodString;
            estiloCabelo: z.ZodString;
            temGrisalho: z.ZodDefault<z.ZodBoolean>;
            temRugas: z.ZodDefault<z.ZodBoolean>;
            temOlheiras: z.ZodDefault<z.ZodBoolean>;
            usaOculos: z.ZodDefault<z.ZodBoolean>;
            pesoAtual: z.ZodNumber;
            alturaAtual: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            corCabelo: string;
            estiloCabelo: string;
            temGrisalho: boolean;
            temRugas: boolean;
            temOlheiras: boolean;
            usaOculos: boolean;
            pesoAtual: number;
            alturaAtual: number;
        }, {
            corCabelo: string;
            estiloCabelo: string;
            pesoAtual: number;
            alturaAtual: number;
            temGrisalho?: boolean | undefined;
            temRugas?: boolean | undefined;
            temOlheiras?: boolean | undefined;
            usaOculos?: boolean | undefined;
        }>;
        atributos: z.ZodObject<{
            forca: z.ZodNumber;
            inteligencia: z.ZodNumber;
            carisma: z.ZodNumber;
            constituicao: z.ZodNumber;
            sorte: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            forca: number;
            inteligencia: number;
            carisma: number;
            constituicao: number;
            sorte: number;
        }, {
            forca: number;
            inteligencia: number;
            carisma: number;
            constituicao: number;
            sorte: number;
        }>;
        atributosGeneticos: z.ZodObject<{
            forca: z.ZodNumber;
            inteligencia: z.ZodNumber;
            carisma: z.ZodNumber;
            constituicao: z.ZodNumber;
            sorte: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            forca: number;
            inteligencia: number;
            carisma: number;
            constituicao: number;
            sorte: number;
        }, {
            forca: number;
            inteligencia: number;
            carisma: number;
            constituicao: number;
            sorte: number;
        }>;
        dinheiro: z.ZodDefault<z.ZodNumber>;
        humorAtual: z.ZodDefault<z.ZodNumber>;
        saudeAtual: z.ZodDefault<z.ZodNumber>;
        profissaoAtual: z.ZodOptional<z.ZodString>;
        salarioMensal: z.ZodDefault<z.ZodNumber>;
        flags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        eventosVividos: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strict", z.ZodTypeAny, {
        schemaVersion: "1.0.0";
        characterId: string;
        nome: string;
        sobrenome: string;
        genero: "M" | "F" | "outro";
        dataNascimento: {
            ano: number;
            mes: number;
            dia: number;
        };
        idadeAtualMeses: number;
        tracosFisicos: {
            corPele: string;
            corOlhos: string;
            formatoRosto: "oval" | "redondo" | "quadrado" | "triangular" | "coracao";
            formatoNariz: "reto" | "arrebitado" | "aquilino" | "pequeno" | "largo";
            formatoBoca: "fina" | "cheia" | "pequena" | "larga";
            estiloCorporalBase: "atletico" | "magro" | "gordo" | "medio";
            alturaBase: number;
        };
        tracosVariaveis: {
            corCabelo: string;
            estiloCabelo: string;
            temGrisalho: boolean;
            temRugas: boolean;
            temOlheiras: boolean;
            usaOculos: boolean;
            pesoAtual: number;
            alturaAtual: number;
        };
        atributos: {
            forca: number;
            inteligencia: number;
            carisma: number;
            constituicao: number;
            sorte: number;
        };
        atributosGeneticos: {
            forca: number;
            inteligencia: number;
            carisma: number;
            constituicao: number;
            sorte: number;
        };
        dinheiro: number;
        humorAtual: number;
        saudeAtual: number;
        salarioMensal: number;
        flags: string[];
        eventosVividos: string[];
        profissaoAtual?: string | undefined;
    }, {
        schemaVersion: "1.0.0";
        characterId: string;
        nome: string;
        sobrenome: string;
        genero: "M" | "F" | "outro";
        dataNascimento: {
            ano: number;
            mes: number;
            dia: number;
        };
        idadeAtualMeses: number;
        tracosFisicos: {
            corPele: string;
            corOlhos: string;
            formatoRosto: "oval" | "redondo" | "quadrado" | "triangular" | "coracao";
            formatoNariz: "reto" | "arrebitado" | "aquilino" | "pequeno" | "largo";
            formatoBoca: "fina" | "cheia" | "pequena" | "larga";
            estiloCorporalBase: "atletico" | "magro" | "gordo" | "medio";
            alturaBase: number;
        };
        tracosVariaveis: {
            corCabelo: string;
            estiloCabelo: string;
            pesoAtual: number;
            alturaAtual: number;
            temGrisalho?: boolean | undefined;
            temRugas?: boolean | undefined;
            temOlheiras?: boolean | undefined;
            usaOculos?: boolean | undefined;
        };
        atributos: {
            forca: number;
            inteligencia: number;
            carisma: number;
            constituicao: number;
            sorte: number;
        };
        atributosGeneticos: {
            forca: number;
            inteligencia: number;
            carisma: number;
            constituicao: number;
            sorte: number;
        };
        dinheiro?: number | undefined;
        humorAtual?: number | undefined;
        saudeAtual?: number | undefined;
        profissaoAtual?: string | undefined;
        salarioMensal?: number | undefined;
        flags?: string[] | undefined;
        eventosVividos?: string[] | undefined;
    }>;
    roster: z.ZodArray<z.ZodObject<{
        schemaVersion: z.ZodLiteral<"1.0.0">;
        npcId: z.ZodString;
        nome: z.ZodString;
        sobrenome: z.ZodString;
        genero: z.ZodEnum<["M", "F", "outro"]>;
        dataNascimento: z.ZodObject<{
            ano: z.ZodNumber;
            mes: z.ZodNumber;
            dia: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            ano: number;
            mes: number;
            dia: number;
        }, {
            ano: number;
            mes: number;
            dia: number;
        }>;
        tracosFisicos: z.ZodObject<{
            corPele: z.ZodString;
            corOlhos: z.ZodString;
            formatoRosto: z.ZodEnum<["oval", "redondo", "quadrado", "triangular", "coracao"]>;
            formatoNariz: z.ZodEnum<["reto", "arrebitado", "aquilino", "pequeno", "largo"]>;
            formatoBoca: z.ZodEnum<["fina", "cheia", "pequena", "larga"]>;
            estiloCorporalBase: z.ZodEnum<["atletico", "magro", "gordo", "medio"]>;
            alturaBase: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            corPele: string;
            corOlhos: string;
            formatoRosto: "oval" | "redondo" | "quadrado" | "triangular" | "coracao";
            formatoNariz: "reto" | "arrebitado" | "aquilino" | "pequeno" | "largo";
            formatoBoca: "fina" | "cheia" | "pequena" | "larga";
            estiloCorporalBase: "atletico" | "magro" | "gordo" | "medio";
            alturaBase: number;
        }, {
            corPele: string;
            corOlhos: string;
            formatoRosto: "oval" | "redondo" | "quadrado" | "triangular" | "coracao";
            formatoNariz: "reto" | "arrebitado" | "aquilino" | "pequeno" | "largo";
            formatoBoca: "fina" | "cheia" | "pequena" | "larga";
            estiloCorporalBase: "atletico" | "magro" | "gordo" | "medio";
            alturaBase: number;
        }>;
        tracosVariaveis: z.ZodObject<{
            corCabelo: z.ZodString;
            estiloCabelo: z.ZodString;
            temGrisalho: z.ZodDefault<z.ZodBoolean>;
            temRugas: z.ZodDefault<z.ZodBoolean>;
            temOlheiras: z.ZodDefault<z.ZodBoolean>;
            usaOculos: z.ZodDefault<z.ZodBoolean>;
            pesoAtual: z.ZodNumber;
            alturaAtual: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            corCabelo: string;
            estiloCabelo: string;
            temGrisalho: boolean;
            temRugas: boolean;
            temOlheiras: boolean;
            usaOculos: boolean;
            pesoAtual: number;
            alturaAtual: number;
        }, {
            corCabelo: string;
            estiloCabelo: string;
            pesoAtual: number;
            alturaAtual: number;
            temGrisalho?: boolean | undefined;
            temRugas?: boolean | undefined;
            temOlheiras?: boolean | undefined;
            usaOculos?: boolean | undefined;
        }>;
        atributos: z.ZodOptional<z.ZodObject<{
            forca: z.ZodNumber;
            inteligencia: z.ZodNumber;
            carisma: z.ZodNumber;
            constituicao: z.ZodNumber;
            sorte: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            forca: number;
            inteligencia: number;
            carisma: number;
            constituicao: number;
            sorte: number;
        }, {
            forca: number;
            inteligencia: number;
            carisma: number;
            constituicao: number;
            sorte: number;
        }>>;
        persistencia: z.ZodEnum<["permanente", "recorrente", "descartavel"]>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        profissaoAtual: z.ZodOptional<z.ZodString>;
        statusFinanceiro: z.ZodDefault<z.ZodEnum<["pobre", "medio", "rico", "milionario"]>>;
        relacionamentoComJogador: z.ZodObject<{
            tipo: z.ZodEnum<["familia_pai", "familia_mae", "familia_irmao", "familia_filho", "familia_conjuge", "familia_extendida", "amigo_proximo", "amigo_casual", "colega_trabalho", "colega_escola", "chefe", "subordinado", "romance_atual", "ex_romance", "inimigo", "rival", "profissional", "conhecido"]>;
            afeto: z.ZodDefault<z.ZodNumber>;
            conhecidoDesde: z.ZodObject<{
                ano: z.ZodNumber;
                mes: z.ZodNumber;
            }, "strict", z.ZodTypeAny, {
                ano: number;
                mes: number;
            }, {
                ano: number;
                mes: number;
            }>;
            ultimaInteracao: z.ZodOptional<z.ZodObject<{
                ano: z.ZodNumber;
                mes: z.ZodNumber;
                eventoId: z.ZodString;
            }, "strict", z.ZodTypeAny, {
                eventoId: string;
                ano: number;
                mes: number;
            }, {
                eventoId: string;
                ano: number;
                mes: number;
            }>>;
        }, "strict", z.ZodTypeAny, {
            tipo: "profissional" | "familia_pai" | "familia_mae" | "familia_irmao" | "familia_filho" | "familia_conjuge" | "familia_extendida" | "amigo_proximo" | "amigo_casual" | "colega_trabalho" | "colega_escola" | "chefe" | "subordinado" | "romance_atual" | "ex_romance" | "inimigo" | "rival" | "conhecido";
            afeto: number;
            conhecidoDesde: {
                ano: number;
                mes: number;
            };
            ultimaInteracao?: {
                eventoId: string;
                ano: number;
                mes: number;
            } | undefined;
        }, {
            tipo: "profissional" | "familia_pai" | "familia_mae" | "familia_irmao" | "familia_filho" | "familia_conjuge" | "familia_extendida" | "amigo_proximo" | "amigo_casual" | "colega_trabalho" | "colega_escola" | "chefe" | "subordinado" | "romance_atual" | "ex_romance" | "inimigo" | "rival" | "conhecido";
            conhecidoDesde: {
                ano: number;
                mes: number;
            };
            afeto?: number | undefined;
            ultimaInteracao?: {
                eventoId: string;
                ano: number;
                mes: number;
            } | undefined;
        }>;
        relacionamentosComOutrosNpcs: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
            tipo: z.ZodEnum<["familia_pai", "familia_mae", "familia_irmao", "familia_filho", "familia_conjuge", "familia_extendida", "amigo_proximo", "amigo_casual", "colega_trabalho", "colega_escola", "chefe", "subordinado", "romance_atual", "ex_romance", "inimigo", "rival", "profissional", "conhecido"]>;
            afeto: z.ZodDefault<z.ZodNumber>;
            conhecidoDesde: z.ZodObject<{
                ano: z.ZodNumber;
                mes: z.ZodNumber;
            }, "strict", z.ZodTypeAny, {
                ano: number;
                mes: number;
            }, {
                ano: number;
                mes: number;
            }>;
            ultimaInteracao: z.ZodOptional<z.ZodObject<{
                ano: z.ZodNumber;
                mes: z.ZodNumber;
                eventoId: z.ZodString;
            }, "strict", z.ZodTypeAny, {
                eventoId: string;
                ano: number;
                mes: number;
            }, {
                eventoId: string;
                ano: number;
                mes: number;
            }>>;
        }, "strict", z.ZodTypeAny, {
            tipo: "profissional" | "familia_pai" | "familia_mae" | "familia_irmao" | "familia_filho" | "familia_conjuge" | "familia_extendida" | "amigo_proximo" | "amigo_casual" | "colega_trabalho" | "colega_escola" | "chefe" | "subordinado" | "romance_atual" | "ex_romance" | "inimigo" | "rival" | "conhecido";
            afeto: number;
            conhecidoDesde: {
                ano: number;
                mes: number;
            };
            ultimaInteracao?: {
                eventoId: string;
                ano: number;
                mes: number;
            } | undefined;
        }, {
            tipo: "profissional" | "familia_pai" | "familia_mae" | "familia_irmao" | "familia_filho" | "familia_conjuge" | "familia_extendida" | "amigo_proximo" | "amigo_casual" | "colega_trabalho" | "colega_escola" | "chefe" | "subordinado" | "romance_atual" | "ex_romance" | "inimigo" | "rival" | "conhecido";
            conhecidoDesde: {
                ano: number;
                mes: number;
            };
            afeto?: number | undefined;
            ultimaInteracao?: {
                eventoId: string;
                ano: number;
                mes: number;
            } | undefined;
        }>>>;
        vivo: z.ZodDefault<z.ZodBoolean>;
        dataMorte: z.ZodOptional<z.ZodObject<{
            ano: z.ZodNumber;
            mes: z.ZodNumber;
            causa: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            causa: string;
            ano: number;
            mes: number;
        }, {
            causa: string;
            ano: number;
            mes: number;
        }>>;
        historicoInteracoes: z.ZodDefault<z.ZodArray<z.ZodObject<{
            eventoId: z.ZodString;
            ano: z.ZodNumber;
            mes: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            eventoId: string;
            ano: number;
            mes: number;
        }, {
            eventoId: string;
            ano: number;
            mes: number;
        }>, "many">>;
    }, "strict", z.ZodTypeAny, {
        schemaVersion: "1.0.0";
        npcId: string;
        tags: string[];
        nome: string;
        sobrenome: string;
        genero: "M" | "F" | "outro";
        dataNascimento: {
            ano: number;
            mes: number;
            dia: number;
        };
        tracosFisicos: {
            corPele: string;
            corOlhos: string;
            formatoRosto: "oval" | "redondo" | "quadrado" | "triangular" | "coracao";
            formatoNariz: "reto" | "arrebitado" | "aquilino" | "pequeno" | "largo";
            formatoBoca: "fina" | "cheia" | "pequena" | "larga";
            estiloCorporalBase: "atletico" | "magro" | "gordo" | "medio";
            alturaBase: number;
        };
        tracosVariaveis: {
            corCabelo: string;
            estiloCabelo: string;
            temGrisalho: boolean;
            temRugas: boolean;
            temOlheiras: boolean;
            usaOculos: boolean;
            pesoAtual: number;
            alturaAtual: number;
        };
        persistencia: "permanente" | "recorrente" | "descartavel";
        statusFinanceiro: "medio" | "pobre" | "rico" | "milionario";
        relacionamentoComJogador: {
            tipo: "profissional" | "familia_pai" | "familia_mae" | "familia_irmao" | "familia_filho" | "familia_conjuge" | "familia_extendida" | "amigo_proximo" | "amigo_casual" | "colega_trabalho" | "colega_escola" | "chefe" | "subordinado" | "romance_atual" | "ex_romance" | "inimigo" | "rival" | "conhecido";
            afeto: number;
            conhecidoDesde: {
                ano: number;
                mes: number;
            };
            ultimaInteracao?: {
                eventoId: string;
                ano: number;
                mes: number;
            } | undefined;
        };
        relacionamentosComOutrosNpcs: Record<string, {
            tipo: "profissional" | "familia_pai" | "familia_mae" | "familia_irmao" | "familia_filho" | "familia_conjuge" | "familia_extendida" | "amigo_proximo" | "amigo_casual" | "colega_trabalho" | "colega_escola" | "chefe" | "subordinado" | "romance_atual" | "ex_romance" | "inimigo" | "rival" | "conhecido";
            afeto: number;
            conhecidoDesde: {
                ano: number;
                mes: number;
            };
            ultimaInteracao?: {
                eventoId: string;
                ano: number;
                mes: number;
            } | undefined;
        }>;
        vivo: boolean;
        historicoInteracoes: {
            eventoId: string;
            ano: number;
            mes: number;
        }[];
        atributos?: {
            forca: number;
            inteligencia: number;
            carisma: number;
            constituicao: number;
            sorte: number;
        } | undefined;
        profissaoAtual?: string | undefined;
        dataMorte?: {
            causa: string;
            ano: number;
            mes: number;
        } | undefined;
    }, {
        schemaVersion: "1.0.0";
        npcId: string;
        nome: string;
        sobrenome: string;
        genero: "M" | "F" | "outro";
        dataNascimento: {
            ano: number;
            mes: number;
            dia: number;
        };
        tracosFisicos: {
            corPele: string;
            corOlhos: string;
            formatoRosto: "oval" | "redondo" | "quadrado" | "triangular" | "coracao";
            formatoNariz: "reto" | "arrebitado" | "aquilino" | "pequeno" | "largo";
            formatoBoca: "fina" | "cheia" | "pequena" | "larga";
            estiloCorporalBase: "atletico" | "magro" | "gordo" | "medio";
            alturaBase: number;
        };
        tracosVariaveis: {
            corCabelo: string;
            estiloCabelo: string;
            pesoAtual: number;
            alturaAtual: number;
            temGrisalho?: boolean | undefined;
            temRugas?: boolean | undefined;
            temOlheiras?: boolean | undefined;
            usaOculos?: boolean | undefined;
        };
        persistencia: "permanente" | "recorrente" | "descartavel";
        relacionamentoComJogador: {
            tipo: "profissional" | "familia_pai" | "familia_mae" | "familia_irmao" | "familia_filho" | "familia_conjuge" | "familia_extendida" | "amigo_proximo" | "amigo_casual" | "colega_trabalho" | "colega_escola" | "chefe" | "subordinado" | "romance_atual" | "ex_romance" | "inimigo" | "rival" | "conhecido";
            conhecidoDesde: {
                ano: number;
                mes: number;
            };
            afeto?: number | undefined;
            ultimaInteracao?: {
                eventoId: string;
                ano: number;
                mes: number;
            } | undefined;
        };
        tags?: string[] | undefined;
        atributos?: {
            forca: number;
            inteligencia: number;
            carisma: number;
            constituicao: number;
            sorte: number;
        } | undefined;
        profissaoAtual?: string | undefined;
        statusFinanceiro?: "medio" | "pobre" | "rico" | "milionario" | undefined;
        relacionamentosComOutrosNpcs?: Record<string, {
            tipo: "profissional" | "familia_pai" | "familia_mae" | "familia_irmao" | "familia_filho" | "familia_conjuge" | "familia_extendida" | "amigo_proximo" | "amigo_casual" | "colega_trabalho" | "colega_escola" | "chefe" | "subordinado" | "romance_atual" | "ex_romance" | "inimigo" | "rival" | "conhecido";
            conhecidoDesde: {
                ano: number;
                mes: number;
            };
            afeto?: number | undefined;
            ultimaInteracao?: {
                eventoId: string;
                ano: number;
                mes: number;
            } | undefined;
        }> | undefined;
        vivo?: boolean | undefined;
        dataMorte?: {
            causa: string;
            ano: number;
            mes: number;
        } | undefined;
        historicoInteracoes?: {
            eventoId: string;
            ano: number;
            mes: number;
        }[] | undefined;
    }>, "many">;
    estadoMundo: z.ZodObject<{
        anoAtual: z.ZodNumber;
        mesAtual: z.ZodNumber;
        flagsGlobais: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strict", z.ZodTypeAny, {
        anoAtual: number;
        mesAtual: number;
        flagsGlobais: string[];
    }, {
        anoAtual: number;
        mesAtual: number;
        flagsGlobais?: string[] | undefined;
    }>;
    cooldownRegistry: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    hashIntegridade: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    criadoEm: string;
    schemaVersion: "1.0.0";
    protagonista: {
        schemaVersion: "1.0.0";
        characterId: string;
        nome: string;
        sobrenome: string;
        genero: "M" | "F" | "outro";
        dataNascimento: {
            ano: number;
            mes: number;
            dia: number;
        };
        idadeAtualMeses: number;
        tracosFisicos: {
            corPele: string;
            corOlhos: string;
            formatoRosto: "oval" | "redondo" | "quadrado" | "triangular" | "coracao";
            formatoNariz: "reto" | "arrebitado" | "aquilino" | "pequeno" | "largo";
            formatoBoca: "fina" | "cheia" | "pequena" | "larga";
            estiloCorporalBase: "atletico" | "magro" | "gordo" | "medio";
            alturaBase: number;
        };
        tracosVariaveis: {
            corCabelo: string;
            estiloCabelo: string;
            temGrisalho: boolean;
            temRugas: boolean;
            temOlheiras: boolean;
            usaOculos: boolean;
            pesoAtual: number;
            alturaAtual: number;
        };
        atributos: {
            forca: number;
            inteligencia: number;
            carisma: number;
            constituicao: number;
            sorte: number;
        };
        atributosGeneticos: {
            forca: number;
            inteligencia: number;
            carisma: number;
            constituicao: number;
            sorte: number;
        };
        dinheiro: number;
        humorAtual: number;
        saudeAtual: number;
        salarioMensal: number;
        flags: string[];
        eventosVividos: string[];
        profissaoAtual?: string | undefined;
    };
    saveId: string;
    nomeSlot: string;
    ultimaPartida: string;
    tempoJogadoMs: number;
    configuracoes: {
        ritmo: "mensal" | "semestral" | "anual";
        conteudoAdultoLiberado: boolean;
        idioma: "pt-BR" | "en-US";
    };
    roster: {
        schemaVersion: "1.0.0";
        npcId: string;
        tags: string[];
        nome: string;
        sobrenome: string;
        genero: "M" | "F" | "outro";
        dataNascimento: {
            ano: number;
            mes: number;
            dia: number;
        };
        tracosFisicos: {
            corPele: string;
            corOlhos: string;
            formatoRosto: "oval" | "redondo" | "quadrado" | "triangular" | "coracao";
            formatoNariz: "reto" | "arrebitado" | "aquilino" | "pequeno" | "largo";
            formatoBoca: "fina" | "cheia" | "pequena" | "larga";
            estiloCorporalBase: "atletico" | "magro" | "gordo" | "medio";
            alturaBase: number;
        };
        tracosVariaveis: {
            corCabelo: string;
            estiloCabelo: string;
            temGrisalho: boolean;
            temRugas: boolean;
            temOlheiras: boolean;
            usaOculos: boolean;
            pesoAtual: number;
            alturaAtual: number;
        };
        persistencia: "permanente" | "recorrente" | "descartavel";
        statusFinanceiro: "medio" | "pobre" | "rico" | "milionario";
        relacionamentoComJogador: {
            tipo: "profissional" | "familia_pai" | "familia_mae" | "familia_irmao" | "familia_filho" | "familia_conjuge" | "familia_extendida" | "amigo_proximo" | "amigo_casual" | "colega_trabalho" | "colega_escola" | "chefe" | "subordinado" | "romance_atual" | "ex_romance" | "inimigo" | "rival" | "conhecido";
            afeto: number;
            conhecidoDesde: {
                ano: number;
                mes: number;
            };
            ultimaInteracao?: {
                eventoId: string;
                ano: number;
                mes: number;
            } | undefined;
        };
        relacionamentosComOutrosNpcs: Record<string, {
            tipo: "profissional" | "familia_pai" | "familia_mae" | "familia_irmao" | "familia_filho" | "familia_conjuge" | "familia_extendida" | "amigo_proximo" | "amigo_casual" | "colega_trabalho" | "colega_escola" | "chefe" | "subordinado" | "romance_atual" | "ex_romance" | "inimigo" | "rival" | "conhecido";
            afeto: number;
            conhecidoDesde: {
                ano: number;
                mes: number;
            };
            ultimaInteracao?: {
                eventoId: string;
                ano: number;
                mes: number;
            } | undefined;
        }>;
        vivo: boolean;
        historicoInteracoes: {
            eventoId: string;
            ano: number;
            mes: number;
        }[];
        atributos?: {
            forca: number;
            inteligencia: number;
            carisma: number;
            constituicao: number;
            sorte: number;
        } | undefined;
        profissaoAtual?: string | undefined;
        dataMorte?: {
            causa: string;
            ano: number;
            mes: number;
        } | undefined;
    }[];
    estadoMundo: {
        anoAtual: number;
        mesAtual: number;
        flagsGlobais: string[];
    };
    cooldownRegistry: Record<string, number>;
    hashIntegridade?: string | undefined;
}, {
    criadoEm: string;
    schemaVersion: "1.0.0";
    protagonista: {
        schemaVersion: "1.0.0";
        characterId: string;
        nome: string;
        sobrenome: string;
        genero: "M" | "F" | "outro";
        dataNascimento: {
            ano: number;
            mes: number;
            dia: number;
        };
        idadeAtualMeses: number;
        tracosFisicos: {
            corPele: string;
            corOlhos: string;
            formatoRosto: "oval" | "redondo" | "quadrado" | "triangular" | "coracao";
            formatoNariz: "reto" | "arrebitado" | "aquilino" | "pequeno" | "largo";
            formatoBoca: "fina" | "cheia" | "pequena" | "larga";
            estiloCorporalBase: "atletico" | "magro" | "gordo" | "medio";
            alturaBase: number;
        };
        tracosVariaveis: {
            corCabelo: string;
            estiloCabelo: string;
            pesoAtual: number;
            alturaAtual: number;
            temGrisalho?: boolean | undefined;
            temRugas?: boolean | undefined;
            temOlheiras?: boolean | undefined;
            usaOculos?: boolean | undefined;
        };
        atributos: {
            forca: number;
            inteligencia: number;
            carisma: number;
            constituicao: number;
            sorte: number;
        };
        atributosGeneticos: {
            forca: number;
            inteligencia: number;
            carisma: number;
            constituicao: number;
            sorte: number;
        };
        dinheiro?: number | undefined;
        humorAtual?: number | undefined;
        saudeAtual?: number | undefined;
        profissaoAtual?: string | undefined;
        salarioMensal?: number | undefined;
        flags?: string[] | undefined;
        eventosVividos?: string[] | undefined;
    };
    saveId: string;
    nomeSlot: string;
    ultimaPartida: string;
    configuracoes: {
        ritmo: "mensal" | "semestral" | "anual";
        conteudoAdultoLiberado?: boolean | undefined;
        idioma?: "pt-BR" | "en-US" | undefined;
    };
    roster: {
        schemaVersion: "1.0.0";
        npcId: string;
        nome: string;
        sobrenome: string;
        genero: "M" | "F" | "outro";
        dataNascimento: {
            ano: number;
            mes: number;
            dia: number;
        };
        tracosFisicos: {
            corPele: string;
            corOlhos: string;
            formatoRosto: "oval" | "redondo" | "quadrado" | "triangular" | "coracao";
            formatoNariz: "reto" | "arrebitado" | "aquilino" | "pequeno" | "largo";
            formatoBoca: "fina" | "cheia" | "pequena" | "larga";
            estiloCorporalBase: "atletico" | "magro" | "gordo" | "medio";
            alturaBase: number;
        };
        tracosVariaveis: {
            corCabelo: string;
            estiloCabelo: string;
            pesoAtual: number;
            alturaAtual: number;
            temGrisalho?: boolean | undefined;
            temRugas?: boolean | undefined;
            temOlheiras?: boolean | undefined;
            usaOculos?: boolean | undefined;
        };
        persistencia: "permanente" | "recorrente" | "descartavel";
        relacionamentoComJogador: {
            tipo: "profissional" | "familia_pai" | "familia_mae" | "familia_irmao" | "familia_filho" | "familia_conjuge" | "familia_extendida" | "amigo_proximo" | "amigo_casual" | "colega_trabalho" | "colega_escola" | "chefe" | "subordinado" | "romance_atual" | "ex_romance" | "inimigo" | "rival" | "conhecido";
            conhecidoDesde: {
                ano: number;
                mes: number;
            };
            afeto?: number | undefined;
            ultimaInteracao?: {
                eventoId: string;
                ano: number;
                mes: number;
            } | undefined;
        };
        tags?: string[] | undefined;
        atributos?: {
            forca: number;
            inteligencia: number;
            carisma: number;
            constituicao: number;
            sorte: number;
        } | undefined;
        profissaoAtual?: string | undefined;
        statusFinanceiro?: "medio" | "pobre" | "rico" | "milionario" | undefined;
        relacionamentosComOutrosNpcs?: Record<string, {
            tipo: "profissional" | "familia_pai" | "familia_mae" | "familia_irmao" | "familia_filho" | "familia_conjuge" | "familia_extendida" | "amigo_proximo" | "amigo_casual" | "colega_trabalho" | "colega_escola" | "chefe" | "subordinado" | "romance_atual" | "ex_romance" | "inimigo" | "rival" | "conhecido";
            conhecidoDesde: {
                ano: number;
                mes: number;
            };
            afeto?: number | undefined;
            ultimaInteracao?: {
                eventoId: string;
                ano: number;
                mes: number;
            } | undefined;
        }> | undefined;
        vivo?: boolean | undefined;
        dataMorte?: {
            causa: string;
            ano: number;
            mes: number;
        } | undefined;
        historicoInteracoes?: {
            eventoId: string;
            ano: number;
            mes: number;
        }[] | undefined;
    }[];
    estadoMundo: {
        anoAtual: number;
        mesAtual: number;
        flagsGlobais?: string[] | undefined;
    };
    tempoJogadoMs?: number | undefined;
    cooldownRegistry?: Record<string, number> | undefined;
    hashIntegridade?: string | undefined;
}>;
export type SaveSlot = z.infer<typeof SaveSlot>;
//# sourceMappingURL=save.d.ts.map