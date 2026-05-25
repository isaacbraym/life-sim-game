import { Container } from 'pixi.js';
import { gsap } from 'gsap';

export type Vec2 = {
  readonly x: number;
  readonly y: number;
};

export type OrientacaoPersonagem =
  | 'PERFIL_ESQUERDO'
  | 'PERFIL_DIREITO'
  | 'FRONTAL'
  | 'COSTAS';

export const VELOCIDADE_PADRAO = 180;

const orientacoesPorSprite = new WeakMap<Container, OrientacaoPersonagem>();

export function resolverOrientacao(atual: Vec2, alvo: Vec2): OrientacaoPersonagem {
  const dx = alvo.x - atual.x;
  const dy = alvo.y - atual.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx < 0 ? 'PERFIL_ESQUERDO' : 'PERFIL_DIREITO';
  }

  return dy < 0 ? 'COSTAS' : 'FRONTAL';
}

export function obterOrientacaoAtual(sprite: Container): OrientacaoPersonagem | undefined {
  return orientacoesPorSprite.get(sprite);
}

export class CharacterController {
  private spriteEmMovimento: Container | undefined;

  moveParaInteractionPoint(
    sprite: Container,
    alvo: Vec2,
    onChegou: () => void,
  ): void {
    this.spriteEmMovimento = sprite;
    gsap.killTweensOf(sprite);

    const origem = { x: sprite.x, y: sprite.y };
    const distancia = Math.hypot(alvo.x - origem.x, alvo.y - origem.y);
    const duration = distancia / VELOCIDADE_PADRAO;

    orientacoesPorSprite.set(sprite, resolverOrientacao(origem, alvo));

    gsap.to(sprite, {
      x: alvo.x,
      y: alvo.y,
      duration,
      ease: 'none',
      onUpdate: () => {
        orientacoesPorSprite.set(
          sprite,
          resolverOrientacao({ x: sprite.x, y: sprite.y }, alvo),
        );
      },
      onComplete: () => {
        this.spriteEmMovimento = undefined;
        onChegou();
      },
    });
  }

  cancelarMovimento(): void {
    if (this.spriteEmMovimento === undefined) return;

    gsap.killTweensOf(this.spriteEmMovimento);
    this.spriteEmMovimento = undefined;
  }
}
