import { db } from './GameDB';

// TODO: implementar export completo com hash SHA-256
export async function exportarSave(_saveId: string): Promise<Blob> {
  void db;
  throw new Error('not implemented');
}

// TODO: implementar import com validação de checksum + Zod
export async function importarSave(_blob: Blob): Promise<void> {
  throw new Error('not implemented');
}
