# 05 — Pipeline de IA, Ferramenta de Validação e Conteúdo Histórico

## Filosofia: IA é ferramenta de dev-time, nunca de runtime

**Regra inviolável**: nenhuma chamada a LLM acontece dentro do jogo em runtime. Todo conteúdo (cenas, eventos, manchetes) é gerado **antes** do jogo ser distribuído, validado por humano, e congelado no banco de conteúdo.

Razões:
- Custo: IA em runtime cobra por sessão de jogador, inviável em modelo free
- Latência: jogador não espera 3-10s por cena ao tomar decisão
- Determinismo: testes automatizados precisam de comportamento reprodutível
- Offline-first: jogo precisa funcionar sem internet
- Qualidade: curadoria humana é o multiplicador de qualidade

## Pipeline completo

```
┌─────────────────────────────────────────────────────────────────┐
│  DEV-TIME (autor + IA + Claude Code, no laptop do desenvolvedor) │
└─────────────────────────────────────────────────────────────────┘

  Autor descreve evento em PT-BR
            │
            ▼
  Claude (chat especializado de eventos) gera estrutura inicial
            │
            ▼
  Autor revisa narrativa, ajusta tom, define escolhas
            │
            ▼
  Para cada desfecho de cada escolha, autor descreve cena
            │
            ▼
  Script CLI (packages/dev-tools/ai-pipeline) chama Claude API
  com Structured Outputs + Schema Zod de Scene
            │
            ▼
  JSON gerado passa por pipeline de validação:
    JSON.parse → Zod.safeParse → validador anatômico → validador coerência
            │
       (válido?)
            │
        ┌───┴───┐
       sim     não → repair loop (max 2 retries) → flag para revisão
            │
            ▼
  Cena válida vai para ferramenta visual (scene-validator app)
            │
            ▼
  Autor abre cena no validador, vê renderização com personagens genéricos
            │
       (visualmente OK?)
            │
        ┌───┴───┐
       sim     não → ajusta manualmente joints/expressões → JSON atualizado
            │
            ▼
  Aprovação salva no content/poses/ e content/events/{categoria}/
  + adiciona poses inéditas à biblioteca reutilizável
            │
            ▼
  Git commit, PR (mesmo solo, força revisão própria)
            │
            ▼
  Build de produção empacota content/ → distribuído ao jogador
```

## Setup técnico

### Anthropic API

- Modelo principal: `claude-sonnet-4-7` (ou superior conforme disponibilidade)
- Estrutura: Structured Outputs com `output_config.format: { type: 'json_schema', schema: ... }`
- Caching: Prompt caching ativo (system prompt + few-shots em cache de 1h)
- Rate limits: respeitar 50 RPM em tier gratuito; tier pago se necessário em batches grandes

### Schema enviado para a IA

A IA recebe **apenas o schema da Scene** (ou da Pose, em geração isolada), não o schema completo do Event. Isto porque:
1. Eventos são escritos pelo autor humano (estrutura, escolhas, efeitos)
2. IA só gera o conteúdo visual da cena de cada desfecho

Conversão do schema Zod para JSON Schema canônico (formato que Claude API entende):

```typescript
// packages/dev-tools/ai-pipeline/src/schemaConverter.ts
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Scene } from '@core/schemas/scene';

export const SceneJsonSchema = zodToJsonSchema(Scene, {
  name: 'Scene',
  target: 'openApi3',  // formato aceito pela Anthropic API
  $refStrategy: 'none',  // inline tudo, sem $ref
});
```

### Estrutura do System Prompt

```markdown
Você é o gerador de cenas de "Vida 2.5D", um jogo de simulação de vida em estilo 2.5D estilizado.

Sua tarefa: dada uma descrição de cena em português brasileiro, gerar um JSON conforme o schema fornecido.

## Conhecimento do rig (15 joints)

[lista completa dos joints com nomes em PT-BR, ranges anatômicos plausíveis em graus]

## Conhecimento de presets

[lista de expressões faciais, presets de mão, presets de pé, backgrounds, framings]

## Princípios de cena

- Composição: respeite regra dos terços, evite atores muito centralizados
- Naturalidade: poses devem refletir emoção descrita, não ser estáticas
- Coerência: contatos entre atores devem fazer sentido espacialmente
- Anatomia: respeite ranges válidos de joint (não dobre cotovelo para trás)

## Few-shot examples

[3-5 exemplos completos: (descrição PT-BR) → (Scene JSON válido)]
```

