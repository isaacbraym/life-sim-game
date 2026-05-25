# 03 — Schemas Canônicos (Zod)

Todos os schemas são definidos com Zod. Tipos TypeScript são inferidos via `z.infer<typeof X>`. Nenhum tipo é declarado manualmente se há um schema Zod correspondente.

---

## ActionDefinition

Schema central do sistema de interação. Cada objeto interactável e cada NPC expõe uma lista de `ActionDefinition`.

```typescript
const ResolutionMode = z.enum(['direct', 'check']);

const CheckDefinition = z.object({
  atributo: z.enum(['forca', 'inteligencia', 'carisma', 'constituicao', 'sorte']),
  dc: z.number().int().min(1).max(30),
  modificadoresExtras: z.array(z.object({
    origem: z.string(),
    valor: z.number().int(),
  })).optional(),
});

const ProgressionRule = z.object({
  contadorId: z.string(),         // ex: 'treinosNoMes'
  limiar: z.number().int(),       // ex: 6
  periodoReset: z.enum(['semana', 'mes', 'semestre', 'ano', 'nunca']),
  efeito: z.array(EffectSchema),  // aplicado ao atingir o limiar
  narrativeWeight: z.enum(['routine', 'relevant', 'major']).default('relevant'),
  logAoAtigir: z.string().optional(), // frase do log de consequência
});

const ActionDefinition = z.object({
  id: z.string(),
  rotulo: z.string(),             // label do botão no ActionBubble
  icone: z.string().optional(),   // ícone visual do botão

  // pré-condições
  requisitos: PredicateTree.optional(),
  faseDeVidaMinima: LifePhaseEnum.optional(),

  // custo imediato (antes de resolver)
  custos: z.array(EffectSchema).optional(),

  // modo de resolução
  resolutionMode: ResolutionMode,
  check: CheckDefinition.optional(), // obrigatório se resolutionMode === 'check'

  // efeitos por desfecho
  onAlways: z.array(EffectSchema).optional(),   // independente de sucesso/falha
  onSuccess: z.array(EffectSchema).optional(),   // se check passou ou resolutionMode === 'direct'
  onFailure: z.array(EffectSchema).optional(),   // se check falhou

  // progressão acumulada
  progression: ProgressionRule.optional(),

  // logs
  logAcao: z.string().optional(),                // "Você treinou na academia."
  logSucesso: z.string().optional(),             // "A conversa foi muito bem."
  logFalha: z.string().optional(),               // "O clima ficou tenso."
  narrativeWeight: z.enum(['routine', 'relevant', 'major']).default('routine'),

  // hooks de evento
  eventHooks: z.array(z.object({
    condicao: z.enum(['onSuccess', 'onFailure', 'always']),
    eventoId: z.string(),
    chance: z.number().min(0).max(1).default(1),
  })).optional(),

  // tempo
  timeCost: z.object({
    unidades: z.number().int().min(0),
    tipo: z.enum(['acao', 'periodo', 'dia', 'noite']),
  }).optional(),
});

type ActionDefinition = z.infer<typeof ActionDefinition>;
```

---

## EffectSchema

Reutilizado em ActionDefinition, EventoSchema e outros.

```typescript
const EffectSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('alterar_atributo'),    atributo: AtributoEnum, delta: z.number() }),
  z.object({ tipo: z.literal('alterar_dinheiro'),    delta: z.number() }),
  z.object({ tipo: z.literal('alterar_humor'),       delta: z.number().int().min(-10).max(10) }),
  z.object({ tipo: z.literal('alterar_energia'),     delta: z.number().int().min(-10).max(10) }),
  z.object({ tipo: z.literal('alterar_relacao'),     npcId: z.string(), delta: z.number().int() }),
  z.object({ tipo: z.literal('setar_flag'),          flag: z.string() }),
  z.object({ tipo: z.literal('remover_flag'),        flag: z.string() }),
  z.object({ tipo: z.literal('adicionar_log'),       camada: LogCamadaEnum, texto: z.string() }),
  z.object({ tipo: z.literal('disparar_evento'),     eventoId: z.string() }),
  z.object({ tipo: z.literal('alterar_progressao'),  contadorId: z.string(), delta: z.number() }),
]);
```

---

## LocationDefinition

