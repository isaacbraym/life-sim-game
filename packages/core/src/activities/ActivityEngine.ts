import { aplicarEfeito } from '../engine/AplicadorEfeitos';
import type { Character } from '../schemas/character';
import type { Effect } from '../schemas/effect';
import type { Npc } from '../schemas/npc';
import type { Atividade } from './ActivityCatalog';

export type ResultadoAtividade = {
  readonly protagonistaAtualizado: Character;
  readonly log: string;
};

const ROSTER_VAZIO: readonly Npc[] = [];

function idadeEmAnos(protagonista: Character): number {
  return Math.floor(protagonista.idadeAtualMeses / 12);
}

function custoAbsoluto(atividade: Atividade): number {
  return Math.abs(atividade.custoDinheiro);
}

function aplicarEfeitoDaAtividade(
  efeito: Effect,
  protagonista: Character,
): Character {
  if (efeito.tipo === 'alterar_atributo') {
    return {
      ...protagonista,
      atributos: {
        ...protagonista.atributos,
        [efeito.atributo]: Math.max(1, protagonista.atributos[efeito.atributo] + efeito.delta),
      },
    };
  }

  return aplicarEfeito(efeito, protagonista, ROSTER_VAZIO).personagem;
}

function nomeAtributo(atributo: Effect & { readonly tipo: 'alterar_atributo' }): string {
  const nomes = {
    forca: 'Forca',
    inteligencia: 'Inteligencia',
    carisma: 'Carisma',
    constituicao: 'Constituicao',
    sorte: 'Sorte',
  } satisfies Record<typeof atributo.atributo, string>;

  return nomes[atributo.atributo];
}

function formatarDelta(rotulo: string, delta: number): string {
  const sinal = delta >= 0 ? '+' : '';
  return `${rotulo} ${sinal}${delta}`;
}

function descreverEfeito(efeito: Effect): string | undefined {
  switch (efeito.tipo) {
    case 'alterar_atributo':
      return formatarDelta(nomeAtributo(efeito), efeito.delta);

    case 'alterar_dinheiro':
      return formatarDelta('Dinheiro', efeito.delta);

    case 'alterar_saude':
      return formatarDelta('Saude', efeito.delta);

    case 'alterar_humor':
      return formatarDelta('Humor', efeito.delta);

    case 'adicionar_flag':
      return `Flag ${efeito.flag}`;

    case 'remover_flag':
      return `Removeu flag ${efeito.flag}`;

    case 'mudar_profissao':
      return `Profissao: ${efeito.profissao}`;

    case 'alterar_relacionamento':
    case 'matar_npc':
    case 'aplicar_status':
    case 'disparar_evento':
      return undefined;
  }
}

function montarLog(atividade: Atividade): string {
  const efeitos = atividade.efeitos
    .map(descreverEfeito)
    .filter((descricao): descricao is string => descricao !== undefined);

  if (efeitos.length === 0) {
    return `Voce realizou ${atividade.rotulo}.`;
  }

  return `${atividade.rotulo}: ${efeitos.join(', ')}.`;
}

export function realizarAtividade(
  atividade: Atividade,
  protagonista: Character,
): ResultadoAtividade {
  if (idadeEmAnos(protagonista) < atividade.idadeMinima) {
    return {
      protagonistaAtualizado: protagonista,
      log: `Você é muito jovem para ${atividade.rotulo}`,
    };
  }

  if (custoAbsoluto(atividade) > protagonista.dinheiro) {
    return {
      protagonistaAtualizado: protagonista,
      log: `Sem dinheiro para ${atividade.rotulo}`,
    };
  }

  const protagonistaAtualizado = atividade.efeitos.reduce<Character>(
    (atual, efeito) => aplicarEfeitoDaAtividade(efeito, atual),
    protagonista,
  );

  return {
    protagonistaAtualizado,
    log: montarLog(atividade),
  };
}
