import { useCallback, useEffect, useState } from 'react';
import type { ZodError } from 'zod';
import { IsoRoomDefinition, type IsoRoomDefinition as TipoIsoRoom } from '@core/schemas/isoRoom';
import { Event, type Event as TipoEvento } from '@core/schemas/event';
import { FurnitureDefinition, type FurnitureDefinition as TipoMovel } from '@core/schemas/furniture';
import { CharacterPartMetadata } from '@core/schemas/characterPart';
import { AnimacaoPersonagem } from '@core/schemas/characterAnimation';
import { ComodoDefinition } from '@core/schemas/location';

type Severidade = 'ok' | 'aviso' | 'erro';

/** `url` (opcional) = caminho do arquivo-fonte do problema, abrível em nova aba. */
type Problema = { readonly chave: string; readonly msg: string; readonly sev: Severidade; readonly url?: string };

type DominioRelatorio = {
  readonly titulo: string;
  readonly icone: string;
  readonly total: number;
  readonly validos: number;
  readonly problemas: readonly Problema[];
};

type Relatorio = {
  readonly dominios: readonly DominioRelatorio[];
  readonly refs: DominioRelatorio;
  readonly geradoEm: string;
};

const CATALOGOS_FURNITURE: readonly string[] = [
  '/content/furniture/eighties/catalogo.json',
  '/content/furniture/nineties/catalogo.json',
  '/content/furniture/twothousands/catalogo.json',
  '/content/furniture/modern/catalogo.json',
];

function primeiroErro(erro: ZodError): string {
  const i = erro.issues[0];
  return i ? `${i.path.join('.') || 'raiz'}: ${i.message}` : 'schema inválido';
}

/** Busca JSON; retorna undefined se 404/HTML (fallback SPA) ou erro. */
async function buscarJson(url: string): Promise<unknown> {
  try {
    const res = await fetch(url);
    const ct = res.headers.get('content-type') ?? '';
    if (!res.ok || !ct.includes('json')) return undefined;
    return await res.json();
  } catch {
    return undefined;
  }
}

async function recursoWebpExiste(url: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    const ct = res.headers.get('content-type') ?? '';
    return res.ok && ct.includes('webp');
  } catch {
    return false;
  }
}

function severidadeDominio(r: DominioRelatorio): Severidade {
  if (r.problemas.some((p) => p.sev === 'erro')) return 'erro';
  if (r.problemas.some((p) => p.sev === 'aviso')) return 'aviso';
  return 'ok';
}

// ─── Checagens por domínio ──────────────────────────────────────────────────

async function checarComodos(): Promise<{ rooms: TipoIsoRoom[]; relatorio: DominioRelatorio }> {
  const lista = await buscarJson('/__devtools/rooms/iso-list');
  const ids = Array.isArray(lista) ? lista.filter((s): s is string => typeof s === 'string') : [];
  const rooms: TipoIsoRoom[] = [];
  const problemas: Problema[] = [];
  await Promise.all(ids.map(async (id) => {
    const url = `/content/locations-iso/${id}.json`;
    const dados = await buscarJson(url);
    if (dados === undefined) { problemas.push({ chave: id, msg: 'arquivo ausente ou inválido', sev: 'erro', url }); return; }
    const r = IsoRoomDefinition.safeParse(dados);
    if (r.success) rooms.push(r.data);
    else problemas.push({ chave: id, msg: primeiroErro(r.error), sev: 'erro', url });
  }));
  return { rooms, relatorio: { titulo: 'Cômodos ISO', icone: '🏠', total: ids.length, validos: rooms.length, problemas } };
}

