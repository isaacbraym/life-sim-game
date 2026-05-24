import type { SaveSlot } from '@lifesim/core';
import { filtrarEventosElegiveis, sortearEvento, EventLoader, RosterDeNpcs, db } from '@lifesim/core';
// envelhecerRoster não está no barrel de @lifesim/core (NpcAging.ts não foi adicionado ao npc/index.ts)
import { envelhecerRoster } from '@core/npc/NpcAging';
import { salvarParaEstadoDeJogo } from '@core/events/EstadoDeJogo';

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

export type EfeitoOpcaoDoTurno = {
  readonly tipo: string;
  readonly [chave: string]: unknown;
};

export type OpcaoDoTurno = {
  readonly texto: string;
  readonly efeitos: readonly EfeitoOpcaoDoTurno[];
  readonly atributoCheck?: {
    readonly atributo: string;
    readonly dificuldade: number;
  };
};

export type EventoDoTurno = {
  readonly eventoId: string;
  readonly titulo: string;
  readonly descricao: string;
  readonly icone: string;
  readonly opcoes: readonly OpcaoDoTurno[];
};

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const MESES_POR_RITMO: Readonly<Record<string, number>> = {
  mensal:    1,
  semestral: 6,
  anual:     12,
};

// ---------------------------------------------------------------------------
// GameEngine
// ---------------------------------------------------------------------------

export class GameEngine {
  private saveAtivo: SaveSlot;
  private rosterDeNpcs: RosterDeNpcs;
  private readonly eventLoader: EventLoader;

  constructor(saveAtivo: SaveSlot) {
    this.saveAtivo = saveAtivo;
    this.eventLoader = new EventLoader();
    this.rosterDeNpcs = new RosterDeNpcs();
    for (const npc of saveAtivo.roster) {
      this.rosterDeNpcs.adicionar(npc);
    }
  }

  async avancarTurno(): Promise<EventoDoTurno | undefined> {
    // 1. Avançar meses conforme ritmo
    const incremento = MESES_POR_RITMO[this.saveAtivo.configuracoes.ritmo] ?? 1;
    let mesAtual = this.saveAtivo.estadoMundo.mesAtual + incremento;
    let anoAtual = this.saveAtivo.estadoMundo.anoAtual;
    let rosterAtual = this.saveAtivo.roster;

    // 2. Virar ano e envelhecer roster quando mês ultrapassa 12
    while (mesAtual > 12) {
      mesAtual -= 12;
      anoAtual += 1;
      rosterAtual = envelhecerRoster(rosterAtual, anoAtual);
    }

    this.saveAtivo = {
      ...this.saveAtivo,
      roster: rosterAtual,
      estadoMundo: { ...this.saveAtivo.estadoMundo, mesAtual, anoAtual },
    };

    // Sincronizar RosterDeNpcs com o novo estado
    this.rosterDeNpcs = new RosterDeNpcs();
    for (const npc of rosterAtual) {
      this.rosterDeNpcs.adicionar(npc);
    }

    // 3. Carregar eventos disponíveis
    const todosEventos = await this.eventLoader.carregarTodos();

    // 4. Converter SaveSlot para o estado canônico do motor de eventos
    const estadoParaFiltro = salvarParaEstadoDeJogo(this.saveAtivo, anoAtual);

    // 5. Filtrar eventos elegíveis
    const elegiveis = filtrarEventosElegiveis(todosEventos, estadoParaFiltro);

    // 6. Sortear evento
    const sorteado = sortearEvento(elegiveis);

    // 7. Persistir estado avançado
    await this.salvar();

    if (sorteado === undefined) return undefined;

    // 8. Buscar dados de exibição do evento sorteado
    const eventoCompleto = todosEventos.find(e => e.id === sorteado.id);
    if (eventoCompleto === undefined) return undefined;

    const opcoesComEfeitos: OpcaoDoTurno[] = (eventoCompleto.opcoes ?? []).map(opcao => ({
      texto:         opcao.texto,
      efeitos:       opcao.efeitos ?? [],
      atributoCheck: opcao.atributoCheck,
    }));

    return {
      eventoId:  eventoCompleto.id,
      titulo:    eventoCompleto.titulo    ?? eventoCompleto.id,
      descricao: eventoCompleto.descricao ?? '',
      icone:     eventoCompleto.icone     ?? '❓',
      opcoes:    opcoesComEfeitos,
    };
  }

  obterEstadoAtual(): SaveSlot {
    return this.saveAtivo;
  }

  registrarCooldown(eventoId: string, anoExpiracao: number): void {
    this.saveAtivo = {
      ...this.saveAtivo,
      cooldownRegistry: {
        ...this.saveAtivo.cooldownRegistry,
        [eventoId]: anoExpiracao,
      },
    };
  }

  aplicarResultadoEfeitos(
    protagonistaAtualizado: import('@lifesim/core').Character,
    rosterAtualizado: readonly import('@lifesim/core').Npc[],
  ): void {
    this.saveAtivo = {
      ...this.saveAtivo,
      protagonista: protagonistaAtualizado,
      roster: [...rosterAtualizado],
      ultimaPartida: new Date().toISOString(),
    };
  }

  async salvarEstadoAtual(): Promise<void> {
    await this.salvar();
  }

  async salvar(): Promise<void> {
    await db.saves.put(this.saveAtivo);
  }
}
