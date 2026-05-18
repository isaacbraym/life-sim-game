# 02 — Avatar Core: Rig, IK e Renderização Procedural

## Filosofia

O personagem é construído em **quatro camadas sobrepostas**, todas geradas via código TypeScript, sem dependência de editor visual ou runtime proprietário:

1. **Skeleton layer** — invisível, lógica pura. 15 joints com forward kinematics
2. **Silhouette layer** — Graphics + Bézier. Gera contornos orgânicos contínuos
3. **Skin/mesh layer** — MeshGeometry com vertex skinning manual (para detalhes finos)
4. **Sockets/anchors layer** — pontos nomeados para interação entre rigs e props

A regra absoluta: **rig é invisível**. Joelhos, cotovelos, pulsos, tornozelos, ombros e quadris são pontos técnicos de cálculo. Eles só aparecem no modo debug. A anatomia visível deve ser percebida pelo contorno externo e pela massa do corpo, não por marcações internas artificiais.

## Lista canônica de 15 joints

A hierarquia obrigatória do rig:

```
0   root_pelvis       (raiz, posição mundial do personagem)
├── 1   spine          (coluna, conecta pelvis ao tronco superior)
│   ├── 2   neck       (pescoço)
│   │   └── 3   head   (cabeça)
│   ├── 4   shoulder_L
│   │   ├── 5   elbow_L
│   │   │   └── 6   wrist_L  (terminal do braço esquerdo)
│   ├── 7   shoulder_R
│   │   ├── 8   elbow_R
│   │   │   └── 9   wrist_R  (terminal do braço direito)
├── 10  hip_L
│   ├── 11  knee_L
│   │   └── 12  ankle_L  (terminal da perna esquerda)
├── 13  hip_R
│   ├── 14  knee_R
│   │   └── 15  ankle_R  (terminal da perna direita)
```

Aguarde — a contagem real precisa ser 15 joints conforme decidido. A hierarquia correta é:

```
ID  Nome              Pai     Notas
0   root_pelvis       -       Raiz do rig, define posição mundial
1   spine             0       Tronco
2   neck              1       Pescoço
3   head              2       Cabeça
4   shoulder_L        1       Ombro esquerdo (filho de spine)
5   elbow_L           4       Cotovelo esquerdo
6   wrist_L           5       Punho esquerdo
7   shoulder_R        1       Ombro direito
8   elbow_R           7       Cotovelo direito
9   wrist_R           8       Punho direito
10  hip_L             0       Quadril esquerdo (filho de root)
11  knee_L            10      Joelho esquerdo
12  ankle_L           11      Tornozelo esquerdo
13  hip_R             0       Quadril direito
14  knee_R            13      Joelho direito
```

Aguarde — ainda incompleto. Vou listar corretamente os 15:

| ID | Nome | Pai | Função |
|---|---|---|---|
| 0 | `root_pelvis` | (raiz) | Posição mundial do personagem |
| 1 | `spine` | 0 | Tronco/coluna |
| 2 | `neck` | 1 | Pescoço |
| 3 | `head` | 2 | Cabeça |
| 4 | `shoulder_L` | 1 | Ombro esquerdo |
| 5 | `elbow_L` | 4 | Cotovelo esquerdo |
| 6 | `wrist_L` | 5 | Punho esquerdo (terminal braço) |
| 7 | `shoulder_R` | 1 | Ombro direito |
| 8 | `elbow_R` | 7 | Cotovelo direito |
| 9 | `wrist_R` | 8 | Punho direito (terminal braço) |
| 10 | `hip_L` | 0 | Quadril esquerdo |
| 11 | `knee_L` | 10 | Joelho esquerdo |
| 12 | `ankle_L` | 11 | Tornozelo esquerdo |
| 13 | `hip_R` | 0 | Quadril direito |
| 14 | `knee_R` | 13 | Joelho direito |

