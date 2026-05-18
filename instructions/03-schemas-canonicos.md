# 03 — Schemas Canônicos (Zod)

Este documento define a fonte única de verdade para todos os tipos de dados do jogo. Todos os schemas são definidos em Zod (em `packages/core/src/schemas/`), e os tipos TypeScript são inferidos automaticamente via `z.infer<typeof X>`.

Regras invioláveis dos schemas:

- **`additionalProperties: false`** implícito via `.strict()` em todo objeto (obrigatório para Claude Structured Outputs)
- Versionamento explícito em qualquer schema que entra em save ou na biblioteca de conteúdo (`schemaVersion: string`)
- Enums fechados sempre que possível (não strings livres)
- Defaults seguros para campos opcionais
- Validações anatômicas/semânticas (range de ângulos, presença de sockets referenciados) ficam em validadores customizados em código pós-Zod, não no schema

## Pose

Pose representa o estado dos 15 joints + expressão facial + presets de mão/pé. É a unidade básica que a biblioteca de poses armazena.

```typescript
// packages/core/src/schemas/pose.ts
import { z } from 'zod';

export const JointId = z.enum([
  'root_pelvis', 'spine', 'neck', 'head',
  'shoulder_L', 'elbow_L', 'wrist_L',
  'shoulder_R', 'elbow_R', 'wrist_R',
  'hip_L', 'knee_L', 'ankle_L',
  'hip_R', 'knee_R',
]);

export const ExpressaoFacial = z.enum([
  'neutra', 'feliz', 'triste', 'raiva', 'surpresa', 'medo',
  'nojo', 'flertando', 'cansada', 'desconfiada', 'arrogante',
]);

export const PresetMao = z.enum([
  'relaxada', 'aberta', 'fechada', 'apontando',
  'joinha', 'palma_aberta', 'segurando_objeto', 'dedo_do_meio',
]);

export const PresetPe = z.enum([
  'descalco', 'tenis', 'sapato_social', 'bota',
  'salto_alto', 'na_ponta', 'relaxado_no_chao',
]);

export const RotacaoJoint = z.object({
  jointId: JointId,
  rotacaoGraus: z.number(),  // graus em espaço local; -180 a 180
}).strict();

export const Pose = z.object({
  schemaVersion: z.literal('1.0.0'),
  poseId: z.string().regex(/^[a-z][a-z0-9_]*$/),
  categoria: z.enum(['basic', 'interactions', 'emotional', 'action']),
  descricao: z.string().min(3).max(200),

  rotacoes: z.array(RotacaoJoint),
  expressaoFacial: ExpressaoFacial,
  intensidadeExpressao: z.number().min(0).max(100).default(50),

  maoEsquerda: PresetMao.default('relaxada'),
  maoDireita: PresetMao.default('relaxada'),
  peEsquerdo: PresetPe.default('descalco'),
  peDireito: PresetPe.default('descalco'),

  metadata: z.object({
    criadoEm: z.string().datetime(),
    criadoPor: z.enum(['humano', 'ia', 'ia_validada']),
    aprovadoEm: z.string().datetime().optional(),
    versao: z.number().int().min(1).default(1),
  }),
}).strict();

export type Pose = z.infer<typeof Pose>;
```

## Scene

Scene representa uma cena de jogo: múltiplos atores em poses, com background, framing de câmera, contatos entre rigs, e beats narrativos (diálogos, narração, escolhas).

