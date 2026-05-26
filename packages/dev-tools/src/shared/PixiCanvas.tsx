import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';

export type PixiCanvasProps = {
  readonly largura: number;
  readonly altura: number;
  readonly aoInicializar: (app: Application) => void;
};

export function PixiCanvas({ largura, altura, aoInicializar }: PixiCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(aoInicializar);

  useEffect(() => {
    callbackRef.current = aoInicializar;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let app: Application | undefined;
    let cancelado = false;

    const inicializar = async () => {
      const instancia = new Application();
      await instancia.init({
        width: largura,
        height: altura,
        background: '#1a1a2e',
        antialias: true,
      });
      if (cancelado) {
        instancia.destroy();
        return;
      }
      app = instancia;
      container.appendChild(app.canvas as HTMLCanvasElement);
      callbackRef.current(app);
    };

    void inicializar();

    return () => {
      cancelado = true;
      if (app) {
        const canvas = app.canvas as HTMLCanvasElement;
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        app.destroy();
        app = undefined;
      }
    };
  }, [largura, altura]);

  return <div ref={containerRef} />;
}
