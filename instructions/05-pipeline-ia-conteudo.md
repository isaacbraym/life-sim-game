# 05 — Pipeline de IA para Geração de Conteúdo (dev-time)

## Princípio

A IA generativa **só atua em tempo de desenvolvimento**, nunca dentro do jogo em runtime. Todo conteúdo gerado passa por validação humana antes de virar conteúdo oficial.

O pipeline agora cobre 4 tipos de conteúdo:
1. **Cenas/poses** — como antes
2. **Cômodos** — `ComodoDefinition` completo com layout de objetos
3. **Móveis** — `FurnitureDefinition` em lote por era
4. **Eventos** — `EventoSchema` em lote com novos campos (`localContextId`, `narrativeWeight`, `eraDisponivel`)

## Tipo 1: Geração de Cenas/Poses

> **Gate de QA: Scene Proofer (`pnpm dev:tools`) — obrigatório antes do commit.**

Fluxo mantido do design original:

1. Autor descreve evento e desfechos em PT-BR
2. IA recebe schema Zod do `Scene` + gramática do rig (15 joints, 4 orientações, ranges anatômicos)
3. IA gera JSON declarativo via Anthropic Structured Outputs
4. Validação: `JSON.parse` → `Zod.safeParse` → validador anatômico → validador de coerência
5. Se inválido: feedback loop, máximo 2 retries
6. Scene-validator renderiza para validação visual humana
7. Aprovação salva em `content/poses/`

## Tipo 2: Geração de Cômodos (novo)

> **Gate de QA: Room Validator (`pnpm dev:tools`) — obrigatório antes do commit.**

### Fluxo

1. Autor descreve o cômodo: tipo, era, arquétipo, objetos esperados
2. CLI `generate-room` chama Claude com:
   - System prompt em `prompts/roomSystem.md`
   - Schema `ComodoDefinition` + `InteractableObject` como JSON Schema via `zod-to-json-schema`
   - Few-shots de cômodos validados (mínimo 3)
3. Claude gera **primeiro um grid ASCII** (mais confiável para layouts espaciais), depois converte para JSON estruturado
4. Pipeline valida via Zod
5. Room Validator renderiza o cômodo com placeholders
6. Autor valida posições, navZonas e pontos de saída via sliders/drag no Room Validator
7. Aprovação salva em `content/locations/{local}/{comodo}.json`

### Técnica de prompt para layouts espaciais

**NÃO peça o JSON diretamente** — LLMs têm dificuldade com coordenadas absolutas em JSON aninhado. Use grid ASCII intermediário:

```
System: Você é um designer de ambientes para um jogo de simulação de vida 2.5D.
Gere o layout do cômodo em 2 etapas:
ETAPA 1: Grid ASCII (largura x altura em tiles de 32px)
  # = parede/limite
  . = área andável
  S = ponto de saída
  Letras = tipo de objeto (B=cama, C=computador, etc.)
ETAPA 2: JSON no schema fornecido, usando as posições do grid ASCII.

User: Academia - Área de musculação - estilo anos 90, 30x17 tiles
```

O script de conversão traduz o grid ASCII para coordenadas `x * TILE_SIZE` automaticamente.

### few-shots obrigatórios

Antes de usar o pipeline em produção, criar manualmente pelo menos **3 cômodos por arquétipo**:
- Sala de aula (escola)
- Área de musculação (academia)
- Sala de apartamento simples (casa)

Esses são os few-shots que garantem qualidade nos cômodos gerados.

### Prompt system para cômodos (`prompts/roomSystem.md`)

```markdown
Você é um designer de ambientes para um jogo de simulação de vida 2.5D brasileiro.

CONTEXTO DO JOGO:
- Perspectiva oblíqua 3/4 (~15°) — não isométrico clássico
- Sala única por vez (room-by-room navigation)
- Personagem anda por click-to-move até objetos interativos
- Cômodos têm entre 20x12 e 40x20 tiles de 32px cada
- Cada objeto precisa de posicaoDeInteracao (onde o personagem fica ao usar)

SCHEMA DE SAÍDA: [JSON Schema do ComodoDefinition aqui]

PROCESSO:
1. Primeiro desenhe o grid ASCII com legenda
2. Depois gere o JSON usando as posições do grid

RESTRIÇÕES:
- NavZonas devem ser polígonos simples (retângulos no MVP)
- Pelo menos 1 ponto de saída por cômodo
- interacaoDeInteracao deve estar numa navZona
- Mínimo 3 e máximo 10 objetos interativos por cômodo
- Objetos devem ter disponibilidadeEra coerente com a era pedida
```

## Tipo 3: Geração de Móveis em lote (novo)

> **Gate de QA: Furniture Viewer (`pnpm dev:tools`) — obrigatório antes do commit.**

### Fluxo

```bash
pnpm gen:furniture --era=nineties --count=20 --categoria=tecnologia
```

O script:
1. Carrega schema `FurnitureDefinition` + few-shots de móveis validados
2. Chama Claude com prompt de geração em lote
3. Valida cada item via Zod
4. Items inválidos são logados para revisão manual
5. Items válidos são salvos em `content/furniture/{era}/`

### Prompt para móveis

```markdown
Gere {count} móveis de categoria {categoria} para ambientação dos anos {era}.

Regras:
- Nome em português brasileiro coloquial
- Preço em reais da época (ajustado pela inflação histórica)
- availability.startYear e endYear coerentes com quando o item existia no Brasil
- tamanhoGrid proporcional ao tamanho real do objeto
- Ações devem fazer sentido narrativo (cama → dormir; computador → estudar, trabalhar, jogar)
- efeitos passivos modestos (máx +3 em qualquer atributo)

Schema: [JSON Schema do FurnitureDefinition aqui]
```

