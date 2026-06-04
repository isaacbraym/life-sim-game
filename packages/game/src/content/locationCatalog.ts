import { ComodoDefinition } from '@core/schemas/location';
import type { ComodoDefinition as TipoComodoDefinition } from '@core/schemas/location';

export type LocalDisponivel = {
  readonly id: string;
  readonly nome: string;
  readonly icone: string;
  readonly comodoEntrada: string;
  readonly disponivel: boolean;
};

const COMODOS_ENTRADA_POR_LOCAL: Readonly<Record<string, string>> = {
  casa: 'quarto_simples_iso',
  escola: 'sala_de_aula_iso',
  academia: 'area_musculacao_iso',
};

const LOCAIS_DEMO: readonly Omit<LocalDisponivel, 'disponivel'>[] = [
  { id: 'casa', nome: 'Casa', icone: '\u{1F3E0}', comodoEntrada: 'quarto_simples_iso' },
  { id: 'escola', nome: 'Escola', icone: '\u{1F3EB}', comodoEntrada: 'sala_de_aula_iso' },
  { id: 'academia', nome: 'Academia', icone: '\u{1F4AA}', comodoEntrada: 'area_musculacao_iso' },
];

const MODULOS_COMODOS = import.meta.glob('../../../../content/locations/**/*.json', { eager: true });

function ehModuloComodo(valor: unknown): valor is { readonly default: unknown } {
  return typeof valor === 'object' && valor !== null && 'default' in valor;
}

function extrairComodo(valor: unknown): TipoComodoDefinition {
  return ComodoDefinition.parse(ehModuloComodo(valor) ? valor.default : valor);
}

const COMODOS_POR_ID = Object.values(MODULOS_COMODOS).reduce<Record<string, TipoComodoDefinition>>(
  (comodos, modulo) => {
    const comodo = extrairComodo(modulo);
    return {
      ...comodos,
      [comodo.id]: comodo,
    };
  },
  {},
);

export function obterComodo(comodoId: string): TipoComodoDefinition | undefined {
  if (comodoId.endsWith('_iso')) {
    return {
      id: comodoId,
      localId: comodoId.replace('_iso', ''),
      nome: comodoId,
      backgroundAsset: '',
      tamanho: { largura: 800, altura: 600 },
      navZonas: [],
      pontosDeSaida: [],
      objetos: [],
      npcsElegiveis: [],
      ambientTags: [],
    };
  }
  return COMODOS_POR_ID[comodoId];
}

export function obterComodoEntrada(localId: string): string | undefined {
  return COMODOS_ENTRADA_POR_LOCAL[localId];
}

export function localTemComodoEntrada(localId: string): boolean {
  const comodoEntrada = obterComodoEntrada(localId);
  return comodoEntrada !== undefined && obterComodo(comodoEntrada) !== undefined;
}

export function listarLocaisDisponiveis(): readonly LocalDisponivel[] {
  return LOCAIS_DEMO.map((local) => ({
    ...local,
    disponivel: localTemComodoEntrada(local.id),
  }));
}
