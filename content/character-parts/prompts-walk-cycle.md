# Prompts GPT — Walk Cycle do Corpo Base

Use no projeto GPT de sprites após o prompt de estilo.
Gere 2 imagens por prompt (gabarito magenta + _2 transparente).
Canvas: 68×96px. Anchor: (34,86). Fundo: magenta #FF00FF.
Gerar sempre nas 8 direções: N/NE/E/SE/S/SW/W/NW.

---

## walk_1.webp — Perna direita à frente

Isometric dimetric character, corpo_base adult neutral, walking pose frame 1.
Perna DIREITA avançada à frente, perna ESQUERDA atrás, joelhos levemente dobrados.
Braço ESQUERDO à frente (oposto à perna), braço DIREITO atrás.
Tronco levemente inclinado para frente (~5°).
Mesmo estilo do corpo base idle: boneco 3D, sem textura, bege claro uniforme.

---

## walk_2.webp — Passagem (pernas juntas)

Isometric dimetric character, corpo_base adult neutral, walking pose frame 2.
Pernas JUNTAS no centro, levemente curvadas (posição de passagem).
Braços próximos ao corpo, posição neutra.
Tronco levemente ereto, corpo no ponto mais ALTO do bob vertical (+2px).

---

## walk_3.webp — Perna esquerda à frente

Isometric dimetric character, corpo_base adult neutral, walking pose frame 3.
Perna ESQUERDA avançada à frente, perna DIREITA atrás.
Braço DIREITO à frente, braço ESQUERDO atrás.
Redesenhar para cada direção — não espelhar horizontalmente.

---

## walk_4.webp — Passagem 2

Isometric dimetric character, corpo_base adult neutral, walking pose frame 4.
Igual ao walk_2 mas com posição de braços levemente diferente para suavizar o loop.
Corpo no ponto mais ALTO do bob vertical.

---

## idle_2.webp — Idle respiração

Isometric dimetric character, corpo_base adult neutral, idle breathing frame.
Igual ao idle_1 (sprites atuais 1–8.webp) mas tronco 1–2px mais alto.
Ombros levemente mais altos. Braços na mesma posição.

---

## sit_1.webp — Sentado

Isometric dimetric character, corpo_base adult neutral, sitting pose.
Personagem sentado: quadris para baixo, joelhos dobrados ~90°, pés no chão.
Tronco ereto, braços apoiados nas coxas ou nos braços da cadeira.
Gerar em todas as 8 direções.

---

## lay_1.webp — Deitado

Isometric dimetric character, corpo_base adult neutral, laying down pose.
Personagem deitado de costas, visto em projeção isométrica.
Corpo horizontal, braços ao lado do corpo.
Gerar apenas em S (frente) e N (costas).

---

## wave_1/2/3.webp — Acenando (3 frames)

wave_1: posição neutra, braço direito levemente levantado.
wave_2: braço direito levantado até a altura do ombro, mão aberta.
wave_3: braço direito no ponto mais alto, acima da cabeça.
Gerar apenas em S, SE, SW.
