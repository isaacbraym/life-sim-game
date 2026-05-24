import { z } from 'zod';
export declare const Atributos: z.ZodObject<{
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
export type Atributos = z.infer<typeof Atributos>;
export declare const FormatoRosto: z.ZodEnum<["oval", "redondo", "quadrado", "triangular", "coracao"]>;
export declare const FormatoNariz: z.ZodEnum<["reto", "arrebitado", "aquilino", "pequeno", "largo"]>;
export declare const FormatoBoca: z.ZodEnum<["fina", "cheia", "pequena", "larga"]>;
export declare const EstiloCorporal: z.ZodEnum<["atletico", "magro", "gordo", "medio"]>;
export declare const TracosFisicos: z.ZodObject<{
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
export type TracosFisicos = z.infer<typeof TracosFisicos>;
export declare const TracosVariaveis: z.ZodObject<{
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
export type TracosVariaveis = z.infer<typeof TracosVariaveis>;
export declare const DataNascimento: z.ZodObject<{
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
export declare const Character: z.ZodObject<{
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
export type Character = z.infer<typeof Character>;
//# sourceMappingURL=character.d.ts.map