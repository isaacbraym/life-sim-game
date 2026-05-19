import { Npc } from '../schemas/npc';

export interface RosterEntry {
  npc: Npc;
  ultimaInteracaoAno?: number;
}

export function adicionarAoRoster(roster: Npc[], npc: Npc): Npc[] {
  return [...roster, npc];
}

export function buscarPorTag(roster: Npc[], tag: string): Npc[] {
  return roster.filter(npc => npc.tags.includes(tag));
}

export function buscarVivos(roster: Npc[]): Npc[] {
  return roster.filter(npc => npc.vivo);
}

export function coletarLixo(roster: Npc[], anoAtual: number, limiteAnosSemInteracao: number): Npc[] {
  return roster.filter(npc => {
    if (npc.persistencia === 'permanente') return true;
    
    let ultimaInt = npc.relacionamentoComJogador.ultimaInteracao?.ano;
    
    const ultimaInteracaoHistorico = npc.historicoInteracoes.at(-1);
    if (ultimaInteracaoHistorico !== undefined) {
      const uId = ultimaInteracaoHistorico.ano;
      if (ultimaInt === undefined || uId > ultimaInt) {
        ultimaInt = uId;
      }
    }
    
    const anosInativo = anoAtual - (ultimaInt ?? npc.relacionamentoComJogador.conhecidoDesde.ano);
    
    return anosInativo <= limiteAnosSemInteracao;
  });
}
