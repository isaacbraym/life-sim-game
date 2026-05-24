import { create } from 'zustand';
import { aplicarEfeito, Effect, rolarD20ComModificador } from '@lifesim/core';
import type { SaveSlot } from '@lifesim/core';
import { GameEngine, type ResultadoRolagem } from '../engine/GameEngine';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type AtributoRpg = {
  readonly nome: string;
  readonly valor: number;
};

type EstadoHud = {
  readonly nomePersonagem: string;
  readonly profissaoAtual: string;
  readonly idadeAnos: number;
  readonly anoAtual: number;
  readonly humor: number;
  readonly saude: number;
  readonly dinheiro: number;
  readonly eventoAtivo: EventoAtivo | undefined;
  readonly ultimaRolagem?: ResultadoRolagem;
  readonly atributos: readonly AtributoRpg[];
  readonly engineAtivo: GameEngine | undefined;
  // [NEW] feat/ui-sprint-1-5 — EventLog, SettingsScreen, DeathScreen
  readonly eventosVividos: readonly string[];
  readonly conteudoAdultoAtivo: boolean;
  readonly saveIdAtivo: string | undefined;
  readonly ritmoAtual: 'mensal' | 'semestral' | 'anual' | undefined;
};

export type OpcaoEvento = {
  readonly texto: string;
  readonly efeitos: readonly unknown[];
  readonly cooldownMeses?: number;
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
};

type AcoesHud = {
  readonly atualizarEstado: (parcial: Partial<EstadoHud>) => void;
  readonly resolverOpcao: (indice: number) => void;
  readonly avancarSemEvento: () => void;
  readonly inicializarEngine: (save: SaveSlot) => void;
  readonly avancarTurno: () => Promise<void>;
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
  ultimaRolagem: undefined,
  atributos: ATRIBUTOS_MOCK,
  engineAtivo: undefined,
  eventosVividos: [],
  conteudoAdultoAtivo: false,
  saveIdAtivo: undefined,
  ritmoAtual: undefined,
};

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

    // Registrar cooldown se a opção define um
    if (opcao.cooldownMeses !== undefined && opcao.cooldownMeses > 0) {
      const anoAtual = saveAtual.estadoMundo.anoAtual;
      const anoExpiracao = anoAtual + Math.ceil(opcao.cooldownMeses / 12);
      engineAtivo.registrarCooldown(eventoAtivo.eventoId, anoExpiracao);
    }

    // Persistir via engine
    engineAtivo.aplicarResultadoEfeitos(protagonistaAtual, rosterAtual);
    void engineAtivo.salvarEstadoAtual();

    // Atualizar store
    set((anterior) => ({
      ...anterior,
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
    const engine = new GameEngine(save);
    set({
      engineAtivo: engine,
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
            eventoId:  eventoDoTurno.eventoId,
            titulo:    eventoDoTurno.titulo,
            descricao: eventoDoTurno.descricao,
            icone:     eventoDoTurno.icone,
            opcoes:    eventoDoTurno.opcoes,
          }
        : undefined,
      ultimaRolagem: eventoDoTurno?.resultadoRolagem,
      anoAtual:  saveAtualizado.estadoMundo.anoAtual,
      idadeAnos: Math.floor(protagonista.idadeAtualMeses / 12),
      humor:     protagonista.humorAtual,
      saude:     protagonista.saudeAtual,
      dinheiro:  protagonista.dinheiro,
      eventosVividos: protagonista.eventosVividos,
    });
  },

  // [NEW]
  alterarConteudoAdulto: (valor: boolean) =>
    set((anterior) => ({ ...anterior, conteudoAdultoAtivo: valor })),
}));
