declare global {
  interface FileSystemWritableFileStream {
    write(data: string | BufferSource | Blob): Promise<void>;
    close(): Promise<void>;
  }

  interface FileSystemFileHandle {
    getFile(): Promise<File>;
    createWritable(): Promise<FileSystemWritableFileStream>;
  }

  interface FileSystemDirectoryHandle {
    readonly name: string;
    getDirectoryHandle(
      name: string,
      options?: { readonly create?: boolean },
    ): Promise<FileSystemDirectoryHandle>;
    getFileHandle(
      name: string,
      options?: { readonly create?: boolean },
    ): Promise<FileSystemFileHandle>;
    removeEntry(
      name: string,
      options?: { readonly recursive?: boolean },
    ): Promise<void>;
  }

  interface Window {
    showDirectoryPicker(options?: {
      readonly id?: string;
      readonly mode?: 'read' | 'readwrite';
      readonly startIn?:
        | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos'
        | FileSystemDirectoryHandle;
    }): Promise<FileSystemDirectoryHandle>;
  }

  interface FileSystemDirectoryHandle {
    queryPermission(opts?: { readonly mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
    requestPermission(opts?: { readonly mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
  }
}

let pastaRaiz: FileSystemDirectoryHandle | undefined;

export const SUPORTA_FILE_SYSTEM_ACCESS =
  typeof window !== 'undefined' && 'showDirectoryPicker' in window;

// ─── Persistência do handle da pasta (IndexedDB) ───────────────────────────
// O handle da File System Access API é estrutura-clonável e pode ser guardado
// no IndexedDB, de modo que o usuário só precisa escolher a pasta UMA vez.
const DB_NOME = 'vida25d-devtools';
const STORE = 'handles';
const CHAVE_RAIZ = 'pastaRaiz';

function abrirDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NOME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function salvarHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const db = await abrirDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(handle, CHAVE_RAIZ);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch { /* persistência indisponível — segue sem lembrar */ }
}

async function lerHandle(): Promise<FileSystemDirectoryHandle | undefined> {
  try {
    const db = await abrirDb();
    const handle = await new Promise<FileSystemDirectoryHandle | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(CHAVE_RAIZ);
      req.onsuccess = () => resolve(req.result as FileSystemDirectoryHandle | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return handle;
  } catch {
    return undefined;
  }
}

export async function selecionarPastaRaiz(): Promise<FileSystemDirectoryHandle> {
  // Abre o seletor já na pasta lembrada (se houver); senão, em Documentos.
  const anterior = await lerHandle();
  pastaRaiz = await window.showDirectoryPicker({
    id: 'vida25d-raiz',
    mode: 'readwrite',
    startIn: anterior ?? 'documents',
  });
  await salvarHandle(pastaRaiz);
  return pastaRaiz;
}

/**
 * Restaura a pasta salva sem abrir o seletor.
 * - `'conectado'`: permissão já concedida, pastaRaiz pronta para uso.
 * - `'reconectar'`: handle existe mas precisa de um gesto p/ reconceder permissão.
 * - `undefined`: nenhuma pasta salva.
 */
export async function restaurarPastaRaiz(): Promise<
  { status: 'conectado' | 'reconectar'; nome: string } | undefined
> {
  if (!SUPORTA_FILE_SYSTEM_ACCESS) return undefined;
  const handle = await lerHandle();
  if (handle === undefined) return undefined;
  const perm = await handle.queryPermission({ mode: 'readwrite' });
  if (perm === 'granted') {
    pastaRaiz = handle;
    return { status: 'conectado', nome: handle.name };
  }
  return { status: 'reconectar', nome: handle.name };
}

/** Reconecta à pasta salva pedindo a permissão (requer gesto do usuário). */
export async function reconectarPastaRaiz(): Promise<FileSystemDirectoryHandle | undefined> {
  const handle = await lerHandle();
  if (handle === undefined) return undefined;
  const perm = await handle.requestPermission({ mode: 'readwrite' });
  if (perm === 'granted') {
    pastaRaiz = handle;
    return handle;
  }
  return undefined;
}

export function obterPastaRaiz(): FileSystemDirectoryHandle {
  if (pastaRaiz === undefined) {
    throw new Error('Pasta raiz nao selecionada. Chame selecionarPastaRaiz().');
  }
  return pastaRaiz;
}

export async function garantirPasta(
  base: FileSystemDirectoryHandle,
  ...caminho: string[]
): Promise<FileSystemDirectoryHandle> {
  let pastaAtual = base;
  for (const parte of caminho) {
    pastaAtual = await pastaAtual.getDirectoryHandle(parte, { create: true });
  }
  return pastaAtual;
}

export async function escreverArquivo(
  pasta: FileSystemDirectoryHandle,
  nomeArquivo: string,
  conteudo: string,
): Promise<void> {
  const arquivo = await pasta.getFileHandle(nomeArquivo, { create: true });
  const gravador = await arquivo.createWritable();
  await gravador.write(conteudo);
  await gravador.close();
}

export async function escreverBinario(
  pasta: FileSystemDirectoryHandle,
  nomeArquivo: string,
  dados: ArrayBuffer,
): Promise<void> {
  const arquivo = await pasta.getFileHandle(nomeArquivo, { create: true });
  const gravador = await arquivo.createWritable();
  await gravador.write(dados);
  await gravador.close();
}
