import { IsoRoomDefinition } from '@core/schemas/isoRoom';

const CATALOG_ISO: Record<string, IsoRoomDefinition> = {};

export async function carregarComodoIso(
  id: string,
): Promise<IsoRoomDefinition | undefined> {
  if (CATALOG_ISO[id] !== undefined) return CATALOG_ISO[id];

  try {
    const res = await fetch(`/content/locations-iso/${id}.json`);
    if (!res.ok) return undefined;
    const dados: unknown = await res.json();
    const resultado = IsoRoomDefinition.safeParse(dados);
    if (!resultado.success) {
      console.error(`[isoRoomCatalog] Schema inválido: ${id}`, resultado.error);
      return undefined;
    }
    CATALOG_ISO[id] = resultado.data;
    return resultado.data;
  } catch {
    return undefined;
  }
}
