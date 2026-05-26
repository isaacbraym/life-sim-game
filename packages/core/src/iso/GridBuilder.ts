import type { IsoRoomDefinition } from '../schemas/isoRoom';
import type { GridCaminhavel } from './Pathfinder';

export function construirGrid(
  comodo: IsoRoomDefinition,
  npcsPresentes: readonly { tileX: number; tileY: number }[],
): GridCaminhavel {
  const grid: boolean[][] = comodo.tiles.map(linha =>
    linha.map(tile => tile.estado === 'caminhavel'),
  );

  for (const objeto of comodo.objetos) {
    for (const offset of objeto.bloqueaTiles) {
      const ty = objeto.tileY + offset.dy;
      const tx = objeto.tileX + offset.dx;
      if (grid[ty]?.[tx] !== undefined) {
        grid[ty]![tx] = false;
      }
    }
  }

  for (const npc of npcsPresentes) {
    if (grid[npc.tileY]?.[npc.tileX] !== undefined) {
      grid[npc.tileY]![npc.tileX] = false;
    }
  }

  return grid;
}
