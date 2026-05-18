# Comandos Rapidos — Vida 2.5D

## Desenvolvimento local

# Instalar dependencias
pnpm install

# Rodar o jogo em dev
cd packages/game && pnpm dev
# Abre em: http://localhost:5173

# Build de producao
cd packages/game && pnpm build

# Deploy para Cloudflare
cd packages/game && pnpm build && npx wrangler pages deploy dist --project-name life-sim-game

## Git

# Commit padrao
git add .
git commit -m "feat(escopo): descricao"
git push

## Captura do projeto (para enviar ao agente)

# Capturar tudo
.\CAPTURA_VIDA25D.ps1 -CaminhoRaiz "C:\PROJETOS\Projeto_Vida2_5_D\life-sim-game"

# Capturar so um package
.\CAPTURA_VIDA25D.ps1 -CaminhoRaiz "C:\PROJETOS\Projeto_Vida2_5_D\life-sim-game" -ApenasPackage "core"
.\CAPTURA_VIDA25D.ps1 -CaminhoRaiz "C:\PROJETOS\Projeto_Vida2_5_D\life-sim-game" -ApenasPackage "game"

## URLs importantes

Producao: https://life-sim-game.isaacbraym1.workers.dev
Repositorio: https://github.com/isaacbraym/life-sim-game
Cloudflare: https://dash.cloudflare.com

## Estrutura de pastas

life-sim-game/
  packages/core/       — motor (rig, schemas, eventos)
  packages/game/       — app principal
  packages/dev-tools/  — ferramentas internas
  content/             — banco de conteudo
  instructions/        — docs arquiteturais (00 ao 07)
  docs/                — docs operacionais
