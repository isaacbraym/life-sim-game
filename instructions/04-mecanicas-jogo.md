# 04 — Mecânicas de Jogo

## Sistema RPG: 5 atributos

O personagem é definido por 5 atributos numéricos (1 a 20), inspirados em D&D 5e mas adaptados para simulação de vida:

| Atributo | Influencia |
|---|---|
| **Força** | Brigas, esportes físicos, trabalhos manuais pesados, intimidação física |
| **Inteligência** | Performance escolar, trabalhos cerebrais, decisões lógicas, resolução de problemas complexos |
| **Carisma** | Relacionamentos, persuasão, vendas, política, sedução, liderança |
| **Constituição** | Saúde física, resistência a doenças, longevidade, tolerância a álcool/drogas |
| **Sorte** | Modificador universal em rolagens, eventos aleatórios favoráveis/desfavoráveis |

**Atributos genéticos vs evolutivos**: ao nascer, os 5 valores são determinados aleatoriamente entre 6 e 14 (distribuição normal centrada em 10). Esses valores ficam armazenados em `atributosGeneticos` no Character e são imutáveis. O campo `atributos` é o valor **atual**, que muda ao longo da vida por ações:

- Ir à academia → +Força (com limite máximo por idade)
- Estudar → +Inteligência
- Frequentar eventos sociais → +Carisma
- Manter dieta + sono regular → +Constituição
- (Sorte não evolui por ações; é puramente genética, mas pode ser temporariamente modificada por amuletos/superstições em eventos especiais)

**Decaimento por idade**: a partir dos 60 anos, Força e Constituição decaem 1 ponto a cada 5 anos. Inteligência e Carisma permanecem; podem decair só com Alzheimer ou eventos específicos. Sorte nunca decai.

## D20 com 4 tiers de desfecho

Toda escolha que envolva risco rola 1d20. O resultado define o desfecho:

| Roll | Tier | Descrição |
|---|---|---|
| 1 | Falha crítica | Consequência ruim, geralmente dispara evento especial negativo |
| 2-9 | Falha | Resultado negativo (atributo, dinheiro, relacionamento, etc.) |
| 10-19 | Sucesso | Resultado positivo padrão |
| 20 | Sucesso crítico | Consequência ótima, geralmente dispara evento especial positivo |

### Modificadores de atributo (estilo D&D 5e)

Cada atributo gera um modificador aplicado ao roll:

```
modificador = floor((atributo - 10) / 2)
```

Exemplos:
- Atributo 8 → modificador -1
- Atributo 10 → modificador 0
- Atributo 14 → modificador +2
- Atributo 18 → modificador +4

Em uma escolha que usa Carisma, o roll efetivo é `1d20 + modificadorCarisma`. Atributos altos ainda podem rolar falha crítica em "1 natural", mas é raro. Atributos baixos podem ainda assim conseguir sucesso crítico em "20 natural".

### Dificuldade (DC — Difficulty Class)

Cada escolha pode declarar uma `dificuldade` no `atributoCheck` da `OpcaoEscolha`. Se o roll + modificador ≥ DC, é sucesso; senão, falha. Os tiers 1 e 20 são absolutos (sucesso/falha crítico independem da DC).

DC típicas:
- 5: trivial (tarefa cotidiana)
- 10: comum (qualquer adulto consegue normalmente)
- 15: difícil (precisa de competência específica)
- 20: muito difícil
- 25: heroico
- 30: praticamente impossível

```typescript
// Exemplo de uso
const roll = rolar1d20();
const modificador = calcularModificador(personagem.atributos.carisma);
const resultadoEfetivo = roll + modificador;

if (roll === 1) return 'falha_critica';
if (roll === 20) return 'sucesso_critico';
if (resultadoEfetivo >= dificuldade) return 'sucesso';
return 'falha';
```

## Sistema de tempo

### Ritmo configurável

No início da partida, o jogador escolhe entre 3 ritmos:

| Ritmo | Eventos principais por ano | Duração estimada de vida completa |
|---|---|---|
| **Mensal** | 12 (1/mês) | ~80h de gameplay |
| **Semestral** | 2 | ~10h de gameplay |
| **Anual** | 1 | ~5h de gameplay (estilo BitLife) |

