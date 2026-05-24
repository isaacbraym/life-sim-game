import { SaveSlot as SaveSlotSchema } from '../schemas/save';
import type { SaveSlot } from '../schemas/save';

export type Migracao = {
  readonly de: string;
  readonly para: string;
  readonly migrar: (saveBruto: unknown) => unknown;
};

/**
 * Lista de migrações registradas no sistema.
 * Mantida vazia por padrão nesta sprint.
 */
export const MIGRACOES: readonly Migracao[] = [];

/**
 * Executa as migrações necessárias no save bruto para trazê-lo à versão atual ('1.0.0'),
 * e então valida sua estrutura usando o schema do Zod.
 * Lança erro se nenhuma migração estiver disponível ou se a validação falhar.
 */
export function migrarSave(saveBruto: unknown): SaveSlot {
  if (typeof saveBruto !== 'object' || saveBruto === null) {
    throw new Error('Save bruto inválido');
  }

  const versaoAtualAlvo = '1.0.0';
  let versaoAtual = (saveBruto as { schemaVersion?: string }).schemaVersion;

  if (versaoAtual === undefined) {
    throw new Error('schemaVersion não encontrado no save');
  }

  let saveCorrente: unknown = saveBruto;
  let loops = 0;
  const maxLoops = 100;

  while (versaoAtual !== versaoAtualAlvo && loops < maxLoops) {
    const migracao = MIGRACOES.find(m => m.de === versaoAtual);
    if (migracao === undefined) {
      throw new Error(`Sem migração disponível da versão ${versaoAtual} para ${versaoAtualAlvo}`);
    }

    saveCorrente = migracao.migrar(saveCorrente);
    versaoAtual = (saveCorrente as { schemaVersion?: string }).schemaVersion;
    loops++;
  }

  if (loops >= maxLoops) {
    throw new Error('Detectado possível loop infinito nas migrações');
  }

  const parsed = SaveSlotSchema.safeParse(saveCorrente);
  if (!parsed.success) {
    throw new Error(`Validação pós-migração falhou: ${JSON.stringify(parsed.error.format())}`);
  }

  return parsed.data;
}
