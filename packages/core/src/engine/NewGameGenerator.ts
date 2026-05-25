import type { BirthProfile, ClasseSocial } from '../schemas/birthprofile';
import type { Atributos } from '../schemas/character';
import type { Npc } from '../schemas/npc';
import type { LifePhaseEnum } from '../schemas/lifephase';
import { calcularFaseAtual } from '../lifephase/LifePhaseManager';
import { resolverEraAtual } from '../era/EraResolver';
import { gerarRosterInicial } from '../npc/NpcGenerator';

export type EstadoInicialDeJogo = {
  readonly saveId: string;
  readonly anoAtual: number;
  readonly mesAtual: number;
  readonly faseDeVida: LifePhaseEnum;
  readonly dinheiro: number;
  readonly eraId: string;
  readonly protagonista: {
    readonly atributosGeneticos: Atributos;
    readonly atributos: Atributos;
  };
  readonly rosterInicial: readonly Npc[];
  readonly casaInicial: string;
  readonly currentLocationId: string;
  readonly currentRoomId: string;
};

const DINHEIRO_POR_CLASSE: Record<ClasseSocial, number> = {
  baixa:      0,
  media_baixa: 50,
  media:      200,
  media_alta: 800,
  alta:       2500,
};

const CASA_POR_CONDICAO: Record<BirthProfile['condicaoHabitacional'], string> = {
  mocorongo: 'casa_template_mocorongo',
  simples:   'casa_template_simples',
  media:     'casa_template_media',
  boa:       'casa_template_boa',
  luxo:      'casa_template_luxo',
};

function aplicarVariacaoLeve(valor: number): number {
  const variacao = Math.floor(Math.random() * 3) - 1; // -1, 0, ou +1
  return Math.min(20, Math.max(1, valor + variacao));
}

function sementeNumerica(saveId: string): number {
  return [...saveId].reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0);
}

export function gerarNovoJogo(perfil: BirthProfile): EstadoInicialDeJogo {
  const saveId = crypto.randomUUID();
  const { anoNascimento } = perfil;

  const faseDeVida = calcularFaseAtual(0); // recém-nascido = bebe
  const era = resolverEraAtual(anoNascimento);

  const gen = perfil.atributosGeneticos;
  const atributosGeneticos: Atributos = {
    forca:        gen.forca,
    inteligencia: gen.inteligencia,
    carisma:      gen.carisma,
    constituicao: gen.constituicao,
    sorte:        gen.sorte,
  };
  const atributos: Atributos = {
    forca:        aplicarVariacaoLeve(gen.forca),
    inteligencia: aplicarVariacaoLeve(gen.inteligencia),
    carisma:      aplicarVariacaoLeve(gen.carisma),
    constituicao: aplicarVariacaoLeve(gen.constituicao),
    sorte:        aplicarVariacaoLeve(gen.sorte),
  };

  const semente = sementeNumerica(saveId);
  const rosterInicial = gerarRosterInicial(anoNascimento, semente);

  return {
    saveId,
    anoAtual:          anoNascimento,
    mesAtual:          1,
    faseDeVida,
    dinheiro:          DINHEIRO_POR_CLASSE[perfil.classeSocial],
    eraId:             era.id,
    protagonista:      { atributosGeneticos, atributos },
    rosterInicial,
    casaInicial:       CASA_POR_CONDICAO[perfil.condicaoHabitacional],
    currentLocationId: 'casa',
    currentRoomId:     'quarto',
  };
}
