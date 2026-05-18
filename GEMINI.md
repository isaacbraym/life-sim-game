# Instrucoes especificas — Gemini Pro

## Contexto do projeto

Vida 2.5D e um jogo de simulacao de vida contemporanea com camada visual 2D procedural.
Desenvolvimento solo. Stack TypeScript/React/PixiJS. Monorepo PNPM.

## Leia antes de qualquer acao

1. /instructions/00-visao-e-escopo.md — visao geral e tom do jogo
2. /instructions/01-arquitetura-tecnica.md — stack e estrutura
3. /docs/STATUS_ATUAL.md — o que foi feito e o que falta
4. /docs/ROADMAP.md — sprint atual e proximos passos

## Suas responsabilidades preferenciais neste projeto

- Geracao de conteudo narrativo (eventos, dialogos, manchetes historicas)
- Revisao de balanceamento de mecanicas (atributos, DCs, pesos de eventos)
- Documentacao e comentarios de codigo
- Suporte a pesquisa tecnica (APIs, bibliotecas, abordagens)
- Geracao de dados de teste (NPCs, saves de exemplo)

## O que NAO fazer

- NAO alterar decisoes arquiteturais documentadas em /instructions/
- NAO sugerir game engines ou runtimes de animacao proprietarios
- NAO gerar codigo de runtime que chame IA generativa
- NAO usar localStorage para saves
- NAO inventar comportamentos de APIs sem verificar

## Convencoes que deve seguir

- Variaveis e metodos em portugues brasileiro
- TypeScript strict — sem any sem justificativa
- Seguir schemas Zod definidos em /instructions/03-schemas-canonicos.md

## Tom do jogo (para conteudo narrativo)

Misto, com pendor acido e dark. Humor cotidiano e absurdo coexiste com
momentos dramaticos genuinos. Referencia tonal: Disco Elysium.
NAO e um jogo fofo. NAO e edgy gratuito.
Conteudo adulto disponivel mas opt-in nas configuracoes.
