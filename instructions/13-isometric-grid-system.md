# 13 — Sistema de Grid Isométrico (Habbo-style)

> Decisão fechada. Substituiu a perspectiva oblíqua ~15° a partir do Sprint 1.0.
> Todos os novos cômodos usam este sistema. Os cômodos legados (`navZonas`) permanecem válidos até migração gradual pelo Gemini.

---

## Projeção

O jogo usa **projeção dimétrica** (~26.57°), a mesma do Habbo Hotel.
NÃO é isométrico verdadeiro (45°) e NÃO é oblíquo ~15°.

Característica central: razão de pixel **2:1** — para cada 1 pixel de altura
de tile na tela, há 2 pixels de largura.

```
Tile em coordenadas de tela:

    ___________
   /           \      largura de tela = TILE_W = 64px
  /    tile     \     altura de tela  = TILE_H = 32px
  \             /
   \___________/
```

### Transformação tile → tela

```typescript
// packages/core/src/iso/IsoMath.ts

export const TILE_W = 64;  // px de largura de tile na tela
export const TILE_H = 32;  // px de altura de tile na tela

/** Converte coordenadas de tile (tx, ty) para coordenadas de tela (sx, sy) */
export function tileParaTela(tx: number, ty: number): { x: number; y: number } {
  return {
    x: (tx - ty) * (TILE_W / 2),
    y: (tx + ty) * (TILE_H / 2),
  };
}

/** Converte coordenadas de tela para tile (arredondado) */
export function telaParaTile(sx: number, sy: number): { tx: number; ty: number } {
  return {
    tx: Math.round(sy / TILE_H + sx / TILE_W),
    ty: Math.round(sy / TILE_H - sx / TILE_W),
  };
}
```

### Z-depth (ordem de renderização)

```typescript
/** Depth isométrico: objetos com maior tx+ty ficam na frente */
export function calcularDepth(tx: number, ty: number, tz: number = 0): number {
  return tx + ty + tz * 0.01;  // tz para desempate vertical (ex: personagem em cima de tapete)
}
```

---

## Schema de cômodo isométrico

Novo schema paralelo ao `ComodoDefinition` (legado).
Não substitui — coexiste até migração completa.

```typescript
// packages/core/src/schemas/isoRoom.ts

export const TileEstado = z.enum(['caminhavel', 'bloqueado', 'vazio']);

export const TileDefinicao = z.object({
  estado:    TileEstado,
  elevacao:  z.number().int().min(0).default(0),  // para degraus/rampas futuras
  assetId:   z.string().optional(),               // sprite do chão/piso
});

export const ObjetoIsoDefinicao = z.object({
  id:          z.string(),
  furnitureId: z.string(),
  tileX:       z.number().int(),
  tileY:       z.number().int(),
  direcao:     DirecaoVisual,                      // ver 14-character-pipeline.md
  bloqueaTiles: z.array(z.object({                 // tiles bloqueados pelo móvel
    dx: z.number().int(),                          // offset relativo ao tileX
    dy: z.number().int(),
  })),
});

export const SaidaIso = z.object({
  id:      z.string(),
  tileX:   z.number().int(),
  tileY:   z.number().int(),
  destino: z.object({
    tipo:     z.enum(['comodo', 'mapa']),
    comodoId: z.string().optional(),
  }),
});

export const IsoRoomDefinition = z.object({
  id:         z.string(),      // ex: "quarto_simples_iso"
  nome:       z.string(),
  larguraTiles: z.number().int().positive(),
  alturaTiles:  z.number().int().positive(),
  /** Grid plano: tiles[y][x]. Linha 0 = topo do cômodo. */
  tiles:      z.array(z.array(TileDefinicao)),
  objetos:    z.array(ObjetoIsoDefinicao),
  saidas:     z.array(SaidaIso),
  npcsElegiveis: z.array(z.string()),
  eraStyle:   z.string(),
});

export type IsoRoomDefinition = z.infer<typeof IsoRoomDefinition>;
export type TileDefinicao     = z.infer<typeof TileDefinicao>;
export type ObjetoIsoDefinicao = z.infer<typeof ObjetoIsoDefinicao>;
```

### Cômodos de referência obrigatórios

Criar em `content/locations-iso/`:
- `quarto_simples_iso.json` — 10×10 tiles, cama + escrivaninha + porta
- `sala_simples_iso.json`   — 12×10 tiles, sofá + TV + mesa + porta

