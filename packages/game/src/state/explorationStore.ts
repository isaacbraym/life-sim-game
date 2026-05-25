import { create } from 'zustand';

export type Vec2 = {
  readonly x: number;
  readonly y: number;
};

export type ObjetoFocado = {
  readonly id: string;
  readonly posicao: Vec2;
  readonly acoes: readonly string[];
};

type EstadoExploracao = {
  readonly localAtualId: string | undefined;
  readonly comodoAtualId: string | undefined;
  readonly objetoFocado: ObjetoFocado | undefined;
  readonly bubblePos: Vec2 | undefined;
  readonly bubbleAcoes: readonly string[];
  readonly interactionLock: boolean;
  readonly modoExploracao: boolean;
};

type AcoesExploracao = {
  readonly entrarEmExploracao: (localId: string, comodoId: string) => void;
  readonly sairDeExploracao: () => void;
  readonly focarObjeto: (objeto: ObjetoFocado) => void;
  readonly desfocarObjeto: () => void;
  readonly setBubblePos: (posicao: Vec2 | undefined) => void;
  readonly setInteractionLock: (valor: boolean) => void;
};

const ESTADO_INICIAL: EstadoExploracao = {
  localAtualId: undefined,
  comodoAtualId: undefined,
  objetoFocado: undefined,
  bubblePos: undefined,
  bubbleAcoes: [],
  interactionLock: false,
  modoExploracao: false,
};

export const useExplorationStore = create<EstadoExploracao & AcoesExploracao>((set) => ({
  ...ESTADO_INICIAL,

  entrarEmExploracao: (localId, comodoId) => {
    set((estadoAnterior) => ({
      ...estadoAnterior,
      localAtualId: localId,
      comodoAtualId: comodoId,
      objetoFocado: undefined,
      bubblePos: undefined,
      bubbleAcoes: [],
      interactionLock: false,
      modoExploracao: true,
    }));
  },

  sairDeExploracao: () => {
    set({ ...ESTADO_INICIAL });
  },

  focarObjeto: (objeto) => {
    set((estadoAnterior) => ({
      ...estadoAnterior,
      objetoFocado: objeto,
      bubblePos: objeto.posicao,
      bubbleAcoes: [...objeto.acoes],
    }));
  },

  desfocarObjeto: () => {
    set((estadoAnterior) => ({
      ...estadoAnterior,
      objetoFocado: undefined,
      bubblePos: undefined,
      bubbleAcoes: [],
    }));
  },

  setBubblePos: (posicao) => {
    set((estadoAnterior) => ({
      ...estadoAnterior,
      bubblePos: posicao,
    }));
  },

  setInteractionLock: (valor) => {
    set((estadoAnterior) => ({
      ...estadoAnterior,
      interactionLock: valor,
    }));
  },
}));
