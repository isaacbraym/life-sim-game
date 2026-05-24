import { create } from 'zustand';
import {
  aplicarEfeito,
  carregarTodosEventos,
  Effect,
  Event as EventSchema,
  GameEngine as CoreGameEngine,
  rolarD20ComModificador,
} from '@lifesim/core';
import type { Event as CoreEvent, ResultadoResolucao, SaveSlot } from '@lifesim/core';
import { ATIVIDADES_BASE } from '@core/activities/ActivityCatalog';
import { realizarAtividade as realizarAtividadeCore } from '@core/activities/ActivityEngine';
import { salvarSave } from '@core/persistence/SaveManager';
import { registrarAutosave } from '@core/persistence/AutosaveOrchestrator';
import { GameEngine as GameEngineLegado, type ResultadoRolagem } from '../engine/GameEngine';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type AtributoRpg = {
  readonly nome: string;
  readonly valor: number;
};

type TelaHud = 'jogo' | 'selecionar_save' | 'novo_personagem' | 'configuracoes' | 'morte';

type EstadoHud = {
  readonly nomePersonagem: string;
  readonly profissaoAtual: string;
  readonly idadeAnos: number;
  readonly anoAtual: number;
  readonly humor: number;
  readonly saude: number;
  readonly dinheiro: number;
  readonly eventoAtivo: EventoAtivo | undefined;
  readonly eventoPrincipalAtivo: CoreEvent | undefined;
  readonly resultadoEventoAtivo: ResultadoResolucao | undefined;
  readonly ultimaRolagem?: ResultadoRolagem;
  readonly atributos: readonly AtributoRpg[];
  readonly engineAtivo: GameEngineLegado | undefined;
  readonly saveAtual: SaveSlot | undefined;
  readonly telaAtual: TelaHud | undefined;
  // [NEW] feat/ui-sprint-1-5 — EventLog, SettingsScreen, DeathScreen
  readonly eventosVividos: readonly string[];
  readonly conteudoAdultoAtivo: boolean;
  readonly saveIdAtivo: string | undefined;
  readonly ritmoAtual: 'mensal' | 'semestral' | 'anual' | undefined;
};

// [FIX QA] cooldownMeses removido — pertence ao EVENTO (Event.triggers), não à opção
export type OpcaoEvento = {
  readonly texto: string;
  readonly efeitos: readonly unknown[];
  readonly atributoCheck?: {
    readonly atributo: string;
    readonly dificuldade: number;
  };
};

export type EventoAtivo = {
  readonly eventoId: string;
  readonly titulo: string;
  readonly descricao: string;
  readonly icone: string;
  readonly opcoes: readonly OpcaoEvento[];
  // [FIX QA] cooldown do evento, propagado pelo GameEngine
  readonly cooldownMeses?: number;
};

type AcoesHud = {
  readonly atualizarEstado: (parcial: Partial<EstadoHud>) => void;
  readonly resolverOpcao: (indice: number) => void;
  readonly avancarTempo: () => void;
  readonly resolverEventoAtivo: (idOpcao: string) => void;
  readonly confirmarResultado: () => void;
  readonly avancarSemEvento: () => void;
  readonly inicializarEngine: (save: SaveSlot) => void;
  readonly avancarTurno: () => Promise<void>;
  readonly realizarAtividade: (idAtividade: string) => void;
  // [NEW]
  readonly alterarConteudoAdulto: (valor: boolean) => void;
};

// ---------------------------------------------------------------------------
// Mock inicial
// ---------------------------------------------------------------------------

const EVENTO_MOCK: EventoAtivo = {
  eventoId: 'mock_promocao',
  titulo: 'Proposta de promoção',
  icone: '💼',
  descricao:
    'Seu gerente te chamou na sala e ofereceu uma promoção — salário 40% maior, mas viagens semanais e menos tempo com a família.',
  opcoes: [
    { texto: 'Aceitar a promoção', efeitos: [] },
    { texto: 'Negociar condições', efeitos: [] },
    { texto: 'Recusar por ora', efeitos: [] },
  ],
};

const ATRIBUTOS_MOCK: readonly AtributoRpg[] = [
  { nome: 'Força',        valor: 8  },
  { nome: 'Inteligência', valor: 14 },
  { nome: 'Carisma',      valor: 12 },
  { nome: 'Constituição', valor: 11 },
  { nome: 'Sorte',        valor: 16 },
];