```typescript
// packages/core/src/schemas/scene.ts
import { z } from 'zod';
import { Pose } from './pose';

export const PapelAtor = z.enum([
  'protagonista',
  'npc_primario',
  'npc_secundario',
  'npc_terciario',
]);

export const Background = z.enum([
  'sala_estar', 'cozinha', 'quarto', 'banheiro',
  'rua_residencial', 'centro_comercial', 'praca',
  'escola_sala', 'escola_corredor', 'escola_patio',
  'escritorio_open', 'escritorio_sala_reuniao',
  'restaurante', 'bar', 'balada',
  'hospital_quarto', 'hospital_corredor',
  'parque', 'praia', 'shopping',
  'igreja', 'cemiterio',
  'fundo_vazio',
]);

export const FramingCamera = z.enum(['wide', 'medium', 'close', 'closeup']);

export const HumorCena = z.enum([
  'comico', 'tenso', 'melancolico', 'intimo',
  'caotico', 'neutro', 'romantico', 'agressivo',
]);

export const Ator = z.object({
  papel: PapelAtor,
  posicao: z.object({
    x: z.number().min(-1).max(1),  // -1 = esquerda, 1 = direita
    y: z.number().min(0).max(1),   // 0 = chão, 1 = topo
    facing: z.enum(['L', 'R']),
  }),
  pose: Pose,
  zOrder: z.number().int().default(0),
}).strict();

export const Contato = z.object({
  // âncora entre rigs (mão de A toca ombro de B)
  fromAtorPapel: PapelAtor,
  fromSocket: z.string(),  // ex: 'right_hand_socket'
  toAtorPapel: PapelAtor,
  toSocket: z.string(),    // ex: 'left_shoulder_socket'
}).strict();

export const BeatNarracao = z.object({
  tipo: z.literal('narracao'),
  texto: z.string().min(1).max(500),
  tags: z.array(z.string()).default([]),
}).strict();

export const BeatDialogo = z.object({
  tipo: z.literal('dialogo'),
  papelAtor: PapelAtor,
  texto: z.string().min(1).max(500),
  mudancaExpressao: ExpressaoFacial.optional(),  // muda expressão durante o diálogo
}).strict();

export const BeatTransicao = z.object({
  tipo: z.literal('transicao'),
  efeito: z.enum(['fade', 'cut', 'dissolve', 'slide_L', 'slide_R']),
  duracaoMs: z.number().int().min(0).max(5000),
}).strict();

export const BeatDiretiva = z.object({
  tipo: z.literal('diretiva'),
  comando: z.enum([
    'mudar_pose', 'mover_ator', 'mudar_expressao',
    'mudar_camera', 'tocar_som', 'pausar',
  ]),
  parametros: z.record(z.unknown()),  // validados por handler específico
}).strict();

export const OpcaoEscolha = z.object({
  texto: z.string().min(1).max(200),
  requisitos: z.unknown().optional(),  // PredicateTree, definido abaixo
  atributoCheck: z.object({
    atributo: z.enum(['forca', 'inteligencia', 'carisma', 'constituicao', 'sorte']),
    dificuldade: z.number().int().min(1).max(30),
  }).optional(),
  efeitos: z.array(z.unknown()),  // Effect[], definido abaixo
  proximoEventoId: z.string().optional(),
}).strict();

export const BeatEscolha = z.object({
  tipo: z.literal('escolha'),
  opcoes: z.array(OpcaoEscolha).min(2).max(5),
}).strict();

export const Beat = z.discriminatedUnion('tipo', [
  BeatNarracao, BeatDialogo, BeatTransicao,
  BeatDiretiva, BeatEscolha,
]);

export const Scene = z.object({
  schemaVersion: z.literal('1.0.0'),
  sceneId: z.string().regex(/^[a-z][a-z0-9_]*$/),
  descricaoCurta: z.string().min(3).max(200),

  background: Background,
  framing: FramingCamera,
  humor: HumorCena,

  atores: z.array(Ator).min(1).max(4),
  contatos: z.array(Contato).default([]),

  beats: z.array(Beat).min(1),

  metadata: z.object({
    criadoEm: z.string().datetime(),
    criadoPor: z.enum(['humano', 'ia', 'ia_validada']),
    aprovadoEm: z.string().datetime().optional(),
    versao: z.number().int().min(1).default(1),
  }),
}).strict();

export type Scene = z.infer<typeof Scene>;
```

## PredicateTree (gramática mínima)

Predicados são usados em prerequisitos de eventos, condições de escolha, gates de NPC matching. Gramática mínima e fechada (sem `eval`, sem expressões dinâmicas).

