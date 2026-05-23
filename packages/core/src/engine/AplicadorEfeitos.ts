import type { Character } from '../schemas/character';
import type { Effect } from '../schemas/effect';
import type { Npc } from '../schemas/npc';

export type ResultadoEfeito = {
  readonly personagem: Character;
  readonly roster: readonly Npc[];
};

function limitarValor(valor: number, minimo: number, maximo: number): number {
  return Math.min(maximo, Math.max(minimo, valor));
}

function atualizarRelacionamentoNpc(npc: Npc, delta: number): Npc {
  return {
    ...npc,
    relacionamentoComJogador: {
      ...npc.relacionamentoComJogador,
      afeto: limitarValor(npc.relacionamentoComJogador.afeto + delta, -100, 100),
    },
  };
}

function matarNpc(npc: Npc, causa: string): Npc {
  return {
    ...npc,
    vivo: false,
    dataMorte: {
      ano: 0,
      mes: 1,
      causa,
    },
  };
}

export function aplicarEfeito(
  efeito: Effect,
  personagem: Character,
  roster: readonly Npc[],
): ResultadoEfeito {
  switch (efeito.tipo) {
    case 'alterar_atributo':
      return {
        personagem: {
          ...personagem,
          atributos: {
            ...personagem.atributos,
            [efeito.atributo]: limitarValor(personagem.atributos[efeito.atributo] + efeito.delta, 1, 20),
          },
        },
        roster,
      };

    case 'alterar_dinheiro':
      return {
        personagem: {
          ...personagem,
          dinheiro: personagem.dinheiro + efeito.delta,
        },
        roster,
      };

    case 'adicionar_flag':
      return {
        personagem: personagem.flags.includes(efeito.flag)
          ? personagem
          : {
              ...personagem,
              flags: [...personagem.flags, efeito.flag],
            },
        roster,
      };

    case 'remover_flag':
      return {
        personagem: {
          ...personagem,
          flags: personagem.flags.filter(flagAtual => flagAtual !== efeito.flag),
        },
        roster,
      };

    case 'alterar_relacionamento':
      return {
        personagem,
        roster: roster.map(npc =>
          npc.npcId === efeito.npcId ? atualizarRelacionamentoNpc(npc, efeito.delta) : npc,
        ),
      };

    case 'matar_npc':
      return {
        personagem,
        roster: roster.map(npc => (npc.npcId === efeito.npcId ? matarNpc(npc, efeito.causa) : npc)),
      };

    case 'mudar_profissao':
      return {
        personagem: {
          ...personagem,
          profissaoAtual: efeito.profissao,
          salarioMensal: efeito.salario ?? personagem.salarioMensal,
        },
        roster,
      };

    case 'alterar_saude':
      return {
        personagem: {
          ...personagem,
          saudeAtual: limitarValor(personagem.saudeAtual + efeito.delta, 0, 100),
        },
        roster,
      };

    case 'alterar_humor':
      return {
        personagem: {
          ...personagem,
          humorAtual: limitarValor(personagem.humorAtual + efeito.delta, 0, 100),
        },
        roster,
      };

    case 'aplicar_status':
    case 'disparar_evento':
      return {
        personagem,
        roster,
      };
  }
}
