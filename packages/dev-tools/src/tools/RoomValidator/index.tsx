import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { ComodoDefinition, type ComodoDefinition as TipoComodoDefinition } from '@core/schemas/location';
import { IsoRoomDefinition, type IsoRoomDefinition as TipoIsoRoomDefinition } from '@core/schemas/isoRoom';
import { carregarComodoDefinition } from '../../shared/SchemaLoader';
import { CanvasDoComodo } from './RoomCanvas';
import { CanvasIsoDoComodo } from './IsoRoomCanvas';
import { PainelJson } from './JsonPanel';

type AbaValidador = 'iso' | 'legado';

export function ValidadorDeComodo() {
  const [aba, setAba] = useState<AbaValidador>('iso');

  // Estado ISO
  const [listaIso, setListaIso] = useState<readonly string[]>([]);
  const [idIso, setIdIso] = useState<string>('');
  const [comodoIso, setComodoIso] = useState<TipoIsoRoomDefinition | undefined>();

  // Estado legado
  const [comodoLegado, setComodoLegado] = useState<TipoComodoDefinition | undefined>();

  const [erro, setErro] = useState<string | undefined>();

  // Carrega a lista de cômodos ISO via rota de dev-tools.
  useEffect(() => {
    let cancelado = false;
    void (async () => {
      try {
        const res = await fetch('/__devtools/rooms/iso-list');
        if (!res.ok) return;
        const dados: unknown = await res.json();
        if (!cancelado && Array.isArray(dados)) {
          const ids = dados.filter((d): d is string => typeof d === 'string');
          setListaIso(ids);
          if (ids[0] !== undefined) setIdIso((atual) => atual || ids[0]!);
        }
      } catch { /* rota indisponível — dropdown fica vazio */ }
    })();
    return () => { cancelado = true; };
  }, []);

  // Ao mudar o id selecionado, busca e valida o cômodo ISO.
  useEffect(() => {
    if (idIso === '') { setComodoIso(undefined); return; }
    let cancelado = false;
    setErro(undefined);
    void (async () => {
      try {
        const res = await fetch(`/content/locations-iso/${idIso}.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status} ao carregar ${idIso}.json`);
        const dados: unknown = await res.json();
        const resultado = IsoRoomDefinition.safeParse(dados);
        if (cancelado) return;
        if (resultado.success) {
          setComodoIso(resultado.data);
        } else {
          const primeiro = resultado.error.issues[0];
          setComodoIso(undefined);
          setErro(primeiro ? `${primeiro.path.join('.') || 'raiz'}: ${primeiro.message}` : 'Schema inválido');
        }
      } catch (e) {
        if (!cancelado) { setComodoIso(undefined); setErro(e instanceof Error ? e.message : String(e)); }
      }
    })();
    return () => { cancelado = true; };
  }, [idIso]);

  const aoCarregarLegado = async (e: ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setErro(undefined);
    const { valido, erro: erroSchema } = await carregarComodoDefinition(arquivo);
    if (valido) {
      setComodoLegado(valido);
    } else {
      const primeiro = erroSchema?.issues[0];
      setErro(primeiro ? `${primeiro.path.join('.') || 'raiz'}: ${primeiro.message}` : 'Schema inválido');
    }
    if (e.target) e.target.value = '';
  };

  const aoAtualizarLegado = useCallback((novo: TipoComodoDefinition) => setComodoLegado(novo), []);
  const aoAtualizarIso = useCallback((novo: TipoIsoRoomDefinition) => setComodoIso(novo), []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Abas */}
      <div style={{
        display: 'flex', gap: '0.5rem', alignItems: 'center',
        padding: '0.6rem 1rem', background: '#1a202c', borderBottom: '1px solid #4a5568',
      }}>
        <button onClick={() => setAba('iso')} style={estiloAba(aba === 'iso')}>ISO (tile grid)</button>
        <button onClick={() => setAba('legado')} style={estiloAba(aba === 'legado')}>Legado (navZonas)</button>
        {erro !== undefined && <span style={{ fontSize: 12, color: '#fc8181', marginLeft: 'auto' }}>{erro}</span>}
      </div>

      {aba === 'iso' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            display: 'flex', gap: '0.75rem', alignItems: 'center',
            padding: '0.6rem 1rem', borderBottom: '1px solid #2d3748', fontSize: 13, color: '#a0aec0',
          }}>
            <label>Cômodo:</label>
            <select
              value={idIso}
              onChange={(e) => setIdIso(e.target.value)}
              style={{
                background: '#2d3748', color: '#e2e8f0', border: '1px solid #4a5568',
                borderRadius: 4, padding: '0.3rem 0.6rem', fontSize: 13, fontFamily: 'monospace', minWidth: 240,
              }}
            >
              {listaIso.length === 0 && <option value="">(nenhum cômodo ISO encontrado)</option>}
              {listaIso.map((id) => <option key={id} value={id}>{id}</option>)}
            </select>
            <span style={{ color: '#718096' }}>{listaIso.length} cômodos · content/locations-iso/</span>
            {comodoIso !== undefined && (
              <span style={{ color: '#a0aec0' }}>
                {comodoIso.nome} — {comodoIso.larguraTiles}×{comodoIso.alturaTiles} tiles — {comodoIso.objetos.length} objetos
              </span>
            )}
          </div>

          {comodoIso !== undefined ? (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
                <CanvasIsoDoComodo comodo={comodoIso} />
              </div>
              <PainelJson
                titulo="IsoRoomDefinition JSON"
                valor={comodoIso}
                schema={IsoRoomDefinition}
                onAtualizar={aoAtualizarIso}
              />
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#718096' }}>
              Selecione um cômodo no dropdown.
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ background: '#744210', color: '#fbd38d', padding: '6px 12px', fontSize: 12 }}>
            ⚠ Sistema legado (ComodoDefinition + navZonas). Novos cômodos devem usar IsoRoomDefinition na aba ISO.
          </div>
          <div style={{
            display: 'flex', gap: '0.75rem', alignItems: 'center',
            padding: '0.6rem 1rem', borderBottom: '1px solid #2d3748',
          }}>
            <label style={{
              background: '#4299e1', color: '#fff', border: 'none', borderRadius: 4,
              padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: 12, fontFamily: 'monospace',
            }}>
              Carregar cômodo legado
              <input type="file" accept=".json" onChange={aoCarregarLegado} style={{ display: 'none' }} />
            </label>
            {comodoLegado !== undefined && (
              <span style={{ fontSize: 12, color: '#a0aec0' }}>
                {comodoLegado.nome} — {comodoLegado.objetos.length} objetos — {comodoLegado.navZonas.length} navZonas
              </span>
            )}
          </div>

          {comodoLegado !== undefined ? (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
                <CanvasDoComodo comodo={comodoLegado} onAtualizar={aoAtualizarLegado} />
              </div>
              <PainelJson
                titulo="ComodoDefinition JSON"
                valor={comodoLegado}
                schema={ComodoDefinition}
                onAtualizar={aoAtualizarLegado}
              />
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#718096' }}>
              Carregue um arquivo <code style={{ margin: '0 0.3rem', color: '#90cdf4' }}>content/locations/**/*.json</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function estiloAba(ativo: boolean): React.CSSProperties {
  return {
    background: ativo ? '#2b6cb0' : '#2d3748',
    color: ativo ? '#ffffff' : '#a0aec0',
    border: `1px solid ${ativo ? '#63b3ed' : '#4a5568'}`,
    borderRadius: 4,
    padding: '0.3rem 0.75rem',
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: 'monospace',
  };
}