A escolha afeta densidade de eventos, não atributos. O jogador pode escolher ritmo lento para roleplay imersivo ou rápido para "rerolls" de vida.

### Dois modos de tempo

**Modo 1: avançar tempo (eventos principais).** O jogador clica em "envelhecer" (botão grande no HUD), e o motor:
1. Avança o calendário interno (mês/semestre/ano conforme ritmo)
2. Atualiza idade do personagem e de todos os NPCs do roster
3. Aplica decaimento por idade se aplicável
4. Consulta o pool de eventos elegíveis
5. Faz weighted random pick
6. Dispara o evento (cena renderizada, escolhas oferecidas)
7. Aplica efeitos da escolha do jogador

**Modo 2: atividades livres (eventos secundários).** Entre eventos principais, o jogador tem ações cotidianas que **não avançam o calendário**, mas:
- Consomem um recurso "energia/disposição" diário/mensal (a definir na fase 1.5)
- Têm efeitos próprios (modificação de atributos, dinheiro, relacionamentos)
- **30-35% de chance de spawnar um mini-evento** (cena curta com 1-3 escolhas)

### Limite de atividades por unidade de tempo

| Ritmo | Atividades antes de "envelhecer" |
|---|---|
| Mensal | 25-35 ações |
| Semestral | 80-120 ações |
| Anual | 150-250 ações |

Esses números são iniciais, a refinar com playtests na fase 1.6.

## Atividades livres do MVP

~30 atividades base, com submenus contextuais. Algumas exemplos:

### Categoria: Físico
- Ir à academia (+Força, -dinheiro, chance de mini-evento "conheceu personal trainer")
- Correr no parque (+Constituição, +humor)
- Praticar esporte específico (+Força ou +Destreza implícita)

### Categoria: Mental
- Estudar (+Inteligência, -humor se exagerar)
- Ler livro (+Inteligência, +humor)
- Quebra-cabeças/jogos (+Inteligência leve)

### Categoria: Social
- Sair com amigos (+Carisma, +humor, -dinheiro)
- Ir a balada (+Carisma, chance de romance, -dinheiro, -humor no dia seguinte)
- Encontros românticos (eventos de romance)
- Visitar familiar (+afeto com NPC específico)

### Categoria: Trabalho
- Hora extra (+dinheiro, -humor, +chance de promoção)
- Networking profissional (+Carisma, chance de mini-evento "oportunidade nova")
- Procurar novo emprego

### Categoria: Hobby
- Tocar instrumento (+Carisma leve, +humor)
- Pintar/desenhar
- Cozinhar
- Jardinagem

### Categoria: Vícios
- Beber (+humor curto, -saude longo, chance de mini-evento)
- Fumar (igual)
- Drogas recreativas (efeitos fortes, alta chance de eventos especiais)
- Jogos de azar (dinheiro aleatório, alta dependência de Sorte)

### Categoria: Crime
- Pequeno furto (DC fácil, recompensa baixa)
- Roubo armado (DC médio, recompensa média, alto risco)
- Esquema de fraude (DC alto, recompensa alta, exige Inteligência)
- Tráfico (cadeia complexa de risco)

## NPCs persistentes

### Roster do save

Cada save mantém um `roster: Npc[]` com todos os NPCs já gerados naquela gameplay. NPCs persistem **dentro de uma única gameplay** — entre gameplays diferentes, novos NPCs são gerados (mesmo "papéis" como "chefe" geram aparências diferentes).

### Tags de persistência

Cada NPC tem `persistencia` definindo seu ciclo de vida no roster:

- **`permanente`**: nunca é removido. Famíia direta (pai, mãe, irmãos, filhos), cônjuges atuais, melhores amigos de longa data.
- **`recorrente`**: pode reaparecer em eventos futuros. Chefes, colegas de trabalho, amigos casuais, ex-romances. Eligível para garbage collection após X anos sem interação.
- **`descartavel`**: gerado para um único evento, descartado após. Vendedor casual, atendente de loja, assaltante anônimo.

### Algoritmo de matching NPC

Quando um evento declara um `SelectorNpc` (em `event.cast`), o motor decide se puxa do roster ou cria novo:

