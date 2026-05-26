# Sprite Generator Drag-and-Drop

Uso rapido:

1. Instale Pillow uma vez, se ainda nao tiver:

```bat
py -m pip install Pillow
```

2. Arraste um `.png` para `gerar_sprites_arrastar.bat`.

O `.bat` chama o script existente `fatiar_sprites_v2.py`.

3. O gerador faz duas coisas:

- cria o `.zip` no mesmo diretorio do PNG;
- instala/atualiza o asset em `content/furniture-assets/<asset_id>/` e adiciona/atualiza a entrada em `content/furniture/twothousands/catalogo.json`.

O `.zip` sera criado com o nome:

```text
<asset_id>.zip
```

O ZIP inclui:

```text
content/furniture-assets/<asset_id>/metadata.json
content/furniture-assets/<asset_id>/1.webp
content/furniture-assets/<asset_id>/2.webp
...
content/furniture-assets/<asset_id>/8.webp
```

## Formato recomendado do PNG

O melhor resultado vem de um sprite sheet 4x2:

```text
1 N   2 NE   3 E   4 SE
5 S   6 SW   7 W   8 NW
```

O `fatiar_sprites_v2.py` tambem pode ser usado manualmente:

```bat
python fatiar_sprites_v2.py sheet.png --asset-id tv_tubo_2000 --footprint 2x1
```

Quando chamado pelo `.bat`, `assetId`, `footprint` e pasta de destino sao preenchidos automaticamente:

- `assetId`: vem do nome do PNG.
- `footprint`: tenta detectar pelo tamanho da celula 4x2; se nao reconhecer, usa `1x1`.
- `destino`: a mesma pasta do PNG.
- `catalogo`: atualiza `content/furniture/twothousands/catalogo.json`.

Depois de gerar um asset, recarregue o Dev Tools em `localhost:5174`.
O Furniture Viewer carrega os catalogos padrao automaticamente.

## Asset ID

O `assetId` e inferido automaticamente pelo nome do arquivo.

Exemplo:

```text
geladeira_2000_01.png -> assetId "geladeira_2000_01" -> geladeira_2000_01.zip
```

## Opcoes uteis

```bat
python fatiar_sprites_v2.py minha_mesa.png --footprint 2x1 --categoria mesa --nome "Minha Mesa"
python fatiar_sprites_v2.py sofa.png --nao-instalar-projeto
```
