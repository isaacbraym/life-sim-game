import type { SaveSlot } from '../schemas/save';
import type { Character } from '../schemas/character';
export declare function listarSaves(): Promise<SaveSlot[]>;
export declare function carregarSave(saveId: string): Promise<SaveSlot | undefined>;
export declare function salvarSave(save: SaveSlot): Promise<void>;
export declare function criarNovoSave(nome: string, protagonista: Character): Promise<SaveSlot>;
export declare function deletarSave(saveId: string): Promise<void>;
export declare class SaveManager {
    criarNovoSave(params: {
        nomeSlot: string;
        ritmo: 'mensal' | 'semestral' | 'anual';
        protagonista: Character;
    }): Promise<SaveSlot>;
}
//# sourceMappingURL=SaveManager.d.ts.map