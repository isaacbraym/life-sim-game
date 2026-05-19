import Dexie, { Table } from 'dexie';
import { SaveSlot } from '../schemas/save';
import { Character } from '../schemas/character';
import { Npc } from '../schemas/npc';

export interface EntradaLogEvento {
  id?: number;
  saveId: string;
  characterId: string;
  eventoId: string;
  ano: number;
  mes: number;
  idadeNoMomento: number;
  escolhaIndice: number;
  resultadoDado?: 'falha_critica' | 'falha' | 'sucesso' | 'sucesso_critico';
  rolagemD20?: number;
  efeitosAplicados: unknown[];
  timestamp: number;
}

export interface Relacionamento {
  fromId: string;
  toId: string;
  tipo: string;
  afeto: number;
  saveId: string;
}

export class VidaGameDB extends Dexie {
  saves!: Table<SaveSlot, string>;
  characters!: Table<Character, string>;
  npcs!: Table<Npc, string>;
  events!: Table<EntradaLogEvento, number>;
  relationships!: Table<Relacionamento, [string, string]>;

  constructor() {
    super('Vida25DGame');

    this.version(1).stores({
      saves: 'saveId, ultimaPartida',
      characters: 'characterId, saveId, idadeAtualMeses, [saveId+idadeAtualMeses]',
      npcs: 'npcId, saveId, persistencia, [saveId+persistencia]',
      events: '++id, saveId, characterId, ano, [saveId+ano], eventoId',
      relationships: '[fromId+toId], fromId, toId, tipo, saveId',
    });
  }
}

export const db = new VidaGameDB();
