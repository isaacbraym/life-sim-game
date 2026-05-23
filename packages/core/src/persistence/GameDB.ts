import Dexie, { type Table } from 'dexie';
import type { SaveSlot } from '../schemas/save';
import type { Character } from '../schemas/character';
import type { Npc } from '../schemas/npc';

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

export class VidaGameDB extends Dexie {
  saves!: Table<SaveSlot, string>;
  characters!: Table<Character, string>;
  npcs!: Table<Npc, string>;
  events!: Table<EntradaLogEvento, number>;

  constructor() {
    super('Vida25DGame');
    this.version(1).stores({
      saves: 'saveId, ultimaPartida',
      characters: 'characterId, saveId, idadeAtualMeses',
      npcs: 'npcId, saveId, persistencia',
      events: '++id, saveId, ano, eventoId',
    });
  }
}

export const db = new VidaGameDB();
