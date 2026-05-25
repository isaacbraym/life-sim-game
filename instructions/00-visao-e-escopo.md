# 00 — Visão e Escopo do Projeto

## O que é o jogo

Vida 2.5D é um jogo de simulação de vida contemporâneo com exploração point-and-click em perspectiva oblíqua. O jogador cria um personagem ao nascer — com ano de nascimento entre **1985 e 2000** — e atravessa a vida tomando decisões, explorando ambientes, interagindo com NPCs e acumulando consequências até a morte natural ou acidental.

A diferença central em relação a jogos como BitLife é a **camada de exploração visual**: o jogador não clica em menus abstratos para "ir à academia". Ele abre um mapa de bairro, escolhe o local Academia, entra em um cômodo, anda até um aparelho, clica nele e interage. Os NPCs estão presentes no ambiente, não em painéis de texto. As consequências de cada ação emergem visualmente no mundo e ficam registradas num log narrativo que constrói a história da vida do personagem.

O charme narrativo vem de **ações, decisões, consequências e logs** — não de diálogos longos ou cutscenes cinematográficas.

## Inspirações

- **Habbo Hotel** — mecânica de exploração point-and-click em ambientes com perspectiva oblíqua, interação com objetos e NPCs no ambiente
- **The Sims** — exploração de cômodos, sistema de mobília, needs e status do personagem, interações contextuais
- **BitLife** — tom narrativo, sistema de log de consequências, eventos com escolhas e desfechos, ritmo de simulação de vida
- **Persona 5** — mapa de locais clicáveis, fases da vida com locais desbloqueáveis por progressão
- **Crusader Kings III** — NPCs persistentes com biografias, relacionamentos cruzados, sistema de eventos por era
- **Disco Elysium** — tom adulto, mistura de humor ácido com momentos dramáticos genuínos
- **Hypnospace Outlaw** — paráfrase histórica criativa, ambientação temporal sem violar copyright

## Pilares de design

1. **Exploração contextual é o diferencial visual inegociável** — o jogador vê e anda pelo ambiente, clica no que quer interagir; o menu abstrato de atividades não existe
2. **Narrativa emerge de ações e consequências, não de diálogos** — logs narrativos por camadas constroem a história; falas completas entre personagens são evitadas
3. **O mundo acompanha a época** — móveis, tecnologia, roupas e eventos refletem o ano em que o personagem vive; nascer em 1985 significa experienciar os anos 80, 90 e 2000s
4. **Conteúdo dirige a experiência, não tecnologia** — cada minuto que o engine consome é um minuto a menos para escrever eventos e ambientes; stack escolhida prioriza velocidade de iteração
5. **IA é multiplicador de produtividade em dev-time, não muleta de qualidade em runtime** — toda cena, cômodo e evento passa por validação humana antes de virar conteúdo do jogo
6. **NPCs com personalidade lembram-se da vida do jogador** — relacionamentos persistentes, com envelhecimento sincronizado, diferenciam o jogo de outras simulações casuais
7. **Save é sagrado** — perder uma vida em curso por falha técnica é falha imperdoável; auto-backup, export para arquivo, integridade verificável

## Tom

Misto, com pendor ácido e dark. Humor cotidiano e absurdo coexiste com momentos dramáticos genuínos (doença terminal de um pai, traição de cônjuge, perda de filho, prisão injusta). Não é um jogo "fofo". Não é também um jogo edgy gratuito.

Referência tonal: Disco Elysium ou Death Stranding — leveza quando cabe, peso quando precisa.

Conteúdo adulto (sexo, violência gráfica, uso de drogas, blasfêmia explícita) está **disponível mas opt-in nas configurações**. Por padrão o jogo inicia com filtro ativado.

## Setting

Mundo contemporâneo real, ambientação predominantemente brasileira com expansão global. O jogador escolhe ano de nascimento entre **1985 e 2000** no início da partida.

A cidade e seus locais evoluem conforme o tempo passa: tecnologia, móveis, roupas, veículos e eventos históricos mudam para refletir a década em que o personagem vive. Um personagem nascido em 1985 vê videocassetes, ouve walkman, e convive com crises econômicas dos anos 90 antes de ver a chegada da internet e dos smartphones.

Notícias históricas reais (parafraseadas, sem citar nomes próprios ou locais sensíveis) aparecem como ambientação temporal: jornais na TV, conversas casuais entre NPCs, eventos políticos e econômicos que impactam a economia do jogo.

## Plataformas alvo

- **Fase 1–3**: PWA no navegador, desktop-first. Cloudflare Pages como hospedagem.
- **Fase 4**: encapsulamento com Capacitor para iOS App Store e Google Play Store.
- **Fase 5 opcional**: build desktop nativo via Tauri para Steam ou itch.io.

## Modelo de negócio

- **Fase 1–3**: gratuito sem ads. Foco em retenção e validação de mercado.
- **Fase 3 final**: introdução de ads (intersticial entre vidas, nunca durante exploração).
- **Fase 4**: recursos premium (cosméticos, casas exclusivas, cenários alternativos). Compras únicas, não assinatura.

Princípios firmes: nenhum pay-to-win, nenhum gacha, nenhum loot box, saves nunca bloqueados por paywall.

## Princípios de não-escopo (o que NÃO faremos)

- **Mundo aberto contínuo**: jogador não anda por ruas conectando locais. O mapa de bairro é um seletor de destinos, não um mundo aberto.
- **Diálogos longos estilo visual novel**: NPCs não têm falas extensas. Interação é por ActionBubble com opções curtas; narrativa vem do log.
- **Build mode de construção de casa**: jogador não constrói paredes nem altera planta. Compra, vende e move móveis dentro de planta fixa.
- **Cutscenes cinematográficas**: eventos acontecem dentro do ambiente explorável com feedback visual; não há modal de cutscene separado.
- **Pathfinding complexo**: movimento do personagem é tween direto para ponto de interação declarado no objeto. Sem A* ou navmesh.
- **Multiplayer**: jogo é single-player offline-first.
- **MMORPG features**: sem guildas, leaderboards competitivos, eventos sazonais com FOMO.
- **Microtransações de progressão**: nunca vender atributos, créditos de vida ou similar.
- **NFTs ou blockchain**: jamais.
- **Realismo extremo**: jogo é estilizado, cartunesco, humorístico — não é simulador biomecânico.

## Critério de sucesso

- **Fase 1 (MVP)**: 10 testers conseguem jogar uma vida completa (nascimento aos 80+ anos) sem crashes, explorando pelo menos 5 locais diferentes, e relatam vontade de jogar de novo.
- **Fase 3 (launch público)**: 1.000 usuários mensais ativos, NPS positivo, churn de 7 dias inferior a 50%.
- **Fase 4 (mobile)**: app aprovado nas duas lojas, pelo menos 10.000 downloads cumulativos nos primeiros 6 meses.

## Identidade visual (direção)

- Perspectiva oblíqua 3/4 leve (~15° de inclinação), entre lateral e isométrico — personagem grande, próximo da câmera, fácil de ler
- Estilo cartunesco/anime estilizado
- Silhuetas orgânicas contínuas, sem aparência de marionete
- Paleta moderada, não saturada
- Ambientes com profundidade visual via z-sorting por Y e leve escala por profundidade
- Tipografia legível em mobile pequeno
- UI clean inspirada em apps modernos