```typescript
const LocationDefinition = z.object({
  id: z.string(),
  nome: z.string(),                           // "Academia", "Escola"
  iconeNoMapa: z.string(),                    // asset do ícone no WorldMapScreen
  faseDeVidaMinima: LifePhaseEnum.optional(), // quando o local fica disponível
  faseDeVidaMaxima: LifePhaseEnum.optional(),
  requisitos: PredicateTree.optional(),       // ex: ter dinheiro para academia
  custoPorVisita: z.number().optional(),      // custo em dinheiro para entrar
  comodosIniciais: z.array(z.string()),       // IDs de ComodoDefinition
  comodoDeEntrada: z.string(),                // qual cômodo o jogador entra primeiro
  disponibilidadeEra: z.object({
    startYear: z.number().int(),
    endYear: z.number().int().optional(),
  }).optional(),
  tags: z.array(z.string()),
});
```

---

## ComodoDefinition

```typescript
const NavZona = z.object({
  id: z.string(),
  poligono: z.array(z.object({ x: z.number(), y: z.number() })), // área andável
});

const PontoDeSaida = z.object({
  id: z.string(),
  posicao: z.object({ x: z.number(), y: z.number() }),
  destino: z.discriminatedUnion('tipo', [
    z.object({ tipo: z.literal('comodo'), comodoId: z.string() }),
    z.object({ tipo: z.literal('mapa') }),  // sair para o WorldMapScreen
  ]),
  rotulo: z.string().optional(),           // "Sair", "Ir para o pátio"
});

const InteractableObject = z.object({
  id: z.string(),
  tipo: z.string(),                        // 'aparelho_musculacao', 'mesa', 'npc_slot'
  posicao: z.object({ x: z.number(), y: z.number() }),
  tamanho: z.object({ largura: z.number(), altura: z.number() }),
  posicaoDeInteracao: z.object({ x: z.number(), y: z.number() }), // onde personagem fica
  orientacaoAoInteragir: OrientacaoPersonagem.optional(),
  assetId: z.string(),                     // referência ao sprite/placeholder
  acoes: z.array(z.string()),             // IDs de ActionDefinition
  npcSlot: z.string().optional(),         // se for ponto de spawn de NPC
  disponibilidadeEra: z.object({
    startYear: z.number().int(),
    endYear: z.number().int().optional(),
  }).optional(),
  interativoNaFase: z.array(LifePhaseEnum).optional(), // fases em que é interativo
});

const ComodoDefinition = z.object({
  id: z.string(),
  localId: z.string(),
  nome: z.string(),                        // "Área de musculação", "Sala de aula"
  backgroundAsset: z.string(),             // asset do background do cômodo
  tamanho: z.object({ largura: z.number(), altura: z.number() }),
  navZonas: z.array(NavZona),
  pontosDeSaida: z.array(PontoDeSaida),
  objetos: z.array(InteractableObject),
  npcsElegiveis: z.array(z.object({
    papel: z.string(),
    slot: z.string(),                      // qual InteractableObject.npcSlot
    persistencia: NpcPersistenciaEnum,
  })),
  ambientTags: z.array(z.string()),        // para filtros de conteúdo
  eraStyle: z.string().optional(),         // 'eighties', 'nineties', etc.
});
```

---

## FurnitureDefinition

```typescript
const FurnitureDefinition = z.object({
  id: z.string(),
  nome: z.string(),
  categoria: z.enum(['assento', 'mesa', 'cama', 'tecnologia', 'eletrodomestico', 'decoracao', 'treino', 'outro']),
  assetId: z.string(),
  tamanhoGrid: z.object({ largura: z.number().int(), altura: z.number().int() }), // em tiles
  preco: z.number(),
  valorDeRevenda: z.number(),
  acoes: z.array(z.string()),             // IDs de ActionDefinition disponíveis neste móvel
  efeitos: z.object({                     // bônus passivos enquanto na casa
    conforto: z.number().optional(),
    humor: z.number().optional(),
    energia: z.number().optional(),
    statusSocial: z.number().optional(),
  }).optional(),
  availability: z.object({
    startYear: z.number().int(),
    endYear: z.number().int().optional(),
  }),
  tags: z.array(z.string()),
  descricao: z.string().optional(),
});
```

---

## BirthProfile / OriginProfile

```typescript
const ClasseSocial = z.enum(['baixa', 'media_baixa', 'media', 'media_alta', 'alta']);

const EstruturaFamiliar = z.enum([
  'pais_casados',
  'pais_divorciados',
  'mae_solo',
  'pai_solo',
  'pai_ausente',
  'mae_falecida',
  'pai_falecido',
  'avos_tutores',
  'orfanato',
  'familia_adotiva',
]);

const BirthProfile = z.object({
  anoNascimento: z.number().int().min(1985).max(2000),
  classeSocial: ClasseSocial,
  estruturaFamiliar: EstruturaFamiliar,
  qualidadeEducacaoInicial: z.enum(['baixa', 'media', 'alta']),
  bairroInicial: z.string(),             // ID do bairro/região
  condicaoHabitacional: z.enum(['mocorongo', 'simples', 'media', 'boa', 'luxo']),
  atributosGeneticos: z.object({
    forca: z.number().int().min(6).max(14),
    inteligencia: z.number().int().min(6).max(14),
    carisma: z.number().int().min(6).max(14),
    constituicao: z.number().int().min(6).max(14),
    sorte: z.number().int().min(6).max(14),
  }),
});

type BirthProfile = z.infer<typeof BirthProfile>;
```

