import { useState, useEffect } from 'react';
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
  const [rotacaoAtual, setRotacaoAtual] = useState<RotacaoMovel>(0);
  const [imagemComErro, setImagemComErro] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setEstadoAsset({ tipo: 'carregando' });
    setImagemComErro(false);

    void carregarFurnitureAssetMetadata(movel.assetId).then((metadata) => {
      if (cancelado) return;
      if (metadata) {
        const primeiraRotacao = metadata.rotacoesDisponiveis[0] ?? 0;
        setRotacaoAtual(primeiraRotacao);
        setEstadoAsset({ tipo: 'disponivel', metadata });
      } else {
        setEstadoAsset({ tipo: 'ausente' });
      }
    });

    return () => { cancelado = true; };
  }, [movel.assetId]);

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
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
    >
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ fontSize: 14 }}>{ICONES_CATEGORIA[movel.categoria]}</span>
        <strong style={{ flex: 1, wordBreak: 'break-word', color: rejeitado ? '#dc2626' : '#111827' }}>
          {movel.nome}
        </strong>
        {rejeitado && <span title="Critério de rejeição" style={{ color: '#dc2626', fontSize: 13 }}>🚫</span>}
        {!rejeitado && semAsset && <span title="Asset não encontrado" style={{ color: '#f59e0b', fontSize: 13 }}>⚠️</span>}
      </div>

      {/* Preview do asset */}
      <PreviewAsset
        estadoAsset={estadoAsset}
        assetId={movel.assetId}
        rotacaoAtual={rotacaoAtual}
        imagemComErro={imagemComErro}
        iconeCategoria={ICONES_CATEGORIA[movel.categoria]}
        aoErroImagem={() => setImagemComErro(true)}
      />

      {/* Controles de rotação */}
      {estadoAsset.tipo === 'disponivel' && (
        <ControleRotacao
          rotacoesDisponiveis={estadoAsset.metadata.rotacoesDisponiveis}
          rotacaoAtual={rotacaoAtual}
          aoAlterarRotacao={(rot) => {
            setRotacaoAtual(rot);
            setImagemComErro(false);
          }}
        />
      )}

      {/* Metadados resumidos */}
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

      {/* assetId */}
      <div style={{ color: '#9ca3af', fontSize: 10, marginTop: '0.2rem', wordBreak: 'break-all' }}>
        {movel.assetId}
        {semAsset && <span style={{ color: '#f59e0b', marginLeft: '0.3rem' }}>— asset não encontrado</span>}
      </div>
    </div>
  );
}

// --- Subcomponentes internos ---

type PropsPreviewAsset = {
  readonly estadoAsset: EstadoAsset;
  readonly assetId: string;
  readonly rotacaoAtual: RotacaoMovel;
  readonly imagemComErro: boolean;
  readonly iconeCategoria: string;
  readonly aoErroImagem: () => void;
};

function PreviewAsset({ estadoAsset, assetId, rotacaoAtual, imagemComErro, iconeCategoria, aoErroImagem }: PropsPreviewAsset) {
  if (estadoAsset.tipo === 'carregando') {
    return (
      <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 11 }}>
        carregando…
      </div>
    );
  }

  if (estadoAsset.tipo === 'ausente' || imagemComErro) {
    return (
      <div style={{
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f9fafb', borderRadius: 4, border: '1px dashed #d1d5db',
        flexDirection: 'column', gap: '0.25rem',
      }}>
        <span style={{ fontSize: 28 }}>{iconeCategoria}</span>
        <span style={{ fontSize: 10, color: '#f59e0b' }}>⚠️ Asset não encontrado</span>
        <span style={{ fontSize: 9, color: '#9ca3af' }}>{assetId}</span>
      </div>
    );
  }

  const { metadata } = estadoAsset;
  const footprint = metadata.footprintPorRotacao[String(rotacaoAtual)] ?? { largura: 1, altura: 1 };
  const larguraPx = footprint.largura * TAMANHO_TILE_CARD;
  const alturaPx = footprint.altura * TAMANHO_TILE_CARD;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '0.25rem 0' }}>
      <div style={{
        position: 'relative',
        width: larguraPx,
        height: alturaPx,
        flexShrink: 0,
      }}>
        {/* Grade de footprint */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: [
            `repeating-linear-gradient(rgba(100,100,100,0.25) 0 1px, transparent 1px 100%)`,
            `repeating-linear-gradient(90deg, rgba(100,100,100,0.25) 0 1px, transparent 1px 100%)`,
          ].join(', '),
          backgroundSize: `${TAMANHO_TILE_CARD}px ${TAMANHO_TILE_CARD}px`,
          border: '1px solid rgba(100,100,100,0.2)',
          borderRadius: 2,
          backgroundColor: '#f3f4f6',
        }} />
        {/* Sprite */}
        <img
          src={urlImagemAsset(assetId, rotacaoAtual, metadata)}
          alt={`${assetId} rot${rotacaoAtual}`}
          onError={aoErroImagem}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'contain',
            imageRendering: 'pixelated',
          }}
        />
      </div>
    </div>
  );
}

type PropsControleRotacao = {
  readonly rotacoesDisponiveis: ReadonlyArray<RotacaoMovel>;
  readonly rotacaoAtual: RotacaoMovel;
  readonly aoAlterarRotacao: (rotacao: RotacaoMovel) => void;
};

function ControleRotacao({ rotacoesDisponiveis, rotacaoAtual, aoAlterarRotacao }: PropsControleRotacao) {
  const todasRotacoes: RotacaoMovel[] = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
      {todasRotacoes.map((rot) => {
        const disponivel = rotacoesDisponiveis.includes(rot);
        const ativo = rot === rotacaoAtual;
        return (
          <button
            key={rot}
            disabled={!disponivel}
            onClick={(e) => { e.stopPropagation(); if (disponivel) aoAlterarRotacao(rot); }}
            style={{
              padding: '2px 6px',
              fontSize: 10,
              border: `1px solid ${ativo ? '#2563eb' : disponivel ? '#d1d5db' : '#f3f4f6'}`,
              borderRadius: 4,
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
  );
}
