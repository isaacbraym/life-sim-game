"""
Retarget + bake de animações Mixamo para um personagem com rig custom.

Fluxo:
  1. Importa o personagem alvo (mesh + rig custom) — ex.: Marnie (tr0005).
  2. Importa um FBX de animação do Mixamo (Without Skin — só curvas de osso).
  3. Faz retarget por world-delta: para cada par de ossos mapeado, copia a
     rotação em espaço de mundo do osso Mixamo para o osso correspondente do
     rig alvo, respeitando as diferenças de rest pose (T-pose) e roll.
     A translação do root copia apenas o componente vertical (in-place).
  4. Bakeia a action resultante diretamente nas curvas do rig alvo.
  5. Renderiza 8 direções dimétricas (26.57°) em WebP combinado por frame.

Uso:
  blender --background --python scripts/blender/retarget_bake.py -- \
    --target <Marnie.fbx> \
    --anim   <Walking.fbx> \
    --output content/character-animations/andar/frames/ \
    --fps 12 --directions 8 [--scale auto] [--combined]

Mapa de ossos: definido em MAPA_MIXAMO_MARNIE abaixo (mixamorig -> tr0005).
"""

import bpy
import math
import os
import sys
import argparse
from mathutils import Matrix, Vector


# ---------------------------------------------------------------------------
# Mapa de ossos: Mixamo (origem) -> Marnie tr0005 (alvo)
# Ordem importa: pais antes de filhos (processamento hierárquico).
# ---------------------------------------------------------------------------
MAPA_MIXAMO_MARNIE = [
    ("mixamorig:Hips", "Waist"),          # root + translação vertical
    ("mixamorig:Spine", "Spine1"),
    ("mixamorig:Spine1", "Spine2"),
    ("mixamorig:Spine2", "Spine3"),
    ("mixamorig:Neck", "Neck"),
    ("mixamorig:Head", "Head"),
    ("mixamorig:LeftShoulder", "LShoulder"),
    ("mixamorig:LeftArm", "LArm"),
    ("mixamorig:LeftForeArm", "LForeArm"),
    ("mixamorig:LeftHand", "LHand"),
    ("mixamorig:RightShoulder", "RShoulder"),
    ("mixamorig:RightArm", "RArm"),
    ("mixamorig:RightForeArm", "RForeArm"),
    ("mixamorig:RightHand", "RHand"),
    ("mixamorig:LeftUpLeg", "LThigh"),
    ("mixamorig:LeftLeg", "LLeg"),
    ("mixamorig:LeftFoot", "LFoot"),
    ("mixamorig:LeftToeBase", "LToe"),
    ("mixamorig:RightUpLeg", "RThigh"),
    ("mixamorig:RightLeg", "RLeg"),
    ("mixamorig:RightFoot", "RFoot"),
    ("mixamorig:RightToeBase", "RToe"),
]

NOME_BONE_ROOT_ALVO = "Waist"

# Mapa direção→ângulo de rotação Z da armature, calibrado visualmente para a
# projeção iso do jogo (x=(tx-ty)*32, y=(tx+ty)*16):
# quem aparece de FRENTE (olhando reto p/ baixo na tela) é SE — a direção mais
# comum em cômodos iso. NW é de costas. Ver instructions/14.
DIRECOES_8 = [
    ('S', 0),    ('SE', 45),  ('E', 90),   ('NE', 135),
    ('N', 180),  ('NW', 225), ('W', 270),  ('SW', 315),
]
DIRECOES_4 = [('SE', 45), ('E', 90), ('S', 0), ('SW', 315)]


def parse_args():
    args_list = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--target", required=True, help="FBX do personagem alvo (mesh+rig).")
    p.add_argument("--anim", required=True, help="FBX de animação do Mixamo.")
    p.add_argument("--output", required=True, help="Pasta de saída dos frames.")
    p.add_argument("--fps", type=int, default=12)
    p.add_argument("--directions", type=int, default=8, choices=[4, 8])
    p.add_argument("--start-frame", type=int, default=None)
    p.add_argument("--end-frame", type=int, default=None)
    p.add_argument("--scale", default="auto", help="OrthoScale da câmera ou 'auto'.")
    p.add_argument("--combined", action="store_true", default=True,
                   help="Renderiza todos os meshes juntos (1 sprite por frame).")
    p.add_argument("--margin", type=float, default=1.0,
                   help="Fator fino de escala (1.0 = altura-alvo exata).")
    p.add_argument("--root-vertical", action="store_true", default=False,
                   help="Copia a translação vertical do quadril (bob/sentar). "
                        "Default OFF: mantém os pés plantados (evita afundar no chão).")
    return p.parse_args(args_list)


