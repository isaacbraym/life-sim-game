import { useRef, useState } from 'react';
import type { Event as EventoDefinition } from '@core/schemas/event';
import { SchemaLoader, type ErroSchema } from '../../shared/SchemaLoader';
import { GraphTab } from './GraphTab';
import { SimulatorTab } from './SimulatorTab';

type AbaEventGraph = 'grafo' | 'simulador';

export function EventGraph() {
  const [abaAtiva, definirAbaAtiva] = useState<AbaEventGraph>('grafo');
  const [eventosSelecionados, definirEventosSelecionados] = useState<readonly EventoDefinition[]>([]);
  const [eventoAtivo, definirEventoAtivo] = useState<EventoDefinition | undefined>(undefined);
  const [errosSchema, definirErrosSchema] = useState<readonly ErroSchema[]>([]);
  const inputArquivoRef = useRef<HTMLInputElement | null>(null);

  async function carregarEventos(arquivos: FileList | undefined) {
    if (arquivos === undefined || arquivos.length === 0) return;

    const resultado = await SchemaLoader.carregarEventosLote(Array.from(arquivos));
    definirEventosSelecionados(resultado.dados);
    definirErrosSchema(resultado.erros);
    definirEventoAtivo(resultado.dados[0]);
  }

  return (
    <section className="eventGraph">
      <style>{ESTILOS_EVENT_GRAPH}</style>
      <header className="eventGraph__topo">
        <div>
          <h1>Event Graph + Consequence Simulator</h1>
          <p>{eventosSelecionados.length} eventos válidos · {errosSchema.length} erros de schema</p>
        </div>
        <div className="eventGraph__acoes">
          <input
            ref={inputArquivoRef}
            type="file"
            accept=".json,application/json"
            multiple
            hidden
            onChange={evento => void carregarEventos(evento.currentTarget.files ?? undefined)}
          />
          <button type="button" onClick={() => inputArquivoRef.current?.click()}>
            Carregar pasta de eventos
          </button>
          <button
            type="button"
            className={abaAtiva === 'grafo' ? 'eventGraph__aba eventGraph__aba--ativa' : 'eventGraph__aba'}
            onClick={() => definirAbaAtiva('grafo')}
          >
            Grafo
          </button>
          <button
            type="button"
            className={abaAtiva === 'simulador' ? 'eventGraph__aba eventGraph__aba--ativa' : 'eventGraph__aba'}
            onClick={() => definirAbaAtiva('simulador')}
          >
            Simulador
          </button>
        </div>
      </header>

      {errosSchema.length > 0 && (
        <details className="eventGraph__erros">
          <summary>Erros de schema ({errosSchema.length})</summary>
          {errosSchema.slice(0, 20).map((erro, indice) => (
            <p key={`${erro.arquivo ?? 'arquivo'}-${indice}`}>
              <strong>{erro.arquivo ?? 'arquivo'}:</strong> {erro.mensagem}
            </p>
          ))}
        </details>
      )}

      {abaAtiva === 'grafo' ? (
        <GraphTab
          eventos={eventosSelecionados}
          eventoAtivo={eventoAtivo}
          aoSelecionarEvento={definirEventoAtivo}
        />
      ) : (
        <SimulatorTab
          eventos={eventosSelecionados}
          eventoAtivo={eventoAtivo}
          aoSelecionarEvento={definirEventoAtivo}
        />
      )}
    </section>
  );
}

