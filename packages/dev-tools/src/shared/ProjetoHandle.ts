declare global {
  interface FileSystemWritableFileStream {
    write(data: string | BufferSource | Blob): Promise<void>;
    close(): Promise<void>;
  }

  interface FileSystemFileHandle {
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
  }

  interface Window {
    showDirectoryPicker(options?: {
      readonly id?: string;
      readonly mode?: 'read' | 'readwrite';
      readonly startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
    }): Promise<FileSystemDirectoryHandle>;
  }
}

let pastaRaiz: FileSystemDirectoryHandle | undefined;

export const SUPORTA_FILE_SYSTEM_ACCESS =
  typeof window !== 'undefined' && 'showDirectoryPicker' in window;

export async function selecionarPastaRaiz(): Promise<FileSystemDirectoryHandle> {
  pastaRaiz = await window.showDirectoryPicker({
    id: 'vida25d-raiz',
    mode: 'readwrite',
    startIn: 'documents',
  });
  return pastaRaiz;
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
