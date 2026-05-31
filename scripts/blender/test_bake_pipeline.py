# Teste do pipeline de bake headless — Vida 2.5D
#
# Valida que o ambiente Blender consegue renderizar as 8 direções na projeção
# dimétrica do projeto (~26.57°, razão 2:1), com fundo transparente, 64x96px.
#
# Uso:
#   "C:\Program Files\Blender Foundation\Blender 4.2\blender.exe" \
#     --background --python scripts/blender/test_bake_pipeline.py
#
# Saída: scripts/blender/output_test/{direcao}.png  (8 PNGs N..NW)

import bpy
import math
import os

# 8 direções → rotação do objeto no eixo Z (graus).
# Mantém o mapeamento da projeção dimétrica do projeto.
DIRECOES = [
    ('N', 315), ('NE', 0), ('E', 45), ('SE', 90),
    ('S', 135), ('SW', 180), ('W', 225), ('NW', 270),
]

RESOLUCAO_X = 64
RESOLUCAO_Y = 96
ORTHO_SCALE = 3.0
# Inclinação dimétrica: atan(0.5) ≈ 26.57°, produz a razão de pixel 2:1.
INCLINACAO_DIMETRICA = math.atan(0.5)


def limpar_cena():
    """Remove todos os objetos da cena default (cubo, luz, câmera)."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    # Limpa data órfã para não acumular entre execuções.
    for bloco in (bpy.data.meshes, bpy.data.cameras, bpy.data.lights):
        for item in list(bloco):
            bloco.remove(item)


def criar_objeto_teste():
    """Cubo simples como stand-in do personagem."""
    bpy.ops.mesh.primitive_cube_add(size=1.5, location=(0, 0, 0.75))
    return bpy.context.active_object


def criar_camera_dimetrica():
    cam_data = bpy.data.cameras.new('CamDimetrica')
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = ORTHO_SCALE

    cam_obj = bpy.data.objects.new('CamDimetrica', cam_data)
    cam_obj.location = (0.0, -8.0, 4.0)
    cam_obj.rotation_euler = (INCLINACAO_DIMETRICA, 0.0, 0.0)

    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    return cam_obj


def criar_luz():
    """Luz solar simples para o cubo não sair preto (não afeta o teste de geometria)."""
    luz_data = bpy.data.lights.new('Sol', type='SUN')
    luz_data.energy = 3.0
    luz_obj = bpy.data.objects.new('Sol', luz_data)
    luz_obj.location = (4.0, -6.0, 8.0)
    luz_obj.rotation_euler = (math.radians(45), 0.0, math.radians(30))
    bpy.context.scene.collection.objects.link(luz_obj)


def configurar_render():
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x = RESOLUCAO_X
    scene.render.resolution_y = RESOLUCAO_Y
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'


def main():
    pasta_script = os.path.dirname(os.path.abspath(__file__))
    pasta_saida = os.path.join(pasta_script, 'output_test')
    os.makedirs(pasta_saida, exist_ok=True)

    limpar_cena()
    cubo = criar_objeto_teste()
    criar_camera_dimetrica()
    criar_luz()
    configurar_render()

    scene = bpy.context.scene
    for nome, graus in DIRECOES:
        cubo.rotation_euler.z = math.radians(graus)
        scene.render.filepath = os.path.join(pasta_saida, f'{nome}.png')
        # write_still=True grava o frame atual; sem animation=True (frame a frame).
        bpy.ops.render.render(write_still=True)
        print(f'  • {nome}.png ({graus}°)')

    print(f'✓ Bake de teste concluido. Verifique: {pasta_saida}')


if __name__ == '__main__':
    main()