```typescript
// packages/core/src/schemas/predicate.ts
import { z } from 'zod';

const OperadorComparacao = z.enum(['==', '!=', '>', '<', '>=', '<=']);

// Predicado base (referência variável)
const PredicadoVariavel = z.object({
  tipo: z.literal('var'),
  caminho: z.string(),  // ex: 'personagem.atributos.forca', 'npc:mae.relacionamento.afeto'
  operador: OperadorComparacao,
  valor: z.union([z.number(), z.string(), z.boolean()]),
}).strict();

const PredicadoFlag = z.object({
  tipo: z.literal('flag'),
  flag: z.string(),  // ex: 'casou_com_alice', 'tem_filho'
  presente: z.boolean().default(true),
}).strict();

const PredicadoRelacionamento = z.object({
  tipo: z.literal('relacionamento'),
  comNpcRole: z.string(),
  tipoVinculo: z.enum(['familia', 'amigo', 'romance', 'inimizade', 'profissional']),
  nivelMinimo: z.number().min(-100).max(100).optional(),
}).strict();

const PredicadoIdade = z.object({
  tipo: z.literal('idade'),
  minimo: z.number().int().min(0).max(120).optional(),
  maximo: z.number().int().min(0).max(120).optional(),
}).strict();

// Composição
const PredicadoFolha = z.union([
  PredicadoVariavel, PredicadoFlag,
  PredicadoRelacionamento, PredicadoIdade,
]);

export type PredicateTree =
  | { tipo: 'todos'; predicados: PredicateTree[] }
  | { tipo: 'algum'; predicados: PredicateTree[] }
  | { tipo: 'nao'; predicado: PredicateTree }
  | z.infer<typeof PredicadoFolha>;

export const PredicateTreeSchema: z.ZodType<PredicateTree> = z.lazy(() =>
  z.union([
    z.object({
      tipo: z.literal('todos'),
      predicados: z.array(PredicateTreeSchema),
    }).strict(),
    z.object({
      tipo: z.literal('algum'),
      predicados: z.array(PredicateTreeSchema),
    }).strict(),
    z.object({
      tipo: z.literal('nao'),
      predicado: PredicateTreeSchema,
    }).strict(),
    PredicadoFolha,
  ])
);
```

**Avaliação**: o `PredicateEvaluator` em `packages/core/src/events/PredicateEvaluator.ts` recebe o predicado + o `GameState` atual e retorna boolean. Para performance, predicados são compilados para closures JS em build-time via `evaluatePredicate(state) => boolean`.

## Effect (mutações de state)

Effects são as mutações que uma escolha de evento causa no save. Lista fechada de tipos.

```typescript
// packages/core/src/schemas/effect.ts
import { z } from 'zod';

export const Effect = z.discriminatedUnion('tipo', [
  z.object({
    tipo: z.literal('alterar_atributo'),
    atributo: z.enum(['forca', 'inteligencia', 'carisma', 'constituicao', 'sorte']),
    delta: z.number().int(),
  }).strict(),
  z.object({
    tipo: z.literal('alterar_dinheiro'),
    delta: z.number(),  // pode ser fracionado (centavos)
  }).strict(),
  z.object({
    tipo: z.literal('adicionar_flag'),
    flag: z.string(),
  }).strict(),
  z.object({
    tipo: z.literal('remover_flag'),
    flag: z.string(),
  }).strict(),
  z.object({
    tipo: z.literal('alterar_relacionamento'),
    npcId: z.string(),
    delta: z.number().int(),  // -100 a 100
  }).strict(),
  z.object({
    tipo: z.literal('matar_npc'),
    npcId: z.string(),
    causa: z.string(),
  }).strict(),
  z.object({
    tipo: z.literal('mudar_profissao'),
    profissao: z.string(),
    salario: z.number().optional(),
  }).strict(),
  z.object({
    tipo: z.literal('alterar_saude'),
    delta: z.number().int(),  // -100 a 100
  }).strict(),
  z.object({
    tipo: z.literal('alterar_humor'),
    delta: z.number().int(),  // -100 a 100
  }).strict(),
  z.object({
    tipo: z.literal('aplicar_status'),
    status: z.enum(['doente', 'preso', 'casado', 'separado', 'aposentado']),
    duracao: z.number().int().optional(),  // em meses; undefined = permanente
  }).strict(),
  z.object({
    tipo: z.literal('disparar_evento'),
    eventoId: z.string(),
    atrasoMeses: z.number().int().min(0).default(0),
  }).strict(),
]);

export type Effect = z.infer<typeof Effect>;
```

