import { useState, useCallback, type ChangeEvent } from 'react';
import type { ComodoDefinition } from '@lifesim/core';
import { carregarComodoDefinition } from '../../shared/SchemaLoader';
import { CanvasDoComodo } from './RoomCanvas';
import { PainelJson } from './JsonPanel';

export function ValidadorDeComodo() {
  const [comodoAtual, setComodoAtual] = useState<ComodoDefinition | undefined>();
  const [erroCarregamento, setErroCarregamento] = useState<string | undefined>();

  const aoCarregarArquivo = async (e: ChangeEvent<HTMLInputElement>) => {
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
          : 'Schema inválido',
      );
    }
    if (e.target) e.target.value = '';
  };

  const aoAtualizarComodo = useCallback((novoComodo: ComodoDefinition) => {
    setComodoAtual(novoComodo);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '0.75rem 1rem',
        background: '#1a202c',
        borderBottom: '1px solid #4a5568',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
      }}>
        <label style={{
          background: '#4299e1', color: '#fff', border: 'none', borderRadius: 4,
          padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: 12, fontFamily: 'monospace',
        }}>
          Carregar cômodo
          <input
            type="file"
            accept=".json"
            onChange={aoCarregarArquivo}
            style={{ display: 'none' }}
          />
        </label>

        {comodoAtual && (
          <span style={{ fontSize: 12, color: '#a0aec0' }}>
            {comodoAtual.nome} · {comodoAtual.objetos.length} objetos · {comodoAtual.navZonas.length} navZonas
          </span>
        )}

        {erroCarregamento !== undefined && (
          <span style={{ fontSize: 12, color: '#fc8181' }}>⚠️ {erroCarregamento}</span>
        )}
      </div>

      {comodoAtual === undefined ? (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#718096', fontSize: 14,
        }}>
          Carregue um arquivo <code style={{ margin: '0 0.3rem', color: '#90cdf4' }}>content/locations/**/*.json</code>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
            <CanvasDoComodo comodo={comodoAtual} onAtualizar={aoAtualizarComodo} />
          </div>
          <PainelJson comodo={comodoAtual} onAtualizar={aoAtualizarComodo} />
        </div>
      )}
    </div>
  );
}