async function checarEventos(): Promise<{ eventos: TipoEvento[]; relatorio: DominioRelatorio }> {
  const lista = await buscarJson('/__devtools/events/list');
  const entradas = Array.isArray(lista)
    ? lista.filter((e): e is { categoria: string; arquivo: string } =>
        typeof e === 'object' && e !== null && typeof (e as Record<string, unknown>).arquivo === 'string')
    : [];
  const eventos: TipoEvento[] = [];
  const problemas: Problema[] = [];
  await Promise.all(entradas.map(async ({ arquivo }) => {
    const url = `/content/events/${arquivo}`;
    const dados = await buscarJson(url);
    if (dados === undefined) { problemas.push({ chave: arquivo, msg: 'arquivo ausente ou inválido', sev: 'erro', url }); return; }
    const r = Event.safeParse(dados);
    if (r.success) eventos.push(r.data);
    else problemas.push({ chave: arquivo, msg: primeiroErro(r.error), sev: 'erro', url });
  }));
  return { eventos, relatorio: { titulo: 'Eventos', icone: '🎬', total: entradas.length, validos: eventos.length, problemas } };
}

async function checarMoveis(): Promise<{ moveis: TipoMovel[]; relatorio: DominioRelatorio }> {
  const moveis: TipoMovel[] = [];
  const problemas: Problema[] = [];
  let total = 0;
  await Promise.all(CATALOGOS_FURNITURE.map(async (url) => {
    const dados = await buscarJson(url);
    const lista = Array.isArray(dados) ? dados : [];
    for (const entrada of lista) {
      total += 1;
      const r = FurnitureDefinition.safeParse(entrada);
      if (r.success) {
        moveis.push(r.data);
        if (!r.data.assetId) problemas.push({ chave: r.data.id, msg: 'sem assetId', sev: 'aviso' });
      } else {
        const reg = entrada as Record<string, unknown>;
        problemas.push({ chave: String(reg?.id ?? '?'), msg: primeiroErro(r.error), sev: 'erro' });
      }
    }
  }));

  // Presença da pasta de asset (metadata.json) por assetId — surfacing de "móvel sem asset".
  const assetIds = [...new Set(moveis.map((m) => m.assetId).filter((a): a is string => !!a))];
  await Promise.all(assetIds.map(async (assetId) => {
    const meta = await buscarJson(`/content/furniture-assets/${assetId}/metadata.json`);
    if (meta === undefined) {
      problemas.push({ chave: assetId, msg: 'pasta de asset ausente (sem metadata.json)', sev: 'aviso' });
    }
  }));

  return { moveis, relatorio: { titulo: 'Móveis', icone: '🪑', total, validos: moveis.length, problemas } };
}

async function checarAnimacoes(): Promise<{ relatorio: DominioRelatorio }> {
  const lista = await buscarJson('/__devtools/animations/list');
  const entradas = Array.isArray(lista)
    ? lista.filter((e): e is { animacaoId: string; arquivo: string } =>
        typeof e === 'object' && e !== null && typeof (e as Record<string, unknown>).arquivo === 'string')
    : [];
  const problemas: Problema[] = [];
  let validos = 0;
  await Promise.all(entradas.map(async ({ arquivo }) => {
    const url = `/content/character-animations/${arquivo}`;
    const dados = await buscarJson(url);
    if (dados === undefined) { problemas.push({ chave: arquivo, msg: 'arquivo ausente ou inválido', sev: 'erro', url }); return; }
    const r = AnimacaoPersonagem.safeParse(dados);
    if (r.success) {
      validos += 1;
      if (r.data.keyframes.length === 0) {
        problemas.push({ chave: arquivo, msg: 'clip sem keyframes', sev: 'aviso', url });
      }
    } else {
      problemas.push({ chave: arquivo, msg: primeiroErro(r.error), sev: 'erro', url });
    }
  }));
  return { relatorio: { titulo: 'Animações', icone: '🎞️', total: entradas.length, validos, problemas } };
}

