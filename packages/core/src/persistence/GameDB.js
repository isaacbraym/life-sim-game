import Dexie from 'dexie';
export class VidaGameDB extends Dexie {
    saves;
    characters;
    npcs;
    events;
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
//# sourceMappingURL=GameDB.js.map