const ESTADO_INICIAL: EstadoHud = {
  nomePersonagem: 'Lucas Mendes',
  profissaoAtual: 'Analista Financeiro',
  idadeAnos: 27,
  anoAtual: 1997,
  humor: 68,
  saude: 82,
  dinheiro: 3450,
  eventoAtivo: EVENTO_MOCK,
  eventoPrincipalAtivo: undefined,
  resultadoEventoAtivo: undefined,
  ultimaRolagem: undefined,
  atributos: ATRIBUTOS_MOCK,
  engineAtivo: undefined,
  saveAtual: undefined,
  telaAtual: 'jogo',
  eventosVividos: [],
  conteudoAdultoAtivo: false,
  saveIdAtivo: undefined,
  ritmoAtual: undefined,
};

function atributosParaHud(protagonista: SaveSlot['protagonista']): readonly AtributoRpg[] {
  return [
    { nome: 'ForÃ§a',        valor: protagonista.atributos.forca        },
    { nome: 'InteligÃªncia', valor: protagonista.atributos.inteligencia },
    { nome: 'Carisma',      valor: protagonista.atributos.carisma      },
    { nome: 'ConstituiÃ§Ã£o', valor: protagonista.atributos.constituicao },
    { nome: 'Sorte',        valor: protagonista.atributos.sorte        },
  ];
}

function estadoHudDoSave(save: SaveSlot): Pick<
  EstadoHud,
  'nomePersonagem' | 'profissaoAtual' | 'idadeAnos' | 'anoAtual' | 'humor' | 'saude' | 'dinheiro' | 'eventosVividos' | 'atributos'
> {
  const protagonista = save.protagonista;

  return {
    nomePersonagem: `${protagonista.nome} ${protagonista.sobrenome}`,
    profissaoAtual: protagonista.profissaoAtual ?? '',
    idadeAnos: Math.floor(protagonista.idadeAtualMeses / 12),
    anoAtual: save.estadoMundo.anoAtual,
    humor: protagonista.humorAtual,
    saude: protagonista.saudeAtual,
    dinheiro: protagonista.dinheiro,
    eventosVividos: protagonista.eventosVividos,
    atributos: atributosParaHud(protagonista),
  };
}

