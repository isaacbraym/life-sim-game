# 14 — Pipeline de Personagem (Sprites + Rig Híbrido)

> Decisão fechada. O runtime renderiza personagens como camadas de sprites por direção.
> O rig (`CharacterRigDefinition`) é exclusivo do Dev Tools para autoria e validação.

---

## Visão geral

```
RUNTIME (jogo)                    DEV TOOLS (autoria)
──────────────────────────────    ──────────────────────────────
Sprites WebP por direção          Rig como esqueleto overlay
Composição por camadas            Validação de encaixe anatômico
Sem procedural                    Preview de animação
Leve, rápido, visual artesanal    Inteligente, editável, exportável
```

O **rig** é o "mapa anatômico" — declara onde fica cada joint, onde encaixa
cada parte. Os **sprites** são a "pele visual" — o que o jogador vê.
Animações são dados de offset/joint que movem as camadas de sprite,
validadas no Character Proofer antes de entrar em produção.

---

## Sistema de direções (8 ângulos)

```typescript
// packages/core/src/schemas/direction.ts

export const DirecaoVisual = z.enum([
  'N',   // costas (fundo do cômodo, afastado da câmera)
  'NE',  // diagonal costas-direita
  'E',   // lateral direita
  'SE',  // diagonal frente-direita  ← mais comum em cômodos ISO
  'S',   // frente (voltado para câmera)
  'SW',  // diagonal frente-esquerda
  'W',   // lateral esquerda
  'NW',  // diagonal costas-esquerda
]);
export type DirecaoVisual = z.infer<typeof DirecaoVisual>;

/** Converte DirecaoVisual para graus (compatibilidade com PlacedFurniture.rotacao) */
export const DIRECAO_PARA_GRAUS: Record<DirecaoVisual, number> = {
  N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315,
};

/** Calcula direção de movimento entre dois tiles */
export function calcularDirecao(
  de: { tx: number; ty: number },
  para: { tx: number; ty: number },
): DirecaoVisual {
  const dx = Math.sign(para.tx - de.tx);
  const dy = Math.sign(para.ty - de.ty);
  const mapa: Record<string, DirecaoVisual> = {
    '0,-1': 'N', '1,-1': 'NE', '1,0': 'E', '1,1': 'SE',
    '0,1': 'S', '-1,1': 'SW', '-1,0': 'W', '-1,-1': 'NW',
  };
  return mapa[`${dx},${dy}`] ?? 'S';
}
```

---

## Sistema de camadas de personagem

Ordem de renderização (z-index crescente = na frente):

```typescript
// packages/core/src/schemas/characterLayer.ts

export const CamadaPersonagem = z.enum([
  'sombra',          // 0 — elipse no chão
  'sapato',          // 1
  'calca',           // 2
  'corpo_base',      // 3 — silhueta base sem roupa
  'camisa',          // 4
  'acessorio_corpo', // 5 — mochila, colar
  'cabelo_atras',    // 6 — parte do cabelo que fica atrás da cabeça
  'cabeca',          // 7
  'rosto',           // 8 — expressão/olhos
  'cabelo_frente',   // 9 — franja, topete
  'chapeu',          // 10
  'acessorio_mao',   // 11 — objeto segurado
]);
export type CamadaPersonagem = z.infer<typeof CamadaPersonagem>;
```

> Nota: `cabelo_atras` e `cabelo_frente` são camadas separadas para que
> o cabelo fique corretamente atrás/na frente da cabeça conforme a direção.
> Um asset de cabelo pode exportar sprites para ambas as camadas.

---

## Schema de parte de personagem

```typescript
// packages/core/src/schemas/characterPart.ts

export const CharacterPartMetadata = z.object({
  partId:    z.string(),        // ex: "cabelo_curto_01"
  tipo:      CamadaPersonagem,  // qual camada ocupa
  direcoes:  z.array(DirecaoVisual).min(1),  // direções disponíveis

  /** Canvas fixo — MESMO tamanho em todas as direções */
  canvasLargura: z.number().int().positive(),
  canvasAltura:  z.number().int().positive(),

  /** Pixel do anchor — ponto de referência de alinhamento com o corpo base */
  anchorPixelX: z.number().int(),
  anchorPixelY: z.number().int(),

  /**
   * Offsets finos por direção (em pixels).
   * Permite micro-ajuste sem reeditar o sprite.
   * Ausente = { x: 0, y: 0 }
   */
  offsetsPorDirecao: z.record(
    z.string(),  // chave: DirecaoVisual ("N", "NE", etc.)
    z.object({ x: z.number().int(), y: z.number().int() })
  ).optional(),

  /**
   * Joints do rig relevantes para encaixe.
   * O Dev Tools usa para sobrepor o rig e validar alinhamento.
   * Exemplos: "joint_cabeca_topo", "joint_ombro_dir"
   */
  jointsDeEncaixe: z.array(z.string()).optional(),

  /** Qual camada de renderização este asset ocupa */
  camada: CamadaPersonagem,

  era:      z.string().optional(),
  tags:     z.array(z.string()),
  variacao: z.string().optional(),  // ex: "gasto", "inverno", "festa"
});
export type CharacterPartMetadata = z.infer<typeof CharacterPartMetadata>;
```

### Exemplo: `cabelo_curto_01/metadata.json`

```json
{
  "partId": "cabelo_curto_01",
  "tipo": "cabelo_frente",
  "direcoes": ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
  "canvasLargura": 64,
  "canvasAltura": 80,
  "anchorPixelX": 32,
  "anchorPixelY": 60,
  "offsetsPorDirecao": {
    "N":  { "x": 0, "y": -2 },
    "NE": { "x": 1, "y": -1 }
  },
  "jointsDeEncaixe": ["joint_cabeca_topo"],
  "camada": "cabelo_frente",
  "era": "nineties",
  "tags": ["curto", "casual"]
}
```

