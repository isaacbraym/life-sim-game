import { useEffect, useMemo, useState } from 'react';
import { Event, type Event as TipoEvento } from '@core/schemas/event';

type EntradaLista = { readonly categoria: string; readonly arquivo: string };

type EventoCarregado = {
  readonly arquivo: string;
  readonly categoria: string;
  readonly eventoId: string;
  readonly titulo: string;
  readonly valido: boolean;
  readonly erroMsg: string | undefined;
  readonly evento: TipoEvento | undefined;
  readonly bruto: unknown;
};

function textoCampo(bruto: unknown, campo: string): string | undefined {
  if (typeof bruto === 'object' && bruto !== null) {
    const valor = (bruto as Record<string, unknown>)[campo];
    if (typeof valor === 'string') return valor;
  }
  return undefined;
}

async function carregarEvento(entrada: EntradaLista): Promise<EventoCarregado> {
  const base = {
    arquivo: entrada.arquivo,
    categoria: entrada.categoria,
  };
  try {
    const res = await fetch(`/content/events/${entrada.arquivo}`);
    const bruto: unknown = await res.json();
    const resultado = Event.safeParse(bruto);
    const eventoId = textoCampo(bruto, 'eventoId') ?? entrada.arquivo;
    const titulo = textoCampo(bruto, 'titulo') ?? eventoId;
    if (resultado.success) {
      return { ...base, eventoId, titulo, valido: true, erroMsg: undefined, evento: resultado.data, bruto };
    }
    const primeiro = resultado.error.issues[0];
    return {
      ...base, eventoId, titulo, valido: false,
      erroMsg: primeiro ? `${primeiro.path.join('.') || 'raiz'}: ${primeiro.message}` : 'Schema inválido',
      evento: undefined, bruto,
    };
  } catch (e) {
    return {
      ...base, eventoId: entrada.arquivo, titulo: entrada.arquivo, valido: false,
      erroMsg: e instanceof Error ? e.message : String(e), evento: undefined, bruto: undefined,
    };
  }
}

