import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { z } from 'zod';
import { FurnitureDefinition } from '@lifesim/core';
import type { FurnitureAssetMetadata, RotacaoMovel } from '@core/schemas/furnitureAsset';
import { carregarFurnitureAssetMetadata, urlImagemAsset } from '../../shared/SchemaLoader';
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
  if (!item.ok) return true;
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
    return resultado.success
      ? { ok: true as const, movel: resultado.data }
      : { ok: false as const, bruto: entrada, erro: resultado.error };
  });

  const numErros = itens.filter((i) => !i.ok).length;
  const msg = `${itens.length - numErros} válidos${numErros > 0 ? ` · ${numErros} com erro de schema` : ''}`;
  return { itens, mensagem: msg };
}

const CATEGORIAS: FurnitureDefinition['categoria'][] = [
  'assento', 'mesa', 'cama', 'tecnologia', 'eletrodomestico', 'decoracao', 'treino', 'outro',
];

const estiloSelect: React.CSSProperties = {
  background: '#ffffff',
  color: '#374151',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  padding: '0.3rem 0.5rem',
  fontSize: 12,
};

export function VisualizadorDeMovel() {
  const [itensCatalogo, setItensCatalogo] = useState<ItemDoCatalogo[]>([]);
  const [mensagem, setMensagem] = useState('');
  const [filtroEra, setFiltroEra] = useState<FiltroEra>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<FiltroCategoria>('todos');
  const [precoMin, setPrecoMin] = useState(0);
  const [precoMax, setPrecoMax] = useState(0);
  const [termoBusca, setTermoBusca] = useState('');
  const [movelInspecionado, setMovelInspecionado] = useState<FurnitureDefinition | undefined>();
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Barra de filtros */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center',
        padding: '0.75rem 1rem', background: '#ffffff', borderBottom: '1px solid #e5e7eb',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => inputArquivoRef.current?.click()}
            style={{
              background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6,
              padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: 12,
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

          <span style={{ fontSize: 12, color: '#6b7280' }}>Preço:</span>
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
            type="text" placeholder="Buscar nome/tag…"
            value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)}
            style={{ ...estiloSelect, width: 160 }}
          />
        </div>
        <span style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
          {itensFiltrados.length}/{numValidos} · {mensagem}
        </span>
      </div>

      {/* Grid de cards */}
      {itensCatalogo.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
          Carregue um arquivo{' '}
          <code style={{ margin: '0 0.3rem', color: '#2563eb' }}>content/furniture/**/*.json</code>
        </div>
      ) : (
        <div style={{
          flex: 1, overflow: 'auto', padding: '1rem',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '0.75rem', alignContent: 'start',
        }}>
          {itensFiltrados.map((item, idx) =>
            item.ok ? (
              <CartaoDeMovel
                key={item.movel.id}
                movel={item.movel}
                aoClicar={() => setMovelInspecionado(item.movel)}
              />
            ) : (
              <CartaoDeMovelComErro key={idx} bruto={item.bruto} erro={item.erro} />
            )
          )}
          {itensFiltrados.length === 0 && (
            <div style={{ gridColumn: '1 / -1', color: '#9ca3af', fontSize: 14, textAlign: 'center', paddingTop: '2rem' }}>
              Nenhum móvel corresponde aos filtros
            </div>
          )}
        </div>
      )}

      {/* Drawer de inspeção */}
      {movelInspecionado !== undefined && (
        <PainelInspecao
          movel={movelInspecionado}
          aoFechar={() => setMovelInspecionado(undefined)}
        />
      )}
    </div>
  );
}

// --- Cartão de erro de schema ---

type PropsCartaoComErro = { readonly bruto: unknown; readonly erro: z.ZodError };

