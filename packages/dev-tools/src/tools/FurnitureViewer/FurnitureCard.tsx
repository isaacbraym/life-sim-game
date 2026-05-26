import type { FurnitureDefinition } from '@lifesim/core';
import type { ErroSchemaComIndice } from '../../shared/SchemaLoader';

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

function formatarEra(availability: FurnitureDefinition['availability']): string {
  return availability.endYear !== undefined
    ? `${availability.startYear}–${availability.endYear}`
    : `${availability.startYear}+`;
}

function estaRejeitado(movel: FurnitureDefinition): boolean {
  const endYear = movel.availability.endYear;
  const anoInvalido = endYear !== undefined && endYear < movel.availability.startYear;
  const semAcoes = movel.acoes.length === 0;
  return anoInvalido || semAcoes;
}

type PropsCartaoDeMovel = {
  readonly movel: FurnitureDefinition;
  readonly erroSchema?: ErroSchemaComIndice | undefined;
};

const estiloCard = (rejeitado: boolean, temErro: boolean): React.CSSProperties => ({
  background: '#1a202c',
  border: `2px solid ${rejeitado ? '#fc8181' : temErro ? '#f6ad55' : '#4a5568'}`,
  borderRadius: 6,
  padding: '0.75rem',
  fontSize: 12,
  color: '#e2e8f0',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
});

const estiloLinha: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '0.5rem',
};

const estiloTag: React.CSSProperties = {
  background: '#2d3748',
  borderRadius: 3,
  padding: '1px 5px',
  fontSize: 11,
  color: '#90cdf4',
};

export function CartaoDeMovel({ movel, erroSchema }: PropsCartaoDeMovel) {
  const rejeitado = estaRejeitado(movel);
  const icone = ICONES_CATEGORIA[movel.categoria];

  const efeitosAtivos = Object.entries(movel.efeitos ?? {}).filter(([, v]) => v !== undefined && v !== 0);

  return (
    <div style={estiloCard(rejeitado, erroSchema !== undefined)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ fontSize: 16 }}>{icone}</span>
        <strong style={{ color: rejeitado ? '#fc8181' : '#90cdf4', flex: 1, wordBreak: 'break-word' }}>
          {movel.nome}
        </strong>
        {erroSchema !== undefined && (
          <span title={erroSchema.erro.message} style={{ cursor: 'help', fontSize: 14 }}>⚠️</span>
        )}
      </div>

      <div style={estiloLinha}>
        <span style={{ color: '#a0aec0' }}>{movel.categoria}</span>
        <span>{formatarEra(movel.availability)}</span>
      </div>

      <div style={estiloLinha}>
        <span>💰 R${movel.preco}</span>
        <span>↩ R${movel.valorDeRevenda}</span>
      </div>

      <div style={{ color: '#a0aec0' }}>
        📐 {movel.tamanhoGrid.largura}×{movel.tamanhoGrid.altura} tiles
      </div>

      {movel.acoes.length > 0 ? (
        <div style={{ color: '#68d391', fontSize: 11 }}>
          ▶ {movel.acoes.join(', ')}
        </div>
      ) : (
        <div style={{ color: '#fc8181', fontSize: 11 }}>⚠️ sem ações</div>
      )}

      {efeitosAtivos.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
          {efeitosAtivos.map(([chave, valor]) => (
            <span key={chave} style={{ ...estiloTag, color: (valor as number) > 0 ? '#68d391' : '#fc8181' }}>
              {chave} {(valor as number) > 0 ? '+' : ''}{String(valor)}
            </span>
          ))}
        </div>
      )}

      {movel.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
          {movel.tags.map((tag) => (
            <span key={tag} style={estiloTag}>{tag}</span>
          ))}
        </div>
      )}

      {erroSchema !== undefined && (
        <div style={{ color: '#f6ad55', fontSize: 10, borderTop: '1px solid #4a5568', paddingTop: '0.3rem' }}>
          {erroSchema.erro.issues[0]?.message ?? 'Schema inválido'}
          {erroSchema.erro.issues[0]?.path.length
            ? ` (${erroSchema.erro.issues[0].path.join('.')})`
            : ''}
        </div>
      )}
    </div>
  );
}
