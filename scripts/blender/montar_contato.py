import sys, os
from PIL import Image

base = sys.argv[1]
out = sys.argv[2]
frame = sys.argv[3] if len(sys.argv) > 3 else "frame_005.webp"
ZOOM = 3
PAD = 6
BG = (40, 40, 48, 255)
CHECK = (60, 60, 70, 255)

dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
imgs = {}
for d in dirs:
    p = os.path.join(base, d, frame)
    if os.path.exists(p):
        imgs[d] = Image.open(p).convert("RGBA")

if not imgs:
    print("nenhuma imagem")
    sys.exit(1)

w, h = next(iter(imgs.values())).size
cw, ch = w * ZOOM, h * ZOOM
cols = len(dirs)
sheet = Image.new("RGBA", (cols * (cw + PAD) + PAD, ch + PAD * 2 + 16), BG)

from PIL import ImageDraw
draw = ImageDraw.Draw(sheet)
for i, d in enumerate(dirs):
    x = PAD + i * (cw + PAD)
    y = PAD + 16
    # fundo xadrez para enxergar transparência
    cell = Image.new("RGBA", (cw, ch), CHECK)
    if d in imgs:
        big = imgs[d].resize((cw, ch), Image.NEAREST)
        cell.alpha_composite(big)
    sheet.alpha_composite(cell, (x, y))
    draw.text((x + 2, 2), d, fill=(255, 255, 255, 255))

sheet.convert("RGB").save(out)
print(f"contato salvo: {out} ({sheet.size})")
