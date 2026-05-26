import { useState, useEffect, useMemo } from 'react';
import type { FurnitureDefinition } from '@lifesim/core';
import type { FurnitureAssetMetadata, RotacaoMovel } from '@core/schemas/furnitureAsset';
import { carregarFurnitureAssetMetadata, urlImagemAsset } from '../../shared/SchemaLoader';

type EstadoAsset =
  | { readonly tipo: 'carregando' }
  | { readonly tipo: 'disponivel'; readonly metadata: FurnitureAssetMetadata }
  | { readonly tipo: 'ausente' };

const ICONES_CATEGORIA: Record<FurnitureDefinition['categoria'], string> = {
  assento: '🪑',
  mesa: '🪞',
  cama: '🛏',
  tecnologia: '💻',
  eletrodomestico: '🍳',
  decoracao: '🎨',
  treino: '🏋',
  outro: '📦',
};

const TAMANHO_TILE_CARD = 32;

type SlotRotacao = {
  readonly num: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  readonly direcao: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
  readonly graus: RotacaoMovel;
};

const SLOTS_ORDENADOS: readonly SlotRotacao[] = [
  { num: 1, direcao: 'N', graus: 0 },
  { num: 2, direcao: 'NE', graus: 45 },
  { num: 3, direcao: 'E', graus: 90 },
  { num: 4, direcao: 'SE', graus: 135 },
  { num: 5, direcao: 'S', graus: 180 },
  { num: 6, direcao: 'SW', graus: 225 },
  { num: 7, direcao: 'W', graus: 270 },
  { num: 8, direcao: 'NW', graus: 315 },
] as const;

const SLOT_PADRAO = SLOTS_ORDENADOS[4]!;

function formatarEra(availability: FurnitureDefinition['availability']): string {
  return availability.endYear !== undefined
    ? `${availability.startYear}–${availability.endYear}`
    : `${availability.startYear}+`;
}

function estaRejeitado(movel: FurnitureDefinition): boolean {
  const endYear = movel.availability.endYear;
  return (endYear !== undefined && endYear < movel.availability.startYear) ||
    movel.acoes.length === 0;
}

type PropsCartaoDeMovel = {
  readonly movel: FurnitureDefinition;
  readonly aoClicar: () => void;
};