System prompt fica em `packages/dev-tools/ai-pipeline/src/prompts/sceneSystem.md`.

### Pipeline de validação completo

```typescript
// packages/dev-tools/ai-pipeline/src/validatePipeline.ts
import { Scene } from '@core/schemas/scene';
import { validarAnatomicamente, validarCoerenciaCena } from '@core/schemas/validators';

export type ValidationResult =
  | { ok: true; cena: Scene }
  | { ok: false; etapa: string; erros: string[] };

export function validar(jsonBruto: string): ValidationResult {
  // Etapa 1: JSON.parse
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonBruto);
  } catch (e) {
    return { ok: false, etapa: 'parse', erros: [String(e)] };
  }

  // Etapa 2: Zod schema
  const zodResult = Scene.safeParse(parsed);
  if (!zodResult.success) {
    return { ok: false, etapa: 'schema', erros: zodResult.error.errors.map(e => e.message) };
  }

  // Etapa 3: validação anatômica
  const anatomico = validarAnatomicamente(zodResult.data);
  if (!anatomico.ok) {
    return { ok: false, etapa: 'anatomico', erros: anatomico.erros };
  }

  // Etapa 4: coerência (contatos, sockets, atores)
  const coerencia = validarCoerenciaCena(zodResult.data);
  if (!coerencia.ok) {
    return { ok: false, etapa: 'coerencia', erros: coerencia.erros };
  }

  return { ok: true, cena: zodResult.data };
}
```

### Repair loop

Quando validação falha, oferece à IA a chance de corrigir:

```typescript
async function gerarCenaComRetry(descricao: string, maxRetries = 2): Promise<Scene> {
  let tentativa = 0;
  let mensagensAdicionais: string[] = [];

  while (tentativa <= maxRetries) {
    const respostaJson = await chamarClaude(descricao, mensagensAdicionais);
    const validacao = validar(respostaJson);

    if (validacao.ok) return validacao.cena;

    // adiciona feedback para próximo retry
    mensagensAdicionais.push(
      `Tentativa anterior falhou na etapa ${validacao.etapa}. Erros: ${validacao.erros.join('; ')}. ` +
      `Corrija e tente novamente, mantendo a intenção da cena.`
    );

    tentativa++;
  }

  throw new GeracaoCenaError(`Falhou após ${maxRetries + 1} tentativas`);
}
```

### Repair determinístico

Antes de retry com IA, tente repair determinístico para erros pequenos:

```typescript
function tentarReparoDeterministico(cena: Scene, erros: ValidationResult): Scene | null {
  // Exemplo: ângulo de cotovelo fora do range
  for (const ator of cena.atores) {
    for (const rotacao of ator.pose.rotacoes) {
      const limite = LIMITES_ANATOMICOS[rotacao.jointId];
      if (rotacao.rotacaoGraus > limite.maxGraus) {
        rotacao.rotacaoGraus = limite.maxGraus;
      } else if (rotacao.rotacaoGraus < limite.minGraus) {
        rotacao.rotacaoGraus = limite.minGraus;
      }
    }
  }
  return cena;  // ou null se não foi possível reparar
}
```

Se repair conseguir corrigir → registra log `{repaired: true, tipoErro: 'anatomico_clamp'}` e prossegue. Se não conseguir → vai para IA retry.

### Custos esperados

Estimativa para 5.000 cenas geradas (cobrindo ~500 eventos com média de 4 desfechos cada):

- Tokens input por cena: ~3.500 (schema + few-shots + descrição)
- Tokens output por cena: ~800
- Custo aproximado (Claude Sonnet em 2026): US$ 0.03 input + US$ 0.012 output = US$ 0.042/cena
- **Total estimado: US$ 200-250 acumulado durante todo o desenvolvimento**

Com prompt caching ativo (system prompt + few-shots cacheados), custo cai para ~US$ 80-120.

## Ferramenta de validação visual (scene-validator)

App separado em `packages/dev-tools/apps/scene-validator/`. Roda em `localhost:5174` durante desenvolvimento.

### Funcionalidades essenciais (MVP da ferramenta — Sprint 0.6)

- **Carregar cena**: file picker ou drag-and-drop de JSON
- **Renderização**: canvas PixiJS mostra a cena com 2 personagens genéricos pré-definidos
- **Inspetor JSON**: Monaco editor à direita mostra o JSON, com syntax highlighting
- **Sincronização two-way**:
  - Editar JSON no Monaco → re-renderiza cena
  - Clicar em joint no canvas → seleciona joint, mostra slider de ângulo
  - Mover slider → atualiza JSON em tempo real
