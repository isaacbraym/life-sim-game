import bpy
import math
import os
import sys
import argparse

def parse_args():
    # Encontrar os argumentos após '--' na chamada do Blender
    if "--" in sys.argv:
        args_list = sys.argv[sys.argv.index("--") + 1:]
    else:
        args_list = []

    parser = argparse.ArgumentParser(description="Pipeline de bake headless para animações 2.5D do Vida.")
    parser.add_argument("--input", required=True, help="Caminho do arquivo FBX de entrada.")
    parser.add_argument("--output", required=True, help="Pasta de saída para os frames renderizados.")
    parser.add_argument("--fps", type=int, default=12, help="Frames por segundo da animação de saída.")
    parser.add_argument("--directions", type=int, default=8, choices=[4, 8], help="Número de direções (4 ou 8).")
    parser.add_argument("--start-frame", type=int, default=1, help="Frame de início.")
    parser.add_argument("--end-frame", type=int, default=None, help="Frame de fim (auto se não fornecido).")
    parser.add_argument("--layer", type=str, default="all", help="Nome do mesh/camada específico para bake. Se omitido, renderiza todos separado.")
    parser.add_argument("--scale", type=float, default=1.0, help="OrthoScale da câmera (ajuste de enquadramento).")

    return parser.parse_args(args_list)

def setup_render_scene(args):
    # 1. Limpar cena default do Blender (Cube, Light, Camera)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # 2. Importar FBX
    print(f"Importando FBX de: {args.input}")
    # O operador do Blender 4.2 para importação de FBX é bpy.ops.import_scene.fbx
    try:
        bpy.ops.import_scene.fbx(filepath=args.input)
    except Exception as e:
        print(f"Erro ao importar FBX: {e}")
        # Tenta reativar o addon ou usar alternativa se necessário
        sys.exit(1)

    # Identificar Armature e Meshes
    scene_objects = bpy.context.scene.objects
    armatures = [obj for obj in scene_objects if obj.type == 'ARMATURE']
    if not armatures:
        print("Erro: Nenhum esqueleto (ARMATURE) encontrado no FBX.")
        sys.exit(1)
    armature = armatures[0]

    meshes = [obj for obj in scene_objects if obj.type == 'MESH']
    if not meshes:
        print("Erro: Nenhum mesh encontrado na cena.")
        sys.exit(1)

    # 3. Adicionar iluminação padrão
    light_data = bpy.data.lights.new(name="BakeSun", type='SUN')
    light_data.energy = 3.0
    light_object = bpy.data.objects.new(name="BakeSun", object_data=light_data)
    bpy.context.scene.collection.objects.link(light_object)
    light_object.location = (5, -5, 10)
    # Rotação para luz incidir diagonalmente
    light_object.rotation_euler = (math.radians(45), 0, math.radians(45))

    # Luz de preenchimento suave
    fill_light_data = bpy.data.lights.new(name="BakeFill", type='SUN')
    fill_light_data.energy = 1.0
    fill_light_object = bpy.data.objects.new(name="BakeFill", object_data=fill_light_data)
    bpy.context.scene.collection.objects.link(fill_light_object)
    fill_light_object.location = (-5, 5, 10)
    fill_light_object.rotation_euler = (math.radians(135), 0, math.radians(225))

    # 4. Criar câmera ortográfica dimétrica
    camera_data = bpy.data.cameras.new(name="BakeCamera")
    camera_data.type = 'ORTHO'
    camera_data.ortho_scale = args.scale
    
    camera_object = bpy.data.objects.new(name="BakeCamera", object_data=camera_data)
    bpy.context.scene.collection.objects.link(camera_object)
    bpy.context.scene.camera = camera_object

    # Enquadramento dimétrico com âncora no pé:
    # A base dos pés está na origem (0,0,0).
    # Queremos alinhar a base do pé no pixel (32, 90) de um canvas 64x96.
    # A diferença do centro (48) para a âncora (90) é 42 pixels para baixo.
    # Deslocamento vertical no plano do canvas: dy = 42 pixels.
    # No 3D, isso equivale a deslocar o ponto de foco da câmera para cima.
    # offset_z = (dy_pixels / resolution_y) * ortho_scale / sin(math.atan(0.5))
    theta = math.atan(0.5) # ~26.565°
    sin_theta = math.sin(theta)
    
    res_y = 96
    anchor_y = 90
    dy = anchor_y - (res_y / 2.0) # 42 pixels
    
    # Calcular offset_z
    offset_z = (dy / res_y) * args.scale / sin_theta

    # Posicionar câmera: Y = -distance, Z = distance * 2.0 + offset_z
    distance = 10.0
    camera_object.location = (0, -distance, distance * 2.0 + offset_z)
    camera_object.rotation_euler = (theta, 0.0, 0.0)

    # 5. Configurar renderizador
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x = 64
    scene.render.resolution_y = 96
    scene.render.film_transparent = True
    
    # Formato WEBP RGBA sem perdas (lossless)
    scene.render.image_settings.file_format = 'WEBP'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.quality = 100

    return armature, meshes

