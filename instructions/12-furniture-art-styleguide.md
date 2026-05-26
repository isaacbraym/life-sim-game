# Styleguide Visual de Assets de Móveis - Vida 2.5D

Este guia estabelece as especificações técnicas, visuais e de geração para os assets de móveis do Vida 2.5D. O documento é prescritivo e mensurável, permitindo que artistas ou inteligências artificiais gerativas produzam e validem os assets sem ambiguidade.

---

## 1. Visão e Referências

O **Habbo Hotel** é a nossa principal referência em termos de legibilidade e charme: móveis pequenos, iconográficos, com leitura clara em uma grade densa. No entanto, o **Vida 2.5D** adota uma abordagem distinta em vários aspectos cruciais:

*   **O que herdamos do Habbo**: Legibilidade dos objetos em grades densas, senso de volume tridimensional bem definido e rotações expressivas que facilitam o posicionamento e interação.
*   **O que descartamos**:
    *   *Perspectiva*: Descartamos o isométrico puro de 45°. O Vida 2.5D adota uma perspectiva oblíqua leve (~15°).
    *   *Paleta*: Abandonamos a paleta extremamente saturada e infantil do Habbo, optando por cores mais naturais, harmônicas e paletas condizentes com cada era histórica.
    *   *Traço/Estilo*: Afastamo-nos das proporções cartunescas extremas e linhas grossas pretas de contorno. Adotamos traços mais naturalistas e materiais que aceitam texturas de desgaste e envelhecimento.

---

## 2. Câmera e Perspectiva

A câmera do jogo utiliza uma perspectiva **oblíqua leve** de aproximadamente **15°** em relação ao plano horizontal.

*   **Proporção de Faces**: A face frontal de um móvel (lado voltado para a câmera) é significativamente mais alta que a face lateral.
*   **Topo Visível**: O topo do móvel é visível, mas de forma estreita e achatada (representando cerca de 15% a 20% da altura total do sprite).
*   **Fuga em Y**: Objetos posicionados no topo da tela reduzem levemente de tamanho. A escala base segue a fórmula:
    $$\text{escala} = 0.85 + \left(\frac{y}{\text{alturaComodo}}\right) \times 0.20$$
*   **Comparativo**: Em relação ao isométrico 45°, neste jogo o topo é **MENOS** visível e a face frontal é **MAIS** dominante.

### Diagrama de Perspectiva (ASCII)

```
        Habbo / Isométrico Clássico (45°)            Vida 2.5D (Oblíquo ~15°)
               +-------------+                      +-----------------+
              /             /|                     /                 /|
             /    TOPO     / |                    /      TOPO       / |
            /             /  |                   +-----------------+  |
           +-------------+   |                   |                 |  |
           |             |   /                   |      FACE       |  /
           |    FRONT    |  /                    |     FRONTAL     | /
           |             | /                     |                 |/
           +-------------+/                      +-----------------+
          (Topo muito visível)                 (Face frontal dominante,
                                                topo estreito/achatado)
```

---

## 3. Sistema de Rotações

O motor do jogo suporta até 4 rotações para cada móvel (múltiplas de 90°). A tabela a seguir define as convenções visuais e o comportamento para um móvel típico com encosto (ex: sofá):

| Rotação | Convenção do código | O que o jogador vê |
| :---: | :---: | --- |
| 0° | `rot_0` | Face frontal voltada para a câmera (assento e encosto visíveis) |
| 90° | `rot_90` | Face lateral direita voltada para a câmera |
| 180° | `rot_180` | Encosto traseiro voltado para a câmera (assento oculto) |
| 270° | `rot_270` | Face lateral esquerda voltada para a câmera |

> [!NOTE]
> Nem todos os móveis necessitam de 4 rotações. Um objeto simétrico por todos os lados (como uma mesa redonda ou um banquinho circular) pode possuir apenas 1 rotação cadastrada. O arquivo `metadata.json` correspondente ao asset define quais rotações estão disponíveis.

---

## 4. Grid e Escala

*   **Tile Base**: $32 \times 32$ px no espaço do mundo do jogo.
*   **Canvas do Sprite**: O canvas da imagem deve incluir uma margem interna de segurança (**padding**) de 8px em todos os lados para acomodar highlights e sombras projetadas.
*   **Aproveitamento**: O móvel deve ocupar cerca de 80% do canvas disponível.
*   **Fundo**: PNG com canal Alpha (transparência total).
*   **Anchor (Origem)**: Definido no ponto inferior-central do footprint do móvel (coordenadas normalizadas `anchorX: 0.5`, `anchorY: 1.0`).

### Dimensões de Canvas Recomendadas por Footprint

