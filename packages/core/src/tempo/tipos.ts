import type { Effect } from '../schemas/effect';
import type { SaveSlot } from '../schemas/save';

export type TierResolucao = 'falha_critica' | 'falha' | 'sucesso' | 'sucesso_critico';

export type ResultadoResolucao = {
  readonly saveAtualizado: SaveSlot;
  readonly rolagem?: {
    readonly atributo: string;
    readonly dado: number;
    readonly modificador: number;
    readonly total: number;
    readonly tier: TierResolucao;
  };
  readonly efeitosAplicados: readonly Effect[];
  readonly mortesDetectadas: readonly {
    readonly tipo: 'protagonista' | 'npc';
    readonly id: string;
    readonly causa: string;
  }[];
};