export function ProoferDeCena() {
  const [eventos, setEventos] = useState<readonly EventoCarregado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState<string | undefined>();

  useEffect(() => {
    let cancelado = false;
    void (async () => {
      setCarregando(true);
      try {
        const res = await fetch('/__devtools/events/list');
        const lista: unknown = res.ok ? await res.json() : [];
        const entradas: EntradaLista[] = Array.isArray(lista)
          ? lista.filter((x): x is EntradaLista =>
              typeof x === 'object' && x !== null
              && typeof (x as Record<string, unknown>).categoria === 'string'
              && typeof (x as Record<string, unknown>).arquivo === 'string')
          : [];
        const carregados = await Promise.all(entradas.map(carregarEvento));
        if (!cancelado) setEventos(carregados);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    })();
    return () => { cancelado = true; };
  }, []);

  const categorias = useMemo(
    () => Array.from(new Set(eventos.map((e) => e.categoria))).sort(),
    [eventos],
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return eventos.filter((e) => {
      if (filtroCategoria !== 'todos' && e.categoria !== filtroCategoria) return false;
      if (termo && !e.titulo.toLowerCase().includes(termo) && !e.eventoId.toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [eventos, filtroCategoria, busca]);

  const atual = eventos.find((e) => e.arquivo === selecionado);
  const numInvalidos = eventos.filter((e) => !e.valido).length;

  if (carregando) {
    return <div style={{ color: '#a0aec0', padding: '1rem', fontFamily: 'monospace' }}>Carregando eventos...</div>;
  }

  return (
    <div style={{ height: '100%', display: 'flex', fontFamily: 'monospace', color: '#e2e8f0', minHeight: 0 }}>
      {/* Painel esquerdo: lista */}
      <div style={{ width: 320, flex: '0 0 320px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #4a5568', minHeight: 0 }}>
        <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px solid #2d3748' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ color: '#90cdf4' }}>Eventos</strong>
            <span style={{ fontSize: 11, color: numInvalidos > 0 ? '#fc8181' : '#9ae6b4' }}>
              {eventos.length} · {numInvalidos} inválido(s)
            </span>
          </div>
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} style={estiloInput}>
            <option value="todos">Todas as categorias ({eventos.length})</option>
            {categorias.map((c) => (
              <option key={c} value={c}>{c} ({eventos.filter((e) => e.categoria === c).length})</option>
            ))}
          </select>
          <input
            placeholder="Buscar título/id..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={estiloInput}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {filtrados.map((e) => (
            <button
              key={e.arquivo}
              onClick={() => setSelecionado(e.arquivo)}
              style={{
                display: 'flex', width: '100%', textAlign: 'left', gap: '0.4rem', alignItems: 'center',
                background: e.arquivo === selecionado ? '#2d3748' : 'transparent',
                color: '#cbd5e0', border: 'none', borderBottom: '1px solid #222831',
                padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: 12, fontFamily: 'monospace',
              }}
            >
              <span title={e.valido ? 'válido' : e.erroMsg}>{e.valido ? '✓' : '✗'}</span>
              <span style={{ flex: 1, wordBreak: 'break-word', color: e.valido ? '#cbd5e0' : '#fc8181' }}>{e.titulo}</span>
              <span style={{ fontSize: 10, color: '#718096' }}>{e.categoria}</span>
            </button>
          ))}
          {filtrados.length === 0 && (
            <div style={{ padding: '1rem', color: '#718096', fontSize: 12 }}>Nenhum evento corresponde aos filtros.</div>
          )}
        </div>
      </div>

      {/* Painel direito: detalhe */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', minHeight: 0 }}>
        {atual === undefined ? (
          <div style={{ color: '#718096' }}>Selecione um evento à esquerda.</div>
        ) : (
          <DetalheEvento entrada={atual} />
        )}
      </div>
    </div>
  );
}

function DetalheEvento({ entrada }: { readonly entrada: EventoCarregado }) {
  const ev = entrada.evento;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 760 }}>
      {/* Validação */}
      <div style={{
        background: entrada.valido ? '#14532d' : '#7f1d1d',
        color: entrada.valido ? '#9ae6b4' : '#fca5a5',
        padding: '8px 12px', borderRadius: 6, fontSize: 12,
      }}>
        {entrada.valido ? '✓ Schema válido (Event 1.0.0)' : `✗ ${entrada.erroMsg ?? 'Schema inválido'}`}
      </div>

      {/* Header */}
      <div>
        <h2 style={{ margin: 0, color: '#90cdf4', fontSize: 18 }}>{entrada.titulo}</h2>
        <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>
          {entrada.eventoId} · <code style={{ color: '#a0aec0' }}>{entrada.arquivo}</code>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          <Chip cor="#3182ce">{entrada.categoria}</Chip>
          {ev?.narrativeWeight && <Chip cor="#805ad5">{ev.narrativeWeight}</Chip>}
          {ev?.contentTags.map((t) => <Chip key={t} cor="#9b2c2c">{t}</Chip>)}
        </div>
      </div>

      {ev !== undefined && (
        <>
          <Secao titulo="Descrição">
            <p style={{ margin: 0, color: '#cbd5e0', fontSize: 13 }}>{ev.descricaoCurta}</p>
          </Secao>

          <Secao titulo="Triggers">
            <Linha rotulo="idadeRange" valor={ev.triggers.idadeRange ? `${ev.triggers.idadeRange[0]}–${ev.triggers.idadeRange[1]}` : '—'} />
            <Linha rotulo="peso" valor={String(ev.triggers.peso)} />
            <Linha rotulo="cooldownMeses" valor={String(ev.triggers.cooldownMeses)} />
            <Linha rotulo="uniqueOnce" valor={ev.triggers.uniqueOnce ? 'sim' : 'não'} />
            <Linha rotulo="requisitos" valor={ev.triggers.requisitos ? 'predicado definido' : '—'} />
            {ev.eraDisponivel && (
              <Linha rotulo="era" valor={`${ev.eraDisponivel.startYear}${ev.eraDisponivel.endYear ? `–${ev.eraDisponivel.endYear}` : '+'}`} />
            )}
          </Secao>

          {ev.cast.length > 0 && (
            <Secao titulo={`Cast (${ev.cast.length})`}>
              {ev.cast.map((c, i) => (
                <Linha key={i} rotulo={c.papel} valor={`${c.tipo} · persiste: ${c.persistenciaApos}`} />
              ))}
            </Secao>
          )}

          <Secao titulo={`Scene · ${ev.scene.beats.length} beats`}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              <Chip cor="#2c5282">{ev.scene.background}</Chip>
              <Chip cor="#2c5282">{ev.scene.humor}</Chip>
              <Chip cor="#2c5282">{ev.scene.framing}</Chip>
              <Chip cor="#2c5282">{ev.scene.atores.length} ator(es)</Chip>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ev.scene.beats.map((beat, i) => <BeatLinha key={i} beat={beat} />)}
            </div>
          </Secao>
        </>
      )}
    </div>
  );
}

