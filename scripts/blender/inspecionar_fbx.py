import bpy
import sys
import os

def args_after_dashes():
    if "--" in sys.argv:
        return sys.argv[sys.argv.index("--") + 1:]
    return []

def limpar():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    # purge data
    for block in list(bpy.data.actions):
        bpy.data.actions.remove(block)
    for block in list(bpy.data.armatures):
        try:
            bpy.data.armatures.remove(block)
        except Exception:
            pass

def importar(caminho):
    ext = os.path.splitext(caminho)[1].lower()
    if ext == ".fbx":
        bpy.ops.import_scene.fbx(filepath=caminho)
    elif ext == ".dae":
        bpy.ops.wm.collada_import(filepath=caminho)
    elif ext in (".glb", ".gltf"):
        bpy.ops.import_scene.gltf(filepath=caminho)
    elif ext == ".obj":
        bpy.ops.wm.obj_import(filepath=caminho)
    else:
        raise RuntimeError(f"Formato nao suportado: {ext}")

def relatar():
    print("\n" + "=" * 60)
    print("=== OBJETOS NA CENA ===")
    for obj in bpy.data.objects:
        verts = len(obj.data.vertices) if obj.type == 'MESH' else 'N/A'
        print(f"  [{obj.type}] {obj.name} | verts: {verts} | scale: {tuple(round(s,3) for s in obj.scale)}")

    print("\n=== ARMATURES (RIGS) ===")
    for arm in bpy.data.armatures:
        bones = arm.bones
        print(f"  Armature '{arm.name}' | total bones: {len(bones)}")
        # hierarquia
        roots = [b for b in bones if b.parent is None]
        def printar(bone, nivel):
            print(f"      {'  '*nivel}- {bone.name}")
            for c in bone.children:
                printar(c, nivel+1)
        for r in roots:
            printar(r, 0)

    print("\n=== ANIMACOES (ACTIONS) ===")
    if not bpy.data.actions:
        print("  (nenhuma)")
    for action in bpy.data.actions:
        fr = action.frame_range
        print(f"  {action.name} | frames: {fr[0]:.0f}-{fr[1]:.0f} | fcurves: {len(action.fcurves)}")

    print("\n=== MATERIAIS ===")
    for mat in bpy.data.materials:
        print(f"  {mat.name}")

    print("\n=== IMAGENS/TEXTURAS ===")
    for img in bpy.data.images:
        print(f"  {img.name} | size: {img.size[0]}x{img.size[1]} | file: {img.filepath}")

    print("\n=== SHAPE KEYS ===")
    for mesh in bpy.data.meshes:
        if mesh.shape_keys:
            print(f"  {mesh.name}: {[k.name for k in mesh.shape_keys.key_blocks]}")

    # bounding box do conjunto de meshes (para escala/altura)
    print("\n=== DIMENSOES ===")
    minz = 1e9; maxz = -1e9; maxdim = 0
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            d = obj.dimensions
            print(f"  {obj.name}: dims {tuple(round(x,3) for x in d)} | loc {tuple(round(x,3) for x in obj.location)}")

def main():
    a = args_after_dashes()
    if not a:
        print("Uso: -- <arquivo>")
        return
    caminho = a[0]
    limpar()
    print(f"\n### Inspecionando: {caminho}")
    try:
        importar(caminho)
    except Exception as e:
        print(f"ERRO ao importar: {e}")
        return
    relatar()
    print("\n### FIM\n")

if __name__ == "__main__":
    main()
