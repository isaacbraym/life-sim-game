import type { Npc } from '../schemas/npc';
import type { SelectorNpc } from '../schemas/event';
import { gerarNpcNovo } from './NpcGenerator';
import { RosterDeNpcs } from './NpcRoster';

// ---------------------------------------------------------------------------
// Tipos exportados
// ---------------------------------------------------------------------------

export type ResultadoSelecaoNpc = {
  readonly npc: Npc;
  readonly foiCriado: boolean;
};

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

function npcSatisfazConstraints(
  npc: Npc,
  constraints: SelectorNpc['constraints'],
  anoAtual: number,
): boolean {
  const { genero, idadeMin, idadeMax, estiloCorporal, profissao } = constraints;

  if (genero !== undefined && genero !== 'qualquer' && npc.genero !== genero) return false;

  const idadeNpc = anoAtual - npc.dataNascimento.ano;
  if (idadeMin !== undefined && idadeNpc < idadeMin) return false;
  if (idadeMax !== undefined && idadeNpc > idadeMax) return false;

  if (estiloCorporal !== undefined && estiloCorporal !== 'qualquer') {
    if (npc.tracosFisicos.estiloCorporalBase !== estiloCorporal) return false;
  }

  if (profissao !== undefined && npc.profissaoAtual !== profissao) return false;

  return true;
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Seleciona NPC elegível do roster ou cria um novo se necessário.
 *
 * Regras de prioridade:
 * 1. tipo === 'sempre_novo' ou persistenciaApos === 'descartavel' → sempre cria novo
 * 2. Busca no roster: vivos, não-descartáveis, satisfazem constraints
 * 3. Se não encontrar elegível → cria novo via gerarNpcNovo
 *
 * @param seletor   Critério de seleção do evento
 * @param roster    Roster ativo do save
 * @param semente   Valor numérico para seleção determinística
 * @param anoAtual  Ano corrente no calendário do jogo (para cálculo de idade)
 */
export function selecionarOuCriarNpc(
  seletor: SelectorNpc,
  roster: RosterDeNpcs,
  semente: number,
  anoAtual: number,
): ResultadoSelecaoNpc {
  const deveSerSempreNovo =
    seletor.tipo === 'sempre_novo' ||
    seletor.persistenciaApos === 'descartavel';

  if (!deveSerSempreNovo) {
    const candidatos = roster
      .listarVivos()
      .filter(npc => npc.persistencia !== 'descartavel')
      .filter(npc => npcSatisfazConstraints(npc, seletor.constraints, anoAtual));

    if (candidatos.length > 0) {
      const indice = semente % candidatos.length;
      const npcSelecionado = candidatos[indice];
      if (npcSelecionado !== undefined) {
        return { npc: npcSelecionado, foiCriado: false };
      }
    }
  }

  return { npc: gerarNpcNovo(seletor, semente), foiCriado: true };
}