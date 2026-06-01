import bpy
import math
import os

def setup_test_scene():
    # 1. Limpar cena
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # 2. Criar Cubo de teste
    bpy.ops.mesh.primitive_cube_add(size=2, enter_editmode=False, align='WORLD', location=(0, 0, 0))
    cube = bpy.context.active_object
    cube.name = "TestCube"

    # 3. Criar luz (Sol) para sombreamento
    light_data = bpy.data.lights.new(name="SunLight", type='SUN')
    light_data.energy = 3.0
    light_object = bpy.data.objects.new(name="SunLight", object_data=light_data)
    bpy.context.scene.collection.objects.link(light_object)
    light_object.location = (5, -5, 10)
    light_object.rotation_euler = (math.radians(45), 0, math.radians(45))

    # 4. Criar câmera ortográfica dimétrica
    camera_data = bpy.data.cameras.new(name="OrthoCamera")
    camera_data.type = 'ORTHO'
    camera_data.ortho_scale = 4.0
    camera_data.sensor_fit = 'VERTICAL'

    camera_object = bpy.data.objects.new(name="OrthoCamera", object_data=camera_data)
    bpy.context.scene.collection.objects.link(camera_object)
    bpy.context.scene.camera = camera_object

    # Projeção dimétrica 2:1 (Habbo-style): ELEVAÇÃO de 26.57° ACIMA da horizontal.
    # rotation.x = pi/2 - atan(0.5) ≈ 63.43°. NÃO usar atan(0.5) (vista top-down).
    # viewdir = (0, cos θ, -sin θ); câmera = origem - viewdir * distância (mira o centro).
    theta = math.atan(0.5)
    distance = 10.0
    camera_object.location = (0.0, -math.cos(theta) * distance, math.sin(theta) * distance)
    camera_object.rotation_euler = (math.pi / 2 - theta, 0, 0)

    # 5. Configurar Render
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x = 64
    scene.render.resolution_y = 96
    scene.render.film_transparent = True
    
    # Formato PNG para o teste
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'

    return cube

def run_test_bake():
    cube = setup_test_scene()
    
    # Definição das 8 direções e seus ângulos em graus
    DIRECOES_8 = [
        ('NE', 0),   ('E', 45),   ('SE', 90),  ('S', 135),
        ('SW', 180), ('W', 225),  ('NW', 270), ('N', 315),
    ]

    output_dir = os.path.join("scripts", "blender", "output_test")
    os.makedirs(output_dir, exist_ok=True)

    print(f"Iniciando renderização de teste no diretório: {output_dir}")

    for direcao, angulo_graus in DIRECOES_8:
        # Rotacionar o objeto no eixo Z
        cube.rotation_euler.z = math.radians(angulo_graus)
        bpy.context.view_layer.update()

        # Configurar caminho de saída
        output_file = os.path.join(output_dir, f"{direcao}.png")
        bpy.context.scene.render.filepath = os.path.abspath(output_file)

        print(f"  Renderizando {direcao} (ângulo: {angulo_graus}°)...")
        bpy.ops.render.render(write_still=True)

    print("✓ Teste concluído com sucesso!")

if __name__ == "__main__":
    run_test_bake()
