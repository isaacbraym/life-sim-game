import os
import json
from datetime import datetime, timezone

def check_has_frames(animation_dir, direcao):
    # Pasta de frames correspondente
    frames_dir = os.path.join(animation_dir, "frames")
    if not os.path.isdir(frames_dir):
        return False
    
    # 1. Caso direto: frames/{direcao}/*.webp
    direct_dir = os.path.join(frames_dir, direcao)
    if os.path.isdir(direct_dir):
        files = os.listdir(direct_dir)
        if any(f.lower().endswith('.webp') for f in files):
            return True
            
    # 2. Caso por camada: frames/{layer}/{direcao}/*.webp
    if os.path.exists(frames_dir):
        for item in os.listdir(frames_dir):
            layer_path = os.path.join(frames_dir, item)
            if os.path.isdir(layer_path):
                dir_path = os.path.join(layer_path, direcao)
                if os.path.isdir(dir_path):
                    files = os.listdir(dir_path)
                    if any(f.lower().endswith('.webp') for f in files):
                        return True
                        
    return False

def gerar_index():
    base_dir = os.path.join("content", "character-animations")
    if not os.path.isdir(base_dir):
        print(f"Diretorio {base_dir} nao existe. Criando...")
        os.makedirs(base_dir, exist_ok=True)
        
    clips = []
    
    # Percorrer recursivamente o diretorio das animacoes
    for root, dirs, files in os.walk(base_dir):
        # Ignorar pastas de frames no proprio percurso
        if "frames" in root.split(os.sep):
            continue
            
        for file in files:
            # Encontrar apenas arquivos .json e que nao sejam o proprio index.json
            if file.endswith(".json") and file != "index.json":
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    animacao_id = data.get("animacaoId")
                    direcao = data.get("direcao")
                    
                    if animacao_id and direcao:
                        # Caminho relativo ao base_dir para usar no JSON
                        rel_path = os.path.relpath(file_path, base_dir).replace(os.sep, "/")
                        
                        # Diretorio pai do arquivo JSON
                        animation_dir = os.path.dirname(file_path)
                        
                        # Verificar se existem frames validos
                        tem_frames = check_has_frames(animation_dir, direcao)
                        
                        clips.append({
                            "animacaoId": animacao_id,
                            "direcao": direcao,
                            "path": rel_path,
                            "temFrames": tem_frames
                        })
                except Exception as e:
                    print(f"Erro ao processar {file_path}: {e}")
                    
    # Ordenar os clipes por ID e direcao
    clips.sort(key=lambda c: (c["animacaoId"], c["direcao"]))
    
    index_data = {
        "clips": clips,
        "geradoEm": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    }
    
    index_path = os.path.join(base_dir, "index.json")
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, indent=2, ensure_ascii=False)
        
    print(f"Index gerado com sucesso em {index_path} ({len(clips)} clips listados).")

if __name__ == "__main__":
    gerar_index()
