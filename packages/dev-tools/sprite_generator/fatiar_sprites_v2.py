#!/usr/bin/env python3
"""
fatiar_sprites.py — v2 — Pipeline de sprites para Vida 2.5D
Sprites numerados: 1.webp (N) a 8.webp (NW)

Uso:
  python fatiar_sprites.py sheet.png --asset-id tv_tubo_2000 --footprint 2x1
  python fatiar_sprites.py sheet.png --asset-id sofa_verde --footprint 3x1 --era nineties --slots 1,2,3,4,5,6,7,8

Requisitos:
  pip install Pillow
"""

import argparse
import io
import json
import os
import re
import sys
import zipfile
from PIL import Image


# ─── Constantes do projeto ────────────────────────────────────────────────────

# Sequência numerada: slot 1=N, 2=NE, ..., 8=NW
SLOTS: list[dict] = [
    {'num': 1, 'direcao': 'N',  'graus': 0},
    {'num': 2, 'direcao': 'NE', 'graus': 45},
    {'num': 3, 'direcao': 'E',  'graus': 90},
    {'num': 4, 'direcao': 'SE', 'graus': 135},
    {'num': 5, 'direcao': 'S',  'graus': 180},
    {'num': 6, 'direcao': 'SW', 'graus': 225},
    {'num': 7, 'direcao': 'W',  'graus': 270},
    {'num': 8, 'direcao': 'NW', 'graus': 315},
]

CANVAS_POR_FOOTPRINT = {
    '1x1': {'largura': 96,  'altura': 80,  'anchorX': 48,  'anchorY': 72},
    '2x1': {'largura': 160, 'altura': 96,  'anchorX': 80,  'anchorY': 80},
    '3x1': {'largura': 224, 'altura': 96,  'anchorX': 112, 'anchorY': 80},
    '1x2': {'largura': 96,  'altura': 128, 'anchorX': 48,  'anchorY': 108},
    '2x2': {'largura': 160, 'altura': 128, 'anchorX': 80,  'anchorY': 112},
    '3x2': {'largura': 224, 'altura': 128, 'anchorX': 112, 'anchorY': 112},
}

COR_FUNDO  = (255, 0, 255)   # magenta #FF00FF
TOLERANCIA = 35               # variação RGB tolerada para remoção
COLUNAS    = 4
LINHAS     = 2


# ─── Processamento ────────────────────────────────────────────────────────────

def cor_proximo(pixel: tuple, ref: tuple, tol: int) -> bool:
    return all(abs(int(pixel[i]) - ref[i]) <= tol for i in range(3))


def remover_magenta(imagem: Image.Image) -> Image.Image:
    rgba = imagem.convert('RGBA')
    px   = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if cor_proximo((r, g, b), COR_FUNDO, TOLERANCIA):
                px[x, y] = (0, 0, 0, 0)
    return rgba


def normalizar_asset_id(sheet_path: str) -> str:
    nome = os.path.splitext(os.path.basename(sheet_path))[0].lower()
    nome = re.sub(r'[^a-z0-9_]+', '_', nome)
    nome = re.sub(r'_+', '_', nome).strip('_')
    return nome or 'asset_sem_nome'


def detectar_footprint(sheet_path: str) -> str:
    sheet = Image.open(sheet_path)
    sw, sh = sheet.size
    w_celula = sw // COLUNAS
    h_celula = sh // LINHAS

    for footprint, config in CANVAS_POR_FOOTPRINT.items():
        if config['largura'] == w_celula and config['altura'] == h_celula:
            return footprint

    return '1x1'


