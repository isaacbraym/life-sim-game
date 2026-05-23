interface SaveStore {
    saveIdAtivo: string | null;
    setSaveAtivo: (id: string) => void;
}
export declare const useSaveStore: import("zustand").UseBoundStore<import("zustand").StoreApi<SaveStore>>;
export {};
//# sourceMappingURL=saveStore.d.ts.map