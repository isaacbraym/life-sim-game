import type { ActionDefinition } from '@core/schemas/action';
import { ActionDefinition as ActionDefinitionSchema } from '@core/schemas/action';

const TIMEOUT_MS = 5000;
const CAMINHO_CATALOGO = '/content/actions/iso_acoes_base.json';

// Cache em memória — carregado uma única vez por sessão.
const CACHE_ACOES: Map<string, ActionDefinition> = new Map();
let catalogoCarregado = false;

/**
 * Carrega `content/actions/iso_acoes_base.json` e popula o cache.
 * Idempotente: chamadas repetidas após o primeiro carregamento retornam
 * imediatamente. Itens com schema inválido são ignorados com `console.warn`.
 */
export async function carregarCatalogoAcoes(): Promise<void> {
  if (catalogoCarregado) return;

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(CAMINHO_CATALOGO, { signal: controlador.signal });
    clearTimeout(temporizador);

    if (!res.ok) {
      console.warn(`[actionCatalog] Falha HTTP ${res.status} ao carregar catálogo de ações.`);
      return;
    }

    const dados: unknown = await res.json();
    if (!Array.isArray(dados)) {
      console.warn('[actionCatalog] Catálogo de ações não é um array.');
      return;
    }

    for (const item of dados) {
      const resultado = ActionDefinitionSchema.safeParse(item);
      if (!resultado.success) {
        console.warn('[actionCatalog] ActionDefinition inválida ignorada:', resultado.error);
        continue;
      }
      CACHE_ACOES.set(resultado.data.id, resultado.data);
    }

    catalogoCarregado = true;
  } catch (erro) {
    clearTimeout(temporizador);
    if (erro instanceof DOMException && erro.name === 'AbortError') {
      console.warn(`[actionCatalog] Timeout ao carregar catálogo (>${TIMEOUT_MS}ms).`);
    } else {
      console.warn('[actionCatalog] Erro ao carregar catálogo de ações:', erro);
    }
  }
}

/** Retorna a `ActionDefinition` por id, ou `undefined` se não encontrada. */
export function obterAcao(acaoId: string): ActionDefinition | undefined {
  return CACHE_ACOES.get(acaoId);
}

/**
 * Retorna uma `ActionDefinition` mínima para ações sem definição formal
 * (ex.: `examinar`, `usar`). Resolução direta, sem efeitos, log genérico.
 */
export function acaoFallback(acaoId: string): ActionDefinition {
  return {
    id: acaoId,
    rotulo: acaoId,
    resolutionMode: 'direct',
    narrativeWeight: 'routine',
    onSuccess: [],
    logAcao: 'Você interagiu com o objeto.',
  };
}
