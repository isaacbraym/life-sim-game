import { db } from './GameDB';
import { SaveSlot as SaveSlotSchema } from '../schemas/save';
export async function listarSaves() {
    const saves = await db.saves.toArray();
    return saves.sort((a, b) => b.ultimaPartida.localeCompare(a.ultimaPartida));
}
export async function carregarSave(saveId) {
    return await db.saves.get(saveId);
}
async function calcularHashSave(save) {
    const salvoSemHash = { ...save, hashIntegridade: undefined };
    const texto = JSON.stringify(salvoSemHash);
    const buffer = new TextEncoder().encode(texto);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
export async function salvarSave(save) {
    const hash = await calcularHashSave(save);
    const saveComHash = { ...save, hashIntegridade: hash };
    const parseResult = SaveSlotSchema.safeParse(saveComHash);
    if (!parseResult.success) {
        throw new Error(`Save inválido: ${JSON.stringify(parseResult.error.format())}`);
    }
    // Double-buffered save swap
    const saveTemp = { ...saveComHash, saveId: `${saveComHash.saveId}_temp` };
    await db.saves.put(saveTemp);
    await db.saves.put(saveComHash);
    await db.saves.delete(saveTemp.saveId);
    // Anexa o saveId ao protagonista e aos NPCs para fins de indexação e cascata no Dexie
    const protagonistaComSaveId = {
        ...saveComHash.protagonista,
        saveId: saveComHash.saveId,
    };
    await db.characters.put(protagonistaComSaveId);
    for (const npc of saveComHash.roster) {
        const npcComSaveId = {
            ...npc,
            saveId: saveComHash.saveId,
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
    void solicitarPersistenciaStorage();
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
        void solicitarPersistenciaStorage();
        return novoSave;
    }
    async verificarIntegridade(saveId) {
        return verificarIntegridade(saveId);
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
export async function verificarIntegridade(saveId) {
    const salvo = await db.saves.get(saveId);
    if (salvo === undefined)
        return false;
    if (salvo.hashIntegridade === undefined)
        return true; // saves antigos: aceitar
    const hashEsperado = await calcularHashSave(salvo);
    return hashEsperado === salvo.hashIntegridade;
}
export async function solicitarPersistenciaStorage() {
    if (typeof navigator === 'undefined' || !('storage' in navigator) || !('persist' in navigator.storage)) {
        return false; // browser não suporta ou ambiente node
    }
    const jaEhPersistente = await navigator.storage.persisted();
    if (jaEhPersistente)
        return true;
    return navigator.storage.persist();
}
//# sourceMappingURL=SaveManager.js.map