function validarEventosCanonicos(eventos: readonly unknown[]): readonly CoreEvent[] {
  const eventosValidos: CoreEvent[] = [];

  for (const evento of eventos) {
    const resultado = EventSchema.safeParse(evento);
    if (resultado.success) {
      eventosValidos.push(resultado.data);
    }
  }

  return eventosValidos;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useHudStore = create<EstadoHud & AcoesHud>((set, get) => ({
  ...ESTADO_INICIAL,

  atualizarEstado: (parcial) =>
    set((anterior) => ({ ...anterior, ...parcial })),

  resolverOpcao: (indice: number) => {
    const { eventoAtivo, engineAtivo } = get();
    if (eventoAtivo === undefined) return;

    let opcao = eventoAtivo.opcoes[indice];
    if (opcao === undefined) return;

    if (engineAtivo === undefined) {
      set((anterior) => ({ ...anterior, eventoAtivo: undefined, ultimaRolagem: undefined }));
      return;
    }

    const saveAtual = engineAtivo.obterEstadoAtual();
    let protagonistaAtual = saveAtual.protagonista;
    let rosterAtual = saveAtual.roster;
    let rolagemResultado: ResultadoRolagem | undefined;

    // Resolver atributoCheck se presente
    if (opcao.atributoCheck !== undefined) {
      const { atributo, dificuldade } = opcao.atributoCheck;
      const chaveAtributo = atributo as keyof typeof protagonistaAtual.atributos;
      const valorAtributo = protagonistaAtual.atributos[chaveAtributo] ?? 10;
      rolagemResultado = rolarD20ComModificador(valorAtributo, dificuldade);

      // Se falha grave: aplicar apenas o primeiro efeito, geralmente negativo.
      // Se falha normal: não aplicar efeitos por enquanto.
      // Se passou ou crítico: aplicar todos os efeitos normalmente.
      if (rolagemResultado.falhaGrave) {
        opcao = { ...opcao, efeitos: opcao.efeitos.slice(0, 1) };
      } else if (!rolagemResultado.passou) {
        opcao = { ...opcao, efeitos: [] };
      }
    }

    // Aplicar efeitos canonicos via AplicadorEfeitos
    for (const efeitoRaw of opcao.efeitos) {
      const resultado = Effect.safeParse(efeitoRaw);
      if (!resultado.success) continue;
      const aplicado = aplicarEfeito(resultado.data, protagonistaAtual, rosterAtual);
      protagonistaAtual = aplicado.personagem;
      rosterAtual = [...aplicado.roster];
    }

    // Registrar evento como vivido
    if (!protagonistaAtual.eventosVividos.includes(eventoAtivo.eventoId)) {
      protagonistaAtual = {
        ...protagonistaAtual,
        eventosVividos: [...protagonistaAtual.eventosVividos, eventoAtivo.eventoId],
      };
    }

    // [FIX QA] Registrar cooldown do EVENTO (cooldownMeses é per-event, não per-option)
    const cooldownMeses = eventoAtivo.cooldownMeses;
    if (cooldownMeses !== undefined && cooldownMeses > 0) {
      const anoAtual = saveAtual.estadoMundo.anoAtual;
      const anoExpiracao = anoAtual + Math.ceil(cooldownMeses / 12);
      engineAtivo.registrarCooldown(eventoAtivo.eventoId, anoExpiracao);
    }

    // Persistir via engine
    engineAtivo.aplicarResultadoEfeitos(protagonistaAtual, rosterAtual);
    const saveAtualizado = engineAtivo.obterEstadoAtual();
    registrarAutosave(saveAtualizado, 'forcar');

    // Atualizar store
    set((anterior) => ({
      ...anterior,
      saveAtual: saveAtualizado,
      eventoAtivo: undefined,
      ultimaRolagem: rolagemResultado,
      humor:    protagonistaAtual.humorAtual,
      saude:    protagonistaAtual.saudeAtual,
      dinheiro: protagonistaAtual.dinheiro,
      eventosVividos: protagonistaAtual.eventosVividos,
      atributos: [
        { nome: 'Força',        valor: protagonistaAtual.atributos.forca        },
        { nome: 'Inteligência', valor: protagonistaAtual.atributos.inteligencia },
        { nome: 'Carisma',      valor: protagonistaAtual.atributos.carisma      },
        { nome: 'Constituição', valor: protagonistaAtual.atributos.constituicao },
        { nome: 'Sorte',        valor: protagonistaAtual.atributos.sorte        },
      ],
    }));
  },

  avancarTempo: () => {
    const saveAtual = get().saveAtual ?? get().engineAtivo?.obterEstadoAtual();
    if (saveAtual === undefined) return;

    void carregarTodosEventos()
      .then((eventosCarregados) => {
        const eventos = validarEventosCanonicos(eventosCarregados);
        const engine = new CoreGameEngine();
        const { saveAposTempo, eventoSorteado } = engine.avancarTempoEContinuar(saveAtual, eventos);
        const morteProtagonista = engine.verificarMorte(saveAposTempo.protagonista);

        set((anterior) => ({
          ...anterior,
          ...estadoHudDoSave(saveAposTempo),
          saveAtual: saveAposTempo,
          eventoPrincipalAtivo: morteProtagonista.morto ? undefined : eventoSorteado,
          resultadoEventoAtivo: undefined,
          telaAtual: morteProtagonista.morto ? 'morte' : anterior.telaAtual,
        }));
      })
      .catch((erro: unknown) => {
        console.error('Falha ao avancar tempo.', erro);
      });
  },

  resolverEventoAtivo: (idOpcao: string) => {
    const { saveAtual, eventoPrincipalAtivo } = get();
    if (saveAtual === undefined || eventoPrincipalAtivo === undefined) return;

    const engine = new CoreGameEngine();
    const resultado = engine.resolverOpcao(saveAtual, eventoPrincipalAtivo, idOpcao);
    const protagonistaMorto = resultado.mortesDetectadas.some(
      (morte) => morte.tipo === 'protagonista',
    );

    set((anterior) => ({
      ...anterior,
      ...estadoHudDoSave(resultado.saveAtualizado),
      saveAtual: resultado.saveAtualizado,
      eventoPrincipalAtivo: undefined,
      resultadoEventoAtivo: resultado,
      telaAtual: protagonistaMorto ? 'morte' : anterior.telaAtual,
    }));
  },

  confirmarResultado: () => {
    const resultado = get().resultadoEventoAtivo;
    const saveParaPersistir = resultado?.saveAtualizado ?? get().saveAtual;

    set((anterior) => ({
      ...anterior,
      resultadoEventoAtivo: undefined,
    }));

    if (saveParaPersistir !== undefined) {
      void salvarSave(saveParaPersistir);
    }
  },

  avancarSemEvento: () => {
    // Fallback usado quando não há engine ativo
    set((anterior) => ({
      ...anterior,
      idadeAnos: anterior.idadeAnos + 1,
      anoAtual: anterior.anoAtual + 1,
      eventoAtivo: EVENTO_MOCK,
    }));
  },

  inicializarEngine: (save: SaveSlot) => {
    const engine = new GameEngineLegado(save);
    set({
      ...estadoHudDoSave(save),
      engineAtivo: engine,
      saveAtual: save,
      eventoPrincipalAtivo: undefined,
      resultadoEventoAtivo: undefined,
      saveIdAtivo: save.saveId,
      conteudoAdultoAtivo: save.configuracoes.conteudoAdultoLiberado,
      ritmoAtual: save.configuracoes.ritmo,
      eventosVividos: save.protagonista.eventosVividos,
    });
  },

  avancarTurno: async () => {
    const engine = get().engineAtivo;

    if (engine === undefined) {
      // Sem engine ativo: usa comportamento mock
      get().avancarSemEvento();
      return;
    }

    const eventoDoTurno = await engine.avancarTurno();
    const saveAtualizado = engine.obterEstadoAtual();
    const protagonista = saveAtualizado.protagonista;

    set({
      eventoAtivo: eventoDoTurno !== undefined
        ? {
            eventoId:      eventoDoTurno.eventoId,
            titulo:        eventoDoTurno.titulo,
            descricao:     eventoDoTurno.descricao,
            icone:         eventoDoTurno.icone,
            opcoes:        eventoDoTurno.opcoes,
            cooldownMeses: eventoDoTurno.cooldownMeses,
          }
        : undefined,
      ultimaRolagem: eventoDoTurno?.resultadoRolagem,
      saveAtual: saveAtualizado,
      anoAtual:  saveAtualizado.estadoMundo.anoAtual,
      idadeAnos: Math.floor(protagonista.idadeAtualMeses / 12),
      humor:     protagonista.humorAtual,
      saude:     protagonista.saudeAtual,
      dinheiro:  protagonista.dinheiro,
      eventosVividos: protagonista.eventosVividos,
    });
  },

  // [FIX QA] alterarConteudoAdulto agora também persiste no SaveSlot via engine
  realizarAtividade: (idAtividade: string) => {
    const atividade = ATIVIDADES_BASE.find((item) => item.id === idAtividade);

    if (atividade === undefined) {
      set((anterior) => ({
        ...anterior,
        eventosVividos: [...anterior.eventosVividos, `Atividade desconhecida: ${idAtividade}`],
      }));
      return;
    }

    const engine = get().engineAtivo;
    if (engine === undefined) {
      set((anterior) => ({
        ...anterior,
        eventosVividos: [...anterior.eventosVividos, `Sem save ativo para ${atividade.rotulo}`],
      }));
      return;
    }

    const saveAtual = engine.obterEstadoAtual();
    const resultado = realizarAtividadeCore(atividade, saveAtual.protagonista);
    const protagonistaComLog = {
      ...resultado.protagonistaAtualizado,
      eventosVividos: [...resultado.protagonistaAtualizado.eventosVividos, resultado.log],
    };

    engine.aplicarResultadoEfeitos(protagonistaComLog, saveAtual.roster);
    const saveAtualizado = engine.obterEstadoAtual();
    registrarAutosave(saveAtualizado, 'agendar');

    set((anterior) => ({
      ...anterior,
      saveAtual: saveAtualizado,
      nomePersonagem: `${protagonistaComLog.nome} ${protagonistaComLog.sobrenome}`,
      profissaoAtual: protagonistaComLog.profissaoAtual ?? '',
      idadeAnos: Math.floor(protagonistaComLog.idadeAtualMeses / 12),
      humor: protagonistaComLog.humorAtual,
      saude: protagonistaComLog.saudeAtual,
      dinheiro: protagonistaComLog.dinheiro,
      eventosVividos: protagonistaComLog.eventosVividos,
      atributos: atributosParaHud(protagonistaComLog),
    }));
  },

  alterarConteudoAdulto: (valor: boolean) => {
    set((anterior) => ({ ...anterior, conteudoAdultoAtivo: valor }));
    const engine = get().engineAtivo;
    if (engine !== undefined) {
      engine.atualizarConfiguracoes({ conteudoAdultoLiberado: valor });
      const saveAtualizado = engine.obterEstadoAtual();
      registrarAutosave(saveAtualizado, 'agendar');
      set((anterior) => ({ ...anterior, saveAtual: saveAtualizado }));
    }
  },
}));
