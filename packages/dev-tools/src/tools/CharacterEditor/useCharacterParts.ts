import { useCallback, useEffect, useState } from 'react';
import { CharacterPartMetadata } from '@core/schemas/characterPart';
import { SLOTS_ORDENADOS, type ParteCarregada } from './types';

const RAIZ_PARTES = '/content/character-parts';

type EntradaIndice = { readonly tipo: string; readonly partId: string };

/** Busca o índice de partes via rota de dev-tools; vazio se indisponível. */
async function buscarIndice(): Promise<readonly EntradaIndice[]> {
  try {
    const res = await fetch('/__devtools/character/list');
    if (!res.ok) return [];
    const dados = (await res.json()) as { ok?: boolean; partes?: unknown };
    if (dados.ok !== true || !Array.isArray(dados.partes)) return [];
    return dados.partes.filter(
      (p): p is EntradaIndice =>
        typeof p === 'object' && p !== null
        && typeof (p as Record<string, unknown>).tipo === 'string'
        && typeof (p as Record<string, unknown>).partId === 'string',
    );
  } catch {
    return [];
  }
}

async function carregarParte(entrada: EntradaIndice): Promise<ParteCarregada | undefined> {
  const caminho = `${entrada.tipo}/${entrada.partId}`;
  try {
    const res = await fetch(`${RAIZ_PARTES}/${caminho}/metadata.json`);
    if (!res.ok) return undefined;
    const dados: unknown = await res.json();
    const resultado = CharacterPartMetadata.safeParse(dados);
    if (!resultado.success) return undefined;

    const meta = resultado.data;
    const spritesPorSlot: Partial<Record<number, string>> = {};
    for (const dir of meta.direcoes) {
      const slot = SLOTS_ORDENADOS.find((s) => s.direcao === dir)?.slot;
      if (slot !== undefined) {
        // Arquivos nomeados por direção (N.webp…NW.webp), não por slot numérico.
        spritesPorSlot[slot] = `${RAIZ_PARTES}/${caminho}/${dir}.webp`;
      }
    }

    return { metadata: meta, caminho, spritesPorSlot, anchorOverrides: {} };
  } catch {
    return undefined;
  }
}

export function useCharacterParts() {
  const [partes, setPartes] = useState<readonly ParteCarregada[]>([]);
  const [carregando, setCarregando] = useState(false);

  const carregarPartes = useCallback(async () => {
    setCarregando(true);
    try {
      const indice = await buscarIndice();
      const carregadas = await Promise.all(indice.map(carregarParte));
      const validas = carregadas.filter((p): p is ParteCarregada => p !== undefined);
      // Ordena: corpo_base primeiro, depois alfabético por caminho.
      const ordenadas = [...validas].sort((a, b) => {
        const corpoA = a.metadata.tipo === 'corpo_base' ? 0 : 1;
        const corpoB = b.metadata.tipo === 'corpo_base' ? 0 : 1;
        return corpoA - corpoB || a.caminho.localeCompare(b.caminho);
      });
      setPartes(ordenadas);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarPartes();
  }, [carregarPartes]);

  return { partes, carregando, recarregar: carregarPartes };
}