```typescript
// pseudo-código de NpcMatcher
function selecionarOuCriarNpc(seletor: SelectorNpc, roster: Npc[], rng: Rng): Npc {
  if (seletor.tipo === 'sempre_novo') {
    return gerarNpcNovo(seletor.constraints, rng);
  }

  // tipo === 'relacional'
  const candidatos = roster.filter(npc =>
    npc.vivo &&
    npc.tags.includes(seletor.papel) &&
    satisfazConstraints(npc, seletor.constraints)
  );

  if (candidatos.length > 0) {
    // existe NPC compatível: usa, com aging aplicado
    return aplicarAging(escolherMaisRelevante(candidatos, rng));
  }

  // não existe: cria novo, registra com tags do seletor
  const novo = gerarNpcNovo(seletor.constraints, rng);
  novo.tags = [seletor.papel];
  novo.persistencia = seletor.persistenciaApos;
  roster.push(novo);
  return novo;
}
```

### Geração de aparência ao criar NPC

Ao criar NPC novo, aleatorize dentro das constraints:

- **Traços fixos** (nunca mudam ao longo da vida): cor pele, cor olhos, formato rosto/nariz/boca, estilo corporal base, altura base
- **Traços variáveis** (mudam com idade/estado): cor cabelo, estilo cabelo, peso atual, marcas de envelhecimento

Use seeds estáveis (`hash(saveId + npcId)`) para que a aparência seja determinística entre sessões.

### Envelhecimento de NPC

A cada avanço de tempo, todos os NPCs do roster envelhecem proporcionalmente:

1. **Aos 30**: nenhuma mudança visual significativa
2. **Aos 40**: leves rugas de expressão, possivelmente primeiros fios brancos
3. **Aos 50**: `temGrisalho: true` se geneticamente predisposto, possíveis óculos (`usaOculos: true`)
4. **Aos 60**: rugas marcantes (`temRugas: true`), olheiras permanentes (`temOlheiras: true`)
5. **Aos 70+**: postura curvada, cabelo grisalho/branco, possivelmente bengala (preset de pé)

Traços fixos (`tracosFisicos`) **nunca mudam**. O jogador sempre reconhece o NPC pela cor de pele, formato de rosto, traços do nariz/boca, mesmo que ele tenha envelhecido drasticamente.

### Status próprio do NPC

NPCs têm seu próprio estado vivo:

- `vivo: boolean`
- `profissaoAtual`
- `statusFinanceiro`
- `relacionamentoComJogador`
- `relacionamentosComOutrosNpcs` (NPCs podem ter vínculos entre si)

**Simulação autônoma de NPCs**: no MVP da Fase 1, NPCs são estáticos (só mudam quando o jogador interage). A simulação de fundo (NPCs envelhecem, mudam de emprego, morrem, casam entre si sem o jogador ver) é planejada para Fase 2+.

### 5 abas de detalhe quando jogador clica num NPC

UI obrigatória para qualquer NPC selecionável:

1. **Aparência**: visualização do rig + descrição textual ("cabelo preto, olhos castanhos, 1.72m, formato de rosto oval, sinal na bochecha esquerda")
2. **Bio**: nome completo, idade atual, profissão, classe social, status civil, religião opcional
3. **Relacionamento**: como conheceu o jogador, tipo de vínculo, barra de afeto, "última interação" datada
4. **Atributos**: stats RPG do NPC (se aplicável; alguns NPCs descartáveis não têm)
5. **Linha do tempo**: lista cronológica de eventos compartilhados com o jogador

## Sistema de eventos

### Estrutura de pool

Cada arquivo `.event.json` em `content/events/` é carregado no startup do jogo e indexado por:

- categoria
- idadeRange (eventos de infância vs adolescência vs adulto vs idoso)
- flags requeridas
- tags de conteúdo (para filtro adulto opt-in)

Quando o jogador clica "envelhecer":

1. Motor consulta o índice e filtra eventos com `triggers.idadeRange` cobrindo a idade atual
2. Avalia `triggers.requisitos` (PredicateTree) contra o GameState
3. Para eventos que passam, aplica `peso` em weighted random pick
4. Escolhe 1 evento, dispara cena

### Cooldown e uniqueOnce

- `cooldownMeses: 24` → evento não pode reocorrer por 24 meses após última ocorrência
- `uniqueOnce: true` → evento só pode ocorrer 1 vez em toda a vida

