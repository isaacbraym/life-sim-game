# 02 — Avatar Core (Rig 2D)

## Filosofia

O personagem é renderizado por um **rig 2D custom de 15 joints**, processado via Forward Kinematics e IK solvers, produzindo uma silhueta orgânica contínua sem linhas/vincos visíveis nas articulações.

A câmera oblíqua ~15° exige que o personagem exista em **4 orientações**. Os 15 joints são os mesmos em todas; o que muda são os parâmetros de silhueta (`BodyProfile`) por orientação e os ciclos de animação disponíveis.

## Os 15 joints canônicos

| ID | Nome anatômico | Tipo de IK |
|---|---|---|
| `root_pelvis` | Quadril (raiz) | FK raiz |
| `spine_low` | Coluna lombar | FK |
| `spine_mid` | Coluna média | FK |
| `spine_high` | Coluna alta | FK |
| `neck` | Pescoço | FK |
| `head` | Cabeça | FK folha |
| `shoulder_l` | Ombro esquerdo | FK |
| `elbow_l` | Cotovelo esquerdo | Two-bone IK |
| `wrist_l` | Pulso esquerdo | Two-bone IK folha |
| `shoulder_r` | Ombro direito | FK |
| `elbow_r` | Cotovelo direito | Two-bone IK |
| `wrist_r` | Pulso direito | Two-bone IK folha |
| `knee_l` | Joelho esquerdo | Two-bone IK |
| `ankle_l` | Tornozelo esquerdo | Two-bone IK folha |
| `knee_r` | Joelho direito | Two-bone IK |
| `ankle_r` | Tornozelo direito | Two-bone IK folha |

Mão e pé: presets de gesto (`MAOABERTA`, `MAOEMPUNHO`, `PEDATAL`, `PEDESOLADO`) — sem joints individuais de falanges no MVP.

Expressões faciais: presets nomeados no MVP (`NEUTRO`, `SORRISO`, `TRISTE`, `RAIVA`, `SURPRESA`, `ENVERGONHADO`). Rig facial completo planejado para Fase 2+.

## As 4 orientações

Com a câmera oblíqua, o personagem precisa de 4 configurações de silhueta e animação:

| Orientação | Enum | Quando usar |
|---|---|---|
| Perfil esquerdo | `PERFIL_ESQUERDO` | Andando para a esquerda |
| Perfil direito | `PERFIL_DIREITO` | Andando para a direita (espelho do esquerdo) |
| Frontal | `FRONTAL` | Caminhando "para a câmera" (sul na perspectiva oblíqua) |
| Costas | `COSTAS` | Caminhando "para longe da câmera" (norte na perspectiva oblíqua) |

```typescript
const OrientacaoPersonagem = z.enum([
  'PERFIL_ESQUERDO',
  'PERFIL_DIREITO',
  'FRONTAL',
  'COSTAS',
]);
type OrientacaoPersonagem = z.infer<typeof OrientacaoPersonagem>;
```

### Perfis por orientação (`BodyProfile`)

Cada orientação tem seu próprio `BodyProfile` com parâmetros de Bézier para a silhueta:

- **PERFIL_ESQUERDO / PERFIL_DIREITO**: perfil lateral completo — silhueta com profundidade de nariz, orelha, cabelo, costas e peito visíveis. Rig atual foi projetado para isso.
- **FRONTAL**: ombros largos visíveis, corpo simétrico, rosto de frente, pés apontando para baixo/frente. Silhueta mais larga que o perfil.
- **COSTAS**: sem detalhes faciais, silhueta de costas, nuca, omoplatas sugeridas. Versão simplificada do perfil.

PERFIL_DIREITO é espelho horizontal do PERFIL_ESQUERDO — não requer parâmetros separados, apenas `scale.x = -1` no container do sprite.

## IK Solvers

### Two-bone IK (analítico) — braços e pernas

```typescript
function resolverTwoBoneIK(params: {
  readonly raiz: Vec2;
  readonly meio: Vec2;
  readonly alvo: Vec2;
  readonly comprimentoA: number;
  readonly comprimentoB: number;
  readonly ladoPreferido: 'esquerdo' | 'direito';
}): readonly [Vec2, Vec2]
```

### FABRIK — chains arbitrárias (spine, cauda futura)

