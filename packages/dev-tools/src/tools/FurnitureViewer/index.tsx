import { useState, useRef, type ChangeEvent } from 'react';
import { z } from 'zod';
import { FurnitureDefinition } from '@lifesim/core';
import { CartaoDeMovel } from './FurnitureCard';

type FiltroEra = 'todos' | 'eighties' | 'nineties' | 'twothousands' | 'modern';
type FiltroCategoria = 'todos' | FurnitureDefinition['categoria'];

type ItemDoCatalogo =
  | { readonly ok: true; readonly movel: FurnitureDefinition }
  | { readonly ok: false; readonly bruto: unknown; readonly erro: z.ZodError };

function anoParaEra(startYear: number): FiltroEra {
  if (startYear < 1990) return 'eighties';
  if (startYear < 2000) return 'nineties';
  if (startYear < 2010) return 'twothousands';
  return 'modern';
}

function itemPassaFiltros(
  item: ItemDoCatalogo,
  era: FiltroEra,
  categoria: FiltroCategoria,
  precoMin: number,
  precoMax: number,
  busca: string,
): boolean {
  if (!item.ok) return true; // itens inválidos sempre aparecem (para inspeção)

  const { movel } = item;
  if (era !== 'todos' && anoParaEra(movel.availability.startYear) !== era) return false;
  if (categoria !== 'todos' && movel.categoria !== categoria) return false;
  if (precoMax > 0 && (movel.preco < precoMin || movel.preco > precoMax)) return false;
  if (busca.trim()) {
    const termo = busca.toLowerCase();
    if (!movel.nome.toLowerCase().includes(termo) && !movel.tags.some((t) => t.toLowerCase().includes(termo))) {
      return false;
    }
  }
  return true;
}

async function parsearCatalogo(arquivo: File): Promise<{ itens: ItemDoCatalogo[]; mensagem: string }> {
  const texto = await arquivo.text();
  const dados: unknown = JSON.parse(texto);
  const lista: unknown[] = Array.isArray(dados) ? dados : [dados];

  const itens: ItemDoCatalogo[] = lista.map((entrada) => {
    const resultado = FurnitureDefinition.safeParse(entrada);
    if (resultado.success) {
      return { ok: true as const, movel: resultado.data };
    }
    return { ok: false as const, bruto: entrada, erro: resultado.error };
  });

  const numErros = itens.filter((i) => !i.ok).length;
  const mensagem = `${itens.length - numErros} válidos${numErros > 0 ? ` · ${numErros} com erro de schema` : ''}`;
  return { itens, mensagem };
}

const CATEGORIAS: FurnitureDefinition['categoria'][] = [
  'assento', 'mesa', 'cama', 'tecnologia', 'eletrodomestico', 'decoracao', 'treino', 'outro',
];

const estiloSelect: React.CSSProperties = {
  background: '#2d3748',
  color: '#e2e8f0',
  border: '1px solid #4a5568',
  borderRadius: 4,
  padding: '0.3rem 0.5rem',
  fontSize: 12,
  fontFamily: 'monospace',
};

