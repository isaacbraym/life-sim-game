import type { SaveSlot } from '../schemas/save';
import { salvarSave } from './SaveManager';

let timerId: ReturnType<typeof setTimeout> | undefined = undefined;

/**
 * Cancela qualquer autosave agendado que ainda não tenha sido executado.
 */
function cancelarAutosavePendente(): void {
  if (timerId !== undefined) {
    clearTimeout(timerId);
    timerId = undefined;
  }
}

/**
 * Agenda o salvamento do jogo de forma debounced.
 * Chamadas sucessivas antes do término do atraso resetam o timer.
 */
export function agendarAutosave(save: SaveSlot, atrasoMs: number = 500): void {
  cancelarAutosavePendente();

  timerId = setTimeout(() => {
    timerId = undefined;
    void salvarSave(save).catch(erro => {
      console.error('[Autosave] Falha ao executar autosave agendado:', erro);
    });
  }, atrasoMs);
}

/**
 * Salva o estado atual do jogo imediatamente, cancelando qualquer agendamento pendente.
 */
export async function forcarAutosave(save: SaveSlot): Promise<void> {
  cancelarAutosavePendente();
  await salvarSave(save);
}
