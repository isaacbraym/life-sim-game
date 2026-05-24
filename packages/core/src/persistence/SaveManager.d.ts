import type { SaveSlot } from '../schemas/save';
import type { Character } from '../schemas/character';
import type { Npc } from '../schemas/npc';
export declare function listarSaves(): Promise<SaveSlot[]>;
export declare function carregarSave(saveId: string): Promise<SaveSlot | undefined>;
export declare function salvarSave(save: SaveSlot): Promise<void>;
export declare function criarNovoSave(nome: string, protagonista: Character, roster?: Npc[]): Promise<SaveSlot>;
export declare function deletarSave(saveId: string): Promise<void>;
export declare class SaveManager {
    criarNovoSave(params: {
        nomeSlot: string;
        ritmo: 'mensal' | 'semestral' | 'anual';
        protagonista: Character;
        roster?: Npc[];
    }): Promise<SaveSlot>;
    verificarIntegridade(saveId: string): Promise<boolean>;
}
export declare function exportarSave(saveId: string): Promise<string>;
export declare function importarSave(jsonString: string): Promise<SaveSlot>;
export declare function verificarIntegridade(saveId: string): Promise<boolean>;
export declare function solicitarPersistenciaStorage(): Promise<boolean>;
//# sourceMappingURL=SaveManager.d.ts.map