async function checarLocaisLegado(): Promise<{ relatorio: DominioRelatorio }> {
  const lista = await buscarJson('/__devtools/rooms/legacy-list');
  const arquivos = Array.isArray(lista) ? lista.filter((s): s is string => typeof s === 'string') : [];
  const problemas: Problema[] = [];
  let validos = 0;
  await Promise.all(arquivos.map(async (arquivo) => {
    const url = `/content/locations/${arquivo}`;
    const dados = await buscarJson(url);
    if (dados === undefined) { problemas.push({ chave: arquivo, msg: 'arquivo ausente ou inválido', sev: 'erro', url }); return; }
    const r = ComodoDefinition.safeParse(dados);
    if (r.success) validos += 1;
    else problemas.push({ chave: arquivo, msg: primeiroErro(r.error), sev: 'erro', url });
  }));
  return { relatorio: { titulo: 'Locais legados', icone: '🗺️', total: arquivos.length, validos, problemas } };
}

async function checarPartes(): Promise<{ relatorio: DominioRelatorio }> {
  // A rota character/list responde { ok, partes: [...] } (diferente de rooms/events, que são arrays).
  const resp = await buscarJson('/__devtools/character/list');
  const lista = Array.isArray(resp)
    ? resp
    : (resp !== null && typeof resp === 'object' ? (resp as { partes?: unknown }).partes : undefined);
  const entradas = Array.isArray(lista)
    ? lista.filter((e): e is { tipo: string; partId: string } =>
        typeof e === 'object' && e !== null
        && typeof (e as Record<string, unknown>).tipo === 'string'
        && typeof (e as Record<string, unknown>).partId === 'string')
    : [];
  const problemas: Problema[] = [];
  let validos = 0;
  await Promise.all(entradas.map(async ({ tipo, partId }) => {
    const base = `/content/character-parts/${tipo}/${partId}`;
    const url = `${base}/metadata.json`;
    const dados = await buscarJson(url);
    const r = CharacterPartMetadata.safeParse(dados);
    if (!r.success) { problemas.push({ chave: `${tipo}/${partId}`, msg: dados === undefined ? 'metadata ausente' : primeiroErro(r.error), sev: 'erro', url }); return; }
    validos += 1;
    const dir = r.data.direcoes[0];
    if (dir !== undefined) {
      const temSprite = await recursoWebpExiste(`${base}/${dir}.webp`);
      if (!temSprite) problemas.push({ chave: `${tipo}/${partId}`, msg: 'metadata OK mas sem sprites WebP', sev: 'aviso', url });
    }
  }));
  return { relatorio: { titulo: 'Partes de personagem', icone: '👤', total: entradas.length, validos, problemas } };
}

function checarReferencias(rooms: TipoIsoRoom[], moveis: TipoMovel[], eventos: TipoEvento[]): DominioRelatorio {
  const problemas: Problema[] = [];
  const idsMovel = new Set<string>();
  for (const m of moveis) { idsMovel.add(m.id); idsMovel.add(m.assetId); }
  const idsRoom = new Set(rooms.map((r) => r.id));
  const idsEvento = new Set(eventos.map((e) => e.eventoId));

  let checados = 0;

  // Cômodos → móveis e saídas
  for (const room of rooms) {
    for (const obj of room.objetos) {
      checados += 1;
      if (!idsMovel.has(obj.furnitureId)) {
        problemas.push({ chave: `${room.id} → ${obj.id}`, msg: `furnitureId inexistente: "${obj.furnitureId}"`, sev: 'erro' });
      }
    }
    for (const saida of room.saidas) {
      checados += 1;
      if (saida.destino.tipo === 'comodo' && saida.destino.comodoId !== undefined && !idsRoom.has(saida.destino.comodoId)) {
        problemas.push({ chave: `${room.id} → saída ${saida.id}`, msg: `cômodo destino não encontrado entre os ISO: "${saida.destino.comodoId}"`, sev: 'aviso' });
      }
    }
  }

  // Eventos → proximoEventoId
  for (const ev of eventos) {
    for (const beat of ev.scene.beats) {
      if (beat.tipo !== 'escolha') continue;
      for (const opcao of beat.opcoes) {
        if (opcao.proximoEventoId === undefined) continue;
        checados += 1;
        if (!idsEvento.has(opcao.proximoEventoId)) {
          problemas.push({ chave: ev.eventoId, msg: `proximoEventoId inexistente: "${opcao.proximoEventoId}"`, sev: 'erro' });
        }
      }
    }
  }

  return { titulo: 'Referências cruzadas', icone: '🔗', total: checados, validos: checados - problemas.length, problemas };
}

