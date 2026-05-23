import { Graphics } from 'pixi.js';
import {
  gerarPathBraco,
  gerarPathPerna,
  PERFIL_BRACO_PADRAO,
  PERFIL_PERNA_PADRAO,
} from '@core/silhouette';
import type { PathBraco } from '@core/silhouette';
import { Esqueleto } from '@lifesim/core';

const COR_PELE       = 0xf5c5a3;
const COR_SOMBRA     = 0xe8a882;
const COR_CONTORNO   = 0x2a1a0e;
const ESPESSURA_CONTORNO = 1.2;

function desenharElipseInclinada(gfx: Graphics, cx: number, cy: number, rx: number, ry: number, angle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const m = 0.552284749831;
  const tx = (px: number, py: number) => cx + px * cos - py * sin;
  const ty = (px: number, py: number) => cy + px * sin + py * cos;

  gfx.moveTo(tx(rx, 0), ty(rx, 0));
  gfx.bezierCurveTo(tx(rx, ry * m), ty(rx, ry * m), tx(rx * m, ry), ty(rx * m, ry), tx(0, ry), ty(0, ry));
  gfx.bezierCurveTo(tx(-rx * m, ry), ty(-rx * m, ry), tx(-rx, ry * m), ty(-rx, ry * m), tx(-rx, 0), ty(-rx, 0));
  gfx.bezierCurveTo(tx(-rx, -ry * m), ty(-rx, -ry * m), tx(-rx * m, -ry), ty(-rx * m, -ry), tx(0, -ry), ty(0, -ry));
  gfx.bezierCurveTo(tx(rx * m, -ry), ty(rx * m, -ry), tx(rx, -ry * m), ty(rx, -ry * m), tx(rx, 0), ty(rx, 0));
  gfx.closePath();
}

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
  const neck    = p('neck');
  const head    = p('head');

  const rootX = offsetX + pelvis.x;
  
  const ombroEsqX = offsetX + sL.x - 14;
  const ombroDirX = offsetX + sR.x + 14;
  const quadrilEsqX = offsetX + hipL.x - 14;
  const quadrilDirX = offsetX + hipR.x + 14;
  const cinturaEsqX = rootX - 15;
  const cinturaDirX = rootX + 15;
  const cinturaY = (sL.y + pelvis.y) / 2 + 10;

  gfx.moveTo(rootX - 10, offsetY + neck.y + 10);
  
  // Top left: Pescoço para ombro (curva arredondada)
  gfx.bezierCurveTo(
    rootX - 25, offsetY + neck.y + 10,
    ombroEsqX, offsetY + sL.y - 10,
    ombroEsqX, offsetY + sL.y + 5
  );
  
  // Lado esquerdo: Ombro para quadril
  gfx.bezierCurveTo(
    ombroEsqX, offsetY + cinturaY - 10,
    cinturaEsqX, offsetY + cinturaY,
    quadrilEsqX, offsetY + pelvis.y
  );
  
  // Fundo (virilha)
  gfx.bezierCurveTo(
    quadrilEsqX + 5, offsetY + pelvis.y + 16,
    quadrilDirX - 5, offsetY + pelvis.y + 16,
    quadrilDirX, offsetY + pelvis.y
  );
  
  // Lado direito: Quadril para ombro
  gfx.bezierCurveTo(
    cinturaDirX, offsetY + cinturaY,
    ombroDirX, offsetY + cinturaY - 10,
    ombroDirX, offsetY + sR.y + 5
  );
  
  // Top right: Ombro para pescoço
  gfx.bezierCurveTo(
    ombroDirX, offsetY + sR.y - 10,
    rootX + 25, offsetY + neck.y + 10,
    rootX + 10, offsetY + neck.y + 10
  );
  
  // Conexão base do pescoço
  gfx.bezierCurveTo(
    rootX + 5, offsetY + neck.y + 12,
    rootX - 5, offsetY + neck.y + 12,
    rootX - 10, offsetY + neck.y + 10
  );
  
  gfx.closePath();
  gfx.fill({ color: COR_PELE });
  gfx.stroke();

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

  // Mãos simples (16x9 -> radius 8x4.5) inclinadas
  const wristL = p('wrist_L');
  const wristR = p('wrist_R');
  desenharElipseInclinada(gfx, offsetX + wristL.x, offsetY + wristL.y, 8, 4.5, 0.4);
  gfx.fill({ color: COR_PELE });
  gfx.stroke();
  desenharElipseInclinada(gfx, offsetX + wristR.x, offsetY + wristR.y, 8, 4.5, -0.4);
  gfx.fill({ color: COR_PELE });
  gfx.stroke();

  // Pés simples (18x8 -> radius 9x4) horizontais
  const ankleL = p('ankle_L');
  gfx.ellipse(offsetX + ankleL.x, offsetY + ankleL.y + 3, 9, 4);
  gfx.fill({ color: COR_PELE });
  gfx.stroke();
  gfx.ellipse(offsetX + ankleR.x, offsetY + ankleR.y + 3, 9, 4);
  gfx.fill({ color: COR_PELE });
  gfx.stroke();
}
