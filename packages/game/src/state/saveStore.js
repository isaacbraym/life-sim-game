import { create } from 'zustand';
export const useSaveStore = create((set) => ({
    saveIdAtivo: null,
    setSaveAtivo: (id) => set({ saveIdAtivo: id }),
}));
//# sourceMappingURL=saveStore.js.map