def limpar_cena():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for col in (bpy.data.actions, bpy.data.armatures, bpy.data.meshes):
        for b in list(col):
            try:
                col.remove(b)
            except Exception:
                pass


def importar_fbx(caminho):
    """Importa FBX e devolve (armature, [meshes]) recém-importados."""
    antes = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=caminho)
    novos = [o for o in bpy.data.objects if o not in antes]
    arms = [o for o in novos if o.type == 'ARMATURE']
    meshes = [o for o in novos if o.type == 'MESH']
    if not arms:
        raise RuntimeError(f"Nenhuma armature em {caminho}")
    return arms[0], meshes


def altura_mundo(meshes):
    """Altura (Z mundo) do conjunto de meshes via bounding box."""
    zmin, zmax = 1e9, -1e9
    for m in meshes:
        for v in m.bound_box:
            wz = (m.matrix_world @ Vector(v)).z
            zmin = min(zmin, wz)
            zmax = max(zmax, wz)
    return zmin, zmax


def rest_world_matrix(arm_obj, bone_name):
    bone = arm_obj.data.bones.get(bone_name)
    if bone is None:
        return None
    return arm_obj.matrix_world @ bone.matrix_local


def retarget(source_arm, target_arm, frame_inicio, frame_fim, root_vertical=False):
    """Copia a animação do rig Mixamo para o rig alvo, frame a frame."""
    scene = bpy.context.scene

    # Pré-computa rest matrices em espaço de mundo.
    pares = []
    for src_name, tgt_name in MAPA_MIXAMO_MARNIE:
        sb = target_arm.pose.bones.get(tgt_name)
        spb = source_arm.pose.bones.get(src_name)
        if sb is None or spb is None:
            print(f"  [aviso] par ignorado (ausente): {src_name} -> {tgt_name}")
            continue
        rs = rest_world_matrix(source_arm, src_name)
        rt = rest_world_matrix(target_arm, tgt_name)
        pares.append((src_name, tgt_name, rs.copy(), rt.copy()))

    # Razão de altura para escalar a translação do root.
    src_hips_rest = rest_world_matrix(source_arm, "mixamorig:Hips")
    tgt_root_rest = rest_world_matrix(target_arm, NOME_BONE_ROOT_ALVO)

    # Garante modo quaternion nos ossos alvo (evita gimbal nas curvas).
    for pb in target_arm.pose.bones:
        pb.rotation_mode = 'QUATERNION'

    tgt_world_inv = target_arm.matrix_world.inverted()

    for frame in range(frame_inicio, frame_fim + 1):
        scene.frame_set(frame)

        for src_name, tgt_name, rs, rt in pares:
            spb = source_arm.pose.bones[src_name]
            tpb = target_arm.pose.bones[tgt_name]

            src_pose_world = source_arm.matrix_world @ spb.matrix
            delta = src_pose_world.to_3x3() @ rs.to_3x3().inverted()
            desired_world_rot = delta @ rt.to_3x3()

            # Posição (head) em espaço da armature alvo, herdando o pai já atualizado.
            if tpb.parent is not None:
                rest_local = tpb.parent.bone.matrix_local.inverted() @ tpb.bone.matrix_local
                head_arm = (tpb.parent.matrix @ rest_local).translation
            else:
                head_arm = tpb.bone.matrix_local.translation.copy()

            # Root: mantém XY fixo (in-place). Vertical opcional (bob/sentar).
            if tgt_name == NOME_BONE_ROOT_ALVO:
                head_world = tgt_root_rest.translation.copy()
                if root_vertical:
                    src_trans_world = src_pose_world.translation - src_hips_rest.translation
                    head_world.z += src_trans_world.z
                head_arm = (tgt_world_inv @ head_world.to_4d()).to_3d()

            desired_arm_rot = target_arm.matrix_world.to_3x3().inverted() @ desired_world_rot
            m = Matrix.Translation(head_arm) @ desired_arm_rot.to_4x4()
            tpb.matrix = m
            bpy.context.view_layer.update()

        # Keyframe em todos os ossos alvo mapeados.
        for _, tgt_name, _, _ in pares:
            tpb = target_arm.pose.bones[tgt_name]
            tpb.keyframe_insert(data_path="rotation_quaternion", frame=frame)
            tpb.keyframe_insert(data_path="location", frame=frame)

    print(f"  Retarget concluído: frames {frame_inicio}-{frame_fim}, {len(pares)} ossos.")


