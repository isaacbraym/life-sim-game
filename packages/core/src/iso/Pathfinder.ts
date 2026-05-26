type Tile = { tx: number; ty: number };

/** Grid de tiles caminháveis. true = pode andar. */
export type GridCaminhavel = boolean[][];

const VIZINHOS_8 = [
  { dx:  0, dy: -1 }, // N
  { dx:  1, dy: -1 }, // NE
  { dx:  1, dy:  0 }, // E
  { dx:  1, dy:  1 }, // SE
  { dx:  0, dy:  1 }, // S
  { dx: -1, dy:  1 }, // SW
  { dx: -1, dy:  0 }, // W
  { dx: -1, dy: -1 }, // NW
] as const;

/**
 * Retorna caminho de tiles de `origem` até `destino` via BFS.
 * Retorna array vazio se não há caminho.
 * Complexidade: O(largura × altura) — adequado para cômodos até 30×30.
 */
export function calcularCaminho(
  grid: GridCaminhavel,
  origem: Tile,
  destino: Tile,
): readonly Tile[] {
  const linhas  = grid.length;
  const colunas = grid[0]?.length ?? 0;

  const dentroDoGrid = (t: Tile) =>
    t.ty >= 0 && t.ty < linhas && t.tx >= 0 && t.tx < colunas;

  if (!dentroDoGrid(origem) || !dentroDoGrid(destino)) return [];
  if (!grid[destino.ty]?.[destino.tx]) return [];

  if (origem.tx === destino.tx && origem.ty === destino.ty) {
    return [origem];
  }

  const visitado = new Set<string>();
  const anterior = new Map<string, Tile | undefined>();
  const fila: Tile[] = [origem];
  const chave = (t: Tile) => `${t.tx},${t.ty}`;

  visitado.add(chave(origem));
  anterior.set(chave(origem), undefined);

  while (fila.length > 0) {
    const atual = fila.shift()!;
    if (atual.tx === destino.tx && atual.ty === destino.ty) {
      return reconstruirCaminho(anterior, destino);
    }
    for (const { dx, dy } of VIZINHOS_8) {
      const vizinho: Tile = { tx: atual.tx + dx, ty: atual.ty + dy };
      const chaveVizinho = chave(vizinho);
      if (
        dentroDoGrid(vizinho) &&
        !visitado.has(chaveVizinho) &&
        grid[vizinho.ty]?.[vizinho.tx]
      ) {
        visitado.add(chaveVizinho);
        anterior.set(chaveVizinho, atual);
        fila.push(vizinho);
      }
    }
  }
  return [];
}

function reconstruirCaminho(
  anterior: Map<string, Tile | undefined>,
  destino: Tile,
): readonly Tile[] {
  const caminho: Tile[] = [];
  let atual: Tile | undefined = destino;
  while (atual !== undefined) {
    caminho.unshift(atual);
    atual = anterior.get(`${atual.tx},${atual.ty}`);
  }
  return caminho;
}