const ESTILOS_EVENT_GRAPH = `
  .eventGraph {
    min-height: calc(100vh - 65px);
    display: flex;
    flex-direction: column;
  }
  .eventGraph__topo {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 20px;
    border-bottom: 1px solid #d1d5db;
    background: #ffffff;
  }
  .eventGraph__topo h1 {
    margin: 0;
    font-size: 20px;
  }
  .eventGraph__topo p {
    margin: 4px 0 0;
    color: #4b5563;
    font-size: 13px;
  }
  .eventGraph__acoes {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .eventGraph__acoes button {
    min-height: 36px;
    padding: 0 12px;
  }
  .eventGraph__aba--ativa {
    border-color: #2563eb;
    background: #eff6ff;
    color: #1d4ed8;
  }
  .eventGraph__erros {
    margin: 12px 20px 0;
    padding: 10px 12px;
    border: 1px solid #fecaca;
    border-radius: 8px;
    background: #fff1f2;
    color: #991b1b;
  }
  .eventGraph__erros p {
    margin: 6px 0;
    font-size: 13px;
  }
  .graphTab,
  .simulatorTab {
    flex: 1;
    min-height: 0;
  }
  .graphTab {
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr) 360px;
  }
  .graphTab__filtros,
  .graphTab__detalhes,
  .simulatorTab__estado,
  .simulatorTab__execucao,
  .simulatorTab__resultado {
    padding: 16px;
    overflow: auto;
  }
  .graphTab__filtros,
  .simulatorTab__estado {
    border-right: 1px solid #d1d5db;
    background: #ffffff;
  }
  .graphTab__detalhes,
  .simulatorTab__resultado {
    border-left: 1px solid #d1d5db;
    background: #ffffff;
  }
  .graphTab__canvas {
    min-height: 680px;
    background: #f8fafc;
  }
  .campo {
    display: grid;
    gap: 6px;
    margin-bottom: 12px;
  }
  .campo label,
  .campo span {
    color: #374151;
    font-size: 13px;
    font-weight: 600;
  }
  .campo input,
  .campo select {
    min-height: 34px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 0 8px;
    background: #ffffff;
  }
  .checkboxLinha {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 6px 0;
    font-size: 13px;
  }
  .detalheLista,
  .choiceLista {
    display: grid;
    gap: 10px;
  }
  .detalheItem,
  .choiceItem {
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 10px;
    background: #ffffff;
  }
  .detalheItem pre,
  .choiceItem pre {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    margin: 6px 0 0;
    color: #374151;
    font-size: 12px;
  }
  .simulatorTab {
    display: grid;
    grid-template-columns: 300px minmax(360px, 1fr) 460px;
  }
  .simulatorTab__execucao {
    display: grid;
    align-content: start;
    gap: 16px;
  }
  .estadoGrid {
    display: grid;
    gap: 10px;
  }
  .flagsEditor {
    display: grid;
    gap: 8px;
  }
  .flagsEditor__linha {
    display: flex;
    gap: 8px;
  }
  .flagsEditor__linha input {
    min-width: 0;
    flex: 1;
  }
  .flagPill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 3px;
    padding: 4px 8px;
    border: 1px solid #d1d5db;
    border-radius: 999px;
    background: #f9fafb;
    font-size: 12px;
  }
  .flagPill button {
    border: 0;
    padding: 0;
    background: transparent;
  }
  .passo {
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 12px;
    background: #ffffff;
  }
  .passo h2,
  .diff h2,
  .tracer h2 {
    margin: 0 0 10px;
    font-size: 16px;
  }
  .choiceButton {
    width: 100%;
    padding: 10px;
    text-align: left;
  }
  .choiceButton--ativa {
    border-color: #2563eb;
    background: #eff6ff;
  }
  .diff {
    display: grid;
    gap: 12px;
  }
  .diff__tabela {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .diff__tabela th,
  .diff__tabela td {
    padding: 7px;
    border-bottom: 1px solid #e5e7eb;
    text-align: left;
  }
  .diff__delta {
    color: #6b7280;
    font-weight: 700;
  }
  .diff__delta--positivo {
    color: #15803d;
  }
  .diff__delta--negativo {
    color: #b91c1c;
  }
  .tracer {
    margin-top: 16px;
    border-top: 1px solid #d1d5db;
    padding-top: 16px;
  }
  .tracer__cabecalho {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .tracer__linhas {
    max-height: 280px;
    overflow: auto;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #111827;
    color: #e5e7eb;
    font-family: "Cascadia Code", Consolas, monospace;
    font-size: 12px;
  }
  .tracer__linha,
  .tracer__separador,
  .tracer__vazio {
    margin: 0;
    padding: 7px 9px;
    border-bottom: 1px solid #1f2937;
  }
  .tracer__separador {
    color: #93c5fd;
    font-weight: 700;
  }
`;
