import { z } from 'zod';
import { PredicateTreeSchema } from './predicate';
import { LifePhaseEnum } from './lifephase';
import { PersistenciaNpc } from './npc';

export const OrientacaoPersonagem = z.enum([
  'PERFIL_ESQUERDO',
  'PERFIL_DIREITO',
  'FRONTAL',
  'COSTAS',
]);
export type OrientacaoPersonagem = z.infer<typeof OrientacaoPersonagem>;

export const NavZona = z.object({
  id: z.string(),
  poligono: z.array(z.object({ x: z.number(), y: z.number() })),
});
export type NavZona = z.infer<typeof NavZona>;

export const PontoDeSaida = z.object({
  id: z.string(),
  posicao: z.object({ x: z.number(), y: z.number() }),
  destino: z.discriminatedUnion('tipo', [
    z.object({ tipo: z.literal('comodo'), comodoId: z.string() }),
    z.object({ tipo: z.literal('mapa') }),
  ]),
  rotulo: z.string().optional(),
});
export type PontoDeSaida = z.infer<typeof PontoDeSaida>;

export const InteractableObject = z.object({
  id: z.string(),
  tipo: z.string(),
  posicao: z.object({ x: z.number(), y: z.number() }),
  tamanho: z.object({ largura: z.number(), altura: z.number() }),
  posicaoDeInteracao: z.object({ x: z.number(), y: z.number() }),
  orientacaoAoInteragir: OrientacaoPersonagem.optional(),
  assetId: z.string(),
  acoes: z.array(z.string()),
  npcSlot: z.string().optional(),
  disponibilidadeEra: z.object({
    startYear: z.number().int(),
    endYear: z.number().int().optional(),
  }).optional(),
  interativoNaFase: z.array(LifePhaseEnum).optional(),
});
export type InteractableObject = z.infer<typeof InteractableObject>;

export const ComodoDefinition = z.object({
  id: z.string(),
  localId: z.string(),
  nome: z.string(),
  backgroundAsset: z.string(),
  tamanho: z.object({ largura: z.number(), altura: z.number() }),
  navZonas: z.array(NavZona),
  pontosDeSaida: z.array(PontoDeSaida),
  objetos: z.array(InteractableObject),
  npcsElegiveis: z.array(z.object({
    papel: z.string(),
    slot: z.string(),
    persistencia: PersistenciaNpc,
  })),
  ambientTags: z.array(z.string()),
  eraStyle: z.string().optional(),
});
export type ComodoDefinition = z.infer<typeof ComodoDefinition>;

export const LocationDefinition = z.object({
  id: z.string(),
  nome: z.string(),
  iconeNoMapa: z.string(),
  faseDeVidaMinima: LifePhaseEnum.optional(),
  faseDeVidaMaxima: LifePhaseEnum.optional(),
  requisitos: PredicateTreeSchema.optional(),
  custoPorVisita: z.number().optional(),
  comodosIniciais: z.array(z.string()),
  comodoDeEntrada: z.string(),
  disponibilidadeEra: z.object({
    startYear: z.number().int(),
    endYear: z.number().int().optional(),
  }).optional(),
  tags: z.array(z.string()),
});
export type LocationDefinition = z.infer<typeof LocationDefinition>;
