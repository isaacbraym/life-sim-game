# 16 — Pipeline de Animação de Personagens

## Visão geral

O pipeline de animação de personagens do **Vida 2.5D** foi projetado para ser leve, rápido de carregar e eficiente em runtime. O sistema utiliza animações 3D pré-renderizadas de forma automatizada e fatiadas em camadas bidimensionais para recomposição e controle dinâmico no jogo.

O pipeline é composto por 3 fases principais:
```
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│        FASE 1          │      │        FASE 2          │      │        FASE 3 & 4      │
│  Mixamo (Animações)   ├─────>│ Blender Headless Bake  ├─────>│  Dev-Tools Validation  │
│  Export FBX 30fps      │      │ Sprite Sheets WebP     │      │  Runtime (PixiJS)      │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
```

1. **Mixamo**: Obtenção de animações esqueléticas de personagens gratuitas no formato FBX.
2. **Blender Headless Bake**: Processamento e renderização automática de sprite sheets WebP com fundo transparente por camada de mesh, nas 8 direções dimétricas do projeto.
3. **CharacterAnimator Runtime**: Validação das animações no proofer e execução das animações no canvas do jogo (PixiJS) aplicando os offsets e frames corretos.

---

## Fase 1 — Obter animações no Mixamo (grátis)

O Mixamo é a plataforma gratuita da Adobe usada para obter rigs base e animações de alta qualidade.

### Passo a passo para obtenção dos assets:

