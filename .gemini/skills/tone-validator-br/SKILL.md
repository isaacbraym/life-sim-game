---
name: tone-validator-br
description: Valida tom e conteúdo de eventos gerados para Vida 2.5D antes de commitar. Detecta humor preconceituoso, piadas que precisam ser explicadas, estereótipos como punchline, referências datadas e niilismo barato. Use SEMPRE antes de adicionar qualquer evento ao content/events/. Make sure to use this skill before committing any event JSON file, without exception.
---

# Tone Validator BR — Antigravity (Vida 2.5D)

## Critérios de rejeição automática (qualquer 1 = FALHA)

1. **Alvo errado**: o riso depende de zombar de grupo vulnerável.
   Teste: "Quem é o alvo da piada? Uma situação/sistema ou um grupo de pessoas?"
   Se grupo de pessoas → FALHA.

2. **Punchline explicada**: o outcome ou descrição "explica" a piada.
   Teste: remove a última frase do outcome. A piada ainda funciona?
   Se precisou da explicação → FALHA.

3. **Estereótipo regional**: "típico paulista", "jeito carioca", "nordestino que..."
   como gatilho do humor → FALHA automática.

4. **Datado em 6 meses**: referência a meme viral da semana, político em cargo atual,
   escândalo recente como nome próprio → FALHA.

5. **Niilismo barato**: 3+ outcomes onde todos os caminhos terminam em perda pura,
   sem nenhuma observação social real, sem ironia que ilumine algo → FALHA.

6. **Autoajuda disfarçada**: outcome que termina em lição moral ou crescimento pessoal
   não irônico ("e ele percebeu que o importante era...") → FALHA.

## Saída obrigatória (JSON)
```json
{
  "passed": false,
  "eventoId": "career_reuniao_inutil_001",
  "issues": [
    {
      "code": "WRONG_TARGET",
      "field": "choices[1].outcome",
      "quote": "trecho problemático aqui",
      "fix": "Reescrever: o alvo deve ser a situação X, não a pessoa Y"
    }
  ],
  "suggestion": "Reorientar o humor para criticar a cultura de reunião, não o gerente específico."
}
```

Se passou em tudo:
```json
{ "passed": true, "eventoId": "...", "issues": [] }
```