def fatiar_sheet(
    sheet_path: str,
    footprint: str,
    slots_ativos: list[int],
) -> dict[int, Image.Image]:
    """Retorna dicionario {numero_slot: Image RGBA}."""
    sheet = Image.open(sheet_path).convert('RGB')
    sw, sh = sheet.size

    config = CANVAS_POR_FOOTPRINT.get(footprint)
    w_esperado = config['largura'] if config else sw // COLUNAS
    h_esperado = config['altura'] if config else sh // LINHAS

    w_celula = sw // COLUNAS
    h_celula = sh // LINHAS

    if w_celula != w_esperado or h_celula != h_esperado:
        print(f'Atencao: celula detectada {w_celula}x{h_celula}px.')
        print(f'Esperado para {footprint}: {w_esperado}x{h_esperado}px.')
        print('Usando dimensao detectada para nao cortar a arte.')

    print(f'Sheet: {sw}x{sh}px | Celula: {w_celula}x{h_celula}px')

    sprites: dict[int, Image.Image] = {}
    for slot in SLOTS:
        num = slot['num']
        if num not in slots_ativos:
            continue
        idx = num - 1
        coluna = idx % COLUNAS
        linha = idx // COLUNAS
        esq = coluna * w_celula
        topo = linha * h_celula
        recorte = sheet.crop((esq, topo, esq + w_celula, topo + h_celula))
        sprites[num] = remover_magenta(recorte)

    return sprites

def gerar_metadata(
    asset_id: str,
    footprint: str,
    slots_ativos: list[int],
    era: str | None,
    material: str | None,
    tags: list[str],
) -> dict:
    config = CANVAS_POR_FOOTPRINT.get(footprint, {})
    partes = footprint.split('x')
    fp_w, fp_h = int(partes[0]), int(partes[1])

    sprites_por_rotacao: dict[str, str] = {}
    rotacoes_disponiveis: list[int]     = []
    footprint_por_rotacao: dict[str, dict] = {}

    for slot in SLOTS:
        if slot['num'] not in slots_ativos:
            continue
        graus_str = str(slot['graus'])
        sprites_por_rotacao[graus_str]  = f"{slot['num']}.webp"
        rotacoes_disponiveis.append(slot['graus'])

        # footprint inverte em E/W e diagonais se o móvel não é quadrado
        direcao = slot['direcao']
        if fp_w != fp_h and direcao in ('E', 'W', 'NE', 'NW', 'SE', 'SW'):
            footprint_por_rotacao[graus_str] = {'largura': fp_h, 'altura': fp_w}
        else:
            footprint_por_rotacao[graus_str] = {'largura': fp_w, 'altura': fp_h}

    anchor_x = config.get('anchorX', 48)
    anchor_y = config.get('anchorY', 72)

    return {
        'assetId': asset_id,
        # float 0–1 (compatibilidade com schema atual)
        'anchorX': round(anchor_x / config.get('largura', 96), 4),
        'anchorY': round(anchor_y / config.get('altura', 80), 4),
        # pixel absoluto (futuro schema FrameDefinicao)
        'anchorPixelX': anchor_x,
        'anchorPixelY': anchor_y,
        'canvasLargura': config.get('largura', 96),
        'canvasAltura':  config.get('altura', 80),
        'escalaBase': 1.0,
        'rotacoesDisponiveis': sorted(rotacoes_disponiveis),
        'footprintPorRotacao': footprint_por_rotacao,
        'spritesPorRotacao': sprites_por_rotacao,
        # mapa slot → direção (para debug e dev-tools)
        'sequenciaSlots': {str(s['num']): s['direcao'] for s in SLOTS
                           if s['num'] in slots_ativos},
        **(({'material': material}) if material else {}),
        **(({'era': era}) if era else {}),
        'tags': tags,
    }


