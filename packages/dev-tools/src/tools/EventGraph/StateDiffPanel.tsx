import type { EstadoProgressao } from '@core/interaction/ProgressionTracker';

export type EstadoSimulador = {
  readonly forca: number;
  readonly inteligencia: number;
  readonly carisma: number;
  readonly constituicao: number;
  readonly sorte: number;
  readonly dinheiro: number;
  readonly idade: number;
  readonly ano: number;
  readonly mes: number;
  readonly faseDeVida: string;
  readonly flagsAtivas: readonly string[];
};

export type ResultadoDiff = {
  readonly antes: EstadoSimulador;
  readonly depois: EstadoSimulador;
  readonly progressaoAntes: EstadoProgressao;
  readonly progressaoDepois: EstadoProgressao;
};

type StateDiffPanelProps = {
  readonly resultado: ResultadoDiff | undefined;
};

const ATRIBUTOS = ['forca', 'inteligencia', 'carisma', 'constituicao', 'sorte'] as const;

function formatarDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `${delta}`;
  return '0';
}

function classeDelta(delta: number): string {
  if (delta > 0) return 'diff__delta diff__delta--positivo';
  if (delta < 0) return 'diff__delta diff__delta--negativo';
  return 'diff__delta';
}

function renderizarLinhaNumero(rotulo: string, antes: number, depois: number) {
  const delta = depois - antes;

  return (
    <tr key={rotulo}>
      <th>{rotulo}</th>
      <td>{antes}</td>
      <td>{depois}</td>
      <td className={classeDelta(delta)}>{formatarDelta(delta)}</td>
    </tr>
  );
}

function diferencaFlags(antes: readonly string[], depois: readonly string[]) {
  const adicionadas = depois.filter(flag => !antes.includes(flag));
  const removidas = antes.filter(flag => !depois.includes(flag));
  return { adicionadas, removidas };
}

function chavesContadores(resultado: ResultadoDiff): readonly string[] {
  return Array.from(new Set([
    ...Object.keys(resultado.progressaoAntes.contadores),
    ...Object.keys(resultado.progressaoDepois.contadores),
  ])).sort();
}

export function StateDiffPanel({ resultado }: StateDiffPanelProps) {
  if (resultado === undefined) {
    return (
      <aside className="diff">
        <h2>Diff de estado</h2>
        <p className="diff__vazio">Execute uma simulação para comparar antes e depois.</p>
      </aside>
    );
  }

  const flags = diferencaFlags(resultado.antes.flagsAtivas, resultado.depois.flagsAtivas);
  const contadores = chavesContadores(resultado);

  return (
    <aside className="diff">
      <h2>Diff de estado</h2>
      <table className="diff__tabela">
        <thead>
          <tr>
            <th>Campo</th>
            <th>Antes</th>
            <th>Depois</th>
            <th>Delta</th>
          </tr>
        </thead>
        <tbody>
          {ATRIBUTOS.map(atributo =>
            renderizarLinhaNumero(atributo, resultado.antes[atributo], resultado.depois[atributo]),
          )}
          {renderizarLinhaNumero('dinheiro', resultado.antes.dinheiro, resultado.depois.dinheiro)}
          {contadores.map(contadorId => {
            const antes = resultado.progressaoAntes.contadores[contadorId] ?? 0;
            const depois = resultado.progressaoDepois.contadores[contadorId] ?? 0;
            return renderizarLinhaNumero(`contador:${contadorId}`, antes, depois);
          })}
        </tbody>
      </table>
      <section className="diff__flags">
        <h3>flagsAtivas</h3>
        <p>
          <strong>Adicionadas:</strong>{' '}
          <span className="diff__delta diff__delta--positivo">
            {flags.adicionadas.length > 0 ? flags.adicionadas.join(', ') : 'nenhuma'}
          </span>
        </p>
        <p>
          <strong>Removidas:</strong>{' '}
          <span className="diff__delta diff__delta--negativo">
            {flags.removidas.length > 0 ? flags.removidas.join(', ') : 'nenhuma'}
          </span>
        </p>
      </section>
    </aside>
  );
}
