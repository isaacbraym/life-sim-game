import type { Ponto } from '../rig/Joint';

export function resolverFABRIK(
  joints: Ponto[],
  comprimentos: number[],
  alvo: Ponto,
  maxIteracoes: number,
  tolerancia: number,
): Ponto[] {
  if (joints.length < 2 || comprimentos.length !== joints.length - 1) {
    throw new Error('Cadeia FABRIK invalida');
  }

  const raizOriginal = obterPonto(joints, 0);
  const somaComprimentos = comprimentos.reduce(
    (total, comprimento) => total + comprimento,
    0,
  );

  if (distancia(raizOriginal, alvo) > somaComprimentos) {
    const posicoesEsticadas: Ponto[] = [raizOriginal];

    for (let indice = 0; indice < comprimentos.length; indice += 1) {
      const atual = obterPonto(posicoesEsticadas, indice);
      const direcao = normalizar(subtrair(alvo, atual));
      posicoesEsticadas.push(
        somar(atual, escalar(direcao, obterComprimento(comprimentos, indice))),
      );
    }

    return posicoesEsticadas;
  }

  const posicoes = joints.map((joint) => ({ x: joint.x, y: joint.y }));
  const ultimo = posicoes.length - 1;

  for (
    let iteracao = 0;
    iteracao < maxIteracoes && distancia(obterPonto(posicoes, ultimo), alvo) > tolerancia;
    iteracao += 1
  ) {
    posicoes[ultimo] = alvo;

    for (let indice = ultimo - 1; indice >= 0; indice -= 1) {
      const pontoAtual = obterPonto(posicoes, indice);
      const pontoProximo = obterPonto(posicoes, indice + 1);
      const direcao = normalizar(subtrair(pontoAtual, pontoProximo));
      posicoes[indice] = somar(
        pontoProximo,
        escalar(direcao, obterComprimento(comprimentos, indice)),
      );
    }

    posicoes[0] = raizOriginal;

    for (let indice = 0; indice < ultimo; indice += 1) {
      const pontoAtual = obterPonto(posicoes, indice);
      const pontoProximo = obterPonto(posicoes, indice + 1);
      const direcao = normalizar(subtrair(pontoProximo, pontoAtual));
      posicoes[indice + 1] = somar(
        pontoAtual,
        escalar(direcao, obterComprimento(comprimentos, indice)),
      );
    }
  }

  return posicoes;
}

function distancia(a: Ponto, b: Ponto): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalizar(v: Ponto): Ponto {
  const magnitude = Math.hypot(v.x, v.y);

  if (magnitude === 0) {
    return { x: 0, y: 0 };
  }

  return { x: v.x / magnitude, y: v.y / magnitude };
}

function subtrair(a: Ponto, b: Ponto): Ponto {
  return { x: a.x - b.x, y: a.y - b.y };
}

function somar(a: Ponto, b: Ponto): Ponto {
  return { x: a.x + b.x, y: a.y + b.y };
}

function escalar(p: Ponto, fator: number): Ponto {
  return { x: p.x * fator, y: p.y * fator };
}

function obterPonto(pontos: readonly Ponto[], indice: number): Ponto {
  const ponto = pontos[indice];

  if (ponto === undefined) {
    throw new Error('Ponto FABRIK inexistente');
  }

  return ponto;
}

function obterComprimento(comprimentos: readonly number[], indice: number): number {
  const comprimento = comprimentos[indice];

  if (comprimento === undefined) {
    throw new Error('Comprimento FABRIK inexistente');
  }

  return comprimento;
}

/*
Testes minimos inline:
- Alvo alcancavel: resolverFABRIK([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }], [1, 1], { x: 1, y: 1 }, 10, 0.001)
  deve retornar uma chain com a ponta proxima de { x: 1, y: 1 }.
- Alvo fora do alcance: resolverFABRIK([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }], [1, 1], { x: 4, y: 0 }, 10, 0.001)
  deve retornar uma chain esticada de x 0 ate x 2.
*/
