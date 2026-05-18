import { Graphics } from 'pixi.js';
import {
  Esqueleto,
  gerarPathBraco,
  gerarPathPerna,
  PERFIL_BRACO_PADRAO,
  PERFIL_PERNA_PADRAO,
  PathBraco,
} from '@lifesim/core';

const COR_PELE       = 0xf5c5a3;
const COR_SOMBRA     = 0xe8a882;
const COR_CONTORNO   = 0x2a1a0e;
const ESPESSURA_CONTORNO = 1.2;

function desenharPathBezier(gfx: Graphics, path: PathBraco, ox: number, oy: number): void {
  const e = path.esq;
  const d = path.dir;
  gfx.moveTo(ox+e.p0.x, oy+e.p0.y);
  gfx.bezierCurveTo(ox+e.cp1.x, oy+e.cp1.y, ox+e.cp2.x, oy+e.cp2.y, ox+e.p1.x, oy+e.p1.y);
  gfx.bezierCurveTo(ox+e.cp3.x, oy+e.cp3.y, ox+e.cp4.x, oy+e.cp4.y, ox+e.p2.x, oy+e.p2.y);
  gfx.bezierCurveTo(
    ox+d.p0.x+(d.p0.x-e.p2.x)*0.3, oy+d.p0.y+(d.p0.y-e.p2.y)*0.3,
    ox+d.p0.x, oy+d.p0.y, ox+d.p0.x, oy+d.p0.y,
  );
  gfx.bezierCurveTo(ox+d.cp1.x, oy+d.cp1.y, ox+d.cp2.x, oy+d.cp2.y, ox+d.p1.x, oy+d.p1.y);
  gfx.bezierCurveTo(ox+d.cp3.x, oy+d.cp3.y, ox+d.cp4.x, oy+d.cp4.y, ox+d.p2.x, oy+d.p2.y);
  gfx.closePath();
}

export function desenharSilhueta(
  gfx: Graphics,
  esqueleto: Esqueleto,
  offsetX: number,
  offsetY: number,
): void {
  gfx.clear();
  const p = (id: Parameters<typeof esqueleto.posicaoMundialDe>[0]) =>
    esqueleto.posicaoMundialDe(id);

  gfx.setStrokeStyle({ width: ESPESSURA_CONTORNO, color: COR_CONTORNO });

  const pathBracoE = gerarPathBraco(p('shoulder_L'), p('elbow_L'), p('wrist_L'), PERFIL_BRACO_PADRAO, false);
  desenharPathBezier(gfx, pathBracoE, offsetX, offsetY);
  gfx.fill({ color: COR_PELE });
  gfx.stroke();

  const pathBracoD = gerarPathBraco(p('shoulder_R'), p('elbow_R'), p('wrist_R'), PERFIL_BRACO_PADRAO, true);
  desenharPathBezier(gfx, pathBracoD, offsetX, offsetY);
  gfx.fill({ color: COR_PELE });
  gfx.stroke();

  const pathPernaE = gerarPathPerna(p('hip_L'), p('knee_L'), p('ankle_L'), PERFIL_PERNA_PADRAO, false);
  desenharPathBezier(gfx, pathPernaE, offsetX, offsetY);
  gfx.fill({ color: COR_PELE });
  gfx.stroke();

  const ankleR = { x: p('hip_R').x, y: p('knee_R').y + 42 };
  const pathPernaD = gerarPathPerna(p('hip_R'), p('knee_R'), ankleR, PERFIL_PERNA_PADRAO, true);
  desenharPathBezier(gfx, pathPernaD, offsetX, offsetY);
  gfx.fill({ color: COR_PELE });
  gfx.stroke();

  const pelvis  = p('root_pelvis');
  const sL      = p('shoulder_L');
  const sR      = p('shoulder_R');
  const hipL    = p('hip_L');
  const hipR    = p('hip_R');
  const ombrosY = sL.y;

  gfx.moveTo(offsetX+hipL.x-20, offsetY+pelvis.y+5);
  gfx.bezierCurveTo(offsetX+hipL.x-24, offsetY+ombrosY+30, offsetX+sL.x-8, offsetY+ombrosY+5, offsetX+sL.x, offsetY+ombrosY);
  gfx.bezierCurveTo(offsetX+sL.x+6, offsetY+ombrosY-4, offsetX+sL.x+12, offsetY+ombrosY-4, offsetX+sR.x-12, offsetY+ombrosY-4);
  gfx.bezierCurveTo(offsetX+sR.x-6, offsetY+ombrosY-4, offsetX+sR.x, offsetY+ombrosY, offsetX+sR.x+8, offsetY+ombrosY+5);
  gfx.bezierCurveTo(offsetX+hipR.x+24, offsetY+ombrosY+30, offsetX+hipR.x+20, offsetY+pelvis.y+5, offsetX+hipR.x+18, offsetY+pelvis.y+18);
  gfx.bezierCurveTo(offsetX+hipR.x+10, offsetY+pelvis.y+24, offsetX+pelvis.x+8, offsetY+pelvis.y+26, offsetX+pelvis.x, offsetY+pelvis.y+26);
  gfx.bezierCurveTo(offsetX+pelvis.x-8, offsetY+pelvis.y+26, offsetX+hipL.x-10, offsetY+pelvis.y+24, offsetX+hipL.x-18, offsetY+pelvis.y+18);
  gfx.bezierCurveTo(offsetX+hipL.x-20, offsetY+pelvis.y+10, offsetX+hipL.x-20, offsetY+pelvis.y+5, offsetX+hipL.x-20, offsetY+pelvis.y+5);
  gfx.closePath();
  gfx.fill({ color: COR_PELE });
  gfx.stroke();

  const neck = p('neck');
  const head = p('head');
  gfx.moveTo(offsetX+neck.x-7, offsetY+neck.y+2);
  gfx.bezierCurveTo(offsetX+neck.x-6, offsetY+head.y+4, offsetX+neck.x+6, offsetY+head.y+4, offsetX+neck.x+7, offsetY+neck.y+2);
  gfx.closePath();
  gfx.fill({ color: COR_PELE });
  gfx.stroke();

  gfx.ellipse(offsetX+head.x, offsetY+head.y-16, 22, 26);
  gfx.fill({ color: COR_PELE });
  gfx.stroke();

  gfx.ellipse(offsetX+head.x-6, offsetY+head.y-20, 3, 2);
  gfx.fill({ color: COR_SOMBRA });
  gfx.ellipse(offsetX+head.x+6, offsetY+head.y-20, 3, 2);
  gfx.fill({ color: COR_SOMBRA });
}