1. **Acesse o site**: Crie ou acesse uma conta Adobe gratuita em [mixamo.com](https://www.mixamo.com).
2. **Escolha o Personagem**:
   - Utilize um modelo padrão (ex: **Y Bot** ou **Beta Bot**) para obter animações limpas e compatíveis com o esqueleto padrão do jogo.
3. **Busque a Animação**:
   - Procure pelo movimento desejado (ex: "Walking", "Idle", "Sitting Down").
   - **Regra obrigatória para locomoção (walk/run)**: Ative a opção **In Place** (No Lugar) nas configurações da animação no painel direito. O deslocamento do personagem em jogo é controlado exclusivamente por código TypeScript (BFS/GSAP), e não pelo movimento interno da animação (Root Motion).
4. **Configurações de Exportação (Download)**:
   - Clique em **Download** no canto superior direito.
   - Configure exatamente como abaixo:
     - **Format**: `FBX Binary (.fbx)`
     - **Skin**: `Without Skin` (apenas as curvas de animação dos ossos para manter o arquivo leve)
     - **Frames per Second**: `30`
     - **Keyframe Reduction**: `none`
5. **Organização do arquivo**:
   - Mova o arquivo baixado para o diretório de entrada do pipeline de bake:
     `scripts/blender/input/{animacaoId}.fbx` (ex: `scripts/blender/input/walk.fbx`)

### Lista de animações recomendadas para o MVP:
Consulte a tabela na seção [Plano de animações para o MVP](#plano-de-animacoes-para-o-mvp) para ver os IDs e termos de busca padrão do Mixamo.

---

## Fase 2 — Bake no Blender 4.2 (grátis)

O script Python headless automatiza a renderização de todas as frames da animação 3D convertendo-as na perspectiva dimétrica do projeto.

### Projeção Dimétrica 26.57° (Habbo-Style)
O projeto utiliza uma câmera ortográfica configurada com declive dimétrico clássico (proporção 2:1 no pixel art). A câmera permanece fixa e o objeto (Armature) é rotacionado em 8 ângulos de Z para capturar as 8 direções:
- **Ângulos de rotação do Objeto (Armature Z)**:
  - `NE` = 0° (frente da câmera)
  - `E`  = 45°
  - `SE` = 90°
  - `S`  = 135°
  - `SW` = 180°
  - `W`  = 225°
  - `NW` = 270°
  - `N`  = 315°

- **Configuração da Câmera**:
  - `Rotation X` = `arctan(0.5) ≈ 26.57°` (`math.atan(0.5)` radianos)
  - `Rotation Y` = 0
  - `Rotation Z` = 0
  - `Tipo`: `ORTHO`
  - `Resolução`: 64 × 96 px
  - `Fundo`: Transparente (`film_transparent = True`)
  - `Formato de saída`: WebP Lossless (Qualidade = 100)

- **Alinhamento do Anchor (32, 90)**:
  - A origem 3D `(0, 0, 0)` representa a base dos pés do personagem.
  - Para alinhar essa base com o pixel `(32, 90)` na imagem 64x96 px final, o script desloca a câmera verticalmente aplicando a fórmula de offset:
    $$\text{offset}_z = \frac{\text{anchor}_y - (\text{res}_y / 2.0)}{\text{res}_y} \times \frac{\text{ortho\_scale}}{\sin(\theta)}$$
    Onde $\theta = \arctan(0.5)$. Isso garante o enquadramento exato e consistente em todos os renders de forma automática.

### Como funciona o script `bake_character.py`

O script é executado via terminal de forma silenciosa (background/headless) sem abrir a interface gráfica do Blender:

```bash
"C:\Program Files\Blender Foundation\Blender 4.2\blender.exe" ^
  --background ^
  --python scripts/blender/bake_character.py ^
  -- ^
  --input scripts/blender/input/walk.fbx ^
  --output content/character-animations/andar/frames/ ^
  --fps 12 ^
  --directions 8
```

#### Argumentos disponíveis (via CLI após `--`):

| Argumento | Tipo | Default | Descrição |
|---|---|---|---|
| `--input` | path | Obrigatório | Caminho do arquivo FBX exportado do Mixamo. |
| `--output` | path | Obrigatório | Pasta de destino dos sprites. |
| `--fps` | int | 12 | Taxa de frames desejada. Reduz dinamicamente a animação de 30 FPS. |
| `--directions` | int | 8 | 4 ou 8 direções de saída. |
| `--start-frame` | int | 1 | Frame inicial para processamento. |
| `--end-frame` | int | auto | Frame final (se omitido, é auto-detectado da timeline). |
| `--layer` | str | all | Filtra apenas um mesh específico para renderizar (ou `all`). |
| `--scale` | float | 1.0 | Ajuste de escala ortográfica da câmera (`ortho_scale`). |

### Bake por Camadas (`hide_render` loop)

Para suportar customização (mudar cabelo, roupa, sapatos separadamente), o personagem é importado como um esqueleto contendo múltiplos sub-meshes. O script realiza o bake isoladamente para cada camada:
1. Ele oculta todos os meshes da cena setando `mesh.hide_render = True`.
2. Para cada frame e direção, ele ativa apenas o mesh atual (`mesh.hide_render = False`) e renderiza a sprite individual.
3. As imagens finais são organizadas em pastas separadas pelo nome do mesh no Blender (ex: `Beta_Body`, `Beta_Joints`).

---

## Fase 3 — Validação no Animation Proofer (dev-tools)

Depois que as sprites foram bakeadas no Blender, o desenvolvedor deve usar o **Animation Proofer** no app de ferramentas de desenvolvimento para validar visualmente o resultado antes de integrá-lo ao repositório principal.

### Como abrir e testar:
1. Inicie o servidor do dev-tools executando no terminal raiz:
   ```bash
   pnpm dev:tools
   ```
2. Abra a interface do app no navegador e acesse a ferramenta correspondente através do atalho **Ctrl+6** (ou clique em **Character Editor / Animation Proofer**).
3. **Fluxo de validação**:
   - Carregue o clip gerado no visualizador.
   - Teste o preview da animação em loop, ajustando as direções na interface.
   - Verifique se os offsets por direção no JSON da animação alinham as sprites de forma harmoniosa com os outros itens do rig esquelético.
   - Salve os ajustes finos diretamente através da File System Access API configurada no dev-tools.

---

## Fase 4 — Runtime no jogo (CharacterAnimator)

O componente `CharacterAnimator` é responsável por ler os arquivos JSON de metadados das animações sob `content/character-animations/` e desenhar as sprites correspondentes em runtime no canvas PixiJS do jogo.

### Como funciona a renderização:
- **Resolução de Clips**: O runtime pesquisa no arquivo index (`content/character-animations/index.json`) se a animação requisitada está disponível e possui frames pré-renderizados para a direção desejada.
- **GSAP Fallback**: Se o clip de frames não existir (ou o carregamento falhar), o jogo aplica uma animação de balanço suave (bobbing/scaling) baseada em interpolação GSAP procedural no corpo base do personagem para simular a ação (ex: respiração ou caminhada genérica).
- **Troca de animações**: As trocas de estado (ex: de `idle` para `andar` ao se mover) ocorrem aplicando transições suaves baseadas em ticks do game loop, zerando e atualizando a contagem de frames (`frameIndex`).

---

## Plano de animações para o MVP

As animações prioritárias para a primeira versão pública do jogo estão listadas abaixo:

| Clip ID | Descrição | Mixamo Search | Prioridade | Observação |
|---|---|---|---|---|
| **andar** | Caminhada padrão | "Walking" | Alta | Ativar `In Place` no Mixamo. |
| **idle** | Respiração natural de pé | "Idle" | Alta | Movimento sutil. |
| **sentar** | Transição para sentar | "Sitting Down" | Alta | Usada ao interagir com sofás/cadeiras. |
| **levantar** | Ficar de pé a partir do assento | "Standing Up" | Alta | Retorno ao estado de exploração. |
| **dormir** | Deitado na cama dormindo | "Sleeping" | Média | Executado deitado com olhos fechados. |
| **acenar** | Cumprimentar NPCs | "Waving" | Média | Disparado em interações sociais. |
| **pegar_objeto** | Pegar item no chão | "Picking Up" | Média | Usado em quests e faxina. |
| **usar_computador** | Digitar no teclado sentado | "Typing" | Baixa | Interação com mesas de trabalho/PC. |
| **falar_celular** | Conversar ao telefone | "Talking On Phone" | Baixa | Ação executada em pé. |

---

## Estrutura de arquivos

A estrutura de arquivos do pipeline está organizada como segue:

```
life-sim-game/
├── instructions/
│   ├── 14-character-pipeline.md       # Rig esquelético e specs das partes
│   └── 16-animation-pipeline.md       # Este documento de pipeline de animação
├── scripts/
│   └── blender/
│       ├── input/                     # [FBX] Entrada de arquivos baixados do Mixamo
│       │   └── walk.fbx
│       ├── output_test/               # [PNG] Resultados de render de teste
│       │   └── NE.png ... N.png
│       ├── bake_character.py          # [PY] Script principal de produção
│       ├── test_bake_pipeline.py      # [PY] Script de teste de ambiente (cubo)
│       ├── gerar_index_animacoes.py   # [PY] Script de indexação de JSONs
│       └── README.md                  # [MD] Guia rápido de comandos
└── content/
    └── character-animations/
        ├── index.json                 # [JSON] Índice gerado automaticamente
        └── andar/
            ├── N.json ... NW.json     # [JSON] Metadados por direção
            └── frames/                # [WebP] Sprites organizados por mesh e direção
                ├── Beta_Body/
                │   ├── N/
                │   │   ├── frame_000.webp
                │   │   └── ...
                │   └── NE/
                └── Beta_Joints/
```

---

## Agosto/2026 — Upgrade do pipeline

No planejamento de expansão técnica do projeto para **Agosto de 2026**, estão previstos investimentos em ferramentas avançadas para ganho de velocidade e qualidade de produção artística:

1. **Meshy Pro ($20/mês)**:
   - Utilização de inteligência artificial generativa 3D para criação de malhas texturizadas a partir de prompts de texto ou imagens de referência.
   - Auto-rigging rápido de novos personagens e exportação direta de animações adaptadas ao esqueleto padrão do jogo.
2. **Cascadeur Indie ($99/ano)**:
   - Refinamento físico das animações FBX obtidas. O Cascadeur auxilia no ajuste automático do centro de gravidade, poses chaves e correção de interpolação física para evitar que o personagem pareça "deslizar".
   - Limite de faturamento da licença Indie é de **US$ 100k** anuais.
3. **Persistência do Pipeline Blender**:
   - Mesmo com o uso de Meshy e Cascadeur, o pipeline do Blender headless implementado (`bake_character.py`) continuará sendo o **core** de exportação. Os modelos 3D criados e animados por essas ferramentas ainda precisarão ser processados pelo script no Blender 4.2 para renderização final das sprites nas 8 direções dimétricas do jogo.

---

## Referências

- **Mixamo**: [https://www.mixamo.com](https://www.mixamo.com)
- **Blender Python API 4.2**: [https://docs.blender.org/api/4.2/](https://docs.blender.org/api/4.2/)
- **Script de Bake**: [scripts/blender/bake_character.py](file:///C:/PROJETOS/Projeto_Vida2_5_D/life-sim-game/scripts/blender/bake_character.py)
- **Script de Teste**: [scripts/blender/test_bake_pipeline.py](file:///C:/PROJETOS/Projeto_Vida2_5_D/life-sim-game/scripts/blender/test_bake_pipeline.py)
- **Animation Proofer (Dev Tools QA)**: [instructions/11-devtools-qa.md](file:///C:/PROJETOS/Projeto_Vida2_5_D/life-sim-game/instructions/11-devtools-qa.md#L75)