- **Validação contínua**: badge mostra status (válido / inválido + erros)
- **Salvar**: botão exporta JSON validado para `content/poses/` ou `content/events/`

### Funcionalidades expandidas (Fase 1+)

- **Biblioteca de poses**: painel lateral mostra todas as poses já aprovadas, com thumbnail
- **Copiar pose entre cenas**: drag-and-drop de pose da biblioteca para ator da cena atual
- **Versionamento de cenas**: cada salvamento cria nova versão com timestamp; histórico de versões navegável
- **Diff entre versões**: comparação visual lado a lado
- **Teste de proporções**: slider para variar altura/largura dos personagens de teste, ver se a cena ainda faz sentido
- **Modo apresentação**: exibe a cena em fullscreen sem UI de edição, para validação final

### Componentes React

```tsx
// packages/dev-tools/apps/scene-validator/src/App.tsx
export function App() {
  const [cena, setCena] = useState<Scene | null>(null);
  const [jointSelecionado, setJointSelecionado] = useState<JointId | null>(null);
  const [validacao, setValidacao] = useState<ValidationResult | null>(null);

  return (
    <Layout>
      <SceneCanvas
        cena={cena}
        onJointClick={setJointSelecionado}
        modoDebug={modoDebug}
      />
      <PainelLateral>
        <JointGizmo
          jointId={jointSelecionado}
          cena={cena}
          onChange={(novaCena) => {
            setCena(novaCena);
            setValidacao(validar(JSON.stringify(novaCena)));
          }}
        />
        <PoseLibrary onSelectPose={aplicarPose} />
      </PainelLateral>
      <JsonInspector cena={cena} onChange={setCena} validacao={validacao} />
      <BarraStatus validacao={validacao} />
    </Layout>
  );
}
```

### Integração com pipeline CLI

A ferramenta visual e o CLI compartilham `packages/core/`. Workflow típico:

```bash
# 1. Gerar 10 cenas via CLI
cd packages/dev-tools/apps/ai-pipeline
pnpm cli generate-batch \
  --input descricoes.json \
  --output ../../../../content/poses/_pendentes/

# 2. Abrir ferramenta visual
cd ../scene-validator
pnpm dev
# Navegar para localhost:5174, validar cenas em _pendentes/, aprovar uma a uma

# 3. Cenas aprovadas vão para content/poses/{categoria}/, _pendentes/ esvazia
```

## Chat especializado de eventos (projeto separado)

Para escrever eventos com qualidade narrativa, criar **um segundo projeto Claude** ("Vida 2.5D — Roteirista") dedicado. Esse chat:

- Conhece o tom do jogo (misto, ácido, dark cotidiano)
- Conhece os 5 atributos e como usá-los em escolhas
- Conhece o sistema D20 + DC + tiers
- Tem few-shots de eventos bem escritos
- Recebe input do autor em PT-BR colloquial e devolve estrutura de evento + 3-5 escolhas + efeitos

Prompt template em `packages/dev-tools/ai-pipeline/src/prompts/eventoRoteirista.md`.

Output desse chat é **rascunho** do evento, que ainda passa por:
1. Revisão do autor (ajuste de tom, escolhas, efeitos)
2. Geração de cenas para cada desfecho (no chat principal, via pipeline)
3. Validação visual de cada cena
4. Commit no banco

## Chat especializado de manchetes históricas (projeto separado)

Terceiro projeto Claude ("Vida 2.5D — Curador Histórico") dedicado a popular `content/historical/YYYY.json`.

System prompt resumido:

```markdown
Você é o curador histórico do jogo "Vida 2.5D". Sua tarefa: dado um ano e mês,
listar 3 manchetes que marcaram aquela época, focando em eventos relevantes
para a sociedade brasileira (mas pode incluir eventos globais de impacto).

Regras invioláveis:
1. Parafraseie. Nunca cite manchete literal de jornal.
2. Não nomeie pessoas reais (políticos, celebridades, vítimas).
3. Use generalização espacial quando o evento for sensível
   ("um grande atentado em metrópole europeia em 2015" em vez de Bataclan).
4. Lista negra de tópicos: suicídios de figuras públicas, atentados com vítimas
   civis identificáveis, conflitos religiosos atuais, acusações criminais
   de pessoas vivas, tragédias com crianças.
5. Tom: jornalístico neutro, frase única de 1-2 linhas.
6. Tags: classifique cada manchete em uma das categorias
   (politica, economia, cultura, tecnologia, esporte, tragedia, internacional).

Output: JSON conforme schema fornecido.
```

