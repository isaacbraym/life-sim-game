import { Application, Text } from 'pixi.js';
import { gsap } from 'gsap';

type Vec2 = {
  readonly x: number;
  readonly y: number;
};

type MostrarFeedbackParams = {
  readonly app: Application;
  readonly posicaoMundo: Vec2;
  readonly texto: string;
  readonly cor?: number;
  readonly duracao?: number;
};

export function mostrarFeedback({
  app,
  posicaoMundo,
  texto,
  cor = 0xffffff,
  duracao = 1.5,
}: MostrarFeedbackParams): void {
  const label = new Text({
    text: texto,
    style: {
      fill: cor,
      fontSize: 18,
      fontFamily: 'Arial, sans-serif',
      fontWeight: '700',
      stroke: { color: 0x111111, width: 3 },
    },
  });

  label.anchor.set(0.5);
  label.position.set(posicaoMundo.x, posicaoMundo.y);
  app.stage.addChild(label);

  gsap.to(label, {
    y: posicaoMundo.y - 60,
    alpha: 0,
    duration: duracao,
    ease: 'power1.out',
    onComplete: () => {
      if (label.parent !== null) {
        label.parent.removeChild(label);
      }
      label.destroy();
    },
  });
}
