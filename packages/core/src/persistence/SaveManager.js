import { db } from './GameDB';
import { SaveSlot as SaveSlotSchema } from '../schemas/save';
export async function listarSaves() {
    const saves = await db.saves.toArray();
    return saves.sort((a, b) => b.ultimaPartida.localeCompare(a.ultimaPartida));
}
export async function carregarSave(saveId) {
    return await db.saves.get(saveId);
}
export async function salvarSave(save) {
    const parseResult = SaveSlotSchema.safeParse(save);
    if (!parseResult.success) {
        throw new Error(`Save inválido: ${JSON.stringify(parseResult.error.format())}`);
    }
    await db.saves.put(save);
    // Anexa o saveId ao protagonista e aos NPCs para fins de indexação e cascata no Dexie
    const protagonistaComSaveId = {
        ...save.protagonista,
        saveId: save.saveId,
    };
    await db.characters.put(protagonistaComSaveId);
    for (const npc of save.roster) {
        const npcComSaveId = {
            ...npc,
            saveId: save.saveId,
        };
        await db.npcs.put(npcComSaveId);
    }
}
export async function criarNovoSave(nome, protagonista) {
    const saveId = crypto.randomUUID();
    const dataIso = new Date().toISOString();
    const novoSave = {
        schemaVersion: '1.0.0',
        saveId,
        nomeSlot: nome,
        criadoEm: dataIso,
        ultimaPartida: dataIso,
        tempoJogadoMs: 0,
        configuracoes: {
            ritmo: 'anual',
            conteudoAdultoLiberado: false,
            idioma: 'pt-BR',
        },
        protagonista,
        roster: [],
        estadoMundo: {
            anoAtual: protagonista.dataNascimento.ano,
            mesAtual: 1,
            flagsGlobais: [],
        },
        cooldownRegistry: {},
    };
    await salvarSave(novoSave);
    return novoSave;
}
export async function deletarSave(saveId) {
    await db.saves.delete(saveId);
    await db.characters.where('saveId').equals(saveId).delete();
    await db.npcs.where('saveId').equals(saveId).delete();
}
export class SaveManager {
    async criarNovoSave(params) {
        const saveId = crypto.randomUUID();
        const dataIso = new Date().toISOString();
        const novoSave = {
            schemaVersion: '1.0.0',
            saveId,
            nomeSlot: params.nomeSlot,
            criadoEm: dataIso,
            ultimaPartida: dataIso,
            tempoJogadoMs: 0,
            configuracoes: {
                ritmo: params.ritmo,
                conteudoAdultoLiberado: false,
                idioma: 'pt-BR',
            },
            protagonista: params.protagonista,
            roster: [],
            estadoMundo: {
                anoAtual: params.protagonista.dataNascimento.ano,
                mesAtual: 1,
                flagsGlobais: [],
            },
            cooldownRegistry: {},
        };
        await salvarSave(novoSave);
        return novoSave;
    }
}
//# sourceMappingURL=SaveManager.js.map