import { useCallback, useState, type ChangeEvent } from 'react';
import {
  ComodoDefinition,
  IsoRoomDefinition,
  type ComodoDefinition as TipoComodoDefinition,
  type IsoRoomDefinition as TipoIsoRoomDefinition,
} from '@lifesim/core';
import { carregarComodoDefinition } from '../../shared/SchemaLoader';
import { CanvasDoComodo } from './RoomCanvas';
import { CanvasIsoDoComodo } from './IsoRoomCanvas';
import { PainelJson } from './JsonPanel';

type ModoValidador = 'legado' | 'iso';

export function ValidadorDeComodo() {
  const [modo, setModo] = useState<ModoValidador>('legado');
  const [comodoAtual, setComodoAtual] = useState<TipoComodoDefinition | undefined>();
  const [comodoIsoAtual, setComodoIsoAtual] = useState<TipoIsoRoomDefinition | undefined>();
  const [erroCarregamento, setErroCarregamento] = useState<string | undefined>();

  const aoCarregarArquivoLegado = async (e: ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setErroCarregamento(undefined);
    const { valido, erro } = await carregarComodoDefinition(arquivo);

    if (valido) {
      setComodoAtual(valido);
    } else {
      const primeiroErro = erro?.issues[0];
      setErroCarregamento(
        primeiroErro
          ? `${primeiroErro.path.join('.') || 'raiz'}: ${primeiroErro.message}`
          : 'Schema invalido',
      );
    }
    if (e.target) e.target.value = '';
  };

  const aoCarregarArquivoIso = async (e: ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setErroCarregamento(undefined);
    try {
      const texto = await arquivo.text();
      const dados: unknown = JSON.parse(texto);
      const resultado = IsoRoomDefinition.safeParse(dados);
      if (resultado.success) {
        setComodoIsoAtual(resultado.data);
      } else {
        const primeiroErro = resultado.error.issues[0];
        setErroCarregamento(
          primeiroErro
            ? `${primeiroErro.path.join('.') || 'raiz'}: ${primeiroErro.message}`
            : 'Schema invalido',
        );
      }
    } catch (erro) {
      setErroCarregamento(erro instanceof Error ? erro.message : String(erro));
    }
    if (e.target) e.target.value = '';
  };

  const aoAtualizarComodo = useCallback((novoComodo: TipoComodoDefinition) => {
    setComodoAtual(novoComodo);
  }, []);

  const aoAtualizarComodoIso = useCallback((novoComodo: TipoIsoRoomDefinition) => {
    setComodoIsoAtual(novoComodo);
  }, []);

  const comodoVisivel = modo === 'legado' ? comodoAtual : comodoIsoAtual;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '0.75rem 1rem',
        background: '#1a202c',
        borderBottom: '1px solid #4a5568',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', fontSize: 12, color: '#a0aec0' }}>
          <span>Modo:</span>
          <button onClick={() => setModo('legado')} style={estiloBotaoModo(modo === 'legado')}>
            Legado (navZonas)
          </button>
          <button onClick={() => setModo('iso')} style={estiloBotaoModo(modo === 'iso')}>
            ISO (tile grid)
          </button>
        </div>

        <label style={{
          background: '#4299e1',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          padding: '0.3rem 0.75rem',
          cursor: 'pointer',
          fontSize: 12,
          fontFamily: 'monospace',
        }}>
          {modo === 'legado' ? 'Carregar comodo' : 'Carregar comodo ISO'}
          <input
            type="file"
            accept=".json"
            onChange={modo === 'legado' ? aoCarregarArquivoLegado : aoCarregarArquivoIso}
            style={{ display: 'none' }}
          />
        </label>

        {modo === 'legado' && comodoAtual !== undefined && (
          <span style={{ fontSize: 12, color: '#a0aec0' }}>
            {comodoAtual.nome} - {comodoAtual.objetos.length} objetos - {comodoAtual.navZonas.length} navZonas
          </span>
        )}

        {modo === 'iso' && comodoIsoAtual !== undefined && (
          <span style={{ fontSize: 12, color: '#a0aec0' }}>
            {comodoIsoAtual.nome} - {comodoIsoAtual.larguraTiles}x{comodoIsoAtual.alturaTiles} tiles - {comodoIsoAtual.objetos.length} objetos
          </span>
        )}

        {erroCarregamento !== undefined && (
          <span style={{ fontSize: 12, color: '#fc8181' }}>{erroCarregamento}</span>
        )}
      </div>

      {comodoVisivel === undefined ? (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#718096',
          fontSize: 14,
        }}>
          Carregue um arquivo{' '}
          <code style={{ margin: '0 0.3rem', color: '#90cdf4' }}>
            {modo === 'legado' ? 'content/locations/**/*.json' : 'content/locations-iso/*.json'}
          </code>
        </div>
      ) : modo === 'legado' && comodoAtual !== undefined ? (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
            <CanvasDoComodo comodo={comodoAtual} onAtualizar={aoAtualizarComodo} />
          </div>
          <PainelJson
            titulo="ComodoDefinition JSON"
            valor={comodoAtual}
            schema={ComodoDefinition}
            onAtualizar={aoAtualizarComodo}
          />
        </div>
      ) : comodoIsoAtual !== undefined ? (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
            <CanvasIsoDoComodo comodo={comodoIsoAtual} />
          </div>
          <PainelJson
            titulo="IsoRoomDefinition JSON"
            valor={comodoIsoAtual}
            schema={IsoRoomDefinition}
            onAtualizar={aoAtualizarComodoIso}
          />
        </div>
      ) : undefined}
    </div>
  );
}

function estiloBotaoModo(ativo: boolean): React.CSSProperties {
  return {
    background: ativo ? '#2b6cb0' : '#2d3748',
    color: ativo ? '#ffffff' : '#a0aec0',
    border: `1px solid ${ativo ? '#63b3ed' : '#4a5568'}`,
    borderRadius: 4,
    padding: '0.25rem 0.55rem',
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: 'monospace',
  };
}
