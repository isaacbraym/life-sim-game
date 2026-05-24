# Instrucoes especificas — Gemini Pro / Antigravity

## Contexto do projeto

Vida 2.5D e um jogo de simulacao de vida contemporanea com camada visual 2D procedural.
Desenvolvimento solo. Stack TypeScript/React/PixiJS/Zustand/Zod/Dexie. Monorepo PNPM.

## Leia antes de qualquer acao

1. /instructions/00-visao-e-escopo.md — visao geral e tom do jogo
2. /instructions/01-arquitetura-tecnica.md — stack e estrutura
3. /instructions/03-schemas-canonicos.md — schemas Zod (especialmente Event)
4. /docs/ROADMAP.md — sprint atual e proximos passos
5. AGENTS.md — regras compartilhadas com todos os agentes

E consulte os arquivos .txt anexados ao chat para o estado real do codigo
(pkg_core.txt, pkg_game.txt, content_banco.txt, 00_raiz_configs.txt).
Esses .txt sao a fonte de verdade do codigo atual.
NUNCA suponha conteudo de arquivo sem verificar nos .txt.

## REGRA DE ESCOPO (CRITICA)

Faca SOMENTE o que esta no brief recebido. NAO modifique arquivos pre-existentes
fora do escopo declarado, mesmo que pareca "obvio" que precisam de fix.

Se identificar que arquivos antigos quebram um validador ou schema novo:
LISTE os arquivos no PR como issue separada — NAO corrija nesta sprint.

PROIBIDO `pnpm install --force` ou qualquer comando que mexa em deps fora
do brief. Se houver problema de build, REPORTAR e parar — nao improvisar fix.

## Suas responsabilidades preferenciais

- Geracao de conteudo narrativo (eventos, dialogos, manchetes historicas)
- Revisao de balanceamento de mecanicas (atributos, DCs, pesos de eventos)
- Documentacao e comentarios de codigo
- Suporte a pesquisa tecnica (APIs, bibliotecas, abordagens)
- Geracao de dados de teste (NPCs, saves de exemplo)
- Suporte a persistencia: SaveManager, listagem/migracao/integridade de saves
- Validacao automatizada de conteudo (scripts de validate-events)

## O que NAO fazer

- NAO alterar decisoes arquiteturais documentadas em /instructions/
- NAO sugerir game engines ou runtimes de animacao proprietarios
- NAO gerar codigo de runtime que chame IA generativa
- NAO usar localStorage para saves principais
- NAO inventar comportamentos de APIs sem verificar
- NAO commitar build artifacts (.js, .d.ts, .js.map em packages/*/src/)
- NAO commitar direto em main — sempre em feature branch
- NAO usar `git add .` — staging sempre seletivo

## Convencoes que deve seguir

- Variaveis e metodos em portugues brasileiro
- TypeScript strict — sem any sem justificativa
- undefined em vez de null para ausencia
- Seguir schemas Zod definidos em /instructions/03-schemas-canonicos.md
- Validar conteudo gerado contra os schemas Zod ANTES de commitar

## Procedimento antes de cada commit

```
git branch    # confirmar HEAD
git status    # ver o que esta modificado
git add <arquivo1> <arquivo2>   # seletivo
git status    # confirmar staging
git commit -m "..."
```

## Tom do jogo (para conteudo narrativo)

Misto, com pendor acido e dark. Humor cotidiano e absurdo coexiste com
momentos dramaticos genuinos. Referencia tonal: Disco Elysium.
NAO e um jogo fofo. NAO e edgy gratuito.
Conteudo adulto disponivel mas opt-in nas configuracoes.

## Regras inviolaveis de conteudo

- Parafrasear SEMPRE — nunca reproduzir manchetes ou eventos reais palavra-por-palavra
- Nao mencionar nomes proprios de pessoas reais em eventos historicos
- Blacklist de topicos (ver /instructions/05-pipeline-ia-conteudo.md):
  tragedias com vitimas civis nomeadas, suicidios de figuras publicas,
  conflitos religiosos atuais
- Tags obrigatorias em todo evento: pelo menos uma de
  [permanente, recorrente, descartavel]
- Eventos recorrentes precisam definir cooldownMeses coerente