| Footprint (Largura x Altura) | Resolução Recomendada do Canvas (px) | Descrição do Asset Comum |
| :---: | :---: | --- |
| **1×1 tile** | $64 \times 80$ | Cadeiras, criados-mudos, vasos, luminárias de chão |
| **2×1 tiles** | $128 \times 96$ | Aparadores, televisões de tubo, banheiras, mesas de cabeceira duplas |
| **2×2 tiles** | $128 \times 128$ | Mesas de jantar quadradas, camas de casal |
| **3×1 tiles** | $192 \times 96$ | Sofás de 3 lugares, estantes largas, balcões de cozinha |
| **3×2 tiles** | $192 \times 160$ | Camas king size, mesas de reunião grandes |

---

## 5. Iluminação e Sombra

A iluminação deve seguir um padrão global rígido para assegurar consistência visual quando múltiplos móveis forem dispostos no mesmo cômodo.

*   **Fonte de Luz**: Posicionada na **superior-esquerda** (proveniente do canto superior esquerdo e ligeiramente à frente do plano do objeto).
*   **Intensidade e Tonalidade por Face**:
    *   *Face Frontal (`rot_0`)*: Iluminação média padrão (~100% do valor da cor base).
    *   *Face Superior (Topo)*: Mais clara, recebendo luz direta (~120% a 130% do valor base).
    *   *Face Lateral Esquerda*: Recebe luz indireta (~70% a 80% do valor base).
    *   *Face Lateral Direita*: Em sombra (~60% a 70% do valor base).
*   **Highlight (Brilho de Borda)**: Adicionar um filete sutil de 1px ligeiramente mais claro nas bordas voltadas para a superior-esquerda para acentuar a silhueta.
*   **Sombra Projetada**: Deve ser em formato de elipse suave e difusa abaixo do objeto.
    *   *Opacidade*: 25% a 35%.
    *   *Bordas*: Completamente desfocadas (sem contorno rígido).

---

## 6. Era e Material

Os móveis devem refletir a estética e materiais característicos de suas eras de introdução no mercado brasileiro.

### Características por Era

*   **`eighties` (1985–1989)**:
    *   *Materiais*: Plásticos coloridos moldados, fórmicas brilhantes, madeira pinus muito clara, vime/palha trançada.
    *   *Cores*: Tons saturados de amarelo, vermelho, azul cobalto, combinados com marrom ou bege escuro.
    *   *Padrões*: Tecidos com padrões geométricos contrastantes ou florais exagerados.
*   **`nineties` (1990–1999)**:
    *   *Materiais*: Plástico texturizado bege/cinza-claro (típico de computadores antigos), compensados de madeira média (mogno ou cerejeira), acabamento fosco.
    *   *Cores*: Bege, cinza neutro, verde-musgo, azul-marinho, vinho.
    *   *Padrões*: Tecidos lisos texturizados ou com listras discretas.
*   **`twothousands` (2000–2009)**:
    *   *Materiais*: Plástico preto brilhante ("black piano"), acabamento metálico em prata e alumínio escovado, acrílico transparente, vidro temperado.
    *   *Cores*: Cinza-escuro, prata, preto absoluto, azul metálico.
    *   *Design*: Curvas arredondadas aerodinâmicas e formatos futuristas ("bobby").
*   **`modern` (2010+)**:
    *   *Materiais*: Madeira clara de reflorestamento (estilo nórdico/pinus limpo), aço carbono preto fosco, tecidos de linho ou algodão grosso texturizado, plástico reciclado fosco.
    *   *Cores*: Cinza-frio, branco fosco, off-white, tons pastéis dessaturados.

### Diretrizes de Desgaste (`tags: ["gasto", "velho"]`)

Quando um asset possuir tags de desgaste, aplique as seguintes alterações de forma sutil:
1.  **Cantos e Bordas**: Pequenas imperfeições ou lascas de 1px nos cantos e quinas.
2.  **Dessaturação**: Redução de ~10% na saturação geral das cores para simular desbotamento pelo sol.
3.  **Marcas de Uso**: Presença de 3 a 5 marcas sutis (como riscos finos na madeira, manchas leves de copo ou marcas de poeira nas frestas).
4.  *Evite*: Sujeira ou destruição exagerada. O móvel deve parecer antigo ou usado, não lixo descartado.

---

## 7. Checklist Visual por Asset

Antes de exportar ou aprovar um móvel, verifique se todos os itens abaixo foram cumpridos:

*   [ ] **Fundo**: Transparência total (canal Alpha, sem pixels brancos ou pretos "sujos" nas bordas).
*   [ ] **Dimensões**: O canvas do sprite segue rigorosamente a tabela recomendada para o footprint declarado.
*   [ ] **Anchor**: O ponto de origem está centralizado horizontalmente no rodapé do sprite (x=0.5, y=1.0).
*   [ ] **Iluminação**: Direcionada da superior-esquerda em todas as rotações ativas.
*   [ ] **Sombra Projetada**: Inserida no chão do sprite, com opacidade entre 25% e 35%, em elipse suave.
*   [ ] **Coerência de Rotações**: Os sprites de rotações diferentes representam o exato mesmo objeto girado, sem mudanças drásticas de proporção, cor ou detalhes estruturais.
*   [ ] **Fidelidade da Era**: A paleta de cores e os materiais são condizentes com a era declarada.
*   [ ] **Desgaste**: Se contiver tags de desgaste, as marcas de uso estão visíveis e na quantidade especificada (3 a 5 marcas).
*   [ ] **Legibilidade**: O móvel mantém leitura e reconhecimento de silhueta mesmo em miniatura ($64 \times 64$ px).
*   [ ] **Bordas Limpas**: Sem halos brancos ou artefatos de compressão em torno da borda transparente.