function montarMarkdown(rel: Relatorio): string {
  const dominios = [...rel.dominios, rel.refs];
  const erros = dominios.reduce((n, d) => n + d.problemas.filter((p) => p.sev === 'erro').length, 0);
  const avisos = dominios.reduce((n, d) => n + d.problemas.filter((p) => p.sev === 'aviso').length, 0);
  const linhas: string[] = [
    `# Relatório de Homologação — Vida 2.5D`,
    `Gerado às ${rel.geradoEm} · ${erros} erro(s) · ${avisos} aviso(s)`,
    '',
  ];
  for (const d of dominios) {
    linhas.push(`## ${d.titulo} — ${d.validos}/${d.total} válidos (${d.problemas.length} problema(s))`);
    if (d.problemas.length === 0) {
      linhas.push('- ✓ sem problemas');
    } else {
      for (const p of d.problemas) {
        linhas.push(`- [${p.sev}] \`${p.chave}\`: ${p.msg}`);
      }
    }
    linhas.push('');
  }
  return linhas.join('\n');
}

// ─── Componente ─────────────────────────────────────────────────────────────

export function VisaoGeral() {
  const [relatorio, setRelatorio] = useState<Relatorio | undefined>();
  const [rodando, setRodando] = useState(false);

  const [statusCopia, setStatusCopia] = useState('');

  const rodar = useCallback(async () => {
    setRodando(true);
    try {
      const [comodos, eventos, moveis, partes, animacoes, legados] = await Promise.all([
        checarComodos(), checarEventos(), checarMoveis(), checarPartes(), checarAnimacoes(), checarLocaisLegado(),
      ]);
      const refs = checarReferencias(comodos.rooms, moveis.moveis, eventos.eventos);
      setRelatorio({
        dominios: [comodos.relatorio, eventos.relatorio, moveis.relatorio, partes.relatorio, animacoes.relatorio, legados.relatorio],
        refs,
        geradoEm: new Date().toLocaleTimeString('pt-BR'),
      });
    } finally {
      setRodando(false);
    }
  }, []);

  const copiarRelatorio = useCallback(async () => {
    if (relatorio === undefined) return;
    try {
      await navigator.clipboard.writeText(montarMarkdown(relatorio));
      setStatusCopia('copiado ✓');
    } catch {
      setStatusCopia('falha ao copiar');
    }
    setTimeout(() => setStatusCopia(''), 2500);
  }, [relatorio]);

  useEffect(() => { void rodar(); }, [rodar]);

  const todos = relatorio ? [...relatorio.dominios, relatorio.refs] : [];
  const totalErros = todos.reduce((n, d) => n + d.problemas.filter((p) => p.sev === 'erro').length, 0);
  const totalAvisos = todos.reduce((n, d) => n + d.problemas.filter((p) => p.sev === 'aviso').length, 0);
  const corGeral = totalErros > 0 ? '#c53030' : totalAvisos > 0 ? '#b7791f' : '#2f855a';

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '1rem', color: '#e2e8f0', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, color: '#90cdf4', fontSize: 18 }}>🩺 Visão Geral — Homologação</h2>
        <button onClick={() => void rodar()} disabled={rodando} style={estiloBotao(rodando)}>
          {rodando ? 'Escaneando…' : '↻ Re-escanear'}
        </button>
        <button onClick={() => void copiarRelatorio()} disabled={relatorio === undefined} style={estiloBotao(relatorio === undefined)}>
          ⧉ Copiar relatório
        </button>
        {statusCopia && <span style={{ fontSize: 11, color: '#9ae6b4' }}>{statusCopia}</span>}
        {relatorio && <span style={{ fontSize: 11, color: '#718096' }}>gerado às {relatorio.geradoEm}</span>}
      </div>

      {relatorio && (
        <div style={{
          background: corGeral, color: '#fff', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem',
          display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: 14,
        }}>
          <strong style={{ fontSize: 16 }}>
            {totalErros === 0 && totalAvisos === 0 ? '✓ Tudo válido' : totalErros > 0 ? '✗ Há erros' : '⚠ Há avisos'}
          </strong>
          <span>{totalErros} erro(s)</span>
          <span>{totalAvisos} aviso(s)</span>
        </div>
      )}

      {!relatorio && rodando && <div style={{ color: '#a0aec0' }}>Escaneando conteúdo do projeto…</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {todos.map((d) => <CartaoDominio key={d.titulo} dominio={d} />)}
      </div>
    </div>
  );
}

