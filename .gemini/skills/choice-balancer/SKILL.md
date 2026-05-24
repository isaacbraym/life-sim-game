---
name: choice-balancer
description: Valida e ajusta o balanceamento de DC e efeitos em eventos do Vida 2.5D. Detecta escolhas impossíveis, triviais demais, ou com efeitos numericamente quebrados. Use após gerar evento e antes do tone-validator-br. Make sure to use this skill whenever reviewing event choices, DC values, or effect deltas.
---

# Choice Balancer — Antigravity (Vida 2.5D)

## Sistema D20 do jogo
- Rolagem: d20 + modificador do atributo
- Modificador: `floor((atributo - 10) / 2)` — igual ao D&D 5e
- Atributos: forca, inteligencia, carisma, constituicao, sorte (escala 1-20)
- Tiers: 1 = falha crítica, 2-9 = falha, 10-19 = sucesso, 20 = sucesso crítico

## Ranges de DC aceitáveis
| DC | Dificuldade | Quando usar |
|---|---|---|
| 5-7 | Fácil | Personagem competente raramente falha |
| 8-11 | Médio | Resultado incerto, tension real |
| 12-15 | Difícil | Especialista tem chance razoável |
| 16-18 | Muito difícil | Herói com atributo 18 tem ~50% chance |
| > 18 | Proibido | Impossível para jogador médio — não usar |

## Deltas de efeito aceitáveis
- Atributo (forca, inteligencia, etc.): -5 a +5 por evento (±10 em eventos raros)
- Dinheiro: proporcional à idade/profissão (não usar valor fixo — usar % do salário)
- Humor/Saúde: -20 a +20 por evento
- Relacionamento: -30 a +30 por evento

## Red flags (rejeitar evento)
- Toda escolha dá efeito positivo → sem tensão
- Toda escolha dá efeito negativo → niilismo barato
- Delta de atributo > ±10 em evento único
- DC de 1 ou 2 (trivial demais) ou > 18 (impossível)
- Escolha sem nenhum efeito (nem positivo nem negativo)
- Dois efeitos do mesmo tipo na mesma escolha sem justificativa narrativa

## Saída obrigatória
```json
{
  "balanced": false,
  "eventoId": "...",
  "problems": [
    {
      "field": "choices[0]",
      "issue": "DC 3 é trivial — personagem com carisma 10 tem 90%+ de sucesso",
      "fix": "Aumentar DC para 10 ou remover o dado e dar efeito fixo pequeno"
    }
  ]
}
```
