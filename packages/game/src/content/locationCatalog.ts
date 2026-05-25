import { ComodoDefinition } from '@core/schemas/location';
import type { ComodoDefinition as TipoComodoDefinition } from '@core/schemas/location';

const COMODOS_ENTRADA_POR_LOCAL: Readonly<Record<string, string>> = {
  casa: 'quarto_simples',
  academia: 'area_musculacao',
};

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
  return COMODOS_POR_ID[comodoId];
}

export function obterComodoEntrada(localId: string): string | undefined {
  return COMODOS_ENTRADA_POR_LOCAL[localId];
}
