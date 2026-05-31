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