Iterativo, convergência em ≤10 iterações para chains de até 6 joints.

## Ciclos de animação requeridos

Por orientação, os ciclos mínimos do MVP:

| Ciclo | PERFIL | FRONTAL | COSTAS |
|---|---|---|---|
| `idle` | ✅ | ✅ | ✅ |
| `caminhar` | ✅ | ✅ | ✅ |
| `interagir` | ✅ | ✅ | — |
| `sentar` | ✅ | ✅ | — |
| `dormir` | ✅ | — | — |

Ciclos de emoção (`chorar`, `comemorar`, `desespero`) são produzidos em PERFIL_ESQUERDO e espelhados conforme contexto.

## Z-sorting e perspectiva oblíqua

Com câmera oblíqua ~15°, personagens e objetos mais ao "norte" da tela (maior Y em coordenadas de mundo) são renderizados antes dos que estão ao "sul" (menor Y).

```typescript
// aplicado no RenderLayer da camada de personagens
const funcaoDeOrdem = (a: DisplayObject, b: DisplayObject) =>
  a.position.y - b.position.y;

// escala por profundidade: quem está mais "atrás" (menor Y na tela) parece menor
function calcularEscalaPorProfundidade(yMundo: number, alturaComodo: number): number {
  const proporcao = yMundo / alturaComodo;
  return 0.85 + proporcao * 0.20; // varia de 0.85 (fundo) a 1.05 (frente)
}
```

## Transição de orientação

Quando o personagem muda de direção durante movimento, a troca de orientação é instantânea (sem interpolar silhueta entre perfis — isso seria visualmente estranho).

```typescript
function resolverOrientacao(
  posicaoAtual: Vec2,
  posicaoAlvo: Vec2
): OrientacaoPersonagem {
  const dx = posicaoAlvo.x - posicaoAtual.x;
  const dy = posicaoAlvo.y - posicaoAtual.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx < 0 ? 'PERFIL_ESQUERDO' : 'PERFIL_DIREITO';
  }
  return dy < 0 ? 'COSTAS' : 'FRONTAL';
}
```

## Silhueta orgânica contínua

A silhueta é gerada por segmentos de Bézier cúbico que envolvem os joints sem expor articulações. Restrições absolutas:

- PROIBIDO: linhas visíveis conectando joints
- PROIBIDO: círculos nos pontos de articulação
- PROIBIDO: vincos ou quebras na silhueta
- OBRIGATÓRIO: transição suave e orgânica entre todos os segmentos

A silhueta é recalculada a cada frame que houver mudança de pose (não a cada frame se em idle estático).

## Ranges anatômicos por joint

Constraints em graus, aplicadas pelo `PredicateEvaluator` anatômico no pipeline de validação:

| Joint | Min | Max | Observação |
|---|---|---|---|
| `spine_low` | -30° | +30° | Flexão/extensão lombar |
| `spine_mid` | -20° | +20° | |
| `spine_high` | -25° | +25° | |
| `neck` | -45° | +45° | |
| `head` | -60° | +60° | |
| `shoulder_l/r` | -180° | +60° | Rotação total do ombro |
| `elbow_l/r` | 0° | +145° | Apenas flexão (sem hiperextensão) |
| `wrist_l/r` | -70° | +70° | |
| `knee_l/r` | -145° | 0° | Apenas flexão |
| `ankle_l/r` | -45° | +25° | Dorsiflexão/plantiflexão |

## Geração de NPC: aparência por seed

```typescript
// hash estável: mesma aparência em qualquer sessão
const seedNpc = hashString(`${saveId}_${npcId}`);
const rng = criarRng(seedNpc);

type TracosFixos = {
  readonly corPele: CorPele;
  readonly corOlhos: CorOlhos;
  readonly formatoRosto: FormatoRosto;
  readonly alturaBase: number;       // em cm, ex: 172
  readonly estiloCorpoBase: EstiloCorporal;
};

type TracosVariaveis = {
  corCabelo: CorCabelo;
  estiloCabelo: EstiloCabelo;
  pesoAtual: PesoRelativo;
  temGrisalho: boolean;
  temRugas: boolean;
  temOlheiras: boolean;
  usaOculos: boolean;
};
```

Traços fixos são imutáveis durante toda a vida do NPC. Traços variáveis evoluem com a idade.
