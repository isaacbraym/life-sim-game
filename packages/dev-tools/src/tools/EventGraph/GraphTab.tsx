import { useMemo, useState } from 'react';
import { Background, Controls, MarkerType, ReactFlow, type Edge, type Node, type NodeMouseHandler } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Event as EventoDefinition } from '@core/schemas/event';
import type { Effect } from '@core/schemas/effect';
import type { OpcaoEscolha } from '@core/schemas/scene';

type GraphTabProps = {
  readonly eventos: readonly EventoDefinition[];
  readonly eventoAtivo: EventoDefinition | undefined;
  readonly aoSelecionarEvento: (evento: EventoDefinition | undefined) => void;
};

type PesoNarrativo = 'routine' | 'relevant' | 'major';

type FiltrosGrafo = {
  readonly pesos: Readonly<Record<PesoNarrativo, boolean>>;
  readonly localContextId: string;
  readonly idadeRange: string;
  readonly eraStart: string;
};

type DadosNo = {
  readonly label: string;
};

const COR_POR_PESO: Readonly<Record<PesoNarrativo, string>> = {
  routine: '#6b7280',
  relevant: '#3b82f6',
  major: '#ef4444',
};

const PESOS: readonly PesoNarrativo[] = ['routine', 'relevant', 'major'];

function pesoDoEvento(evento: EventoDefinition): PesoNarrativo {
  return evento.narrativeWeight ?? 'routine';
}

function escolhasDoEvento(evento: EventoDefinition): readonly OpcaoEscolha[] {
  return evento.scene.beats.flatMap(beat => (beat.tipo === 'escolha' ? beat.opcoes : []));
}

function ehRegistro(valor: unknown): valor is Readonly<Record<string, unknown>> {
  return typeof valor === 'object' && valor !== null;
}

function coletarHooksGenericos(evento: EventoDefinition): readonly string[] {
  const registroEvento = evento as unknown as Readonly<Record<string, unknown>>;
  const eventHooks = registroEvento.eventHooks;

  if (!Array.isArray(eventHooks)) return [];

  return eventHooks.flatMap(hook => {
    if (!ehRegistro(hook) || typeof hook.eventoId !== 'string') return [];
    return [hook.eventoId];
  });
}

function coletarReferenciasDeEfeito(efeitos: readonly Effect[]): readonly string[] {
  return efeitos.flatMap(efeito => (efeito.tipo === 'disparar_evento' ? [efeito.eventoId] : []));
}

function coletarReferenciasDoEvento(evento: EventoDefinition): readonly string[] {
  const referenciasEscolhas = escolhasDoEvento(evento).flatMap(escolha => [
    ...(escolha.proximoEventoId !== undefined ? [escolha.proximoEventoId] : []),
    ...coletarReferenciasDeEfeito(escolha.efeitos),
  ]);

  return [...coletarHooksGenericos(evento), ...referenciasEscolhas];
}

function formatarIdadeRange(evento: EventoDefinition): string {
  const idadeRange = evento.triggers.idadeRange;
  return idadeRange === undefined ? 'sem idadeRange' : `${idadeRange[0]}-${idadeRange[1]}`;
}

function filtrarEventos(eventos: readonly EventoDefinition[], filtros: FiltrosGrafo): readonly EventoDefinition[] {
  const anoMinimo = filtros.eraStart.trim() === '' ? undefined : Number(filtros.eraStart);

  return eventos.filter(evento => {
    const peso = pesoDoEvento(evento);
    if (!filtros.pesos[peso]) return false;
    if (filtros.localContextId !== '' && evento.localContextId !== filtros.localContextId) return false;
    if (filtros.idadeRange !== '' && formatarIdadeRange(evento) !== filtros.idadeRange) return false;
    if (anoMinimo !== undefined && Number.isFinite(anoMinimo)) {
      if ((evento.eraDisponivel?.startYear ?? 0) < anoMinimo) return false;
    }
    return true;
  });
}

function criarNos(eventos: readonly EventoDefinition[], eventoAtivo: EventoDefinition | undefined): Node<DadosNo>[] {
  return eventos.map((evento, indice) => {
    const peso = pesoDoEvento(evento);
    const coluna = indice % 4;
    const linha = Math.floor(indice / 4);

    return {
      id: evento.eventoId,
      position: { x: coluna * 260, y: linha * 140 },
      data: { label: `${evento.eventoId}\n${evento.titulo}` },
      style: {
        width: 210,
        minHeight: 70,
        border: eventoAtivo?.eventoId === evento.eventoId ? '3px solid #111827' : `2px solid ${COR_POR_PESO[peso]}`,
        borderRadius: 8,
        background: COR_POR_PESO[peso],
        color: '#ffffff',
        fontSize: 12,
        whiteSpace: 'pre-line',
        padding: 10,
      },
    };
  });
}

function criarArestas(eventos: readonly EventoDefinition[]): Edge[] {
  const idsValidos = new Set(eventos.map(evento => evento.eventoId));

  return eventos.flatMap(evento =>
    coletarReferenciasDoEvento(evento)
      .filter(eventoId => idsValidos.has(eventoId))
      .map((eventoId, indice) => ({
        id: `${evento.eventoId}-${eventoId}-${indice}`,
        source: evento.eventoId,
        target: eventoId,
        markerEnd: { type: MarkerType.ArrowClosed },
        animated: false,
      })),
  );
}

function valoresUnicos(eventos: readonly EventoDefinition[], obterValor: (evento: EventoDefinition) => string | undefined) {
  return Array.from(new Set(eventos.map(obterValor).filter((valor): valor is string => valor !== undefined))).sort();
}

