import { z } from 'zod';
export const Atributos = z.object({
    forca: z.number().int().min(1).max(20),
    inteligencia: z.number().int().min(1).max(20),
    carisma: z.number().int().min(1).max(20),
    constituicao: z.number().int().min(1).max(20),
    sorte: z.number().int().min(1).max(20),
}).strict();
export const FormatoRosto = z.enum(['oval', 'redondo', 'quadrado', 'triangular', 'coracao']);
export const FormatoNariz = z.enum(['reto', 'arrebitado', 'aquilino', 'pequeno', 'largo']);
export const FormatoBoca = z.enum(['fina', 'cheia', 'pequena', 'larga']);
export const EstiloCorporal = z.enum(['atletico', 'magro', 'gordo', 'medio']);
export const TracosFisicos = z.object({
    corPele: z.string().regex(/^#[0-9a-f]{6}$/i),
    corOlhos: z.string().regex(/^#[0-9a-f]{6}$/i),
    formatoRosto: FormatoRosto,
    formatoNariz: FormatoNariz,
    formatoBoca: FormatoBoca,
    estiloCorporalBase: EstiloCorporal,
    alturaBase: z.number().min(1.4).max(2.1),
}).strict();
export const TracosVariaveis = z.object({
    corCabelo: z.string().regex(/^#[0-9a-f]{6}$/i),
    estiloCabelo: z.string(),
    temGrisalho: z.boolean().default(false),
    temRugas: z.boolean().default(false),
    temOlheiras: z.boolean().default(false),
    usaOculos: z.boolean().default(false),
    pesoAtual: z.number().min(30).max(200),
    alturaAtual: z.number().min(0.5).max(2.1),
}).strict();
export const DataNascimento = z.object({
    ano: z.number().int().min(1900).max(2025),
    mes: z.number().int().min(1).max(12),
    dia: z.number().int().min(1).max(31),
}).strict();
export const Character = z.object({
    schemaVersion: z.literal('1.0.0'),
    characterId: z.string().uuid(),
    nome: z.string().min(1).max(100),
    sobrenome: z.string().min(1).max(100),
    genero: z.enum(['M', 'F', 'outro']),
    dataNascimento: DataNascimento,
    idadeAtualMeses: z.number().int().min(0),
    tracosFisicos: TracosFisicos,
    tracosVariaveis: TracosVariaveis,
    atributos: Atributos,
    atributosGeneticos: Atributos,
    dinheiro: z.number().default(0),
    humorAtual: z.number().int().min(0).max(100).default(70),
    saudeAtual: z.number().int().min(0).max(100).default(100),
    profissaoAtual: z.string().optional(),
    salarioMensal: z.number().min(0).default(0),
    flags: z.array(z.string()).default([]),
    eventosVividos: z.array(z.string()).default([]),
}).strict();
//# sourceMappingURL=character.js.map