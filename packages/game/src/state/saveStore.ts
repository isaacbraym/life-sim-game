import { create } from 'zustand';

// TODO: tipar com SaveSlot de @core/schemas/save quando implementado
interface SaveStore {
  saveIdAtivo: string | null;
  setSaveAtivo: (id: string) => void;
}

export const useSaveStore = create<SaveStore>((set) => ({
  saveIdAtivo: null,
  setSaveAtivo: (id) => set({ saveIdAtivo: id }),
}));