export function CartaoDeMovel({ movel, aoClicar }: PropsCartaoDeMovel) {
  const [estadoAsset, setEstadoAsset] = useState<EstadoAsset>({ tipo: 'carregando' });
  const [indiceSlot, setIndiceSlot] = useState(0);
  const [imagemComErro, setImagemComErro] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setEstadoAsset({ tipo: 'carregando' });
    setIndiceSlot(0);
    setImagemComErro(false);

    void carregarFurnitureAssetMetadata(movel.assetId).then((metadata) => {
      if (cancelado) return;
      if (metadata) {
        setEstadoAsset({ tipo: 'disponivel', metadata });
      } else {
        setEstadoAsset({ tipo: 'ausente' });
      }
    });

    return () => { cancelado = true; };
  }, [movel.assetId]);

  const assetMetadata = estadoAsset.tipo === 'disponivel' ? estadoAsset.metadata : undefined;

  const slotsDisponiveis = useMemo(() => {
    if (assetMetadata === undefined) return [];
    return SLOTS_ORDENADOS.filter((slot) =>
      assetMetadata.rotacoesDisponiveis.includes(slot.graus),
    );
  }, [assetMetadata]);

  const slotAtual = slotsDisponiveis[indiceSlot] ?? SLOT_PADRAO;

  const urlSpriteAtual = useMemo(() => {
    if (assetMetadata === undefined || slotAtual === undefined) return undefined;
    const nomeArquivo = assetMetadata.spritesPorRotacao?.[String(slotAtual.graus)];
    return nomeArquivo !== undefined
      ? `/content/furniture-assets/${assetMetadata.assetId}/${nomeArquivo}`
      : `/content/furniture-assets/${assetMetadata.assetId}/${slotAtual.num}.webp`;
  }, [assetMetadata, slotAtual]);

  const urlSpriteFallback = useMemo(() => {
    if (assetMetadata === undefined || slotAtual === undefined) return undefined;
    return urlImagemAsset(assetMetadata.assetId, slotAtual.graus, assetMetadata);
  }, [assetMetadata, slotAtual]);

  const irParaProximo = () => {
    if (slotsDisponiveis.length <= 1) return;
    setIndiceSlot((indiceAtual) => (indiceAtual + 1) % slotsDisponiveis.length);
    setImagemComErro(false);
  };

  const irParaAnterior = () => {
    if (slotsDisponiveis.length <= 1) return;
    setIndiceSlot((indiceAtual) => (indiceAtual - 1 + slotsDisponiveis.length) % slotsDisponiveis.length);
    setImagemComErro(false);
  };

  const rejeitado = estaRejeitado(movel);
  const semAsset = estadoAsset.tipo === 'ausente';

  const corBorda = rejeitado ? '#ef4444'
    : semAsset ? '#f59e0b'
    : '#e5e7eb';

  return (
    <div
      onClick={aoClicar}
      style={{
        background: '#ffffff',
        border: `2px solid ${corBorda}`,
        borderRadius: 8,
        padding: '0.75rem',
        fontSize: 12,
        color: '#111827',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={(evento) => { (evento.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; }}
      onMouseLeave={(evento) => { (evento.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ fontSize: 14 }}>{ICONES_CATEGORIA[movel.categoria]}</span>
        <strong style={{ flex: 1, wordBreak: 'break-word', color: rejeitado ? '#dc2626' : '#111827' }}>
          {movel.nome}
        </strong>
        {rejeitado && <span title="Critério de rejeição" style={{ color: '#dc2626', fontSize: 13 }}>🚫</span>}
        {!rejeitado && semAsset && <span title="Asset não encontrado" style={{ color: '#f59e0b', fontSize: 13 }}>⚠️</span>}
      </div>

      <PreviewAsset
        estadoAsset={estadoAsset}
        assetId={movel.assetId}
        slotAtual={slotAtual}
        urlSpriteAtual={urlSpriteAtual}
        urlSpriteFallback={urlSpriteFallback}
        imagemComErro={imagemComErro}
        iconeCategoria={ICONES_CATEGORIA[movel.categoria]}
        aoErroImagem={() => setImagemComErro(true)}
      />

      {estadoAsset.tipo === 'disponivel' && (
        <ControleRotacao
          slotsDisponiveis={slotsDisponiveis}
          slotAtual={slotAtual}
          indiceSlot={indiceSlot}
          irParaAnterior={irParaAnterior}
          irParaProximo={irParaProximo}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
        <span>{movel.categoria}</span>
        <span>{formatarEra(movel.availability)}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>💰 R${movel.preco}</span>
        <span style={{ color: '#6b7280' }}>↩ R${movel.valorDeRevenda}</span>
      </div>

      <div style={{ color: '#6b7280' }}>
        📐 {movel.tamanhoGrid.largura}×{movel.tamanhoGrid.altura} tiles
      </div>

      {movel.acoes.length === 0 && (
        <div style={{ color: '#dc2626', fontSize: 11 }}>⚠️ sem ações definidas</div>
      )}

      <div style={{ color: '#9ca3af', fontSize: 10, marginTop: '0.2rem', wordBreak: 'break-all' }}>
        {movel.assetId}
        {semAsset && <span style={{ color: '#f59e0b', marginLeft: '0.3rem' }}>— asset não encontrado</span>}
      </div>
    </div>
  );
}

type PropsPreviewAsset = {
  readonly estadoAsset: EstadoAsset;
  readonly assetId: string;
  readonly slotAtual: SlotRotacao;
  readonly urlSpriteAtual: string | undefined;
  readonly urlSpriteFallback: string | undefined;
  readonly imagemComErro: boolean;
  readonly iconeCategoria: string;
  readonly aoErroImagem: () => void;
};

function PreviewAsset({
  estadoAsset,
  assetId,
  slotAtual,
  urlSpriteAtual,
  urlSpriteFallback,
  imagemComErro,
  iconeCategoria,
  aoErroImagem,
}: PropsPreviewAsset) {
  const [usandoFallback, setUsandoFallback] = useState(false);

  useEffect(() => {
    setUsandoFallback(false);
  }, [urlSpriteAtual]);

  if (estadoAsset.tipo === 'carregando') {
    return (
      <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 11 }}>
        carregando...
      </div>
    );
  }

  if (estadoAsset.tipo === 'ausente' || imagemComErro) {
    return (
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb',
        borderRadius: 4,
        border: '1px dashed #d1d5db',
        flexDirection: 'column',
        gap: '0.25rem',
      }}>
        <span style={{ fontSize: 28 }}>{iconeCategoria}</span>
        <span style={{ fontSize: 10, color: '#f59e0b' }}>⚠️ Asset não encontrado</span>
        <span style={{ fontSize: 9, color: '#9ca3af' }}>{assetId}</span>
      </div>
    );
  }

  const { metadata } = estadoAsset;
  const footprint = metadata.footprintPorRotacao[String(slotAtual.graus)] ?? { largura: 1, altura: 1 };
  const larguraPx = footprint.largura * TAMANHO_TILE_CARD;
  const alturaPx = footprint.altura * TAMANHO_TILE_CARD;
  const urlImagem = usandoFallback ? urlSpriteFallback : urlSpriteAtual;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '0.25rem 0' }}>
      <div style={{
        position: 'relative',
        width: larguraPx,
        height: alturaPx,
        flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            `repeating-linear-gradient(rgba(100,100,100,0.25) 0 1px, transparent 1px 100%)`,
            `repeating-linear-gradient(90deg, rgba(100,100,100,0.25) 0 1px, transparent 1px 100%)`,
          ].join(', '),
          backgroundSize: `${TAMANHO_TILE_CARD}px ${TAMANHO_TILE_CARD}px`,
          border: '1px solid rgba(100,100,100,0.2)',
          borderRadius: 2,
          backgroundColor: '#f3f4f6',
        }} />
        <img
          src={urlImagem}
          alt={`${assetId} ${slotAtual.direcao}`}
          onError={() => {
            if (!usandoFallback && urlSpriteFallback !== undefined && urlSpriteFallback !== urlSpriteAtual) {
              setUsandoFallback(true);
              return;
            }
            aoErroImagem();
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            imageRendering: 'pixelated',
          }}
        />
      </div>
    </div>
  );
}

