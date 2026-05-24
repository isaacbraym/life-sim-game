import type { JointId } from '../schemas/pose';
import type { Joint, Ponto } from './Joint';

export function computarFK(
  juntas: Map<JointId, Joint>,
  ordemTopologica: JointId[],
): Map<JointId, { x: number; y: number; rotacao: number }> {
  const resultado = new Map<JointId, { x: number; y: number; rotacao: number }>();

  for (const id of ordemTopologica) {
    const junta = juntas.get(id);

    if (junta === undefined) {
      throw new Error(`Joint inexistente: ${id}`);
    }

    if (junta.parentId === null) {
      resultado.set(id, {
        x: junta.localPosition.x,
        y: junta.localPosition.y,
        rotacao: junta.rotacaoLocal,
      });
      continue;
    }

    const pai = resultado.get(junta.parentId);

    if (pai === undefined) {
      throw new Error(`Joint pai ainda nao processado: ${junta.parentId}`);
    }

    const offsetRotacionado = rotacionar(junta.localPosition, pai.rotacao);
    const posicaoMundial = somarPontos(
      { x: pai.x, y: pai.y },
      offsetRotacionado,
    );

    resultado.set(id, {
      x: posicaoMundial.x,
      y: posicaoMundial.y,
      rotacao: pai.rotacao + junta.rotacaoLocal,
    });
  }

  return resultado;
}

function rotacionar(ponto: Ponto, angulo: number): Ponto {
  return {
    x: ponto.x * Math.cos(angulo) - ponto.y * Math.sin(angulo),
    y: ponto.x * Math.sin(angulo) + ponto.y * Math.cos(angulo),
  };
}

function somarPontos(a: Ponto, b: Ponto): Ponto {
  return { x: a.x + b.x, y: a.y + b.y };
}