---

## LifePhaseDefinition

```typescript
const LifePhaseEnum = z.enum([
  'bebe',           // 0–2 anos
  'crianca',        // 3–11 anos
  'adolescente',    // 12–17 anos
  'jovem_adulto',   // 18–25 anos
  'adulto',         // 26–59 anos
  'idoso',          // 60+ anos
]);

const LifePhaseDefinition = z.object({
  id: LifePhaseEnum,
  idadeMin: z.number().int(),
  idadeMax: z.number().int(),
  autonomia: z.enum(['nenhuma', 'limitada', 'parcial', 'plena']),
  locaisDisponiveis: z.array(z.string()),    // IDs de LocationDefinition
  locaisBloqueados: z.array(z.string()),     // override: mesmo que requisitos passem
  acoesDesfavor: z.array(z.string()),        // ações que não fazem sentido nesta fase
  worldMapVisivel: z.boolean(),
  descricao: z.string(),
});
```

---

## EraDefinition / YearContext

```typescript
const EraDefinition = z.object({
  id: z.string(),                         // 'eighties', 'nineties', etc.
  nome: z.string(),
  startYear: z.number().int(),
  endYear: z.number().int(),
  tecnologiasDisponiveis: z.array(z.string()),
  estiloRoupa: z.string(),               // referência a ClothingPreset de era
  estiloMovel: z.string(),               // referência a FurnitureStylePreset de era
  musicaAmbiente: z.string().optional(), // asset de música da era
  descricao: z.string(),
});

const YearContext = z.object({
  ano: z.number().int(),
  eraId: z.string(),
  tecnologiasAtivas: z.array(z.string()),
  eventoHistoricosDoAno: z.array(z.string()), // IDs de eventos históricos
  modificadoresEconomicos: z.object({
    inflacao: z.number(),
    desemprego: z.number(),
    custoVidaMultiplicador: z.number(),
  }),
});
```

---

## EventoSchema (estendido)

Mantém toda a estrutura anterior; adiciona campos opcionais:

```typescript
// campos novos no EventoSchema existente:
localContextId: z.string().optional(),    // se definido, só dispara nesse tipo de local
narrativeWeight: z.enum(['routine', 'relevant', 'major']).default('relevant'),
eraDisponivel: z.object({
  startYear: z.number().int(),
  endYear: z.number().int().optional(),
}).optional(),
```

---

## LogCamada (LifeLog)

```typescript
const LogCamadaEnum = z.enum([
  'feedback',        // flutuante na tela, efêmero (não persiste)
  'acao_simples',    // "Você treinou na academia."
  'consequencia',    // "Você ganhou +1 Força após manter rotina de treino."
  'evento_importante', // "Aos 18 anos, você começou namoro com Juliana."
  'resumo_periodico',  // resumo mensal/semestral gerado automaticamente
]);

const LogEntry = z.object({
  id: z.string(),
  camada: LogCamadaEnum,
  timestamp: z.number(),                 // ms desde nascimento do personagem
  anoJogo: z.number().int(),
  mesJogo: z.number().int().min(1).max(12),
  texto: z.string(),
  npcIds: z.array(z.string()).optional(), // NPCs envolvidos
  localId: z.string().optional(),
  tags: z.array(z.string()),
});
```

---

## HomeSaveState

```typescript
const PlacedFurniture = z.object({
  furnitureId: z.string(),
  comodoId: z.string(),
  gridX: z.number().int(),
  gridY: z.number().int(),
  rotacao: z.number().int().multipleOf(90), // 0, 90, 180, 270
  instanceId: z.string(),               // UUID único desta instância
});

const HomeSaveState = z.object({
  houseId: z.string(),                  // qual template de casa está usando
  movelComprados: z.array(z.string()),  // IDs de FurnitureDefinition
  movelVendidos: z.array(z.string()),   // histórico
  movelPosicionados: z.array(PlacedFurniture),
  valorEstimadoImovel: z.number(),
  aluguelMensal: z.number().optional(), // se alugando
});
```
