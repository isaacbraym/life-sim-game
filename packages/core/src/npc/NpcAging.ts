import type { Npc } from '../schemas/npc';

export type ResultadoEnvelhecimento = {
  readonly npc: Npc;
  /** true se algum traço variável mudou nesta chamada */
  readonly houveMudancaVisual: boolean;
};

function calcularIdade(npc: Npc, anoAtual: number): number {
  return anoAtual - npc.dataNascimento.ano;
}

export function envelhecerNpc(npc: Npc, anoAtual: number): Npc {
  if (!npc.vivo) {
    return npc;
  }

  const idade = calcularIdade(npc, anoAtual);

  if (idade > 90) {
    return {
      ...npc,
      vivo: false,
    };
  }

  const variaveis = npc.tracosVariaveis;

  const temGrisalho = idade >= 45 ? true : variaveis.temGrisalho;
  const temRugas = idade >= 55 ? true : variaveis.temRugas;

  let temOlheiras = variaveis.temOlheiras;
  if (idade >= 35 && !temOlheiras) {
    if (Math.sin(npc.npcId.length * anoAtual) > 0.4) {
      temOlheiras = true;
    }
  }

  let usaOculos = variaveis.usaOculos;
  if (idade >= 40 && !usaOculos) {
    if (Math.sin(npc.npcId.length * anoAtual + 1) > 0.5) {
      usaOculos = true;
    }
  }

  const delta = Math.round(Math.sin(npc.npcId.length + anoAtual) * 2);
  const pesoAtual = Math.min(150, Math.max(40, variaveis.pesoAtual + delta));

  return {
    ...npc,
    tracosVariaveis: {
      ...variaveis,
      temGrisalho,
      temRugas,
      temOlheiras,
      usaOculos,
      pesoAtual,
    },
  };
}

export function envelhecerRoster(
  roster: readonly Npc[],
  anoAtual: number,
): Npc[] {
  return roster.map(npc => envelhecerNpc(npc, anoAtual));
}

export function envelhecerRosterComRelatorio(
  roster: readonly Npc[],
  anoAtual: number,
): {
  readonly rosterAtualizado: Npc[];
  readonly npcsMudados: readonly string[];
} {
  const rosterAtualizado: Npc[] = [];
  const npcsMudados: string[] = [];

  for (const npc of roster) {
    const npcEnvelhecido = envelhecerNpc(npc, anoAtual);
    rosterAtualizado.push(npcEnvelhecido);

    if (!npc.vivo) {
      continue;
    }

    const v1 = npc.tracosVariaveis;
    const v2 = npcEnvelhecido.tracosVariaveis;

    const mudouVisual =
      v1.temGrisalho !== v2.temGrisalho ||
      v1.temRugas !== v2.temRugas ||
      v1.temOlheiras !== v2.temOlheiras ||
      v1.usaOculos !== v2.usaOculos ||
      v1.pesoAtual !== v2.pesoAtual ||
      npc.vivo !== npcEnvelhecido.vivo;

    if (mudouVisual) {
      npcsMudados.push(npc.npcId);
    }
  }

  return { rosterAtualizado, npcsMudados };
}
