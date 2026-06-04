import type { ResultadoDeAcao } from '../interaction/ActionResolver';
import { persistirEntradaLog } from './LifeLog';

// Persiste todos os logs gerados por um ResultadoDeAcao no IndexedDB.
// Chamar imediatamente apos resolverAcao, em modo fire-and-forget.
export function persistirLogsDeAcao(saveId: string, resultado: ResultadoDeAcao): void {
  for (const entrada of resultado.logsGerados) {
    void persistirEntradaLog(saveId, entrada);
  }
}