def aterrar_personagem(arm_obj, meshes):
    """Translada o conjunto para que o ponto mais baixo (pés) fique em z=0."""
    zmin, _ = altura_mundo(meshes)
    # Move a armature (pais dos meshes) e meshes sem pai.
    arm_obj.location.z -= zmin
    for m in meshes:
        if m.parent is None:
            m.location.z -= zmin
    bpy.context.view_layer.update()


RES_X, RES_Y = 64, 96
ANCHOR_Y = 90            # pés no pixel y=90 (topo-down)
ALTURA_ALVO_PX = 74.0    # altura visual do personagem em pé (~77% do canvas)
THETA = math.atan(0.5)   # 26.57° dimétrico
DIST_CAM = 10.0


def setup_iluminacao(scene):
    """Mundo ambiente + dois sóis (texturas anime tendem a renderizar escuras)."""
    mundo = bpy.data.worlds.new("BakeWorld")
    mundo.use_nodes = True
    bg = mundo.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (1.0, 1.0, 1.0, 1.0)
        bg.inputs[1].default_value = 0.6
    scene.world = mundo

    sun = bpy.data.lights.new("BakeSun", type='SUN')
    sun.energy = 4.0
    so = bpy.data.objects.new("BakeSun", sun)
    scene.collection.objects.link(so)
    so.rotation_euler = (math.radians(45), 0, math.radians(45))

    fill = bpy.data.lights.new("BakeFill", type='SUN')
    fill.energy = 2.0
    fo = bpy.data.objects.new("BakeFill", fill)
    scene.collection.objects.link(fo)
    fo.rotation_euler = (math.radians(135), 0, math.radians(225))


