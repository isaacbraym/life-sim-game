# Prompts GPT-4o — Geração de Sprites Isométricos
# Vida 2.5D — Guardar em instructions/ ou docs/

---

## PROMPT MESTRE — Móvel (foto de objeto → 8 sprites WebP)

Cole este prompt no ChatGPT com a foto do objeto anexada:

---

You are a professional isometric pixel-art sprite creator for a life simulation
game inspired by Habbo Hotel, but with a slightly more naturalistic and muted
visual style.

I'm attaching a reference photo of: [DESCREVA O OBJETO em inglês, ex:
"a compact CRT television set, circa 1999-2003, black plastic body, 50cm wide,
with a slightly curved screen and simple control buttons on the front"]

Create a complete set of 8 isometric sprites of this object, one per direction,
using dimetric projection (the same as Habbo Hotel: ~26.57° angle, 2:1 horizontal
to vertical pixel ratio for the grid).

TECHNICAL REQUIREMENTS:
- Canvas size: [SUBSTITUIR pela dimensão correta do footprint, ex: "160×96 pixels
  for a 2×1 tile footprint"]
- ALL 8 sprites must use the EXACT SAME canvas size
- Background: fully transparent (PNG with alpha channel)
- Anchor point: the bottom-center of the object's tile footprint must be at pixel
  ([anchorX], [anchorY]) in every sprite — example: (80, 80) for a 160×96 canvas
- The object should occupy approximately 70-80% of the canvas height in the S view

STYLE REQUIREMENTS:
- Isometric dimetric projection: NOT true isometric, NOT top-down, NOT side view
- The tile below the object would follow a 2:1 width:height ratio (64px wide, 32px tall)
- Lighting: consistent top-left light source across ALL 8 sprites
  - Top face: brightest (~130% base value)
  - Front face (facing camera): medium (~100% base value)
  - Left face: darker (~75% base value)
  - Right face: darkest (~65% base value)
- Drop shadow: soft ellipse beneath the object, ~25% opacity, no hard edge
- Style: clean, Habbo-inspired pixel art but slightly more realistic,
  muted/naturalistic palette (avoid oversaturated cartoon colors)
- Era/material: [DESCREVA a era e material, ex: "late 1990s consumer electronics,
  matte black plastic, slightly yellowed edges, subtle wear marks"]

DELIVER:
A single image with all 8 sprites arranged in 2 rows:
Row 1 (top):    N  |  NE  |  E  |  SE
Row 2 (bottom): S  |  SW  |  W  |  NW

Where:
- S  = front face visible (object facing toward camera) ← most important view
- SE = front-right diagonal ← second most important
- N  = back/top visible, front hidden
- etc.

Label each sprite with its direction code (N, NE, E, SE, S, SW, W, NW).

Also state in your response:
1. The canvas size you used (W × H px)
2. The anchor pixel position (X, Y)
3. The tile footprint (e.g., "2 tiles wide × 1 tile deep")
4. Any artistic choices you made beyond the brief

---

## PROMPT — Parte de personagem (cabelo, roupa, acessório)

Cole este prompt no ChatGPT com referência visual da parte:

---

You are a professional isometric sprite artist for a life simulation game
(Habbo Hotel-inspired, dimetric projection, 2:1 pixel ratio).

I need 8 directional sprites for a character PART: [DESCREVA a parte, ex:
"short curly hair for a young adult character, dark brown color, casual style,
circa 1990s"]

CHARACTER REFERENCE PROPORTIONS (the body this part will be placed on):
- Full character canvas: 64×96 pixels
- Character visual height: ~72 pixels (body occupies 75% of canvas)
- Head top position in S direction: approximately at pixel Y=12
- Head center in S direction: approximately at pixel X=32, Y=24
- The character wears this part LAYERED on top of a pre-rendered body sprite

TECHNICAL REQUIREMENTS:
- Canvas: 64×96 pixels (same as full character — DO NOT crop to the part only)
- All 8 sprites use the same 64×96 canvas
- Background: fully transparent (PNG with alpha)
- Anchor: (32, 90) — bottom-center of character feet — same in all 8 sprites
- Only draw the PART itself (hair/clothing/accessory), NOT the body
- The part must align visually with the body when layered

8 DIRECTIONS required: N, NE, E, SE, S, SW, W, NW

STYLE: same as furniture — Habbo-inspired but naturalistic, muted palette,
top-left lighting, era-appropriate materials.

NOTES for hair specifically:
- In S direction: show full hair front, ears may be visible
- In N direction: show hair from behind, no face
- In E/W directions: show hair profile
- Diagonals: interpolate between front and side naturally

DELIVER:
Same 2-row layout: N NE E SE / S SW W NW
Label each with direction code.
State anchor position and any alignment decisions.

---

## TABELA DE REFERÊNCIA — Canvas por footprint de móvel

Usar ao preencher [SUBSTITUIR] no prompt acima:

| Footprint | Canvas      | anchorX | anchorY |
|-----------|-------------|---------|---------|
| 1×1 tile  | 96×80 px    | 48      | 72      |
| 2×1 tile  | 160×96 px   | 80      | 80      |
| 3×1 tile  | 224×96 px   | 112     | 80      |
| 1×2 tile  | 96×128 px   | 48      | 108     |
| 2×2 tile  | 160×128 px  | 80      | 112     |

---

## DICAS DE USO

1. Se o GPT gerar sprites com tamanhos inconsistentes entre direções,
   adicione ao final do prompt:
   "CRITICAL: do NOT resize or crop any sprite. Every sprite must be
   exactly [W]×[H] pixels. Use transparent padding if the object
   does not fill the entire canvas."

2. Se o estilo ficar cartoon demais, adicione:
   "The style should lean toward the more realistic end of pixel art:
   think classic video game console games (SNES/PS1 era), not Flash
   browser games."

3. Se o anchor estiver errado entre direções (objeto "pula" ao rotacionar),
   no Dev Tools use o `offsetsPorDirecao` no metadata.json para micro-ajuste
   sem precisar reeditar o sprite.

4. Para variações de era do mesmo objeto (ex: TV dos anos 80 vs anos 2000),
   adicione ao prompt:
   "Era: [eighties/nineties/twothousands]. Adjust materials accordingly:
   eighties = bright plastics, geometric patterns;
   nineties = beige/grey neutral plastic, simple design;
   twothousands = black gloss plastic, rounded shapes, silver accents."
