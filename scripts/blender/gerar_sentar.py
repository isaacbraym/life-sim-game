"""
Gera o clip 'sentar' (em pé → sentado) a partir de 'levantar' (sentado → em pé)
invertendo a ordem dos frames. Atualiza o manifest.json e gera GIF de review.

Rodar após o bake (bake_marnie.py):
    python scripts/blender/gerar_sentar.py
"""

import json
import os
import shutil
import glob
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BASE = os.path.join(RAIZ, "content", "test-characters", "marnie")
DIRECOES = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
FONTE = "levantar"
ALVO = "sentar"


def inverter_clip(variante):
    src_root = os.path.join(BASE, variante, FONTE, "frames")
    if not os.path.isdir(src_root):
        return 0
    dst_root = os.path.join(BASE, variante, ALVO, "frames")
    total = 0
    for d in DIRECOES:
        src = os.path.join(src_root, d)
        if not os.path.isdir(src):
            continue
        frames = sorted(glob.glob(os.path.join(src, "*.webp")))
        if not frames:
            continue
        dst = os.path.join(dst_root, d)
        os.makedirs(dst, exist_ok=True)
        for arq in glob.glob(os.path.join(dst, "*.webp")):
            os.remove(arq)
        for novo_idx, arq in enumerate(reversed(frames)):
            shutil.copy2(arq, os.path.join(dst, f"frame_{novo_idx:03d}.webp"))
        total = len(frames)
    return total


def gerar_gif(variante, fps):
    try:
        from PIL import Image
    except ImportError:
        return
    src = os.path.join(BASE, variante, ALVO, "frames", "SE")
    frames = sorted(glob.glob(os.path.join(src, "*.webp")))
    if not frames:
        return
    q = []
    for a in frames:
        im = Image.open(a).convert("RGBA")
        im = im.resize((im.width * 3, im.height * 3), Image.NEAREST)
        bg = Image.new("RGBA", im.size, (45, 47, 56, 255))
        bg.alpha_composite(im)
        q.append(bg.convert("P", palette=Image.ADAPTIVE))
    out = os.path.join(BASE, "_review", f"{variante}_{ALVO}.gif")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    q[0].save(out, save_all=True, append_images=q[1:],
              duration=int(1000 / fps), loop=0, disposal=2)


def main():
    manifesto_path = os.path.join(BASE, "manifest.json")
    m = json.load(open(manifesto_path, encoding="utf-8"))
    for v in m["variantes"]:
        levantar = next((c for c in v["clips"] if c["clipId"] == FONTE), None)
        if levantar is None:
            continue
        n = inverter_clip(v["varianteId"])
        if n <= 0:
            continue
        if not any(c["clipId"] == ALVO for c in v["clips"]):
            # Insere 'sentar' logo antes de 'levantar'.
            idx = next(i for i, c in enumerate(v["clips"]) if c["clipId"] == FONTE)
            v["clips"].insert(idx, {
                "clipId": ALVO, "fps": levantar["fps"], "loop": False,
                "frames": n, "rootVertical": levantar.get("rootVertical", True),
            })
        gerar_gif(v["varianteId"], levantar["fps"])
        print(f"  {v['varianteId']}: sentar = {n} frames (levantar invertido)")
    json.dump(m, open(manifesto_path, "w", encoding="utf-8"),
              indent=2, ensure_ascii=False)
    print(f"✓ Manifest atualizado: {manifesto_path}")


if __name__ == "__main__":
    main()
