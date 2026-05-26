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


def encontrar_raiz_projeto() -> str | None:
    caminho = os.path.abspath(os.path.dirname(__file__))
    for _ in range(8):
        if (
            os.path.exists(os.path.join(caminho, 'package.json'))
            and os.path.isdir(os.path.join(caminho, 'content'))
        ):
            return caminho

        proximo = os.path.dirname(caminho)
        if proximo == caminho:
            break
        caminho = proximo

    return None


def salvar_asset_no_projeto(
    raiz_projeto: str,
    asset_id: str,
    sprites: dict[int, Image.Image],
    metadata: dict,
) -> str:
    pasta_asset = os.path.join(raiz_projeto, 'content', 'furniture-assets', asset_id)
    os.makedirs(pasta_asset, exist_ok=True)

    with open(os.path.join(pasta_asset, 'metadata.json'), 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
        f.write('\n')

    for num, img in sorted(sprites.items()):
        img.save(os.path.join(pasta_asset, f'{num}.webp'), format='WebP', lossless=True, quality=100)

    return pasta_asset


def nome_humano(asset_id: str) -> str:
    return ' '.join(parte.capitalize() for parte in asset_id.split('_') if parte)


def inferir_categoria(asset_id: str) -> str:
    regras = [
        (('sofa', 'cadeira', 'pufe', 'poltrona', 'banco'), 'assento'),
        (('mesa', 'rack', 'escrivaninha'), 'mesa'),
        (('cama', 'berco'), 'cama'),
        (('tv', 'televisao', 'notebook', 'computador', 'pc', 'celular', 'radio'), 'tecnologia'),
        (('geladeira', 'fogao', 'lavadora', 'microondas', 'freezer'), 'eletrodomestico'),
        (('vaso', 'planta', 'quadro', 'luminaria', 'tapete'), 'decoracao'),
        (('esteira', 'halter', 'bicicleta'), 'treino'),
    ]
    for termos, categoria in regras:
        if any(termo in asset_id for termo in termos):
            return categoria
    return 'outro'


def gerar_entrada_catalogo(
    asset_id: str,
    footprint: str,
    nome: str | None,
    categoria: str | None,
    start_year: int,
    preco: float,
    valor_revenda: float,
    tags: list[str],
) -> dict:
    partes = footprint.split('x')
    largura, altura = int(partes[0]), int(partes[1])
    tags_catalogo = sorted(set(tags + ['gerado_sprite']))

    return {
        'id': asset_id,
        'nome': nome or nome_humano(asset_id),
        'categoria': categoria or inferir_categoria(asset_id),
        'assetId': asset_id,
        'tamanhoGrid': {'largura': largura, 'altura': altura},
        'preco': preco,
        'valorDeRevenda': valor_revenda,
        'acoes': [],
        'efeitos': {},
        'availability': {'startYear': start_year},
        'tags': tags_catalogo,
        'descricao': f'Entrada gerada automaticamente pelo sprite_generator para validar {asset_id} no Furniture Viewer.',
    }


def atualizar_catalogo(
    catalogo_path: str,
    entrada_gerada: dict,
) -> str:
    os.makedirs(os.path.dirname(catalogo_path), exist_ok=True)

    if os.path.exists(catalogo_path):
        with open(catalogo_path, 'r', encoding='utf-8') as f:
            catalogo = json.load(f)
    else:
        catalogo = []

    if not isinstance(catalogo, list):
        raise ValueError(f'Catalogo precisa ser uma lista JSON: {catalogo_path}')

    indice_existente = next(
        (
            i for i, item in enumerate(catalogo)
            if isinstance(item, dict)
            and (item.get('id') == entrada_gerada['id'] or item.get('assetId') == entrada_gerada['assetId'])
        ),
        None,
    )

    if indice_existente is None:
        catalogo.append(entrada_gerada)
        acao = 'adicionado'
    else:
        existente = catalogo[indice_existente]
        atualizado = dict(entrada_gerada)
        atualizado.update(existente)
        atualizado['assetId'] = entrada_gerada['assetId']
        atualizado['tamanhoGrid'] = entrada_gerada['tamanhoGrid']
        atualizado['tags'] = sorted(set(existente.get('tags', []) + entrada_gerada['tags']))
        catalogo[indice_existente] = atualizado
        acao = 'atualizado'

    with open(catalogo_path, 'w', encoding='utf-8') as f:
        json.dump(catalogo, f, indent=2, ensure_ascii=False)
        f.write('\n')

    return acao


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
    parser.add_argument('--nao-instalar-projeto', action='store_true',
                        help='Nao copia o asset nem atualiza catalogo em content/.')
    parser.add_argument('--catalogo', default=None,
                        help='Catalogo JSON a atualizar. Padrao: content/furniture/twothousands/catalogo.json')
    parser.add_argument('--nome', default=None,
                        help='Nome exibido no Furniture Viewer. Padrao: nome derivado do asset-id.')
    parser.add_argument('--categoria', default=None,
                        choices=['assento', 'mesa', 'cama', 'tecnologia', 'eletrodomestico', 'decoracao', 'treino', 'outro'],
                        help='Categoria do movel no catalogo. Se omitida, tenta inferir pelo asset-id.')
    parser.add_argument('--start-year', type=int, default=2000,
                        help='Ano inicial no catalogo automatico.')
    parser.add_argument('--preco', type=float, default=100,
                        help='Preco padrao no catalogo automatico.')
    parser.add_argument('--valor-revenda', type=float, default=25,
                        help='Valor de revenda padrao no catalogo automatico.')
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

    pasta_asset = None
    catalogo_path = None
    acao_catalogo = None
    if not args.nao_instalar_projeto:
        raiz_projeto = encontrar_raiz_projeto()
        if raiz_projeto is None:
            print('\nAVISO: raiz do projeto nao encontrada. ZIP gerado, mas catalogo nao foi atualizado.')
        else:
            print('5. Instalando no projeto e atualizando catalogo...')
            pasta_asset = salvar_asset_no_projeto(raiz_projeto, asset_id, sprites, metadata)
            catalogo_path = args.catalogo or os.path.join(
                raiz_projeto, 'content', 'furniture', 'twothousands', 'catalogo.json'
            )
            entrada = gerar_entrada_catalogo(
                asset_id=asset_id,
                footprint=footprint,
                nome=args.nome,
                categoria=args.categoria,
                start_year=args.start_year,
                preco=args.preco,
                valor_revenda=args.valor_revenda,
                tags=tags,
            )
            acao_catalogo = atualizar_catalogo(catalogo_path, entrada)

    print(f'\nPronto: {zip_path}')
    print('   Conteudo:')
    print(f'   content/furniture-assets/{asset_id}/')
    print('   - metadata.json')
    for s in SLOTS:
        if s['num'] in slots_ativos:
            print(f"   - {s['num']}.webp  ({s['direcao']})")
    if pasta_asset and catalogo_path and acao_catalogo:
        print('\nInstalado no projeto:')
        print(f'   Asset:    {pasta_asset}')
        print(f'   Catalogo: {catalogo_path} ({acao_catalogo})')
        print('   Recarregue o Dev Tools -> Furniture Viewer para validar.')
    else:
        print('\n   Extraia o ZIP na raiz do projeto (life-sim-game/) para validar no Dev Tools.')

if __name__ == '__main__':
    main()