## Event

Evento narrativo: a unidade de conteúdo do jogo. Cada arquivo em `content/events/**/*.json` segue este schema.

```typescript
// packages/core/src/schemas/event.ts
import { z } from 'zod';
import { Scene } from './scene';
import { PredicateTreeSchema } from './predicate';

export const CategoriaEvento = z.enum([
  'childhood', 'education', 'career', 'relationship',
  'crime', 'health', 'hobby', 'mortality',
  'finance', 'travel', 'historic',
]);

export const TagConteudo = z.enum([
  'violence', 'sexual', 'substance', 'language',
  'death', 'trauma', 'religious', 'political',
]);

export const TipoNpcEvento = z.enum([
  'relacional',     // prefere NPC do roster com tags
  'sempre_novo',    // cria NPC efêmero sempre
]);

export const SelectorNpc = z.object({
  papel: z.string(),  // ex: 'best_friend', 'boss', 'father'
  tipo: TipoNpcEvento,
  persistenciaApos: z.enum(['permanente', 'recorrente', 'descartavel']).default('descartavel'),
  constraints: z.object({
    genero: z.enum(['M', 'F', 'qualquer']).optional(),
    idadeMin: z.number().int().min(0).max(120).optional(),
    idadeMax: z.number().int().min(0).max(120).optional(),
    tomDePele: z.enum(['claro', 'medio', 'escuro', 'qualquer']).optional(),
    estiloCorporal: z.enum(['atletico', 'magro', 'gordo', 'medio', 'qualquer']).optional(),
    profissao: z.string().optional(),
    atributoMinimo: z.object({
      atributo: z.enum(['forca', 'inteligencia', 'carisma', 'constituicao', 'sorte']),
      minimo: z.number().int(),
    }).optional(),
  }).default({}),
}).strict();

export const Event = z.object({
  schemaVersion: z.literal('1.0.0'),
  eventoId: z.string().regex(/^[a-z][a-z0-9_]*$/),
  categoria: CategoriaEvento,
  titulo: z.string().min(3).max(100),
  descricaoCurta: z.string().min(3).max(300),

  contentTags: z.array(TagConteudo).default([]),

  triggers: z.object({
    idadeRange: z.tuple([z.number().int().min(0), z.number().int().min(0)]).optional(),
    requisitos: PredicateTreeSchema.optional(),
    peso: z.number().min(0).max(100).default(10),
    cooldownMeses: z.number().int().min(0).default(0),
    uniqueOnce: z.boolean().default(false),
  }),

  cast: z.array(SelectorNpc).default([]),

  scene: Scene,

  metadata: z.object({
    criadoEm: z.string().datetime(),
    criadoPor: z.enum(['humano', 'ia_assistido', 'ia_validada']),
    revisadoPor: z.string().optional(),
    versao: z.number().int().min(1).default(1),
  }),
}).strict();

export type Event = z.infer<typeof Event>;
```

## Character (Personagem do jogador)

