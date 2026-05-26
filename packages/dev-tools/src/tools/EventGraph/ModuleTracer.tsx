type ModuleTracerProps = {
  readonly linhas: readonly string[];
  readonly aoLimpar: () => void;
};

export function ModuleTracer({ linhas, aoLimpar }: ModuleTracerProps) {
  return (
    <aside className="tracer">
      <div className="tracer__cabecalho">
        <h2>Rastreabilidade</h2>
        <button type="button" onClick={aoLimpar}>Limpar log</button>
      </div>
      <div className="tracer__linhas" role="log" aria-live="polite">
        {linhas.length === 0 ? (
          <p className="tracer__vazio">Nenhuma simulação registrada.</p>
        ) : (
          linhas.map((linha, indice) => (
            <div key={`${indice}-${linha}`} className={linha.startsWith('▶') ? 'tracer__separador' : 'tracer__linha'}>
              {linha}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