function renderizarPredicados(evento: EventoDefinition) {
  if (evento.triggers.requisitos === undefined) {
    return <p>Nenhum predicado em triggers.requisitos.</p>;
  }

  return <pre>{JSON.stringify(evento.triggers.requisitos, undefined, 2)}</pre>;
}

function renderizarChoices(evento: EventoDefinition) {
  const escolhas = escolhasDoEvento(evento);

  if (escolhas.length === 0) {
    return <p>Nenhuma choice encontrada em scene.beats.</p>;
  }

  return (
    <div className="choiceLista">
      {escolhas.map((escolha, indice) => (
        <article key={`${evento.eventoId}-choice-${indice}`} className="choiceItem">
          <strong>{escolha.texto}</strong>
          <p>
            atributo: {escolha.atributoCheck?.atributo ?? 'direto'} · DC: {escolha.atributoCheck?.dificuldade ?? '-'}
          </p>
          <pre>{JSON.stringify(escolha.efeitos, undefined, 2)}</pre>
        </article>
      ))}
    </div>
  );
}

export function GraphTab({ eventos, eventoAtivo, aoSelecionarEvento }: GraphTabProps) {
  const [filtros, definirFiltros] = useState<FiltrosGrafo>({
    pesos: { routine: true, relevant: true, major: true },
    localContextId: '',
    idadeRange: '',
    eraStart: '',
  });

  const eventosFiltrados = useMemo(() => filtrarEventos(eventos, filtros), [eventos, filtros]);
  const nos = useMemo(() => criarNos(eventosFiltrados, eventoAtivo), [eventosFiltrados, eventoAtivo]);
  const arestas = useMemo(() => criarArestas(eventosFiltrados), [eventosFiltrados]);
  const locais = useMemo(() => valoresUnicos(eventos, evento => evento.localContextId), [eventos]);
  const idades = useMemo(() => valoresUnicos(eventos, formatarIdadeRange), [eventos]);
  const selecionarNo: NodeMouseHandler<Node<DadosNo>> = (_, no) => {
    const evento = eventosFiltrados.find(eventoFiltrado => eventoFiltrado.eventoId === no.id);
    aoSelecionarEvento(evento);
  };

  function alternarPeso(peso: PesoNarrativo) {
    definirFiltros(filtrosAtuais => ({
      ...filtrosAtuais,
      pesos: {
        ...filtrosAtuais.pesos,
        [peso]: !filtrosAtuais.pesos[peso],
      },
    }));
  }

  return (
    <div className="graphTab">
      <aside className="graphTab__filtros">
        <h2>Filtros</h2>
        <div className="campo">
          <span>narrativeWeight</span>
          {PESOS.map(peso => (
            <label key={peso} className="checkboxLinha">
              <input type="checkbox" checked={filtros.pesos[peso]} onChange={() => alternarPeso(peso)} />
              {peso}
            </label>
          ))}
        </div>
        <label className="campo">
          <span>localContextId</span>
          <select
            value={filtros.localContextId}
            onChange={evento => definirFiltros({ ...filtros, localContextId: evento.currentTarget.value })}
          >
            <option value="">Todos</option>
            {locais.map(local => <option key={local} value={local}>{local}</option>)}
          </select>
        </label>
        <label className="campo">
          <span>faseDeVida / idadeRange</span>
          <select
            value={filtros.idadeRange}
            onChange={evento => definirFiltros({ ...filtros, idadeRange: evento.currentTarget.value })}
          >
            <option value="">Todos</option>
            {idades.map(idade => <option key={idade} value={idade}>{idade}</option>)}
          </select>
        </label>
        <label className="campo">
          <span>eraDisponivel.startYear mínimo</span>
          <input
            type="number"
            value={filtros.eraStart}
            onChange={evento => definirFiltros({ ...filtros, eraStart: evento.currentTarget.value })}
          />
        </label>
      </aside>

      <div className="graphTab__canvas">
        <ReactFlow
          nodes={nos}
          edges={arestas}
          fitView
          onNodeClick={selecionarNo}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      <aside className="graphTab__detalhes">
        <h2>Detalhes</h2>
        {eventoAtivo === undefined ? (
          <p>Clique em um nó para inspecionar o evento.</p>
        ) : (
          <div className="detalheLista">
            <article className="detalheItem">
              <strong>{eventoAtivo.eventoId}</strong>
              <p>{eventoAtivo.titulo}</p>
              <p>narrativeWeight: {pesoDoEvento(eventoAtivo)}</p>
              <p>localContextId: {eventoAtivo.localContextId ?? '-'}</p>
              <p>
                eraDisponivel: {eventoAtivo.eraDisponivel === undefined
                  ? '-'
                  : `${eventoAtivo.eraDisponivel.startYear}–${eventoAtivo.eraDisponivel.endYear ?? 'aberto'}`}
              </p>
              <p>criadoPor: {eventoAtivo.metadata.criadoPor}</p>
              <p>cooldownMeses: {eventoAtivo.triggers.cooldownMeses}</p>
              <p>uniqueOnce: {eventoAtivo.triggers.uniqueOnce ? 'sim' : 'não'}</p>
            </article>
            <article className="detalheItem">
              <h3>Predicados</h3>
              {renderizarPredicados(eventoAtivo)}
            </article>
            <article className="detalheItem">
              <h3>Choices</h3>
              {renderizarChoices(eventoAtivo)}
            </article>
          </div>
        )}
      </aside>
    </div>
  );
}