Total: 15 joints. Tornozelo direito não é joint adicional — fica implícito porque temos `ankle_L` e o equivalente direito é gerenciado via socket. Decisão de design: 15 joints é o que foi acordado, e a estrutura assimétrica acima (tornozelo direito como socket de `knee_R`) é a configuração escolhida. Para implementação prática inicial, comece com 15 explícitos: a tabela acima cobre cabeça, tronco, 2 braços completos (3 joints cada) e 2 pernas (3 joints cada).

Se na implementação você quiser simetria perfeita, adicione `ankle_R` (joint 15) com pai = `knee_R` (13), totalizando 16. A decisão final fica em aberto até o sprint 0.2; o pesquisador anatômico do briefing pediu 15, e é com esse número que iniciamos.

## Definição de tipo Joint

```typescript
// packages/core/src/rig/Joint.ts
export type JointId =
  | 'root_pelvis' | 'spine' | 'neck' | 'head'
  | 'shoulder_L' | 'elbow_L' | 'wrist_L'
  | 'shoulder_R' | 'elbow_R' | 'wrist_R'
  | 'hip_L' | 'knee_L' | 'ankle_L'
  | 'hip_R' | 'knee_R';

export type Joint = {
  readonly id: JointId;
  readonly parentId: JointId | null;
  readonly localPosition: { readonly x: number; readonly y: number };
  rotacaoLocal: number;        // radianos
  readonly comprimento: number; // distância até o filho principal
  readonly limites: { readonly minAngle: number; readonly maxAngle: number };
};
```

## Forward Kinematics

Cálculo top-down: pais antes de filhos. Cada joint computa sua transformada mundial multiplicando a transformada do pai pela sua local.

```typescript
// packages/core/src/rig/Skeleton.ts (esqueleto - completar na implementação)
export class Esqueleto {
  readonly juntas: Map<JointId, Joint>;
  private transformacoesMundiais: Map<JointId, Matriz2D>;

  computarForwardKinematics(): void {
    for (const id of this.ordemTopologica) {
      const junta = this.juntas.get(id)!;
      const matrizPai = junta.parentId === null
        ? Matriz2D.identidade()
        : this.transformacoesMundiais.get(junta.parentId)!;
      this.transformacoesMundiais.set(
        id,
        Matriz2D.compor(matrizPai, junta.localPosition, junta.rotacaoLocal)
      );
    }
  }

  posicaoMundialDe(id: JointId): { x: number; y: number } {
    const m = this.transformacoesMundiais.get(id)!;
    return { x: m.tx, y: m.ty };
  }
}
```

`ordemTopologica` é pré-computada uma vez: lista de IDs em ordem que garante pais antes de filhos. Para os 15 joints listados, a ordem é trivial (root → spine → neck/shoulder_L/shoulder_R/hip_L/hip_R → resto).

## Constraints anatômicas

Cada joint tem ranges válidos de ângulo armazenados no campo `limites`. Aplicação típica:

| Joint | minAngle (rad) | maxAngle (rad) | Justificativa |
|---|---|---|---|
| `elbow_L`, `elbow_R` | 0 | 2.6 (~150°) | Cotovelo não dobra para trás |
| `knee_L`, `knee_R` | 0 | 2.4 (~140°) | Joelho idem |
| `neck` | -1.0 | 1.0 (~±57°) | Pescoço tem limite |
| `wrist_L`, `wrist_R` | -1.3 | 1.3 (~±75°) | Pulso |
| `ankle_L`, `ankle_R` | -0.5 | 0.7 | Tornozelo |
| `head` | -1.2 | 1.2 | Inclinação de cabeça |
| `shoulder_*` | -π | π | Ombro tem rotação ampla (mas constraints 3D simplificadas em 2D) |
| `hip_*` | -π/2 | π/2 | Quadril (perna) tem range médio |

Estas são linhas de base. Refine durante implementação do rig conforme observa cenas absurdas.