```typescript
// packages/core/src/schemas/character.ts
import { z } from 'zod';

export const Atributos = z.object({
  forca: z.number().int().min(1).max(20),
  inteligencia: z.number().int().min(1).max(20),
  carisma: z.number().int().min(1).max(20),
  constituicao: z.number().int().min(1).max(20),
  sorte: z.number().int().min(1).max(20),
}).strict();

export const TracosFisicos = z.object({
  // imutáveis ao longo da vida
  corPele: z.string().regex(/^#[0-9a-f]{6}$/i),
  corOlhos: z.string().regex(/^#[0-9a-f]{6}$/i),
  formatoRosto: z.enum(['oval', 'redondo', 'quadrado', 'triangular', 'coracao']),
  formatoNariz: z.enum(['reto', 'arrebitado', 'aquilino', 'pequeno', 'largo']),
  formatoBoca: z.enum(['fina', 'cheia', 'pequena', 'larga']),
  estiloCorporalBase: z.enum(['atletico', 'magro', 'gordo', 'medio']),
  alturaBase: z.number().min(1.4).max(2.1),  // metros
}).strict();

export const TracosVariaveis = z.object({
  // mudam com idade/estado
  corCabelo: z.string().regex(/^#[0-9a-f]{6}$/i),
  estiloCabelo: z.string(),  // referência a preset
  temGrisalho: z.boolean().default(false),
  temRugas: z.boolean().default(false),
  temOlheiras: z.boolean().default(false),
  usaOculos: z.boolean().default(false),
  pesoAtual: z.number().min(30).max(200),  // kg
  alturaAtual: z.number().min(0.5).max(2.1),  // varia com idade
}).strict();

export const Character = z.object({
  schemaVersion: z.literal('1.0.0'),
  characterId: z.string().uuid(),

  nome: z.string().min(1).max(100),
  sobrenome: z.string().min(1).max(100),
  genero: z.enum(['M', 'F', 'outro']),

  dataNascimento: z.object({
    ano: z.number().int().min(1990).max(2010),
    mes: z.number().int().min(1).max(12),
    dia: z.number().int().min(1).max(31),
  }),
  idadeAtualMeses: z.number().int().min(0),

  tracosFisicos: TracosFisicos,
  tracosVariaveis: TracosVariaveis,

  atributos: Atributos,
  atributosGeneticos: Atributos,  // base ao nascer, imutável

  dinheiro: z.number().default(0),
  humorAtual: z.number().int().min(0).max(100).default(70),
  saudeAtual: z.number().int().min(0).max(100).default(100),

  profissaoAtual: z.string().optional(),
  salarioMensal: z.number().min(0).default(0),

  flags: z.array(z.string()).default([]),
  eventosVividos: z.array(z.string()).default([]),  // eventIds
}).strict();

export type Character = z.infer<typeof Character>;
```

## NPC (Personagem Não Jogável)

```typescript
// packages/core/src/schemas/npc.ts
import { z } from 'zod';
import { TracosFisicos, TracosVariaveis, Atributos } from './character';

export const PersistenciaNpc = z.enum(['permanente', 'recorrente', 'descartavel']);

export const TipoVinculo = z.enum([
  'familia_pai', 'familia_mae', 'familia_irmao', 'familia_filho',
  'familia_conjuge', 'familia_extendida',
  'amigo_proximo', 'amigo_casual', 'colega_trabalho', 'colega_escola',
  'chefe', 'subordinado',
  'romance_atual', 'ex_romance',
  'inimigo', 'rival',
  'profissional', 'conhecido',
]);

export const Relacionamento = z.object({
  tipo: TipoVinculo,
  afeto: z.number().int().min(-100).max(100).default(0),
  conhecidoDesde: z.object({
    ano: z.number().int(),
    mes: z.number().int().min(1).max(12),
  }),
  ultimaInteracao: z.object({
    ano: z.number().int(),
    mes: z.number().int().min(1).max(12),
    eventoId: z.string(),
  }).optional(),
}).strict();

export const Npc = z.object({
  schemaVersion: z.literal('1.0.0'),
  npcId: z.string().uuid(),

  nome: z.string().min(1).max(100),
  sobrenome: z.string().min(1).max(100),
  genero: z.enum(['M', 'F', 'outro']),
  dataNascimento: z.object({
    ano: z.number().int(),
    mes: z.number().int().min(1).max(12),
    dia: z.number().int().min(1).max(31),
  }),

  tracosFisicos: TracosFisicos,
  tracosVariaveis: TracosVariaveis,

  atributos: Atributos.optional(),  // alguns NPCs descartáveis não têm

  persistencia: PersistenciaNpc,
  tags: z.array(z.string()).default([]),  // ex: ['chefe', 'autoritario']

  profissaoAtual: z.string().optional(),
  statusFinanceiro: z.enum(['pobre', 'medio', 'rico', 'milionario']).default('medio'),

  relacionamentoComJogador: Relacionamento,
  relacionamentosComOutrosNpcs: z.record(z.string(), Relacionamento).default({}),

  vivo: z.boolean().default(true),
  dataMorte: z.object({
    ano: z.number().int(),
    mes: z.number().int().min(1).max(12),
    causa: z.string(),
  }).optional(),

  historicoInteracoes: z.array(z.object({
    eventoId: z.string(),
    ano: z.number().int(),
    mes: z.number().int(),
  })).default([]),
}).strict();

export type Npc = z.infer<typeof Npc>;
```