---

## 8. Prompts de Geração e Metadados para Validação

Abaixo estão os prompts estruturados e os arquivos de configuração `metadata.json` para os três primeiros móveis de validação do motor de renderização.

### Móvel 1: Televisão de Tubo dos Anos 2000

*   **assetId**: `tv_tubo_2000`
*   **Footprint**: 2×1 tiles (Canvas: $128 \times 96$ px)
*   **Era**: `twothousands`
*   **Material**: Plástico preto brilhante com tela de vidro CRT cinza.

#### Prompt de Geração (Midjourney/DALL-E)
> "A 2.5D sprite of a year 2000 CRT television set, oblique top-down perspective at 15 degrees angle, 2x1 tiles footprint. Sleek glossy black plastic casing with rounded corners, gray curved CRT glass screen. Clean flat vector pixel-art style, no black outlines, soft shading. Light source coming from top-left. Casts a soft, semi-transparent drop shadow directly beneath it. Isolated on a solid black background for alpha-channel extraction."

#### `metadata.json` correspondente
```json
{
  "assetId": "tv_tubo_2000",
  "anchorX": 0.5,
  "anchorY": 1.0,
  "escalaBase": 1.0,
  "rotacoesDisponiveis": [0, 90, 180, 270],
  "footprintPorRotacao": {
    "0":   { "largura": 2, "altura": 1 },
    "90":  { "largura": 1, "altura": 2 },
    "180": { "largura": 2, "altura": 1 },
    "270": { "largura": 1, "altura": 2 }
  },
  "material": "plastico_preto",
  "era": "twothousands",
  "tags": ["tecnologia", "tv"]
}
```

---

### Móvel 2: Sofá Verde de 3 Lugares, Gasto

*   **assetId**: `sofa_verde_gasto_3_lugares`
*   **Footprint**: 3×1 tiles (Canvas: $192 \times 96$ px)
*   **Era**: `nineties`
*   **Material**: Tecido verde-musgo áspero com marcas visíveis de desgaste e almofadas baixas.

#### Prompt de Geração (Midjourney/DALL-E)
> "A 2.5D sprite of a worn 3-seater sofa, oblique top-down perspective at 15 degrees angle, 3x1 tiles footprint. Upholstered in dark forest green fabric, low cushions. Visible subtle wear and tear, slightly faded color, slightly frayed edges. Clean flat vector design, soft shading. Light source coming from top-left. Casts a soft, semi-transparent elliptical drop shadow directly beneath it. Isolated on a solid black background for alpha-channel extraction."

#### `metadata.json` correspondente
```json
{
  "assetId": "sofa_verde_gasto_3_lugares",
  "anchorX": 0.5,
  "anchorY": 1.0,
  "escalaBase": 1.0,
  "rotacoesDisponiveis": [0, 90, 180, 270],
  "footprintPorRotacao": {
    "0":   { "largura": 3, "altura": 1 },
    "90":  { "largura": 1, "altura": 3 },
    "180": { "largura": 3, "altura": 1 },
    "270": { "largura": 1, "altura": 3 }
  },
  "material": "tecido_verde",
  "era": "nineties",
  "tags": ["assento", "sofa", "gasto", "velho"]
}
```

---

### Móvel 3: Banheira Simples

*   **assetId**: `banheira_simples`
*   **Footprint**: 2×1 tiles (Canvas: $128 \times 96$ px)
*   **Era**: `nineties`
*   **Material**: Porcelana branca levemente amarelada (off-white) com pés de metal cromado.

#### Prompt de Geração (Midjourney/DALL-E)
> "A 2.5D sprite of a clawfoot bathtub, oblique top-down perspective at 15 degrees angle, 2x1 tiles footprint. Classic white porcelain basin with a slight yellow tint, silver metallic claw feet. Clean flat vector style, smooth gradients. Light source coming from top-left. Casts a soft, semi-transparent elliptical drop shadow directly beneath it. Isolated on a solid black background for alpha-channel extraction."

#### `metadata.json` correspondente
```json
{
  "assetId": "banheira_simples",
  "anchorX": 0.5,
  "anchorY": 1.0,
  "escalaBase": 1.0,
  "rotacoesDisponiveis": [0, 90],
  "footprintPorRotacao": {
    "0":  { "largura": 2, "altura": 1 },
    "90": { "largura": 1, "altura": 2 }
  },
  "material": "porcelana",
  "era": "nineties",
  "tags": ["banheiro", "higiene"]
}
```
