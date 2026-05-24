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
export async function criarNovoSave(nome, protagonista, roster) {
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
        roster: roster ?? [],
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
            roster: params.roster ?? [],
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
export async function exportarSave(saveId) {
    const salvo = await db.saves.get(saveId);
    if (salvo === undefined) {
        throw new Error(`Save não encontrado: ${saveId}`);
    }
    const exportacao = {
        versaoExportacao: '1.0.0',
        exportadoEm: new Date().toISOString(),
        payload: salvo,
    };
    return JSON.stringify(exportacao, null, 2);
}
export async function importarSave(jsonString) {
    let parseado;
    try {
        parseado = JSON.parse(jsonString);
    }
    catch {
        throw new Error('JSON inválido — arquivo corrompido ou não é um save do Vida 2.5D.');
    }
    if (typeof parseado !== 'object' ||
        parseado === null ||
        !('payload' in parseado)) {
        throw new Error('Formato de exportação inválido.');
    }
    const resultado = SaveSlotSchema.safeParse(parseado.payload);
    if (!resultado.success) {
        throw new Error(`Save com schema inválido: ${resultado.error.issues.map(i => i.message).join(', ')}`);
    }
    const saveImportado = resultado.data;
    const saveExistente = await db.saves.get(saveImportado.saveId);
    if (saveExistente !== undefined) {
        // Já existe: gerar novo ID para não sobrescrever
        const saveComNovoId = {
            ...saveImportado,
            saveId: crypto.randomUUID(),
            nomeSlot: `${saveImportado.nomeSlot} (importado)`,
            ultimaPartida: new Date().toISOString(),
        };
        await salvarSave(saveComNovoId);
        return saveComNovoId;
    }
    await salvarSave(saveImportado);
    return saveImportado;
}
//# sourceMappingURL=SaveManager.js.map