def criar_camera(scene, ortho, foco_z):
    """Câmera ortográfica com ELEVAÇÃO dimétrica de 26.57° acima da horizontal
    (olha 26.57° abaixo da horizontal). Vertical:profundidade = 2:1.
    A câmera mira o ponto (0,0,foco_z)."""
    cam_data = bpy.data.cameras.new("BakeCamera")
    cam_data.type = 'ORTHO'
    cam_data.sensor_fit = 'VERTICAL'
    cam_data.ortho_scale = ortho
    cam = bpy.data.objects.new("BakeCamera", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    # viewdir = (0, cos θ, -sin θ): olha para +Y inclinada θ para baixo.
    dir_x, dir_y, dir_z = 0.0, math.cos(THETA), -math.sin(THETA)
    cam.location = (0.0 - dir_x * DIST_CAM,
                    0.0 - dir_y * DIST_CAM,
                    foco_z - dir_z * DIST_CAM)
    cam.rotation_euler = (math.pi / 2 - THETA, 0.0, 0.0)
    return cam


def configurar_render(scene, fmt='WEBP'):
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x = RES_X
    scene.render.resolution_y = RES_Y
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = fmt
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.quality = 100


def medir_silhueta(scene, tmp_png):
    """Renderiza o frame atual e mede a silhueta (alpha) sem depender de PIL."""
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = os.path.abspath(tmp_png)
    bpy.ops.render.render(write_still=True)
    scene.render.image_settings.file_format = 'WEBP'

    img = bpy.data.images.load(os.path.abspath(tmp_png), check_existing=False)
    w, h = img.size
    px = img.pixels[:]  # RGBA float, linhas de baixo (r=0) para cima
    r_min, r_max = None, None
    for r in range(h):
        base = r * w * 4
        ocupado = any(px[base + c * 4 + 3] > 0.02 for c in range(w))
        if ocupado:
            r_min = r if r_min is None else r_min
            r_max = r
    bpy.data.images.remove(img)
    if r_min is None:
        return None
    altura_px = r_max - r_min + 1
    feet_top_y = h - 1 - r_min   # pé = linha mais baixa (r_min) em coords topo-down
    return altura_px, feet_top_y


def calibrar_camera(scene, arm_obj, meshes, args):
    """Renderiza a T-pose, mede e ajusta ortho + posição vertical (anchor 90)."""
    tmp = os.path.join(os.path.dirname(args.output.rstrip("/\\")), "_cal_tmp.png")

    _, zmax = altura_mundo(meshes)
    foco_z = zmax / 2.0  # mira no meio do corpo

    if str(args.scale).lower() != "auto":
        ortho = float(args.scale)
        cam = criar_camera(scene, ortho, foco_z)
    else:
        # Provisório: ortho generoso (zmax inteiro) p/ a T-pose caber sem clipar.
        ortho = max(0.5, zmax) * 1.15
        cam = criar_camera(scene, ortho, foco_z)
        m = medir_silhueta(scene, tmp)
        if m:
            altura_px, _ = m
            ortho = ortho * (altura_px / ALTURA_ALVO_PX) * args.margin
            cam.data.ortho_scale = ortho

    # Ajuste fino vertical (2 passes): coloca os pés exatamente no pixel 90.
    for _ in range(2):
        m2 = medir_silhueta(scene, tmp)
        if not m2:
            break
        altura_px, feet_top_y = m2
        erro_px = feet_top_y - ANCHOR_Y               # >0 = pés baixos demais
        if abs(erro_px) <= 1:
            break
        px_por_unidade = altura_px / max(0.001, zmax)
        dz = erro_px / px_por_unidade                 # sobe o personagem
        arm_obj.location.z -= dz
        for mo in meshes:
            if mo.parent is None:
                mo.location.z -= dz
        bpy.context.view_layer.update()
    print(f"  Calibrado: ortho={ortho:.3f}, foco_z={foco_z:.3f}, "
          f"altura_px={altura_px}, feet_y->{ANCHOR_Y}")
    try:
        os.remove(tmp)
    except OSError:
        pass
    return cam


def render_direcoes(target_arm, meshes, args):
    scene = bpy.context.scene

    if args.start_frame is None:
        args.start_frame = int(target_arm.animation_data.action.frame_range[0])
    if args.end_frame is None:
        args.end_frame = int(target_arm.animation_data.action.frame_range[1])

    fps_blender = scene.render.fps
    step = max(1, round(fps_blender / args.fps))
    frames = list(range(args.start_frame, args.end_frame + 1, step))

    direcoes = DIRECOES_8 if args.directions == 8 else DIRECOES_4
    print(f"  Frames: {frames}  ({len(frames)}) | direções: {len(direcoes)}")

    for nome_dir, ang in direcoes:
        target_arm.rotation_euler.z = math.radians(ang)
        bpy.context.view_layer.update()
        for idx, frame in enumerate(frames):
            scene.frame_set(frame)
            pasta = os.path.join(args.output, nome_dir)
            os.makedirs(pasta, exist_ok=True)
            scene.render.filepath = os.path.abspath(
                os.path.join(pasta, f"frame_{idx:03d}.webp"))
            bpy.ops.render.render(write_still=True)
    print(f"  ✓ Render: {len(frames)} frames × {len(direcoes)} direções → {args.output}")


def main():
    args = parse_args()
    limpar_cena()

    scene = bpy.context.scene

    print(f"### Alvo: {args.target}")
    target_arm, target_meshes = importar_fbx(args.target)
    # Zera rotação do alvo para controlarmos via Z nas direções.
    target_arm.rotation_euler = (target_arm.rotation_euler.x, target_arm.rotation_euler.y, 0.0)

    # Aterra na T-pose (pés em z=0) e calibra câmera ANTES de animar,
    # garantindo escala/anchor consistentes entre todas as animações.
    aterrar_personagem(target_arm, target_meshes)
    setup_iluminacao(scene)
    configurar_render(scene)
    calibrar_camera(scene, target_arm, target_meshes, args)

    print(f"### Animação: {args.anim}")
    source_arm, _ = importar_fbx(args.anim)

    action = source_arm.animation_data.action
    fr_ini = int(action.frame_range[0])
    fr_fim = int(action.frame_range[1])
    print(f"### Action '{action.name}' frames {fr_ini}-{fr_fim}")

    retarget(source_arm, target_arm, fr_ini, fr_fim, root_vertical=args.root_vertical)

    # Remove a armature/anim fonte; mantém só a Marnie animada.
    bpy.data.objects.remove(source_arm, do_unlink=True)

    render_direcoes(target_arm, target_meshes, args)


if __name__ == "__main__":
    main()
