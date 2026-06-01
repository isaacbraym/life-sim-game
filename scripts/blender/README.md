# Scripts Blender — Vida 2.5D

## Pré-requisitos

- Blender 4.2 instalado em `C:\Program Files\Blender Foundation\Blender 4.2\`
- Python 3.x instalado para rodar o script auxiliar

## Scripts disponíveis

### test_bake_pipeline.py — Teste de ambiente
Verifica que o Blender headless funciona corretamente.
Não precisa de modelo 3D — usa um cubo como teste.

```bash
"C:\Program Files\Blender Foundation\Blender 4.2\blender.exe" --background --python scripts/blender/test_bake_pipeline.py
```

Saída esperada: `scripts/blender/output_test/` com 8 PNGs (N, NE, E, SE, S, SW, W, NW)

### bake_character.py — Bake de produção
Converte FBX animado do Mixamo em sprite sheets WebP por camada, 8 direções.

```bash
"C:\Program Files\Blender Foundation\Blender 4.2\blender.exe" ^
  --background ^
  --python scripts/blender/bake_character.py ^
  -- ^
  --input scripts/blender/input/walk.fbx ^
  --output content/character-animations/andar/frames/ ^
  --fps 12 ^
  --directions 8
```

Parâmetros: --input (FBX), --output (pasta), --fps (12), --directions (8|4),
--start-frame (1), --end-frame (auto), --scale (1.0)

### gerar_index_animacoes.py — Indexar clips
Gera `content/character-animations/index.json` lido pelo dev-tools.

```bash
python scripts/blender/gerar_index_animacoes.py
```

### retarget_bake.py — Retarget Mixamo → rig custom + bake (personagem de teste)
Para personagens com rig próprio (NÃO Mixamo nativo), ex.: Marnie (tr0005, rig de
jogo de 193 bones). Importa o personagem (mesh+rig), importa uma animação Mixamo
(Without Skin), faz o retarget por world-delta de rotações osso-a-osso e bakeia
as 8 direções dimétricas em WebP combinado.

```bash
"C:\Program Files\Blender Foundation\Blender 4.2\blender.exe" ^
  --background --python scripts/blender/retarget_bake.py -- ^
  --target "packages/dev-tools/Marnie/Marine/Marine.fbx" ^
  --anim   "packages/dev-tools/Marnie/animations_mixamo/Walking.fbx" ^
  --output "content/test-characters/marnie/base/andar/frames/" ^
  --fps 12 --directions 8
```

Flags extras: `--root-vertical` (copia a descida do quadril — usar em sentar/
levantar), `--scale auto|<float>` (auto-calibra escala+anchor por medição da
silhueta), `--end-frame N` (cortar clips longos). O mapa de ossos
(mixamorig → tr0005) está em `MAPA_MIXAMO_MARNIE` no topo do script.

> Diferença de câmera vs. `bake_character.py`: este script usa a elevação
> dimétrica correta (26.57° acima da horizontal) e `sensor_fit=VERTICAL`,
> evitando a vista top-down e tornando o anchor (32,90) determinístico.

### bake_marnie.py — Orquestrador da personagem de teste Marnie
Roda `retarget_bake.py` para todas as variantes (base=jogador, gym=NPC) e clips,
gera `content/test-characters/marnie/manifest.json` e GIFs de review em `_review/`.

```bash
python scripts/blender/bake_marnie.py
```

### inspecionar_fbx.py / montar_contato.py — QA
`inspecionar_fbx.py <arquivo>` faz dump de objetos/rig/bones/texturas.
`montar_contato.py <pasta_frames> <saida.png> [frame]` monta contact sheet das 8
direções (fundo xadrez) para inspeção rápida.

## Fluxo completo de uma nova animação

1. Baixar FBX do Mixamo (Without Skin, 30fps, In Place=ON) →
   salvar em `scripts/blender/input/{nome}.fbx`
2. Rodar `bake_character.py` com o FBX
3. Rodar `gerar_index_animacoes.py`
4. Abrir `pnpm dev:tools` → Ctrl+6 (Animation Proofer) → validar visualmente
5. Commitar somente após aprovação no Proofer

## Resolução de problemas

**FBX não importa:** verificar se o addon FBX está ativado no Blender
  → Edit → Preferences → Add-ons → buscar "FBX"

**Personagem fora do frame:** ajustar `--scale` (menor = mais zoom in)

**Animação errada (frames errados):** verificar `--start-frame` e `--end-frame`
  com os valores da ação no Mixamo (visível na barra de timeline do FBX)

**Retarget: personagem com pose estranha:** conferir o `MAPA_MIXAMO_MARNIE`. Os
  dois rigs precisam estar em T-pose (ou A-pose) compatível. Para outro rig custom,
  ajustar o mapa de ossos (origem mixamorig → destino) no topo do `retarget_bake.py`.

**Personagem sentado "flutuando":** ligar `--root-vertical` para baixar o quadril.
**Pés afundando no chão (walk):** desligar `--root-vertical` (default).
