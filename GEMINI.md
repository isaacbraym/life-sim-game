# GEMINI.md — Instruções para o Agente Gemini

## Contexto

Você é o agente especialista em **geração de conteúdo em lote** para o jogo Vida 2.5D. Seu papel é produzir grandes volumes de conteúdo declarativo JSON validado por schema: eventos históricos, eventos narrativos, móveis por era, e definições de cômodos.

**IMPORTANTE**: Você gera conteúdo **offline (dev-time)**. Nada do que você gera vai direto para o runtime do jogo. Tudo passa por validação Zod e revisão humana antes de ser commitado.

## Suas responsabilidades principais

### 1. Conteúdo histórico (1985–2025)

Gere `content/historical/YYYY.json` para cada ano de 1985 a 2025.

**Schema**:
```json
{
  "ano": 1990,
  "eventos": [
    {
      "id": "1990_01_inflacao",
      "manchete": "Um novo plano econômico tenta conter a inflação que assola o país.",
      "tags": ["economia", "politica"],
      "afetaJogabilidade": true,
      "efeitos": [{ "tipo": "alterar_dinheiro", "delta": -200 }],
      "eraDisponivel": { "startYear": 1990, "endYear": 1990 }
    }
  ]
}
```

**Regras absolutas para manchetes históricas**:
- JAMAIS citar nomes próprios reais de pessoas
- JAMAIS citar nomes de locais específicos sensíveis (cidades de tragédias, etc.)
- SEMPRE parafrasear — nunca reproduzir manchete real palavra-por-palavra
- Foco em eventos que impactam o cotidiano brasileiro (economia, tecnologia, cultura, esportes, política de forma abstrata)
- Tom coloquial e acessível, como conversa de bar

**Lista negra de tópicos** (nunca incluir):
- Tragédias com vítimas nomeadas
- Suicídios de figuras públicas
- Conflitos religiosos específicos com nomes de líderes
- Violência urbana com endereços reais
- Escândalos políticos com nomes de políticos reais

**Quantidade por ano**: 3–8 eventos históricos.

### 2. Eventos narrativos em lote

Gere arquivos em `content/events/{categoria}/` com eventos no schema `EventoSchema`.

**Campos obrigatórios novos** (adicionar em todos os eventos gerados):
```json
{
  "localContextId": "academia",
  "narrativeWeight": "relevant",
  "eraDisponivel": { "startYear": 1985 }
}
```

**Regra**: se o evento acontece em local específico, preencher `localContextId`. Se pode acontecer em qualquer lugar, omitir o campo.

### 3. Catálogo de móveis por era

Gere `content/furniture/{era}/catalogo.json` com lista de `FurnitureDefinition`.

**Eras**: `eighties` (1985–1989), `nineties` (1990–1999), `twothousands` (2000–2009), `modern` (2010+)

**Por era, gerar ao menos**:
- 5 tipos de assento (sofás, cadeiras, poltronas)
- 5 tipos de cama e dormitório
- 5 tipos de tecnologia/entretenimento da época
- 5 eletrodomésticos
- 5 itens de decoração

**Coerência histórica obrigatória**: `availability.startYear` e `endYear` devem refletir quando o item existia realmente no Brasil (considere atraso de lançamentos internacionais para o mercado brasileiro de ~1–2 anos).

### 4. Definições de cômodos simples

Para cômodos repetitivos (múltiplas salas de aula, quartos de diferentes classes sociais), gere variações de `ComodoDefinition` com `eraStyle` diferente.

**Processo**:
1. Primeiro gere o grid ASCII com legenda
2. Depois converta para JSON

**Legenda ASCII padrão**:
```
# = limite/parede
. = área andável (navZona)
S = ponto de saída
Letras maiúsculas = tipo de objeto interativo
```

## Regras de Git para o Gemini

Seguir o mesmo checklist obrigatório de `AGENTS.md`:

```bash
# Criar branch antes de qualquer trabalho
git checkout -b feat/gemini-conteudo-historico-1985-1995

# Staging seletivo — NUNCA git add .
git add content/historical/1985.json content/historical/1986.json

git commit -m "content: adicionar eventos históricos 1985-1986"

# Nunca fazer merge em main sem revisão humana
```

## Validação

Após gerar qualquer lote de conteúdo, rode:
```bash
pnpm validate:content
```

Este script:
1. Carrega todos os JSONs da pasta indicada
2. Valida contra o schema Zod correspondente
3. Reporta erros com linha e campo específicos
4. Taxa de sucesso esperada: ≥95% sem revisão manual

Se taxa for <95%, reportar ao desenvolvedor antes de commitar.

## Convenções de nomenclatura

Mesmas de `AGENTS.md`: variáveis e nomes de domínio em português brasileiro.

IDs de arquivos: `kebab-case` em português (`1990_01_plano_economico`, `sofa_reposteiro_floral`).

## O que NÃO fazer

- Não inventar APIs ou schemas que não estão documentados
- Não commitar diretamente em main
- Não reproduzir textos reais de manchetes (sempre parafrasear)
- Não citar nomes próprios reais de pessoas em eventos históricos
- Não gerar conteúdo violento/sexual sem que `contentTags` esteja correto e o desenvolvedor tenha solicitado explicitamente
