# 00 — Visão e Escopo do Projeto

## O que é o jogo

Vida 2.5D é um jogo de simulação de vida contemporâneo, sucessor espiritual do BitLife com camada visual procedural rica. O jogador cria um personagem ao nascer, escolhe o ano de nascimento entre 1990 e 2010, e atravessa a vida tomando decisões mês a mês (ou semestre a semestre, ou ano a ano — ritmo configurável no início da partida) até a morte natural ou acidental.

A diferença central em relação ao BitLife é a **camada visual**: cada evento e cada interação relevante gera uma cena renderizada com o personagem do jogador e os NPCs envolvidos, em estilo 2.5D estilizado cartunesco/anime. As cenas são geradas como código JSON declarativo em dev-time pela IA, validadas visualmente pelo desenvolvedor, e renderizadas em runtime substituindo personagens genéricos pelos personagens reais do save daquela gameplay.

## Inspirações

- **BitLife** — loop de gameplay, simulação de vida contemporânea, ritmo de decisão por turno
- **The Sims** — UI rica, painéis de informação sobre personagens e relacionamentos
- **Hypnospace Outlaw** — paráfrase histórica criativa, ambientação temporal sem violar copyright
- **Disco Elysium** — tom adulto, mistura humor ácido com momentos dramáticos genuínos
- **Crusader Kings** — sistema de NPCs persistentes com biografias e relacionamentos cruzados

## Pilares de design

1. **Camada visual procedural é o diferencial inegociável** — qualquer decisão técnica que comprometa a qualidade visual ou a flexibilidade do rig deve ser revista
2. **Conteúdo dirige a experiência, não tecnologia** — cada minuto que o engine consome é um minuto a menos para escrever eventos. Stack escolhida prioriza velocidade de iteração
3. **IA é multiplicador de produtividade em dev-time, não muleta de qualidade em runtime** — toda cena passa por validação humana antes de virar conteúdo do jogo
4. **NPCs com personalidade lembram-se da vida do jogador** — relacionamentos persistentes, com envelhecimento sincronizado, são o que diferencia o jogo de outras simulações casuais
5. **Save é sagrado** — perder uma vida em curso por falha técnica é falha imperdoável. Auto-backup, export para arquivo, integridade verificável

## Tom

Misto, com pendor ácido e dark. Humor cotidiano e absurdo coexiste com momentos dramáticos genuínos (doença terminal de um pai, traição de cônjuge, perda de filho, prisão injusta). Não é um jogo "fofo". Não é também um jogo edgy gratuito. A referência tonal é Disco Elysium ou Death Stranding: leveza quando cabe, peso quando precisa.

Conteúdo adulto (sexo, violência gráfica, uso de drogas, blasfêmia explícita) está **disponível mas opt-in nas configurações**. Por padrão o jogo inicia com filtro ativado. O jogador adulto que quer pode desativar e ter a experiência completa.

## Setting

Mundo contemporâneo real, ambientação predominantemente brasileira mas com expansão global. O jogador escolhe ano de nascimento entre **1990 e 2010** no início da partida, e a vida do personagem avança em tempo real conforme o ritmo escolhido.

Notícias históricas reais (parafraseadas, sem citar nomes próprios ou locais específicos sensíveis) aparecem como ambientação temporal: jornais na TV, conversas casuais entre NPCs, eventos políticos/econômicos que impactam a economia do jogo. Curadoria via chat de IA especializado, com lista negra explícita de tópicos sensíveis (tragédias com vítimas civis nomeadas, suicídios de figuras públicas, conflitos religiosos atuais, etc.).

## Plataformas alvo

- **Fase 1-3**: PWA no navegador, desktop-first. Cloudflare Pages como hospedagem.
- **Fase 4**: encapsulamento com Capacitor para iOS App Store e Google Play Store, mantendo o código base único.
- **Fase 5 opcional**: build desktop nativo via Tauri para distribuição em Steam ou itch.io, se houver demanda.

Mobile aproveita a base desktop sempre que possível. Filosofia de iteração: validar uma feature em desktop primeiro (6× iterações até ficar bom), depois adaptar para mobile (1× iteração), economizando ciclos.

## Modelo de negócio

- **Fase 1-3**: gratuito sem ads. Foco em retenção e validação de mercado.
- **Fase 3 final**: introdução de ads (intersticial entre vidas, não durante gameplay) como monetização principal.
- **Fase 4**: recursos premium (cosméticos avançados, scenarios alternativos, acelerador de progressão). Compras únicas, não assinatura.

Decisões finais de monetização ficam abertas. Princípios firmes:
- Nenhum pay-to-win
- Nenhum gacha
- Nenhum elemento de loot box
- Saves nunca podem ser bloqueados por paywall

## Princípios de não-escopo (o que NÃO faremos)

- **Multiplayer**: jogo é single-player offline-first. Nada de PvP, co-op, ou social features além de share de save/screenshot
- **MMORPG features**: nada de guildas, leaderboards globais competitivos, eventos sazonais com FOMO
- **Microtransações de progressão**: nunca vender atributos, créditos de vida, ou similar
- **NFTs ou blockchain**: jamais
- **Conteúdo gerado pelo usuário público**: jogadores não podem criar e compartilhar eventos. Risco legal e de moderação alto demais para indie solo
- **Realismo extremo**: o jogo é estilizado, cartunesco, humorístico. Não é um simulador biomecânico
- **Simulação econômica complexa**: economia é abstrata e serve a narrativa, não é o foco

## Critério de sucesso

- **Fase 1 (MVP)**: 10 testers conseguem jogar uma vida completa (nascimento aos 80+ anos) sem crashes e relatam vontade de jogar de novo
- **Fase 3 (launch público)**: 1.000 usuários mensais ativos, NPS positivo, churn de 7 dias inferior a 50%
- **Fase 4 (mobile)**: app aprovado nas duas lojas, com pelo menos 10.000 downloads cumulativos nos primeiros 6 meses

## Identidade visual (a definir, mas direção)

- Estilo cartunesco/anime estilizado, 2.5D
- Silhuetas orgânicas contínuas, sem aparência de marionete
- Paleta moderada, não saturada
- Tipografia legível em mobile pequeno
- Animações suaves mas econômicas (mobile-friendly)
- UI clean, inspirada em apps modernos (não em UIs de jogos AAA)

Identidade visual completa será desenvolvida em pass dedicado durante Fase 1.6 (polimento).