def run_bake(args, armature, meshes):
    scene = bpy.context.scene

    # 1. Detectar end-frame automaticamente se não fornecido
    if args.end_frame is None:
        if armature.animation_data and armature.animation_data.action:
            args.end_frame = int(armature.animation_data.action.frame_range[1])
            print(f"End frame auto-detectado: {args.end_frame}")
        else:
            args.end_frame = 30
            print(f"Nenhuma animação ativa detectada. Usando end frame padrão: {args.end_frame}")

    # 2. Calcular step das frames
    fps_blender = scene.render.fps
    step = max(1, round(fps_blender / args.fps))
    frames_to_render = list(range(args.start_frame, args.end_frame + 1, step))
    print(f"Frames Blender a renderizar ({fps_blender} -> {args.fps} FPS): {frames_to_render}")

    # 3. Definir direções de acordo com argumento
    DIRECOES_8 = [
        ('NE', 0),   ('E', 45),   ('SE', 90),  ('S', 135),
        ('SW', 180), ('W', 225),  ('NW', 270), ('N', 315),
    ]
    DIRECOES_4 = [('SE', 90), ('S', 135), ('SW', 180), ('W', 225)]
    
    direcoes_selecionadas = DIRECOES_8 if args.directions == 8 else DIRECOES_4

    # 4. Filtrar meshes alvo
    if args.layer != "all":
        meshes_alvo = [m for m in meshes if m.name == args.layer]
        if not meshes_alvo:
            print(f"Erro: Camada (mesh) com nome '{args.layer}' não encontrada.")
            sys.exit(1)
    else:
        meshes_alvo = meshes

    print(f"Bakeando {len(meshes_alvo)} camadas: {[m.name for m in meshes_alvo]}")

    n_frames = len(frames_to_render)
    n_direcoes = len(direcoes_selecionadas)
    n_meshes = len(meshes_alvo)
    total_renders = n_direcoes * n_frames * n_meshes
    contador = 0

    # Guardar estado de visibilidade original
    visibilidade_original = {m.name: m.hide_render for m in meshes}

    # Loop principal: Direções -> Frames -> Camadas (Meshes)
    for i_dir, (nome_direcao, angulo_graus) in enumerate(direcoes_selecionadas, 1):
        print(f"Renderizando direção {nome_direcao} ({i_dir}/{n_direcoes})...")
        
        # Rotacionar armature no eixo Z
        armature.rotation_euler.z = math.radians(angulo_graus)
        bpy.context.view_layer.update()

        for frame in frames_to_render:
            scene.frame_set(frame)
            indice_frame = frames_to_render.index(frame)

            for mesh in meshes_alvo:
                # Ocultar todos os meshes no render
                for m in meshes:
                    m.hide_render = True

                # Exibir apenas o mesh atual
                mesh.hide_render = False

                # Configurar caminho de saída
                # Formato: output/mesh_name/direcao/frame_000.webp
                pasta_saida = os.path.join(args.output, mesh.name, nome_direcao)
                os.makedirs(pasta_saida, exist_ok=True)
                
                nome_frame = f"frame_{indice_frame:03d}.webp"
                caminho_final = os.path.join(pasta_saida, nome_frame)
                scene.render.filepath = os.path.abspath(caminho_final)

                # Renderizar frame único
                bpy.ops.render.render(write_still=True)
                
                contador += 1
                if contador % 10 == 0 or contador == total_renders:
                    print(f"  Progresso: {contador}/{total_renders} frames gerados.")

    # Restaurar visibilidade original
    for m in meshes:
        m.hide_render = visibilidade_original[m.name]

    print(f"✓ Bake concluído: {n_frames} frames × {n_direcoes} direções × {n_meshes} camadas")
    print(f"  Output: {args.output}")

def main():
    args = parse_args()
    armature, meshes = setup_render_scene(args)
    run_bake(args, armature, meshes)

if __name__ == "__main__":
    main()
