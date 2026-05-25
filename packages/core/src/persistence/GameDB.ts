import Dexie, { type Table } from 'dexie';
import type { SaveSlot } from '../schemas/save';
import type { Character } from '../schemas/character';
import type { Npc } from '../schemas/npc';
import type { LogCamadaEnum } from '../log/LifeLog';
import type { PlacedFurniture } from '../schemas/furniture';

export type EntradaLogEvento = {
  id?: number;
  saveId: string;
  eventoId: string;
  ano: number;
  mes: number;
  idadeNoMomento: number;
  escolhaIndice: number;
  resultadoDado?: 'falha_critica' | 'falha' | 'sucesso' | 'sucesso_critico';
  rolagemD20?: number;
  timestamp: number;
};

// v2 — novos tipos

export type EntradaLifeLog = {
  id?: number;
  saveId: string;
  logId: string;
  camada: LogCamadaEnum;
  timestamp: number;
  anoJogo: number;
  mesJogo: number;
  texto: string;
  npcIds?: string[];
  localId?: string;
  tags: string[];
};

export type RegistroProgressao = {
  saveId: string;
  contadores: Record<string, number>;
  marcadores: Record<string, boolean>;
  ultimoReset: Record<string, number>;
};

export type RegistroHomeSave = {
  saveId: string;
  houseId: string;
  movelComprados: string[];
  movelVendidos: string[];
  movelPosicionados: PlacedFurniture[];
  valorEstimadoImovel: number;
  aluguelMensal?: number;
};

export type RegistroLocationState = {
  saveId: string;
  currentLocationId?: string;
  currentRoomId?: string;
  lastVisitedLocationId?: string;
};

export class VidaGameDB extends Dexie {
  saves!: Table<SaveSlot, string>;
  characters!: Table<Character, string>;
  npcs!: Table<Npc, string>;
  events!: Table<EntradaLogEvento, number>;

  // v2
  lifeLog!: Table<EntradaLifeLog, number>;
  progressao!: Table<RegistroProgressao, string>;
  homeSave!: Table<RegistroHomeSave, string>;
  locationState!: Table<RegistroLocationState, string>;

  constructor() {
    super('Vida25DGame');

    this.version(1).stores({
      saves:      'saveId, ultimaPartida',
      characters: 'characterId, saveId, idadeAtualMeses',
      npcs:       'npcId, saveId, persistencia',
      events:     '++id, saveId, ano, eventoId',
    });

    this.version(2).stores({
      saves:         '&saveId, ultimaPartida',
      characters:    '&characterId, saveId',
      npcs:          '&npcId, saveId, persistencia',
      events:        '++id, saveId, ano, eventoId',
      lifeLog:       '++id, saveId, camada, anoJogo, mesJogo, *tags',
      progressao:    '&saveId',
      homeSave:      '&saveId',
      locationState: '&saveId',
    });
  }
}

export const db = new VidaGameDB();