function CartaoDeMovelComErro({ bruto, erro }: PropsCartaoComErro) {
  const nome = (bruto !== null && typeof bruto === 'object' && 'nome' in bruto)
    ? String((bruto as Record<string, unknown>)['nome'])
    : 'Item inválido';

  return (
    <div style={{
      background: '#fff7ed', border: '2px solid #f59e0b', borderRadius: 8,
      padding: '0.75rem', fontSize: 12, color: '#374151',
    }}>
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.4rem' }}>
        <span>⚠️</span>
        <strong style={{ color: '#d97706' }}>{nome}</strong>
      </div>
      <div style={{ color: '#dc2626', fontSize: 11 }}>
        {erro.issues.slice(0, 3).map((issue, i) => (
          <div key={i}>{issue.path.join('.') || 'raiz'}: {issue.message}</div>
        ))}
        {erro.issues.length > 3 && <div>+{erro.issues.length - 3} outros erros</div>}
      </div>
    </div>
  );
}

// --- Painel de inspeção lateral ---

const TAMANHO_TILE_INSPECAO = 128;

type PropsPainelInspecao = {
  readonly movel: FurnitureDefinition;
  readonly aoFechar: () => void;
};

function PainelInspecao({ movel, aoFechar }: PropsPainelInspecao) {
  const [estadoAsset, setEstadoAsset] = useState<
    | { tipo: 'carregando' }
    | { tipo: 'disponivel'; metadata: FurnitureAssetMetadata }
    | { tipo: 'ausente' }
  >({ tipo: 'carregando' });
  const [rotacaoAtual, setRotacaoAtual] = useState<RotacaoMovel>(0);
  const [imagemComErro, setImagemComErro] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setEstadoAsset({ tipo: 'carregando' });
    setImagemComErro(false);

    void carregarFurnitureAssetMetadata(movel.assetId).then((metadata) => {
      if (cancelado) return;
      if (metadata) {
        setRotacaoAtual(metadata.rotacoesDisponiveis[0] ?? 0);
        setEstadoAsset({ tipo: 'disponivel', metadata });
      } else {
        setEstadoAsset({ tipo: 'ausente' });
      }
    });

    return () => { cancelado = true; };
  }, [movel.assetId]);

  const efeitosAtivos = Object.entries(movel.efeitos ?? {}).filter(([, v]) => v !== undefined && v !== 0);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={aoFechar}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 50 }}
      />
      {/* Painel */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 460,
        background: '#ffffff', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
        overflow: 'auto', zIndex: 51, display: 'flex', flexDirection: 'column',
      }}>
        {/* Topo */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, background: '#fff',
        }}>
          <strong style={{ fontSize: 16 }}>{movel.nome}</strong>
          <button
            onClick={aoFechar}
            style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Preview grande */}
          <SecaoPreviewInspecao
            estadoAsset={estadoAsset}
            assetId={movel.assetId}
            rotacaoAtual={rotacaoAtual}
            imagemComErro={imagemComErro}
            aoErroImagem={() => setImagemComErro(true)}
            aoAlterarRotacao={(rot) => { setRotacaoAtual(rot); setImagemComErro(false); }}
          />

          {/* Dados do FurnitureDefinition */}
          <Secao titulo="FurnitureDefinition">
            <CampoInfo rotulo="ID" valor={movel.id} />
            <CampoInfo rotulo="Categoria" valor={movel.categoria} />
            <CampoInfo rotulo="Era" valor={
              movel.availability.endYear !== undefined
                ? `${movel.availability.startYear}–${movel.availability.endYear}`
                : `${movel.availability.startYear}+`
            } />
            <CampoInfo rotulo="Preço" valor={`R$${movel.preco}`} />
            <CampoInfo rotulo="Revenda" valor={`R$${movel.valorDeRevenda}`} />
            <CampoInfo rotulo="Grid" valor={`${movel.tamanhoGrid.largura}×${movel.tamanhoGrid.altura} tiles`} />
            <CampoInfo rotulo="Ações" valor={movel.acoes.length > 0 ? movel.acoes.join(', ') : '⚠️ nenhuma'} />
            {efeitosAtivos.length > 0 && (
              <CampoInfo rotulo="Efeitos" valor={
                efeitosAtivos.map(([k, v]) => `${k} ${(v as number) > 0 ? '+' : ''}${String(v)}`).join(' · ')
              } />
            )}
            {movel.tags.length > 0 && (
              <CampoInfo rotulo="Tags" valor={movel.tags.join(', ')} />
            )}
            {movel.descricao && <CampoInfo rotulo="Descrição" valor={movel.descricao} />}
          </Secao>

          {/* Dados do FurnitureAssetMetadata */}
          {estadoAsset.tipo === 'disponivel' && (
            <Secao titulo="FurnitureAssetMetadata">
              <CampoInfo rotulo="assetId" valor={estadoAsset.metadata.assetId} />
              <CampoInfo rotulo="Âncora" valor={`${estadoAsset.metadata.anchorX} × ${estadoAsset.metadata.anchorY}`} />
              <CampoInfo rotulo="Escala base" valor={String(estadoAsset.metadata.escalaBase)} />
              <CampoInfo rotulo="Rotações" valor={estadoAsset.metadata.rotacoesDisponiveis.map((r) => `${r}°`).join(', ')} />
              {estadoAsset.metadata.spritesPorRotacao !== undefined && (
                <CampoInfo
                  rotulo="Sprites"
                  valor={Object.entries(estadoAsset.metadata.spritesPorRotacao)
                    .map(([rotacao, arquivo]) => `${rotacao}°: ${arquivo}`)
                    .join(' · ')}
                />
              )}
              {estadoAsset.metadata.material && <CampoInfo rotulo="Material" valor={estadoAsset.metadata.material} />}
              {estadoAsset.metadata.era && <CampoInfo rotulo="Era" valor={estadoAsset.metadata.era} />}
              {estadoAsset.metadata.tags.length > 0 && (
                <CampoInfo rotulo="Tags" valor={estadoAsset.metadata.tags.join(', ')} />
              )}
            </Secao>
          )}

          {estadoAsset.tipo === 'ausente' && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '0.75rem', fontSize: 12 }}>
              <strong style={{ color: '#d97706' }}>⚠️ Asset não encontrado</strong>
              <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>
                Pasta esperada: <code style={{ color: '#374151' }}>content/furniture-assets/{movel.assetId}/</code>
              </div>
            </div>
          )}

          {/* Caminho do asset */}
          <Secao titulo="Localização">
            <div style={{ fontSize: 12, color: '#6b7280', wordBreak: 'break-all' }}>
              📁 <code style={{ color: '#374151' }}>content/furniture-assets/{movel.assetId}/</code>
            </div>
          </Secao>
        </div>
      </div>
    </>
  );
}

