import type { Ponto } from '../rig/Joint';

export type ResultadoIK = {
  readonly anguloSuperior: number;
  readonly anguloInferior: number;
};

export function resolverTwoBoneIK(
  origem: Ponto,
  alvo: Ponto,
  comprimentoSuperior: number,
  comprimentoInferior: number,
  direcaoDobra: -1 | 1,
  limites: { readonly flexaoMin: number; readonly flexaoMax: number },
): ResultadoIK {
  const deltaX = alvo.x - origem.x;
  const deltaY = alvo.y - origem.y;
  const distanciaAlvo = Math.hypot(deltaX, deltaY);

  if (distanciaAlvo === 0) {
    return { anguloSuperior: 0, anguloInferior: 0 };
  }

  const alcanceMinimo = Math.abs(comprimentoSuperior - comprimentoInferior);
  const alcanceMaximo = comprimentoSuperior + comprimentoInferior;
  const distancia = Math.min(Math.max(distanciaAlvo, alcanceMinimo), alcanceMaximo);

  const cosAnguloSuperiorBruto =
    (comprimentoSuperior ** 2 + distancia ** 2 - comprimentoInferior ** 2) /
    (2 * comprimentoSuperior * distancia);
  const cosAnguloSuperior = Math.min(Math.max(cosAnguloSuperiorBruto, -1), 1);
  const anguloBase = Math.atan2(deltaY, deltaX);
  const anguloOssoSuperior =
    anguloBase - direcaoDobra * Math.acos(cosAnguloSuperior);

  const cosAnguloInferiorBruto =
    (comprimentoSuperior ** 2 + comprimentoInferior ** 2 - distancia ** 2) /
    (2 * comprimentoSuperior * comprimentoInferior);
  const cosAnguloInferior = Math.min(Math.max(cosAnguloInferiorBruto, -1), 1);
  const anguloOssoInferior =
    direcaoDobra * (Math.PI - Math.acos(cosAnguloInferior));

  return {
    anguloSuperior: clampAngulo(anguloOssoSuperior, limites.flexaoMin, limites.flexaoMax),
    anguloInferior: clampAngulo(anguloOssoInferior, limites.flexaoMin, limites.flexaoMax),
  };
}

function clampAngulo(angulo: number, min: number, max: number): number {
  return Math.min(Math.max(angulo, min), max);
}

/*
Testes minimos inline:
- Braco esticado: resolverTwoBoneIK({ x: 0, y: 0 }, { x: 2, y: 0 }, 1, 1, 1, { flexaoMin: -Math.PI, flexaoMax: Math.PI })
  deve retornar anguloSuperior proximo de 0 e anguloInferior proximo de 0.
- Alvo dobrado 90 graus: resolverTwoBoneIK({ x: 0, y: 0 }, { x: 1, y: 1 }, 1, 1, 1, { flexaoMin: -Math.PI, flexaoMax: Math.PI })
  deve retornar angulos finitos, com dobra positiva na convencao de direcaoDobra.
*/
