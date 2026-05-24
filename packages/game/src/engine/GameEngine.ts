import type { SaveSlot } from '@lifesim/core';
import { filtrarEventosElegiveis, sortearEvento, EventLoader, RosterDeNpcs, db } from '@lifesim/core';
// envelhecerRoster não está no barrel de @lifesim/core (NpcAging.ts não foi adicionado ao npc/index.ts)
import { envelhecerRoster } from '@core/npc/NpcAging';
import { salvarParaEstadoDeJogo } from '@core/events/EstadoDeJogo';
import type { ResultadoRolagem } from '@core/rpg/D20Roll';

export type { ResultadoRolagem };

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
  // [FIX QA] cooldown é por-EVENTO (Event.triggers.cooldownMeses no schema),
  // não por-opção. Propagado para a UI registrar via engine.registrarCooldown.
  readonly cooldownMeses?: number;
  readonly resultadoRolagem?: ResultadoRolagem;
};

// [FIX QA] Estrutura mínima de Beat para extrair opções do scene canônico.
type BeatComOpcoes = {
  readonly tipo: 'escolha';
  readonly opcoes?: readonly {
    readonly texto?: string;
    readonly efeitos?: readonly EfeitoOpcaoDoTurno[];
    readonly atributoCheck?: { readonly atributo: string; readonly dificuldade: number };
  }[];
};

function ehBeatEscolha(beat: unknown): beat is BeatComOpcoes {
  return typeof beat === 'object'
    && beat !== null
    && (beat as { tipo?: unknown }).tipo === 'escolha';
}

/**
 * Extrai opções de um evento. Suporta dois formatos:
 *   1. Top-level `evento.opcoes` (formato simplificado do EventLoader)
 *   2. Schema canônico: opções dentro de `evento.scene.beats[].opcoes`
 *      (beat com `tipo: 'escolha'`)
 */
function extrairOpcoes(evento: Readonly<Record<string, unknown>>): OpcaoDoTurno[] {
  // Formato simplificado
  const opcoesTopLevel = evento.opcoes;
  if (Array.isArray(opcoesTopLevel)) {
    return opcoesTopLevel.map((opcao: Record<string, unknown>) => ({
      texto:         typeof opcao.texto === 'string' ? opcao.texto : '',
      efeitos:       Array.isArray(opcao.efeitos) ? opcao.efeitos as readonly EfeitoOpcaoDoTurno[] : [],
      atributoCheck: opcao.atributoCheck as OpcaoDoTurno['atributoCheck'],
    }));
  }

  // Schema canônico — buscar beat de escolha
  const scene = evento.scene;
  if (typeof scene !== 'object' || scene === null) return [];
  const beats = (scene as { beats?: unknown }).beats;
  if (!Array.isArray(beats)) return [];

  for (const beat of beats) {
    if (!ehBeatEscolha(beat)) continue;
    const opcoes = beat.opcoes ?? [];
    return opcoes.map((opcao) => ({
      texto:         opcao.texto ?? '',
      efeitos:       opcao.efeitos ?? [],
      atributoCheck: opcao.atributoCheck,
    }));
  }
  return [];
}

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

    // [FIX QA] Extrai opções suportando tanto o formato top-level quanto
    // o schema canônico (scene.beats[].opcoes).
    const opcoesComEfeitos: OpcaoDoTurno[] = extrairOpcoes(
      eventoCompleto as unknown as Readonly<Record<string, unknown>>,
    );

    // [FIX QA] Propaga o cooldownMeses do evento (era lido erradamente de opcao)
    const triggers = (eventoCompleto as unknown as { triggers?: { cooldownMeses?: number } }).triggers;
    const cooldownDoEvento = triggers?.cooldownMeses;

    return {
      eventoId:  eventoCompleto.id,
      titulo:    eventoCompleto.titulo    ?? eventoCompleto.id,
      descricao: eventoCompleto.descricao ?? '',
      icone:     eventoCompleto.icone     ?? '❓',
      opcoes:    opcoesComEfeitos,
      cooldownMeses: cooldownDoEvento,
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

  // [FIX QA] Atualiza configurações do save (conteúdo adulto, idioma).
  // Antes, conteudoAdultoAtivo no hudStore não persistia no SaveSlot.
  atualizarConfiguracoes(parcial: Partial<SaveSlot['configuracoes']>): void {
    this.saveAtivo = {
      ...this.saveAtivo,
      configuracoes: {
        ...this.saveAtivo.configuracoes,
        ...parcial,
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
