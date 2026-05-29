import { IsoRoomDefinition } from '@core/schemas/isoRoom';

const CACHE_ISO: Record<string, IsoRoomDefinition> = {};
const TIMEOUT_MS = 5000;

export async function carregarComodoIso(
  id: string,
): Promise<IsoRoomDefinition | undefined> {
  if (CACHE_ISO[id] !== undefined) return CACHE_ISO[id];

  const controlador  = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(
      `/content/locations-iso/${id}.json`,
      { signal: controlador.signal },
    );
    clearTimeout(temporizador);

    if (!res.ok) return undefined;

    const dados: unknown = await res.json();
    const resultado = IsoRoomDefinition.safeParse(dados);
    if (!resultado.success) {
      console.error(`[isoRoomCatalog] Schema inválido: ${id}`, resultado.error);
      return undefined;
    }

    CACHE_ISO[id] = resultado.data;
    return resultado.data;
  } catch (erro) {
    clearTimeout(temporizador);
    if (erro instanceof DOMException && erro.name === 'AbortError') {
      console.warn(`[isoRoomCatalog] Timeout ao carregar "${id}" (>${TIMEOUT_MS}ms)`);
    }
    return undefined;
  }
}