export function VisualizadorDeMovel() {
  const [itensCatalogo, setItensCatalogo] = useState<ItemDoCatalogo[]>([]);
  const [mensagem, setMensagem] = useState('');

  const [filtroEra, setFiltroEra] = useState<FiltroEra>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<FiltroCategoria>('todos');
  const [precoMin, setPrecoMin] = useState(0);
  const [precoMax, setPrecoMax] = useState(0);
  const [termoBusca, setTermoBusca] = useState('');

  const inputArquivoRef = useRef<HTMLInputElement>(null);

  const aoCarregarArquivo = async (e: ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setMensagem('Carregando...');
    try {
      const { itens, mensagem: msg } = await parsearCatalogo(arquivo);
      setItensCatalogo(itens);
      setMensagem(msg);
    } catch (err) {
      setMensagem(`Erro: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (e.target) e.target.value = '';
  };

  const itensFiltrados = itensCatalogo.filter((item) =>
    itemPassaFiltros(item, filtroEra, filtroCategoria, precoMin, precoMax, termoBusca),
  );

  const numValidos = itensCatalogo.filter((i) => i.ok).length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center',
        padding: '0.75rem 1rem', background: '#1a202c', borderBottom: '1px solid #4a5568',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => inputArquivoRef.current?.click()}
            style={{
              background: '#4299e1', color: '#fff', border: 'none', borderRadius: 4,
              padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: 12, fontFamily: 'monospace',
            }}
          >
            Carregar catálogo
          </button>
          <input ref={inputArquivoRef} type="file" accept=".json" onChange={aoCarregarArquivo} style={{ display: 'none' }} />

          <select value={filtroEra} onChange={(e) => setFiltroEra(e.target.value as FiltroEra)} style={estiloSelect}>
            <option value="todos">Todas as eras</option>
            <option value="eighties">Anos 80</option>
            <option value="nineties">Anos 90</option>
            <option value="twothousands">Anos 2000</option>
            <option value="modern">Moderno (2010+)</option>
          </select>

          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value as FiltroCategoria)} style={estiloSelect}>
            <option value="todos">Todas as categorias</option>
            {CATEGORIAS.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <span style={{ fontSize: 12, color: '#a0aec0' }}>Preço:</span>
          <input
            type="number" placeholder="min" value={precoMin || ''}
            onChange={(e) => setPrecoMin(Number(e.target.value))}
            style={{ ...estiloSelect, width: 80 }}
          />
          <input
            type="number" placeholder="max" value={precoMax || ''}
            onChange={(e) => setPrecoMax(Number(e.target.value))}
            style={{ ...estiloSelect, width: 80 }}
          />

          <input
            type="text" placeholder="Buscar nome/tag..."
            value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)}
            style={{ ...estiloSelect, width: 160 }}
          />
        </div>

        <span style={{ fontSize: 12, color: '#a0aec0', whiteSpace: 'nowrap' }}>
          {itensFiltrados.length}/{numValidos} · {mensagem}
        </span>
      </div>

      {itensCatalogo.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#718096', fontSize: 14 }}>
          Carregue um arquivo <code style={{ margin: '0 0.3rem', color: '#90cdf4' }}>content/furniture/**/*.json</code>
        </div>
      ) : (
        <div style={{
          flex: 1, overflow: 'auto', padding: '1rem',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '0.75rem', alignContent: 'start',
        }}>
          {itensFiltrados.map((item, idx) =>
            item.ok ? (
              <CartaoDeMovel key={item.movel.id} movel={item.movel} />
            ) : (
              <CartaoDeMovelComErro key={idx} bruto={item.bruto} erro={item.erro} />
            )
          )}
          {itensFiltrados.length === 0 && (
            <div style={{ gridColumn: '1 / -1', color: '#718096', fontSize: 14, textAlign: 'center', paddingTop: '2rem' }}>
              Nenhum móvel corresponde aos filtros
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type PropsCartaoComErro = { readonly bruto: unknown; readonly erro: z.ZodError };

function CartaoDeMovelComErro({ bruto, erro }: PropsCartaoComErro) {
  const nome = (bruto !== null && typeof bruto === 'object' && 'nome' in bruto)
    ? String((bruto as Record<string, unknown>)['nome'])
    : 'Item inválido';

  return (
    <div style={{
      background: '#1a202c', border: '2px solid #f6ad55', borderRadius: 6,
      padding: '0.75rem', fontSize: 12, color: '#e2e8f0',
    }}>
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.4rem' }}>
        <span>⚠️</span>
        <strong style={{ color: '#f6ad55' }}>{nome}</strong>
      </div>
      <div style={{ color: '#fc8181', fontSize: 11 }}>
        {erro.issues.slice(0, 3).map((issue, i) => (
          <div key={i}>{issue.path.join('.') || 'raiz'}: {issue.message}</div>
        ))}
        {erro.issues.length > 3 && <div>+{erro.issues.length - 3} outros erros</div>}
      </div>
    </div>
  );
}