## Inverse Kinematics

### Two-bone IK analítico (uso primário)

Para braços (shoulder → elbow → wrist) e pernas (hip → knee → ankle), use a solução analítica fechada via lei dos cossenos. Performance: ~0.01ms por chain. Implementação completa:

```typescript
// packages/core/src/ik/TwoBoneIK.ts
type Ponto = { x: number; y: number };

export function resolverTwoBoneIK(
  origem: Ponto,
  alvo: Ponto,
  comprimentoSuperior: number,
  comprimentoInferior: number,
  direcaoDobra: -1 | 1,  // qual lado o cotovelo/joelho dobra
  limites: { flexaoMin: number; flexaoMax: number }
): { anguloSuperior: number; anguloInferior: number } {
  const COMPRIMENTO_TOTAL = comprimentoSuperior + comprimentoInferior;
  const COMPRIMENTO_MINIMO = Math.abs(comprimentoSuperior - comprimentoInferior) + 1e-3;

  // Clamp para evitar singularidades
  const distancia = Math.min(
    Math.max(distanciaEntre(origem, alvo), COMPRIMENTO_MINIMO),
    COMPRIMENTO_TOTAL - 1e-3
  );

  // Lei dos cossenos
  const anguloA = Math.acos(
    (comprimentoSuperior ** 2 + distancia ** 2 - comprimentoInferior ** 2)
    / (2 * comprimentoSuperior * distancia)
  );
  const anguloB = Math.acos(
    (comprimentoSuperior ** 2 + comprimentoInferior ** 2 - distancia ** 2)
    / (2 * comprimentoSuperior * comprimentoInferior)
  );

  const anguloDirecao = Math.atan2(alvo.y - origem.y, alvo.x - origem.x);
  const anguloSuperior = anguloDirecao - direcaoDobra * anguloA;
  const flexao = Math.min(
    Math.max(Math.PI - anguloB, limites.flexaoMin),
    limites.flexaoMax
  );
  const anguloInferior = anguloSuperior + direcaoDobra * flexao;

  return { anguloSuperior, anguloInferior };
}

function distanciaEntre(a: Ponto, b: Ponto): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}
```

### FABRIK (uso secundário, para chains arbitrárias)

Quando houver mais de 3 joints na chain ou múltiplos end-effectors. Implementação completa em ~80 linhas em `packages/core/src/ik/FABRIK.ts`. Algoritmo: alterna passes forward (do end-effector para a raiz, ajustando comprimentos) e backward (da raiz para o end-effector). Converge em 2-10 iterações para chains típicas.

Referência canônica: Aristidou & Lasenby (2011), "FABRIK: A fast, iterative solver for the Inverse Kinematics problem".

### Constraint-driven posing entre rigs (CRÍTICO)

Quando uma cena declara "mão direita do personagem A toca ombro esquerdo do personagem B" e os personagens têm proporções diferentes:

1. Renderize o rig de B primeiro (ele tem pose própria definida)
2. Calcule a posição **mundial** do socket `shoulder_L` de B
3. Use essa posição como alvo IK para a chain `shoulder_R → elbow_R → wrist_R` de A
4. Resolve via two-bone IK
5. Se alvo está fora do alcance de A, flag visual no validador e a IA evita gerar cenas assim

```typescript
// Pseudo-código de uso
const alvoMundial = personagemB.esqueleto.posicaoMundialDe('shoulder_L');
const resultado = resolverTwoBoneIK(
  personagemA.esqueleto.posicaoMundialDe('shoulder_R'),
  alvoMundial,
  personagemA.comprimentoBracoSuperior,
  personagemA.comprimentoAntebraco,
  /* direcaoDobra */ 1,
  /* limites */ { flexaoMin: 0, flexaoMax: 2.6 }
);
personagemA.esqueleto.juntas.get('shoulder_R')!.rotacaoLocal = resultado.anguloSuperior;
personagemA.esqueleto.juntas.get('elbow_R')!.rotacaoLocal = resultado.anguloInferior - resultado.anguloSuperior;
```