Esses dois cômodos são os "tiles de referência" para calibrar escala visual
de personagem, móveis e câmera antes de migrar os demais.

---

## BFS — Pathfinding próprio (sem biblioteca)

Implementado em `packages/core/src/iso/Pathfinder.ts`.
Zero dependências externas. Substitui o conceito de "tween direto para posicaoDeInteracao".

```typescript
// packages/core/src/iso/Pathfinder.ts

type Tile = { tx: number; ty: number };

/** Grid de tiles caminháveis. true = pode andar. */
export type GridCaminhavel = boolean[][];

const VIZINHOS_8 = [
  { dx: 0,  dy: -1 }, // N
  { dx: 1,  dy: -1 }, // NE
  { dx: 1,  dy:  0 }, // E
  { dx: 1,  dy:  1 }, // SE
  { dx: 0,  dy:  1 }, // S
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
  const linhas   = grid.length;
  const colunas  = grid[0]?.length ?? 0;

  const dentroDoGrid = (t: Tile) =>
    t.ty >= 0 && t.ty < linhas && t.tx >= 0 && t.tx < colunas;

  if (!dentroDoGrid(origem) || !dentroDoGrid(destino)) return [];
  if (!grid[destino.ty]?.[destino.tx]) return [];

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
```

### Grid dinâmico (runtime)

O grid é construído a cada mudança de estado do cômodo:

```typescript
// packages/core/src/iso/GridBuilder.ts

export function construirGrid(
  comodo: IsoRoomDefinition,
  npcsPresentes: readonly { tileX: number; tileY: number }[],
): GridCaminhavel {
  // Inicializar com tiles do schema
  const grid: boolean[][] = comodo.tiles.map(linha =>
    linha.map(tile => tile.estado === 'caminhavel')
  );

  // Bloquear tiles ocupados por móveis
  for (const objeto of comodo.objetos) {
    for (const offset of objeto.bloqueaTiles) {
      const ty = objeto.tileY + offset.dy;
      const tx = objeto.tileX + offset.dx;
      if (grid[ty]?.[tx] !== undefined) {
        grid[ty]![tx] = false;
      }
    }
  }

  // Bloquear tiles de NPCs
  for (const npc of npcsPresentes) {
    if (grid[npc.tileY]?.[npc.tileX] !== undefined) {
      grid[npc.tileY]![npc.tileX] = false;
    }
  }

  return grid;
}
```

---

## Movimento de personagem

O movimento via BFS substitui o "tween GSAP direto".
GSAP ainda é usado — mas para animar o personagem tile a tile ao longo do caminho.

```
Clique do jogador no tile (tx, ty)
  → construirGrid(comodoAtual, npcsPresentes)
  → calcularCaminho(grid, posicaoAtual, destino)
  → se caminho vazio: feedback visual "não é possível"
  → se caminho válido:
       para cada tile no caminho:
         → calcular DirecaoVisual entre tile atual e próximo
         → trocar sprite do personagem para essa direção
         → GSAP tween: mover container do personagem para tileParaTela(tx, ty)
         → duração: TILE_MOVE_MS (ex: 180ms por tile)
```

Constante: `TILE_MOVE_MS = 180` (ajustar após testes visuais).

---

## Canvas de tile recomendado por footprint

Todos os sprites usam canvas **fixo** por footprint. O anchor é em **pixel absoluto**
(não float 0–1), idêntico em **todas as direções** para o mesmo footprint.

| Footprint (tiles) | Canvas WebP (px) | anchorPixelX | anchorPixelY |
|---|---|---|---|
| 1×1 | 96×80   | 48 | 72 |
| 2×1 | 160×96  | 80 | 80 |
| 3×1 | 224×96  | 112 | 80 |
| 1×2 | 96×128  | 48 | 108 |
| 2×2 | 160×128 | 80 | 112 |

O ponto `(anchorPixelX, anchorPixelY)` é o **ponto de chão central** do footprint —
o pixel que se alinha ao vértice frontal do tile na tela.

Quando a direção muda e o footprint troca (ex: sofá 3×1 → 1×3),
o canvas muda de tamanho e o anchor muda de valor.
O `footprintPorDirecao` no metadata declara isso explicitamente.

---

## Referências de cômodos legado

Os cômodos em `content/locations/` com schema `ComodoDefinition` (navZonas)
permanecem válidos e não devem ser alterados.
A migração para `IsoRoomDefinition` acontece gradualmente, coordenada pelo Gemini,
sprint a sprint, após os 2 cômodos de referência estarem validados visualmente.