Flags são marcadas automaticamente após disparar evento (`evento_disparado_XYZ_ano_2024`).

### Predicados (PredicateTree)

A linguagem de predicados é fechada e mínima (ver `03-schemas-canonicos.md`). Não há `eval` ou expressões dinâmicas. Predicados são compilados para closures JS em build-time.

Exemplos de uso:

```json
{
  "triggers": {
    "idadeRange": [18, 25],
    "requisitos": {
      "tipo": "todos",
      "predicados": [
        { "tipo": "flag", "flag": "completou_ensino_medio", "presente": true },
        { "tipo": "var", "caminho": "personagem.dinheiro", "operador": ">=", "valor": 5000 },
        {
          "tipo": "nao",
          "predicado": { "tipo": "flag", "flag": "tem_filho", "presente": true }
        }
      ]
    },
    "peso": 30
  }
}
```

### Árvores narrativas

Choices podem ter `proximoEventoId` que força o próximo evento a ser específico. Isso permite construir mini-arcos:

```
evento "chefe_pede_overtime_sem_aumento"
├── escolha "aceitar"
│   └── (sem proximoEventoId, retorna ao pool normal)
├── escolha "negociar"
│   ├── sucesso → evento "promocao_inesperada"
│   └── falha → evento "chefe_furioso_demissao_iminente"
└── escolha "atacar_chefe"
    └── proximoEventoId: "consequencias_violencia_trabalho"
```

Árvores podem ter múltiplos níveis. Para manter sanidade, **limite profundidade a 5 níveis** e use ferramenta `event-grapher` em dev-tools para visualizar.

## Eventos históricos

Cada `content/historical/YYYY.json` lista eventos do ano real, parafraseados, sem citar nomes próprios sensíveis:

```json
{
  "ano": 2002,
  "eventos": [
    {
      "id": "2002_01_blackout",
      "manchete": "Um grande apagão de energia atinge boa parte do país, deixando milhões sem luz.",
      "tags": ["infraestrutura", "tecnologia"],
      "afetaJogabilidade": true,
      "efeitos": [
        { "tipo": "alterar_humor", "delta": -5 }
      ]
    },
    {
      "id": "2002_01_bbb_estreia",
      "manchete": "Estreia de um reality show de confinamento que vira sensação nacional.",
      "tags": ["cultura", "tv"],
      "afetaJogabilidade": false
    }
  ]
}
```

Durante o gameplay, ao avançar para janeiro de 2002, o motor pode:
- Mostrar 1-3 manchetes aleatórias do arquivo no "noticiário" da HUD
- Se `afetaJogabilidade: true`, aplicar efeitos diretamente
- Disparar um evento jogável especial se houver um vinculado àquela manchete

## Conteúdo adulto opt-in

Toda peça de conteúdo (evento, cena, NPC) pode ter `contentTags: TagConteudo[]`. Tags possíveis:

- `violence`, `sexual`, `substance` (drogas), `language` (palavrão pesado)
- `death`, `trauma`, `religious`, `political`

No menu de configurações, o jogador tem checkboxes para liberar cada tag. Por padrão **todas começam bloqueadas** — eventos com qualquer tag bloqueada são automaticamente filtrados do pool.

Após liberar, o jogador pode rever a qualquer momento e fechar novamente. Eventos já vividos permanecem no histórico, mas não voltam ao pool.

## Carreiras (Fase 2+)

Profissões com árvores narrativas dedicadas. MVP cobre apenas profissões "básicas" via campos `profissaoAtual` e `salarioMensal`. Fase 2 introduz:

- 15-20 carreiras com 20-40 eventos próprios cada
- Progressão por níveis (estagiário → júnior → pleno → sênior → gestor)
- Eventos específicos por carreira (médico que perde paciente, advogado em caso famoso, criminoso pego em flagrante)

Lista provisória de carreiras-foco da Fase 2:
- Médico, Advogado, Programador, Professor, Artista
- Empresário, Político, Atleta, Músico, Ator
- Policial, Bombeiro, Militar
- Trabalhador braçal genérico, Vendedor genérico
- Criminoso (várias especialidades)
- Aposentado (acessado após idade limite)
