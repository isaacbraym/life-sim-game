export const TILE_W = 64;
export const TILE_H = 32;

export const TILE_MOVE_MS = 300;

/** Converte coordenadas de tile (tx, ty) para coordenadas de tela (sx, sy). */
export function tileParaTela(tx: number, ty: number): { x: number; y: number } {
  return {
    x: (tx - ty) * (TILE_W / 2),
    y: (tx + ty) * (TILE_H / 2),
  };
}

/** Converte coordenadas de tela para tile (arredondado). */
export function telaParaTile(sx: number, sy: number): { tx: number; ty: number } {
  return {
    tx: Math.round(sy / TILE_H + sx / TILE_W),
    ty: Math.round(sy / TILE_H - sx / TILE_W),
  };
}

/** Depth isométrico: objetos com maior tx+ty ficam na frente. */
export function calcularDepth(tx: number, ty: number, tz: number = 0): number {
  return tx + ty + tz * 0.01;
}