## Tipo 4: Geração de Eventos em lote (novo)

> **Gate de QA: Event Graph + Simulador (`pnpm dev:tools`) — obrigatório antes do commit.**

### Fluxo

```bash
pnpm gen:events --categoria=education --fase=adolescente --count=15 --era=nineties
```

O script adiciona ao prompt os novos campos:
- `localContextId` — qual local o evento está vinculado (opcional)
- `narrativeWeight` — `routine | relevant | major`
- `eraDisponivel.startYear` e `endYear`

### Estratégia de adaptação dos 213 eventos existentes

Os eventos existentes **não serão descartados**. Estratégia de enriquecimento incremental:

1. Eventos de academia → adicionar `localContextId: 'academia'`
2. Eventos de escola → adicionar `localContextId: 'escola'`
3. Eventos de família em casa → adicionar `localContextId: 'casa'`
4. Eventos sem contexto claro → manter sem `localContextId` (disparam universalmente)
5. Classificar `narrativeWeight` em todos os eventos existentes
6. Adicionar `eraDisponivel` onde fizer sentido (smartphones só após 2007)

Script de enriquecimento automático via Claude:
```bash
pnpm enrich:events --input=content/events/ --output=content/events-enriched/
```

## Geração de Conteúdo Histórico (delegado ao Gemini)

O conteúdo histórico de 1985 a 2025 (cerca de 40 anos) é gerado pelo agente Gemini via Anthropic Gravity / pipeline separado. Ver `GEMINI.md` para instruções.

O Gemini recebe:
- Schema `EventoHistorico` (id, ano, manchete parafraseada, tags, afetaJogabilidade, efeitos)
- Lista negra de tópicos sensíveis
- Regra: JAMAIS citar nomes próprios reais ou locais específicos sensíveis
- Template de paráfrase criativa

Output: `content/historical/YYYY.json` para cada ano de 1985 a 2025.

## Ferramentas de dev-tools

### scene-validator (existente, mantido)

Valida e ajusta poses/cenas de personagens.

### room-validator (novo)

```
packages/dev-tools/apps/room-validator/
├── RoomCanvas.tsx        — renderiza ComodoDefinition com PixiJS
├── FurniturePlacer.tsx   — drag de objetos para ajustar posições
├── WalkableEditor.tsx    — editar navZonas via polígono clicável
├── ExitEditor.tsx        — posicionar pontos de saída
└── JsonInspector.tsx     — Monaco editor com validação Zod em tempo real
```

**Critério de uso**: toda `ComodoDefinition` gerada por IA passa pelo room-validator antes de ir para `content/locations/`. Nunca commitar cômodo sem validação visual.

## Tecnologia: Vercel AI SDK + Anthropic Structured Outputs

```typescript
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { ComodoDefinition } from '@core/schemas/location';

const { object: comodo } = await generateObject({
  model: anthropic('claude-sonnet-4-5'),
  schema: ComodoDefinition,
  mode: 'tool',       // mais confiável para Anthropic que mode: 'json'
  maxRetries: 3,
  prompt: promptDeComodo,
});
```

Alternativa (SDK Anthropic direto, GA sem beta header):
```typescript
import Anthropic from '@anthropic-ai/sdk';
import { zodToJsonSchema } from 'zod-to-json-schema';

const client = new Anthropic();
const response = await client.messages.create({
  model: 'claude-sonnet-4-5',
  max_tokens: 4096,
  output_config: {
    format: { type: 'json_schema', schema: zodToJsonSchema(ComodoDefinition) },
  },
  messages: [{ role: 'user', content: promptDeComodo }],
});
```

## Retry loop com injeção de erro

```typescript
async function gerarComRetry<T>(
  schema: z.ZodType<T>,
  promptBase: string,
  maxTentativas = 3
): Promise<T> {
  let ultimoErro = '';
  for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
    const prompt = tentativa === 1
      ? promptBase
      : `${promptBase}\n\nTentativa anterior falhou na validação:\n${ultimoErro}\nCorreja e tente novamente.`;

    const resposta = await chamarLLM(prompt);
    const resultado = schema.safeParse(JSON.parse(resposta));

    if (resultado.success) return resultado.data;
    ultimoErro = JSON.stringify(resultado.error.format(), null, 2);
  }
  throw new Error(`Falhou após ${maxTentativas} tentativas. Revisão manual necessária.`);
}
```

## Verificação de qualidade (checklist pré-commit)

Antes de commitar qualquer conteúdo gerado por IA:

- [ ] Conteúdo aberto no proofer correspondente em `pnpm dev:tools` (ver `instructions/11-devtools-qa.md`)
- [ ] Aprovação humana explícita registrada (screenshot ou nota no PR)
- [ ] Para cômodos: `posicaoDeInteracao` de todos os objetos verificada dentro das navZonas no Room Validator
- [ ] Para eventos (lote): pelo menos 3 eventos simulados no Consequence Simulator com `EstadoDeJogo` representativo
- [ ] Para furniture: catálogo revisado no Furniture Viewer, nenhum móvel com `acoes[]` vazio ou `availability` incoerente
- [ ] JSON valida 100% contra schema Zod via `pnpm validate:content`
- [ ] Cômodo passou pelo room-validator (visual OK)
- [ ] Pose/cena passou pelo scene-validator (anatômico OK)
- [ ] Eventos sem reprodução de manchetes históricas palavra-por-palavra
- [ ] `eraDisponivel` coerente com tecnologia/contexto histórico real
- [ ] Sem nomes próprios reais em manchetes históricas
