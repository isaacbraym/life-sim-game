import type { SaveSlot } from '../schemas/save';
import { forcarAutosave, agendarAutosave } from './Autosave';

/**
 * Registra um autosave para o save slot ativo.
 * Permite controle entre salvamento forçado (imediato) ou agendado (debounced).
 * Se a saúde do protagonista estiver zerada (morte), força o salvamento imediatamente.
 */
export function registrarAutosave(
  save: SaveSlot,
  tipo: 'forcar' | 'agendar' = 'agendar'
): void {
  if (tipo === 'forcar' || save.protagonista.saudeAtual <= 0) {
    void forcarAutosave(save);
  } else {
    agendarAutosave(save, 500);
  }
}