function CartaoDominio({ dominio }: { readonly dominio: DominioRelatorio }) {
  const [aberto, setAberto] = useState(false);
  const sev = severidadeDominio(dominio);
  const cor = sev === 'erro' ? '#fc8181' : sev === 'aviso' ? '#f6ad55' : '#68d391';
  const erros = dominio.problemas.filter((p) => p.sev === 'erro').length;
  const avisos = dominio.problemas.filter((p) => p.sev === 'aviso').length;

  return (
    <div style={{ background: '#1a202c', border: `1px solid #2d3748`, borderLeft: `3px solid ${cor}`, borderRadius: 6, padding: '0.8rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <strong style={{ fontSize: 14 }}>{dominio.icone} {dominio.titulo}</strong>
        <span style={{ color: cor, fontSize: 18 }}>{sev === 'ok' ? '✓' : sev === 'aviso' ? '⚠' : '✗'}</span>
      </div>
      <div style={{ fontSize: 12, color: '#a0aec0', marginTop: 6 }}>
        {dominio.validos}/{dominio.total} válidos
        {erros > 0 && <span style={{ color: '#fc8181' }}> · {erros} erro(s)</span>}
        {avisos > 0 && <span style={{ color: '#f6ad55' }}> · {avisos} aviso(s)</span>}
      </div>

      {dominio.problemas.length > 0 && (
        <>
          <button onClick={() => setAberto((v) => !v)} style={{
            marginTop: 8, background: 'transparent', color: '#90cdf4', border: 'none',
            cursor: 'pointer', fontSize: 11, fontFamily: 'monospace', padding: 0,
          }}>
            {aberto ? '▾ ocultar' : `▸ ver ${dominio.problemas.length} problema(s)`}
          </button>
          {aberto && (
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
              {dominio.problemas.map((p, i) => (
                <div key={i} style={{ fontSize: 11, borderBottom: '1px solid #222831', paddingBottom: 3 }}>
                  <span style={{ color: p.sev === 'erro' ? '#fc8181' : '#f6ad55' }}>{p.sev === 'erro' ? '✗' : '⚠'}</span>{' '}
                  {p.url !== undefined ? (
                    <a href={p.url} target="_blank" rel="noreferrer" title={`Abrir ${p.url}`}
                       style={{ color: '#63b3ed', textDecoration: 'underline' }}>{p.chave}</a>
                  ) : (
                    <code style={{ color: '#cbd5e0' }}>{p.chave}</code>
                  )}
                  <div style={{ color: '#718096', paddingLeft: 14 }}>{p.msg}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function estiloBotao(desabilitado: boolean): React.CSSProperties {
  return {
    background: '#2d3748', color: '#90cdf4', border: '1px solid #4a5568', borderRadius: 4,
    padding: '0.35rem 0.8rem', cursor: desabilitado ? 'wait' : 'pointer', fontSize: 12, fontFamily: 'monospace',
    opacity: desabilitado ? 0.6 : 1,
  };
}