---

## Estrutura de arquivos de personagem

```
content/
  character-rigs/
    base_adulto/
      rig.json               ← CharacterRigDefinition (rig dev-tools)
    base_adolescente/
      rig.json
  character-parts/
    corpo_base/
      adulto_neutro/
        metadata.json
        N.webp  NE.webp  E.webp  SE.webp
        S.webp  SW.webp  W.webp  NW.webp
    cabelo/
      cabelo_curto_01/
        metadata.json
        N.webp  NE.webp  E.webp  SE.webp
        S.webp  SW.webp  W.webp  NW.webp
    camisa/
      camiseta_basica_branca/
        metadata.json
        N.webp  ...  NW.webp
    calca/
    sapato/
    acessorio_corpo/
    chapeu/
    rosto/
      expressao_neutro/
        metadata.json
        (direções relevantes apenas: S, SE, SW para rosto visível)
```

---

## CharacterRigDefinition (dev-tools only)

O rig existente de 15 joints é preservado como `CharacterRigDefinition`.
Ele **nunca** é carregado em runtime de jogo.
É carregado exclusivamente pelo Character Proofer no Dev Tools.

```typescript
// packages/core/src/schemas/characterRig.ts (renomear/evoluir o schema atual)

export const JointIso = z.object({
  id:           z.string(),          // ex: "joint_cabeca_topo"
  nome:         z.string(),          // ex: "Topo da cabeça"
  camadaRef:    CamadaPersonagem,    // qual camada este joint ancora
  /**
   * Posição do joint em coordenadas de canvas do corpo_base,
   * por direção. Permite que o Dev Tools sobreponha o joint
   * na posição certa para cada ângulo de visão.
   */
  posicaoPorDirecao: z.record(
    z.string(),
    z.object({ x: z.number().int(), y: z.number().int() })
  ),
});

export const CharacterRigDefinition = z.object({
  rigId:    z.string(),   // ex: "base_adulto"
  joints:   z.array(JointIso),
  corpoBasePartId: z.string(),  // qual corpo_base este rig descreve
});
export type CharacterRigDefinition = z.infer<typeof CharacterRigDefinition>;
```

---

## Sistema de animação

Animações são dados — não código de runtime. Elas descrevem offsets de camada
e valores de joint ao longo do tempo. O Character Proofer do Dev Tools valida
visualmente antes de qualquer animação entrar em produção.

```typescript
// packages/core/src/schemas/characterAnimation.ts

export const KeyframeAnimacao = z.object({
  tempoMs:  z.number().int(),       // ms desde o início
  camada:   CamadaPersonagem,
  offsetX:  z.number().int().default(0),
  offsetY:  z.number().int().default(0),
  opacidade: z.number().min(0).max(1).default(1),
  /** Escala uniforme — para efeitos de "respiração" ou "sentar" */
  escala:   z.number().positive().default(1),
});

export const AnimacaoPersonagem = z.object({
  animacaoId:  z.string(),   // ex: "sentar_sofa", "andar_N", "dormir"
  direcao:     DirecaoVisual,
  duracaoMs:   z.number().int(),
  loop:        z.boolean().default(false),
  keyframes:   z.array(KeyframeAnimacao),
  acaoVinculada: z.string().optional(), // ID da ActionDefinition que dispara
});
export type AnimacaoPersonagem = z.infer<typeof AnimacaoPersonagem>;
```

---

## Character Proofer — Dev Tools (substituir stub)

O stub atual de CharacterEditor deve evoluir para o **Character Proofer**
com as seguintes capacidades:

### Painel de composição
- Selecionar `corpo_base` (adulto, adolescente)
- Adicionar partes: cabelo, camisa, calça, sapato, acessório
- Preview ao vivo com composição das camadas na ordem correta
- Controle de direção: botões N/NE/E/SE/S/SW/W/NW

### Overlay de rig
- Toggle para exibir joints do `CharacterRigDefinition` sobre os sprites
- Cada joint como ponto colorido com label
- Permite verificar se cabelo encaixa em `joint_cabeca_topo`,
  se mochila encaixa em `joint_ombro_dir`, etc.

### Preview de animação
- Selecionar `AnimacaoPersonagem` para executar
- Play/pause/scrubbing no timeline
- Ver offset de cada camada frame a frame

### Exportação
- Botão "Salvar parte" → cria/atualiza `content/character-parts/{tipo}/{id}/`
  via File System Access API (ver `15-asset-authoring.md`)

---

## Canvas padrão de personagem

O `corpo_base` adulto em direção `S` (referência de escala):

```
canvasLargura: 64px
canvasAltura:  96px
anchorPixelX:  32   (centro horizontal)
anchorPixelY:  90   (base dos pés)
Altura visual do personagem: ~72px (75% do canvas)
```

Todas as partes de personagem usam o mesmo canvas de 64×96px,
com o mesmo anchor de 32×90px. Isso garante que qualquer parte
se alinhe ao corpo base sem offset manual, exceto micro-ajustes
declarados em `offsetsPorDirecao`.

---

## Tamanho de personagem em relação ao tile

```
Tile na tela: 64px × 32px
Personagem:   64px × 96px de canvas, ~72px de altura visual

→ Personagem ocupa ~2.25 alturas de tile verticalmente
→ Footprint: 1×1 tile
→ Anchor alinha ao vértice frontal do tile ocupado
```

Essa proporção é próxima do Habbo Hotel e garante boa legibilidade
em cômodos de 10×10 tiles ou mais.
