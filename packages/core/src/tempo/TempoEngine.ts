import type { SaveSlot } from '../schemas/save';
import { envelhecerRoster } from '../npc/NpcAging';

const MESES_POR_RITMO = {
  mensal: 1,
  semestral: 6,
  anual: 12,
} satisfies Record<SaveSlot['configuracoes']['ritmo'], number>;

function normalizarData(anoAtual: number, mesAtual: number): {
  readonly anoAtual: number;
  readonly mesAtual: number;
} {
  let ano = anoAtual;
  let mes = mesAtual;

  while (mes > 12) {
    ano += 1;
    mes -= 12;
  }

  return { anoAtual: ano, mesAtual: mes };
}

export function avancarTempo(save: SaveSlot): SaveSlot {
  const deltaMeses = MESES_POR_RITMO[save.configuracoes.ritmo];
  const dataAtualizada = normalizarData(
    save.estadoMundo.anoAtual,
    save.estadoMundo.mesAtual + deltaMeses,
  );

  return {
    ...save,
    protagonista: {
      ...save.protagonista,
      idadeAtualMeses: save.protagonista.idadeAtualMeses + deltaMeses,
    },
    roster: envelhecerRoster(save.roster, dataAtualizada.anoAtual),
    estadoMundo: {
      ...save.estadoMundo,
      anoAtual: dataAtualizada.anoAtual,
      mesAtual: dataAtualizada.mesAtual,
    },
  };
}