type PropsSecaoPreviewInspecao = {
  readonly estadoAsset: { tipo: 'carregando' } | { tipo: 'disponivel'; metadata: FurnitureAssetMetadata } | { tipo: 'ausente' };
  readonly assetId: string;
  readonly rotacaoAtual: RotacaoMovel;
  readonly imagemComErro: boolean;
  readonly aoErroImagem: () => void;
  readonly aoAlterarRotacao: (rot: RotacaoMovel) => void;
};

function SecaoPreviewInspecao({ estadoAsset, assetId, rotacaoAtual, imagemComErro, aoErroImagem, aoAlterarRotacao }: PropsSecaoPreviewInspecao) {
  if (estadoAsset.tipo === 'carregando') {
    return (
      <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
        carregando asset…
      </div>
    );
  }

  if (estadoAsset.tipo === 'ausente' || imagemComErro) {
    return (
      <div style={{
        height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f9fafb', borderRadius: 6, border: '1px dashed #d1d5db',
        color: '#9ca3af', fontSize: 13,
      }}>
        Sem asset disponível
      </div>
    );
  }

  const { metadata } = estadoAsset;
  const footprint = metadata.footprintPorRotacao[String(rotacaoAtual)] ?? { largura: 1, altura: 1 };
  const larguraPx = footprint.largura * TAMANHO_TILE_INSPECAO;
  const alturaPx = footprint.altura * TAMANHO_TILE_INSPECAO;
  const todasRotacoes: RotacaoMovel[] = [0, 45, 90, 135, 180, 225, 270, 315];
  const rotacoesDisponiveis = todasRotacoes.filter((rot) => metadata.rotacoesDisponiveis.includes(rot));
  const podeGirar = rotacoesDisponiveis.length > 1;

  const irParaAnterior = () => {
    if (!podeGirar) return;
    const indiceAtual = rotacoesDisponiveis.indexOf(rotacaoAtual);
    const indiceSeguro = indiceAtual >= 0 ? indiceAtual : 0;
    const anterior = rotacoesDisponiveis[(indiceSeguro - 1 + rotacoesDisponiveis.length) % rotacoesDisponiveis.length];
    if (anterior !== undefined) aoAlterarRotacao(anterior);
  };

  const irParaProxima = () => {
    if (!podeGirar) return;
    const indiceAtual = rotacoesDisponiveis.indexOf(rotacaoAtual);
    const indiceSeguro = indiceAtual >= 0 ? indiceAtual : 0;
    const proxima = rotacoesDisponiveis[(indiceSeguro + 1) % rotacoesDisponiveis.length];
    if (proxima !== undefined) aoAlterarRotacao(proxima);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ maxWidth: '100%', overflow: 'auto', padding: '0.25rem' }}>
        <div style={{ position: 'relative', width: larguraPx, height: alturaPx }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: [
              `repeating-linear-gradient(rgba(100,100,100,0.2) 0 1px, transparent 1px 100%)`,
              `repeating-linear-gradient(90deg, rgba(100,100,100,0.2) 0 1px, transparent 1px 100%)`,
            ].join(', '),
            backgroundSize: `${TAMANHO_TILE_INSPECAO}px ${TAMANHO_TILE_INSPECAO}px`,
            border: '1px solid rgba(100,100,100,0.2)',
            borderRadius: 2,
            backgroundColor: '#f3f4f6',
          }} />
          <img
            src={urlImagemAsset(assetId, rotacaoAtual, metadata)}
            alt={`${assetId} rot${rotacaoAtual}`}
            onError={aoErroImagem}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'contain', imageRendering: 'pixelated',
            }}
          />
        </div>
      </div>

      {/* Controles de rotação */}
      {rotacoesDisponiveis.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <button
            onClick={irParaAnterior}
            disabled={!podeGirar}
            title="Rotação anterior"
            style={{
              width: 38, height: 32,
              border: '1px solid #d1d5db',
              borderRadius: 6,
              background: '#ffffff',
              color: '#374151',
              fontSize: 18,
              lineHeight: 1,
              cursor: podeGirar ? 'pointer' : 'default',
              opacity: podeGirar ? 1 : 0.35,
            }}
          >
            ↺
          </button>
          <span style={{ minWidth: 58, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#374151' }}>
            {rotacaoAtual}°
          </span>
          <button
            onClick={irParaProxima}
            disabled={!podeGirar}
            title="Próxima rotação"
            style={{
              width: 38, height: 32,
              border: '1px solid #d1d5db',
              borderRadius: 6,
              background: '#ffffff',
              color: '#374151',
              fontSize: 18,
              lineHeight: 1,
              cursor: podeGirar ? 'pointer' : 'default',
              opacity: podeGirar ? 1 : 0.35,
            }}
          >
            ↻
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {todasRotacoes.map((rot) => {
          const disponivel = metadata.rotacoesDisponiveis.includes(rot);
          const ativo = rot === rotacaoAtual;
          return (
            <button
              key={rot}
              disabled={!disponivel}
              onClick={() => disponivel && aoAlterarRotacao(rot)}
              style={{
                padding: '4px 10px', fontSize: 12,
                border: `1px solid ${ativo ? '#2563eb' : disponivel ? '#d1d5db' : '#f3f4f6'}`,
                borderRadius: 6,
                background: ativo ? '#eff6ff' : '#ffffff',
                color: ativo ? '#1d4ed8' : disponivel ? '#374151' : '#d1d5db',
                cursor: disponivel ? 'pointer' : 'not-allowed',
              }}
            >
              {rot}°
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 11, color: '#9ca3af' }}>
        footprint {footprint.largura}×{footprint.altura} tiles · {larguraPx}×{alturaPx}px
      </div>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
        {titulo}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {children}
      </div>
    </div>
  );
}

function CampoInfo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', fontSize: 12 }}>
      <span style={{ color: '#9ca3af', minWidth: 80, flexShrink: 0 }}>{rotulo}</span>
      <span style={{ color: '#111827', wordBreak: 'break-all' }}>{valor}</span>
    </div>
  );
}