type PropsControleRotacao = {
  readonly slotsDisponiveis: readonly SlotRotacao[];
  readonly slotAtual: SlotRotacao;
  readonly indiceSlot: number;
  readonly irParaAnterior: () => void;
  readonly irParaProximo: () => void;
};

function ControleRotacao({
  slotsDisponiveis,
  slotAtual,
  indiceSlot,
  irParaAnterior,
  irParaProximo,
}: PropsControleRotacao) {
  if (slotsDisponiveis.length === 0) return undefined;
  const temMaisDeUmSlot = slotsDisponiveis.length > 1;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      marginTop: '6px',
      background: '#1f2937',
      borderRadius: 4,
      padding: '4px',
    }}>
      <button
        onClick={(evento) => {
          evento.stopPropagation();
          irParaAnterior();
        }}
        disabled={!temMaisDeUmSlot}
        title="Rotacao anterior"
        style={estiloBotaoSetaRotacao(temMaisDeUmSlot)}
      >
        ↺
      </button>

      <span style={{
        minWidth: '52px',
        textAlign: 'center',
        fontSize: '13px',
        fontWeight: 600,
        color: '#e2e8f0',
        letterSpacing: '0.5px',
      }}>
        {slotAtual.direcao}
        <span style={{ fontSize: '10px', color: '#a0aec0', marginLeft: '4px' }}>
          {indiceSlot + 1}/{slotsDisponiveis.length}
        </span>
      </span>

      <button
        onClick={(evento) => {
          evento.stopPropagation();
          irParaProximo();
        }}
        disabled={!temMaisDeUmSlot}
        title="Proxima rotacao"
        style={estiloBotaoSetaRotacao(temMaisDeUmSlot)}
      >
        ↻
      </button>
    </div>
  );
}

function estiloBotaoSetaRotacao(habilitado: boolean): React.CSSProperties {
  return {
    fontSize: '18px',
    background: 'none',
    border: '1px solid #4a5568',
    borderRadius: '4px',
    padding: '2px 8px',
    cursor: habilitado ? 'pointer' : 'default',
    opacity: habilitado ? 1 : 0.3,
    color: '#e2e8f0',
  };
}