Autor humano valida cada lote, especialmente em anos sensíveis (2001, 2014-2018 política BR, 2020 pandemia).

## Conteúdo histórico — fontes técnicas

### APIs gratuitas a consumir em dev-time

- **Wikipedia REST API** — endpoint `feed/onthisday/events/{MM}/{DD}` retorna eventos do dia em várias línguas
- **Wikidata SPARQL** (`query.wikidata.org/sparql`) — queries estruturadas filtrando por país e período
- **Wikipedia Current Events portal** — lista curada de eventos globais relevantes por dia
- **IBGE APIs** — dados demográficos, econômicos brasileiros
- **Banco Central APIs** — séries históricas de inflação, câmbio (úteis para ambientação econômica do jogo)

### Pipeline Python para coleta

```python
# scripts/collect-historical-events.py
import requests
import json
from datetime import date, timedelta

def coletar_ano(ano: int) -> dict:
    eventos_por_mes = {}
    for mes in range(1, 13):
        eventos_do_mes = []
        for dia in range(1, 32):
            try:
                data_iter = date(ano, mes, dia)
            except ValueError:
                continue
            url = f"https://api.wikimedia.org/feed/v1/wikipedia/pt/onthisday/events/{mes:02d}/{dia:02d}"
            r = requests.get(url, headers={'User-Agent': 'Vida25D-Curator/1.0'})
            if r.ok:
                eventos_do_mes.extend(_filtrar_por_ano(r.json(), ano))
        eventos_por_mes[mes] = eventos_do_mes
    return eventos_por_mes

# Script gera content/historical/_pendentes/{ano}.raw.json
# Depois o chat curador parafraseia e tagueia
# Curadoria humana revisa
# Versão final vai para content/historical/{ano}.json
```

### Blacklist de tópicos (curadoria humana sempre revisa)

Categorias onde **mesmo paráfrase é problemática** e devem ser descartadas:

- Suicídios de figuras públicas reais
- Atentados com vítimas civis nomeadas ou em local específico
- Acusações criminais contra pessoas vivas e identificáveis
- Tragédias com crianças (massacres escolares, sequestros)
- Conflitos religiosos atuais (Israel-Palestina, Mianmar-Rohingya)
- Estatísticas de gênero/etnia que podem cair em discurso de ódio
- Casos jurídicos brasileiros recentes ainda em andamento

Categorias **OK com paráfrase + generalização**:

- Crises econômicas (Plano Real 1994, crise 2008, pandemia 2020)
- Avanços tecnológicos (iPhone, ChatGPT, redes sociais — "o telefone com tela de toque que mudou tudo")
- Eventos esportivos e culturais (Copa do Mundo, Olimpíadas, premiações)
- Mudanças políticas amplas (queda do Muro, fim da URSS, eleições democráticas) — com cautela
- Modas e gírias de época ("a música que todos tocavam em 1998")

### Estratégias de paráfrase segura

1. **Generalização temporal e espacial**: "no início dos anos 2000, um grande atentado terrorista chocou os EUA" em vez de "11 de setembro de 2001"
2. **Arquétipos**: "celebridade do rock morre cedo aos 27" em vez de nomear Kurt Cobain ou Amy Winehouse
3. **Inversão criativa**: "uma nova doença respiratória emerge na Ásia em 2020"
4. **Datas precisas para eventos não-controversos**: "Brasil pentacampeão na Copa 2002" é factual, esportivo, sem dano a ninguém — ok citar
5. **Personagens fictícios com profissões públicas**: "o presidente eleito" sem nome — jogador preenche imaginariamente

## Atualização de conteúdo pós-launch

Conteúdo histórico cresce com o tempo (anos novos chegam). Pipeline contínuo:

- Anualmente: curador roda script Python para o ano que acabou, paráfrase, revisão humana, novo arquivo `content/historical/{ano}.json`
- Build de jogo distribui via update (PWA atualiza automaticamente, app via update da loja)

Conteúdo passado pode ser **revisitado** quando o tom da sociedade muda: algo aceitável em 2020 pode ser problemático em 2030. Revise anualmente os arquivos antigos.
