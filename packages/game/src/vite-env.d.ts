// Declarações manuais substituindo /// <reference types="vite/client" />
// Motivo: vite/client declara ImportMeta.glob como property; EventLoader.ts do core
// declara como method. TypeScript TS2300 impede coexistência. O game não usa
// import.meta.glob diretamente, portanto glob não é declarado aqui.

interface ImportMetaEnv {
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly SSR: boolean;
  readonly [key: string]: unknown;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly hot?: {
    readonly accept: () => void;
    readonly dispose: (cb: () => void) => void;
    readonly decline: () => void;
    readonly invalidate: () => void;
  };
}
