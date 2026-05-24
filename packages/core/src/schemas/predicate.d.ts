import { z } from 'zod';
declare const PredicadoFolha: z.ZodUnion<[z.ZodObject<{
    tipo: z.ZodLiteral<"var">;
    caminho: z.ZodString;
    operador: z.ZodEnum<["==", "!=", ">", "<", ">=", "<="]>;
    valor: z.ZodUnion<[z.ZodNumber, z.ZodString, z.ZodBoolean]>;
}, "strict", z.ZodTypeAny, {
    tipo: "var";
    caminho: string;
    operador: "==" | "!=" | ">" | "<" | ">=" | "<=";
    valor: string | number | boolean;
}, {
    tipo: "var";
    caminho: string;
    operador: "==" | "!=" | ">" | "<" | ">=" | "<=";
    valor: string | number | boolean;
}>, z.ZodObject<{
    tipo: z.ZodLiteral<"flag">;
    flag: z.ZodString;
    presente: z.ZodDefault<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    tipo: "flag";
    flag: string;
    presente: boolean;
}, {
    tipo: "flag";
    flag: string;
    presente?: boolean | undefined;
}>, z.ZodObject<{
    tipo: z.ZodLiteral<"relacionamento">;
    comNpcRole: z.ZodString;
    tipoVinculo: z.ZodEnum<["familia", "amigo", "romance", "inimizade", "profissional"]>;
    nivelMinimo: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    tipo: "relacionamento";
    comNpcRole: string;
    tipoVinculo: "familia" | "amigo" | "romance" | "inimizade" | "profissional";
    nivelMinimo?: number | undefined;
}, {
    tipo: "relacionamento";
    comNpcRole: string;
    tipoVinculo: "familia" | "amigo" | "romance" | "inimizade" | "profissional";
    nivelMinimo?: number | undefined;
}>, z.ZodObject<{
    tipo: z.ZodLiteral<"idade">;
    minimo: z.ZodOptional<z.ZodNumber>;
    maximo: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    tipo: "idade";
    minimo?: number | undefined;
    maximo?: number | undefined;
}, {
    tipo: "idade";
    minimo?: number | undefined;
    maximo?: number | undefined;
}>, z.ZodObject<{
    tipo: z.ZodLiteral<"atributo">;
    atributo: z.ZodEnum<["forca", "inteligencia", "carisma", "constituicao", "sorte"]>;
    operador: z.ZodEnum<["==", "!=", ">", "<", ">=", "<="]>;
    valor: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    tipo: "atributo";
    atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
    operador: "==" | "!=" | ">" | "<" | ">=" | "<=";
    valor: number;
}, {
    tipo: "atributo";
    atributo: "forca" | "inteligencia" | "carisma" | "constituicao" | "sorte";
    operador: "==" | "!=" | ">" | "<" | ">=" | "<=";
    valor: number;
}>]>;
export type PredicateTree = {
    tipo: 'todos';
    predicados: PredicateTree[];
} | {
    tipo: 'algum';
    predicados: PredicateTree[];
} | {
    tipo: 'nao';
    predicado: PredicateTree;
} | z.infer<typeof PredicadoFolha>;
export declare const PredicateTreeSchema: z.ZodType<PredicateTree, z.ZodTypeDef, unknown>;
export {};
//# sourceMappingURL=predicate.d.ts.map