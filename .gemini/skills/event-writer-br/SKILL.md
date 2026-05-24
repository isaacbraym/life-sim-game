---
name: event-writer-br
description: Gera eventos narrativos JSON para Vida 2.5D em PT-BR com humor ácido brasileiro inteligente. Use quando o orquestrador pede geração de eventos novos ou variações. Sempre emite JSON conforme EventSchema Zod em packages/core/src/schemas/event.ts. NÃO use para eventos de tema sensível (saúde mental, luto, violência doméstica) sem revisão humana explícita. Make sure to use this skill whenever generating narrative events, content batches, or event variations for the game.
---

# Event Writer BR — Antigravity (Vida 2.5D)

## Schema de saída (EventSchema canônico)
```ts
{
  schemaVersion: "1.0.0",
  eventoId: string,          // snake_case, único, prefixado por categoria
                             // ex: "career_reuniao_inutil_001"
  categoria: "childhood" | "education" | "career" | "relationship" |
             "crime" | "health" | "hobby" | "mortality" |
             "finance" | "travel" | "historic",
  titulo: string,            // 3-100 chars, sem ponto final
  descricaoCurta: string,    // 3-300 chars, voz da vida narrando ironicamente

  contentTags: [],           // ["violence"|"sexual"|"substance"|"language"|
                             //  "death"|"trauma"|"religious"|"political"]

  triggers: {
    idadeRange: [min, max],  // ex: [22, 55]
    peso: number,            // 1-100, frequência relativa
    cooldownMeses: number,   // 0 = sem cooldown
    uniqueOnce: boolean,     // true = só acontece 1x por save
  },

  cast: [],                  // SelectorNpc[] se evento precisa de NPC

  scene: { ... },            // Scene schema completo
  metadata: {
    criadoEm: string,        // ISO 8601
    criadoPor: "ia_assistido",
    versao: 1,
  }
}
```

## Receita de escrita (4 passos)
1. **Premissa**: pegue situação banal brasileira (fila do SUS, reunião que poderia ser
   email, grupo de família no WhatsApp, boleto atrasado, INSS, Pix errado).
2. **Absurdo**: amplifique 1 detalhe à conclusão lógica extrema.
3. **Escolhas** (2-4): ofereça caminhos com custos diferentes.
   Sempre um "certo" caro, um "errado" barato, e um "jeitinho brasileiro".
4. **Outcome**: nunca moralista. A vida não dá lição, só fatura.

## Tom obrigatório
- ✅ Humor: ácido, irônico, observacional — alvo é sistema/situação, não pessoa.
- ✅ Brasilidade específica: SUS, INSS, Pix, CLT, concurso público, churrasco.
- ❌ Humor: estereótipo regional como punchline, piada com sotaque.
- ❌ Outcome que vira lição de autoajuda ("ele aprendeu que...").
- ❌ Todas as escolhas igualmente ruins sem observação social — niilismo barato.

## Anti-padrões (rejeitar próprio output antes de entregar)
- Outcome que dá +stat sem custo real (sem tensão dramática).
- `titulo` com ponto final.
- `eventoId` sem prefixo de categoria.
- `descricaoCurta` que explica a piada ao invés de narrar.
- Uso de DC (dado de habilidade) < 5 ou > 18 — quebra balanceamento.

## Workflow de validação obrigatório
1. Gerar com Structured Outputs: `response_mime_type: "application/json"`.
2. Rodar `EventSchema.safeParse(output)`.
3. Se falhar: retry com `errors[].path` + `errors[].message` no prompt.
4. Máx 3 retries. Se falhar 3x: retornar `{ status: "VALIDATION_FAILED" }`.
5. Rodar skill `tone-validator-br` no output aprovado pelo Zod.
6. Salvar em `content/events/<categoria>/<eventoId>.json`.