def empacotar_zip(
    asset_id: str,
    sprites: dict[int, Image.Image],
    metadata: dict,
    destino: str,
) -> str:
    caminho_zip = os.path.join(destino, f'{asset_id}.zip')
    base = f'content/furniture-assets/{asset_id}'

    with zipfile.ZipFile(caminho_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(
            f'{base}/metadata.json',
            json.dumps(metadata, indent=2, ensure_ascii=False)
        )
        for num, img in sorted(sprites.items()):
            buf = io.BytesIO()
            img.save(buf, format='WebP', lossless=True, quality=100)
            zf.writestr(f'{base}/{num}.webp', buf.getvalue())

    return caminho_zip


def verificar_qualidade(sprites: dict[int, Image.Image]) -> None:
    for num, img in sprites.items():
        slot = next(s for s in SLOTS if s['num'] == num)
        px = img.load()
        w, h = img.size

        restantes = sum(
            1 for y in range(h) for x in range(w)
            if px[x, y][3] > 0 and cor_proximo(px[x, y][:3], COR_FUNDO, 20)
        )
        if restantes:
            print(f"AVISO Slot {num} ({slot['direcao']}): {restantes} px magenta restantes")

        pixels_visiveis = sum(
            1 for y in range(h) for x in range(w) if px[x, y][3] > 0
        )
        if pixels_visiveis < 50:
            print(f"AVISO Slot {num} ({slot['direcao']}): poucos pixels visiveis ({pixels_visiveis})")
        else:
            print(f"OK Slot {num} ({slot['direcao']}): {pixels_visiveis} px visiveis")

# ─── CLI ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description='Fatia sprite sheet do GPT (numerado 1-8), remove magenta, gera ZIP'
    )
    parser.add_argument('sheet', help='PNG do sprite sheet gerado pelo GPT')
    parser.add_argument('--asset-id', default=None,
                        help='ID do asset. Se omitido, usa o nome do PNG.')
    parser.add_argument('--footprint', default=None,
                        help='Footprint em tiles. Se omitido, tenta detectar pela celula do sheet.')
    parser.add_argument('--era', default=None)
    parser.add_argument('--material', default=None)
    parser.add_argument('--tags', default='',
                        help='Tags separadas por virgula')
    parser.add_argument('--slots', default='1,2,3,4,5,6,7,8',
                        help='Slots disponiveis. Ex: 1,3,5,7 para so cardinais')
    parser.add_argument('--destino', default=None,
                        help='Pasta de destino do ZIP. Se omitida, usa a pasta do PNG')
    args = parser.parse_args()

    if not os.path.exists(args.sheet):
        print(f'Erro: {args.sheet} nao encontrado.')
        sys.exit(1)

    asset_id = args.asset_id or normalizar_asset_id(args.sheet)
    footprint = args.footprint or detectar_footprint(args.sheet)
    destino = args.destino or os.path.dirname(os.path.abspath(args.sheet))

    if footprint not in CANVAS_POR_FOOTPRINT:
        print(f'Footprint "{footprint}" desconhecido. Disponiveis: {", ".join(CANVAS_POR_FOOTPRINT)}')
        sys.exit(1)

    slots_ativos = [int(s.strip()) for s in args.slots.split(',')]
    tags = [t.strip() for t in args.tags.split(',') if t.strip()]

    print('\nVida 2.5D - Pipeline de sprites v2')
    print(f'   Asset:    {asset_id}')
    print(f'   Footprint: {footprint}')
    print(f'   Slots:    {slots_ativos}')
    print(f'   Saida:    {destino}\n')

    print('1. Fatiando...')
    sprites = fatiar_sheet(args.sheet, footprint, slots_ativos)

    print('2. Verificando qualidade...')
    verificar_qualidade(sprites)

    print('3. Gerando metadata.json...')
    metadata = gerar_metadata(
        asset_id=asset_id,
        footprint=footprint,
        slots_ativos=slots_ativos,
        era=args.era,
        material=args.material,
        tags=tags,
    )

    print('4. Empacotando ZIP...')
    os.makedirs(destino, exist_ok=True)
    zip_path = empacotar_zip(asset_id, sprites, metadata, destino)

    print(f'\nPronto: {zip_path}')
    print('   Extraia na raiz do projeto (life-sim-game/).')
    print('   Conteudo:')
    print(f'   content/furniture-assets/{asset_id}/')
    print('   - metadata.json')
    for s in SLOTS:
        if s['num'] in slots_ativos:
            print(f"   - {s['num']}.webp  ({s['direcao']})")
    print('\n   Abra no Dev Tools -> Furniture Viewer para validar.')

if __name__ == '__main__':
    main()
