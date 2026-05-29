import type { IsoRoomDefinition } from '../schemas/isoRoom';
import type { GridCaminhavel } from './Pathfinder';

export function construirGrid(
  comodo: IsoRoomDefinition,
  npcsPresentes: readonly { tileX: number; tileY: number }[],
): GridCaminhavel {
  const grid: boolean[][] = comodo.tiles.map(linha =>
    linha.map(tile => tile.estado === 'caminhavel'),
  );

  const numLinhas  = grid.length;
  const numColunas = grid[0]?.length ?? 0;

  const dentroDoGrid = (ty: number, tx: number): boolean =>
    ty >= 0 && ty < numLinhas && tx >= 0 && tx < numColunas;

  for (const objeto of comodo.objetos) {
    for (const offset of objeto.bloqueaTiles) {
      const ty = objeto.tileY + offset.dy;
      const tx = objeto.tileX + offset.dx;
      if (dentroDoGrid(ty, tx)) {
        // SAFETY: dentroDoGrid garante que os índices são válidos
        grid[ty]![tx] = false;
      }
    }
  }

  for (const npc of npcsPresentes) {
    const { tileY: ty, tileX: tx } = npc;
    if (dentroDoGrid(ty, tx)) {
      // SAFETY: dentroDoGrid garante que os índices são válidos
      grid[ty]![tx] = false;
    }
  }

  return grid;
}
