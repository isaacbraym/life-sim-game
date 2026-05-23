import { create } from 'zustand';
import type { SaveSlot } from '@lifesim/core';
import { GameEngine } from '../engine/GameEngine';

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
  readonly atributos: readonly AtributoRpg[];
  readonly engineAtivo: GameEngine | undefined;
};

export type OpcaoEvento = {
  readonly texto: string;
};

export type EventoAtivo = {
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
};

// ---------------------------------------------------------------------------
// Mock inicial
// ---------------------------------------------------------------------------

const EVENTO_MOCK: EventoAtivo = {
  titulo: 'Proposta de promoção',
  icone: '💼',
  descricao:
    'Seu gerente te chamou na sala e ofereceu uma promoção — salário 40% maior, mas viagens semanais e menos tempo com a família.',
  opcoes: [
    { texto: 'Aceitar a promoção' },
    { texto: 'Negociar condições' },
    { texto: 'Recusar por ora' },
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
  atributos: ATRIBUTOS_MOCK,
  engineAtivo: undefined,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useHudStore = create<EstadoHud & AcoesHud>((set, get) => ({
  ...ESTADO_INICIAL,

  atualizarEstado: (parcial) =>
    set((anterior) => ({ ...anterior, ...parcial })),

  resolverOpcao: (_indice) => {
    // TODO Sprint 1.7: chamar ChoiceResolver com a opção escolhida
    set((anterior) => ({ ...anterior, eventoAtivo: undefined }));
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
    set({ engineAtivo: engine });
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
            titulo:    eventoDoTurno.titulo,
            descricao: eventoDoTurno.descricao,
            icone:     eventoDoTurno.icone,
            opcoes:    eventoDoTurno.opcoes,
          }
        : undefined,
      anoAtual:  saveAtualizado.estadoMundo.anoAtual,
      idadeAnos: Math.floor(protagonista.idadeAtualMeses / 12),
      humor:     protagonista.humorAtual,
      saude:     protagonista.saudeAtual,
      dinheiro:  protagonista.dinheiro,
    });
  },
}));