function BeatLinha({ beat }: { readonly beat: TipoEvento['scene']['beats'][number] }) {
  const cor = COR_BEAT[beat.tipo] ?? '#4a5568';
  return (
    <div style={{ background: '#1a202c', border: `1px solid ${cor}`, borderRadius: 4, padding: '6px 10px', fontSize: 12 }}>
      <span style={{ color: cor, fontWeight: 'bold' }}>{ROTULO_BEAT[beat.tipo] ?? beat.tipo}</span>
      {beat.tipo === 'narracao' && <span style={{ color: '#cbd5e0' }}> · {truncar(beat.texto)}</span>}
      {beat.tipo === 'dialogo' && <span style={{ color: '#cbd5e0' }}> · [{beat.papelAtor}] {truncar(beat.texto)}</span>}
      {beat.tipo === 'transicao' && <span style={{ color: '#cbd5e0' }}> · {beat.efeito} ({beat.duracaoMs}ms)</span>}
      {beat.tipo === 'escolha' && (
        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {beat.opcoes.map((op, i) => (
            <div key={i} style={{ color: '#a0aec0', paddingLeft: 8 }}>
              • {truncar(op.texto)}
              <span style={{ color: '#718096' }}>
                {' '}— {op.efeitos.length} efeito(s){op.atributoCheck ? ` · check ${op.atributoCheck.atributo} (${op.atributoCheck.dificuldade})` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const COR_BEAT: Record<string, string> = {
  narracao: '#4299e1', dialogo: '#48bb78', transicao: '#a0aec0', escolha: '#ed8936',
};
const ROTULO_BEAT: Record<string, string> = {
  narracao: '📖 narração', dialogo: '💬 diálogo', transicao: '🎬 transição', escolha: '❓ escolha',
};

function truncar(texto: string): string {
  return texto.length > 90 ? `${texto.slice(0, 90)}…` : texto;
}

function Chip({ children, cor }: { readonly children: React.ReactNode; readonly cor: string }) {
  return (
    <span style={{ background: cor, color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 11 }}>{children}</span>
  );
}

function Secao({ titulo, children }: { readonly titulo: string; readonly children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#718096', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{titulo}</div>
      <div style={{ background: '#1a202c', border: '1px solid #2d3748', borderRadius: 6, padding: '0.6rem 0.8rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {children}
      </div>
    </div>
  );
}

function Linha({ rotulo, valor }: { readonly rotulo: string; readonly valor: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, fontSize: 12 }}>
      <span style={{ color: '#718096' }}>{rotulo}</span>
      <span style={{ color: '#e2e8f0', wordBreak: 'break-word' }}>{valor}</span>
    </div>
  );
}

const estiloInput: React.CSSProperties = {
  background: '#11161f', color: '#e2e8f0', border: '1px solid #4a5568',
  borderRadius: 4, padding: '0.35rem 0.5rem', fontSize: 12, fontFamily: 'monospace', width: '100%',
};
