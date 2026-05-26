import { z } from 'zod';

export const DirecaoVisual = z.enum([
  'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW',
]);
export type DirecaoVisual = z.infer<typeof DirecaoVisual>;

export const DIRECAO_PARA_GRAUS: Record<DirecaoVisual, number> = {
  N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315,
};

export const GRAUS_PARA_DIRECAO: Record<number, DirecaoVisual> = {
  0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW',
};

/**
 * Calcula a direção visual de movimento entre dois tiles adjacentes.
 * dx e dy são deltas de tile (-1, 0 ou 1).
 */
export function calcularDirecao(
  de: { tx: number; ty: number },
  para: { tx: number; ty: number },
): DirecaoVisual {
  const dx = Math.sign(para.tx - de.tx) as -1 | 0 | 1;
  const dy = Math.sign(para.ty - de.ty) as -1 | 0 | 1;
  const mapa: Partial<Record<string, DirecaoVisual>> = {
    '0,-1':  'N',
    '1,-1':  'NE',
    '1,0':   'E',
    '1,1':   'SE',
    '0,1':   'S',
    '-1,1':  'SW',
    '-1,0':  'W',
    '-1,-1': 'NW',
  };
  return mapa[`${dx},${dy}`] ?? 'S';
}
