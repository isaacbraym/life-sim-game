"""
Orquestrador de bake da personagem de teste Marnie.

Para cada variante (base = jogador, gym = NPC) e cada clip do Mixamo, chama o
worker retarget_bake.py no Blender headless e grava as sprites em
content/test-characters/marnie/{variante}/{clipId}/frames/{dir}/frame_NNN.webp.

Ao final gera o manifest.json (consumido pelo viewer do dev-tools e pelo runtime)
e GIFs de review por clip para conferência rápida.

Rodar a partir da raiz do repo:
    python scripts/blender/bake_marnie.py
"""

import json
import os
import subprocess
import sys
import glob

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BLENDER = r"C:\Program Files\Blender Foundation\Blender 4.2\blender.exe"
WORKER = os.path.join("scripts", "blender", "retarget_bake.py")
ANIM_DIR = os.path.join("packages", "dev-tools", "Marnie", "animations_mixamo")
SAIDA_BASE = os.path.join("content", "test-characters", "marnie")

CANVAS = {"largura": 64, "altura": 96, "anchorX": 32, "anchorY": 90}
FPS = 12

VARIANTES = [
    {"varianteId": "base", "nome": "Marnie", "papel": "jogador",
     "fbx": os.path.join("packages", "dev-tools", "Marnie", "Marine", "Marine.fbx")},
    {"varianteId": "gym", "nome": "Marnie (Líder de Ginásio)", "papel": "npc",
     "fbx": os.path.join("packages", "dev-tools", "Marnie", "Marine", "Marine (Gym Leader).fbx")},
]

# (arquivo_fbx, clipId, root_vertical, loop, end_frame|None)
CLIPS_BASE = [
    ("Breathing Idle.fbx",  "idle",       False, True,  90),
    ("Walking.fbx",         "andar",      False, True,  None),
    ("Slow Run.fbx",        "correr",     False, True,  None),
    ("Sitting.fbx",         "sentado",    True,  True,  None),
    ("Sit To Stand.fbx",    "levantar",   True,  False, None),
    ("Sitting Talking.fbx", "conversar",  True,  True,  90),
]
CLIPS_GYM = [
    ("Breathing Idle.fbx",  "idle",       False, True,  90),
    ("Walking.fbx",         "andar",      False, True,  None),
    ("Sitting.fbx",         "sentado",    True,  True,  None),
    ("Sitting Talking.fbx", "conversar",  True,  True,  90),
]


def rodar_bake(fbx_alvo, anim_fbx, saida, root_vertical, end_frame):
    args = [
        BLENDER, "--background", "--python", WORKER, "--",
        "--target", fbx_alvo,
        "--anim", os.path.join(ANIM_DIR, anim_fbx),
        "--output", saida,
        "--fps", str(FPS),
        "--directions", "8",
    ]
    if root_vertical:
        args.append("--root-vertical")
    if end_frame is not None:
        args += ["--end-frame", str(end_frame)]
    print(f"  → bake {anim_fbx} -> {saida} (rootv={root_vertical}, end={end_frame})")
    res = subprocess.run(args, cwd=RAIZ, capture_output=True, text=True)
    if res.returncode != 0:
        print(res.stdout[-2000:])
        print(res.stderr[-2000:])
        raise RuntimeError(f"Falha no bake de {anim_fbx}")
    # extrai linha de calibração/erros úteis
    for linha in res.stdout.splitlines():
        if "Calibrado" in linha or "Render:" in linha or "aviso" in linha:
            print("    " + linha.strip())


def contar_frames(saida_frames):
    """Conta frames por direção (assume todas as direções com mesma contagem)."""
    contagem = {}
    for d in ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]:
        p = os.path.join(saida_frames, d)
        n = len(glob.glob(os.path.join(p, "*.webp"))) if os.path.isdir(p) else 0
        contagem[d] = n
    return contagem


def gerar_gif_review(saida_frames, destino_gif, direcao="S", zoom=3):
    try:
        from PIL import Image
    except ImportError:
        return
    arquivos = sorted(glob.glob(os.path.join(saida_frames, direcao, "*.webp")))
    if not arquivos:
        return
    quadros = []
    for a in arquivos:
        im = Image.open(a).convert("RGBA")
        im = im.resize((im.width * zoom, im.height * zoom), Image.NEAREST)
        fundo = Image.new("RGBA", im.size, (45, 47, 56, 255))
        fundo.alpha_composite(im)
        quadros.append(fundo.convert("P", palette=Image.ADAPTIVE))
    if quadros:
        os.makedirs(os.path.dirname(destino_gif), exist_ok=True)
        quadros[0].save(destino_gif, save_all=True, append_images=quadros[1:],
                        duration=int(1000 / FPS), loop=0, disposal=2)


def main():
    manifest_clips = {}
    review_dir = os.path.join(SAIDA_BASE, "_review")

    for var in VARIANTES:
        clips = CLIPS_BASE if var["varianteId"] == "base" else CLIPS_GYM
        print(f"\n=== Variante: {var['varianteId']} ({var['nome']}) ===")
        for anim_fbx, clip_id, rootv, loop, end in clips:
            saida_frames = os.path.join(
                SAIDA_BASE, var["varianteId"], clip_id, "frames")
            rodar_bake(var["fbx"], anim_fbx, saida_frames + os.sep, rootv, end)

            contagem = contar_frames(os.path.join(RAIZ, saida_frames))
            n = contagem.get("S", 0)
            print(f"    {clip_id}: {n} frames/direção")

            gif = os.path.join(RAIZ, review_dir,
                               f"{var['varianteId']}_{clip_id}.gif")
            gerar_gif_review(os.path.join(RAIZ, saida_frames), gif)

            manifest_clips.setdefault(var["varianteId"], []).append({
                "clipId": clip_id,
                "fps": FPS,
                "loop": loop,
                "frames": n,
                "rootVertical": rootv,
            })

    manifest = {
        "personagemId": "marnie",
        "nome": "Marnie",
        "fonte": "Pokémon Sword/Shield trainer tr0005 (uso de teste interno)",
        "canvas": CANVAS,
        "variantes": [
            {k: v[k] for k in ("varianteId", "nome", "papel")} | {
                "clips": manifest_clips.get(v["varianteId"], [])
            }
            for v in VARIANTES
        ],
    }
    destino_manifest = os.path.join(RAIZ, SAIDA_BASE, "manifest.json")
    os.makedirs(os.path.dirname(destino_manifest), exist_ok=True)
    with open(destino_manifest, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"\n✓ Manifest: {destino_manifest}")
    print(f"✓ GIFs de review: {os.path.join(SAIDA_BASE, '_review')}")


if __name__ == "__main__":
    main()
