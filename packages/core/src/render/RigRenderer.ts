import type { Esqueleto } from '../rig/Skeleton';

// TODO: implementar renderização de rig via PixiJS Graphics + Bézier
// Nota: importar PIXI apenas em runtime (não no core, que é isomórfico)
export class RigRenderer {
  renderizar(_esqueleto: Esqueleto, _container: unknown): void {
    throw new Error('not implemented');
  }
}
