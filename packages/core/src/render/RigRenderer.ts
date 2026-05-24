import type { Esqueleto } from '../rig/Skeleton';

// [FIX QA] Substituído throw por no-op + warn — função era stub que crashava.
// A implementação real fica no game (packages/game/src/rendering/RigRenderer.ts)
// porque o core é isomórfico e não pode depender do PixiJS.
// Esta classe permanece como contrato/placeholder para um eventual renderer
// agnóstico de framework no core.
// TODO: implementar renderização de rig via PixiJS Graphics + Bézier no game,
//       não aqui. Considerar remover esta classe do core.
export class RigRenderer {
  renderizar(_esqueleto: Esqueleto, _container: unknown): void {
    if (typeof console !== 'undefined') {
      console.warn('[core/RigRenderer] stub chamado — use game/rendering/RigRenderer');
    }
  }
}
