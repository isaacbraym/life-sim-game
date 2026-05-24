import { z } from 'zod';
export declare const AtributoRPG: z.ZodEnum<["forca", "inteligencia", "carisma", "constituicao", "sorte"]>;
export type AtributoRPG = z.infer<typeof AtributoRPG>;
export declare const StatusPersonagem: z.ZodEnum<["doente", "preso", "casado", "separado", "aposentado"]>;
export declare const Effect: z.ZodDiscriminatedUnion<"tipo", [z.ZodObject<{
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
}>]>;
export type Effect = z.infer<typeof Effect>;
//# sourceMappingURL=effect.d.ts.map