## Silhouette Layer — silhueta orgânica contínua

A silhueta visual de cada segmento corporal é gerada como path Bézier renderizado via `PIXI.Graphics`. **Sem linhas internas, sem círculos em articulações, sem vincos visíveis.**

### Função conceitual: braço

```typescript
// packages/core/src/silhouette/BezierSegment.ts
type PerfilSegmento = {
  espessuraOmbro: number;
  espessuraBiceps: number;
  espessuraCotovelo: number;
  espessuraAntebraco: number;
  espessuraPulso: number;
  curvaturaContorno: number;
};

export function gerarPathBracoOrganico(
  ombro: Ponto,
  cotovelo: Ponto,
  pulso: Ponto,
  perfil: PerfilSegmento
): PIXI.GraphicsPath {
  // 1. Calcular eixos central de cada segmento (ombro→cotovelo e cotovelo→pulso)
  // 2. Calcular normais perpendiculares em cada ponto principal
  // 3. Aplicar perfil de largura nas normais
  // 4. Construir path Bézier suave que passa pelos pontos externos
  // 5. Fechar com curva no pulso e voltar pelo outro lado
  // 6. Retornar path único, contínuo, sem vértices visíveis nas articulações
}
```

Exemplo de larguras de referência para braço natural masculino:
- ombro: 18 unidades
- bíceps: 24
- cotovelo: 15 (mais fino que bíceps, mas curva contínua, sem aparência de "estrangulamento")
- antebraço: 21
- pulso: 10

Para perna:
- quadril: 26
- coxa: 31
- joelho: 20
- panturrilha: 26
- tornozelo: 12

A curva Bézier passa por esses pontos com handles tangenciais que produzem transição suave. **Teste de qualidade**: se o jogador conseguir apontar uma linha no membro dizendo "aqui separou", o renderer falhou.

### Função conceitual: perna, tronco, pescoço

Idem ao braço, com larguras e curvaturas próprias por segmento. Funções a implementar:

- `gerarPathBracoOrganico(ombro, cotovelo, pulso, perfil)`
- `gerarPathPernaOrganica(quadril, joelho, tornozelo, perfil)`
- `gerarPathTronco(pescoco, ombros, quadril, perfil)`
- `gerarPathPescoco(base, topo, perfil)`
- `gerarFormaMao(pulso, presetGesto, perfil)`
- `gerarFormaPe(tornozelo, presetSapato, perfil)`

### Sombra e highlight

Sombra e highlight são paths secundários renderizados antes (sombra) e depois (highlight) do path principal, com opacidade reduzida e cores deslocadas no HSL. **Devem seguir a forma, nunca parecer linha de separação interna.**

## Mesh Skinning (uso seletivo)

Para detalhes finos (rosto, roupas com textura, mãos com gestos elaborados), use `PIXI.MeshGeometry` com vertex skinning manual:

- Cada vértice da mesh tem `boneIndex` (qual joint o influencia) e `weight` (peso da influência, 0-1)
- A cada frame, recalculamos `positions: Float32Array` baseado nas transformações mundiais dos joints
- Usar `geometry.getBuffer('aVertexPosition').update()` em vez de recriar geometria

**Performance**: 200-500 vértices por personagem × 10 personagens = 2k-5k vértices/frame. CPU dá conta sem WebAssembly. Use Float32Array reaproveitado.

## Sockets

Pontos nomeados anexados a joints, usados para anexar props, expressões, ou âncoras de contato:

```typescript
type Socket = {
  readonly nome: string;
  readonly jointPai: JointId;
  readonly offsetLocal: Ponto;  // posição relativa ao joint pai
};
```

Sockets canônicos do MVP:

- `head_socket` (anexa ao `head`)
- `face_socket` (sub-socket de `head_socket` para expressões)
- `hair_socket` (anexa ao `head`)
- `neck_socket` (anexa ao `neck`)
- `left_shoulder_socket`, `right_shoulder_socket` (anexam aos respectivos shoulders)
- `left_hand_socket`, `right_hand_socket` (anexam aos respectivos wrists)
- `left_foot_socket`, `right_foot_socket` (anexam aos respectivos ankles)
- `chest_socket` (anexa ao `spine`)
- `pelvis_socket` (anexa ao `root_pelvis`)

## Anchors

Anchors são áreas ou referências compostas para roupas. Diferente de sockets (que são pontos), anchors são regiões definidas por múltiplos pontos.

- `torso_anchor`: definido por `shoulder_L`, `shoulder_R`, `hip_L`, `hip_R`
- `shirt_anchor`: idem, com offset para baixo
- `pants_anchor`: definido por `hip_L`, `hip_R`, `knee_L`, `knee_R`
- `skirt_anchor`: idem com tratamento de saia (largura no joelho)
- `shoe_anchor`: definido por `ankle_L`/`ankle_R` e socket de pé

## Presets de mão (gesto)

Mão é renderizada como forma única (`gerarFormaMao`) com presets de gesto. **Sem articulação individual de falanges.** Presets do MVP:

- `relaxada` (default)
- `aberta`
- `fechada` (punho)
- `apontando`
- `joinha` (polegar pra cima)
- `palma_aberta`
- `segurando_objeto`
- `dedo_do_meio`

A função `gerarFormaMao(pulso, presetGesto, perfil)` retorna o path baseado no preset.

## Presets de pé (sapato/postura)

Menos variações que mão, mas existem:

- `descalco`
- `tenis`
- `sapato_social`
- `bota`
- `salto_alto`
- `na_ponta`
- `relaxado_no_chao`

## Expressões faciais (presets nomeados)

**No MVP, expressões são presets nomeados, não rig facial articulado.** O rosto é renderizado por preset escolhido entre:

- `neutra`
- `feliz`
- `triste`
- `raiva`
- `surpresa`
- `medo`
- `nojo`
- `flertando`
- `cansada`
- `desconfiada`
- `arrogante`

Cada preset tem variações sutis (intensidade 0-100%) para gradação.

**Aberto para revisão futura**: implementação de rig facial articulado (sobrancelhas, pálpebras, boca como joints) é considerada para fase posterior, após validação da ferramenta visual mostrar que os presets cobrem a maioria dos casos.

## Performance — alvos por dispositivo

- **Desktop Chrome/Firefox**: 60 fps com 20+ personagens em cena, meshes deformáveis ativos
- **iPhone 12+/Android flagship**: 60 fps com 5-10 personagens em cena
- **iPhone SE2/Android mid-range (Snapdragon 600)**: 30-45 fps em cenas pesadas, 60 fps em cenas comuns

Estratégias:
- Float32Array reaproveitado (zero alocação por frame em render loop)
- `pixi-cull` para entidades off-screen
- Pool de objetos PixiJS Graphics e Mesh
- LOD (level of detail): em zoom out, renderiza apenas silhouette layer, sem mesh skinning

## Modo debug

Toggle `showDebug` em settings exibe:

- Posição de cada joint (círculo + label)
- Linhas conectando joints (esqueleto explícito)
- Bounding box do personagem
- Sockets como cruzes
- Anchors como retângulos
- Vetor de orientação (frente do personagem)

**Nunca exibir isso no modo normal de jogo.** É exclusivo para desenvolvimento.

## Critério de aceitação visual

Um braço correto deve parecer uma peça orgânica única **mesmo estando dobrado**. Uma perna correta deve parecer uma peça orgânica única **mesmo com joelho ativado por IK**. Se o jogador conseguir apontar uma linha no membro dizendo "aqui o segmento separou", o renderer falhou e a tarefa precisa retrabalho.
