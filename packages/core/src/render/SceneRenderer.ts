// [FIX QA] Substituído throw por no-op + warn — função era stub que crashava.
// TODO: implementar orquestração de cena com múltiplos rigs
export class SceneRenderer {
  renderizarCena(_sceneJson: unknown, _container: unknown): void {
    if (typeof console !== 'undefined') {
      console.warn('[core/SceneRenderer] stub chamado — não implementado');
    }
  }
}