## SaveSlot (estado completo do save)

```typescript
// packages/core/src/schemas/save.ts
import { z } from 'zod';
import { Character } from './character';
import { Npc } from './npc';

export const RitmoJogo = z.enum(['mensal', 'semestral', 'anual']);

export const SaveSlot = z.object({
  schemaVersion: z.literal('1.0.0'),
  saveId: z.string().uuid(),
  nomeSlot: z.string().min(1).max(50),

  criadoEm: z.string().datetime(),
  ultimaPartida: z.string().datetime(),
  tempoJogadoMs: z.number().int().min(0).default(0),

  configuracoes: z.object({
    ritmo: RitmoJogo,
    conteudoAdultoLiberado: z.boolean().default(false),
    idioma: z.enum(['pt-BR', 'en-US']).default('pt-BR'),
  }),

  protagonista: Character,
  roster: z.array(Npc),

  estadoMundo: z.object({
    anoAtual: z.number().int(),
    mesAtual: z.number().int().min(1).max(12),
    flagsGlobais: z.array(z.string()).default([]),
  }),
}).strict();

export type SaveSlot = z.infer<typeof SaveSlot>;
```

## Versionamento e migrações

Todo schema com `schemaVersion: z.literal('X.Y.Z')` deve ter:

1. **Migrador para próxima versão** quando o schema mudar
2. **Compatibilidade de leitura** com versão anterior por pelo menos 6 meses pós-launch
3. **CHANGELOG entry** descrevendo a mudança e o impacto

Padrão de migração em `packages/core/src/schemas/migrations/`:

```typescript
// packages/core/src/schemas/migrations/saveSlotV1ToV2.ts
export function migrarSaveSlotV1ParaV2(antigo: SaveSlotV1): SaveSlotV2 {
  return {
    ...antigo,
    schemaVersion: '2.0.0',
    // ... transformações específicas
  };
}
```

Loader de save em `packages/core/src/persistence/exporters.ts` detecta versão e aplica migradores em sequência (`v1 → v2 → v3`) até chegar na versão atual.

## Validação pós-Zod

Zod garante forma e tipos, mas não semântica anatômica ou coerência cross-field. Validadores adicionais em `packages/core/src/schemas/validators/`:

- `validarAnatomicamente(pose: Pose): ValidationResult` — checa ranges de ângulo por joint
- `validarCoerenciaCena(scene: Scene): ValidationResult` — checa que sockets em contatos existem nos atores referenciados
- `validarEvento(event: Event): ValidationResult` — checa que sceneId referenciado existe, predicados são bem formados, NPCs em cast batem com atores em scene

Pipeline completo de validação de um Event vindo da IA:

```
JSON bruto → JSON.parse → Zod.safeParse(Event) → validarEvento → validarCoerenciaCena → validarAnatomicamente
```

Se qualquer etapa falhar, registra erro estruturado e dispara repair loop (ver `05-pipeline-ia-conteudo.md`).
