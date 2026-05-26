param(
    [Parameter(Mandatory = $true)]
    [string]$CaminhoRaiz,

    [string]$ApenasPackage = ""
)

$ConfigsCapturar = @(
    "package.json",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.base.json",
    "vite.config.ts",
    "pnpm-workspace.yaml"
)

$PastasIgnorar = @(
    "node_modules",
    "dist",
    ".git",
    ".vite",
    "coverage",
    ".turbo",
    "_pendentes",
    "_entrega_escopo_atual"
)

$PadroesNomeIgnorar = @(
    "vida25d_captura_*",
    "*.zip"
)

$ExtensoesCodigo = @("*.ts", "*.tsx")
$MAX_EVENTOS_PASTA = 2

function Nome-Ignorado {
    param([string]$nome)

    foreach ($padrao in $PadroesNomeIgnorar) {
        if ($nome -like $padrao) {
            return $true
        }
    }

    return $false
}

function Caminho-Excluido {
    param(
        [string]$caminho,
        [string[]]$lista
    )

    $partes = $caminho -split '[\\/]'
    foreach ($seg in $lista) {
        if ($partes -contains $seg) {
            return $true
        }
    }

    foreach ($parte in $partes) {
        if (Nome-Ignorado -nome $parte) {
            return $true
        }
    }

    return $false
}

function Caminho-Relativo {
    param(
        [string]$caminhoCompleto,
        [string]$base
    )

    return $caminhoCompleto.Replace($base, "").TrimStart('\').TrimStart('/')
}

function Adicionar-Linha {
    param(
        [System.Text.StringBuilder]$StringBuilder,
        [string]$Texto = ""
    )

    [void]$StringBuilder.AppendLine($Texto)
}

function Adicionar-Arquivo {
    param(
        [System.Text.StringBuilder]$StringBuilder,
        [System.IO.FileInfo]$Arquivo,
        [string]$Base
    )

    $rel = Caminho-Relativo -caminhoCompleto $Arquivo.FullName -base $Base
    Adicionar-Linha -StringBuilder $StringBuilder -Texto "// --- $($Arquivo.Name) [$rel] ---"
    Adicionar-Linha -StringBuilder $StringBuilder -Texto (Get-Content $Arquivo.FullName -Raw -Encoding UTF8)
    Adicionar-Linha -StringBuilder $StringBuilder
}

function Adicionar-Separador {
    param(
        [System.Text.StringBuilder]$StringBuilder,
        [string]$Titulo
    )

    Adicionar-Linha -StringBuilder $StringBuilder -Texto "// =================================================="
    Adicionar-Linha -StringBuilder $StringBuilder -Texto "// $Titulo"
    Adicionar-Linha -StringBuilder $StringBuilder -Texto "// =================================================="
    Adicionar-Linha -StringBuilder $StringBuilder
}

function Adicionar-Arquivos-Por-Padrao {
    param(
        [System.Text.StringBuilder]$StringBuilder,
        [string]$Titulo,
        [string]$Pasta,
        [string[]]$Filtros,
        [switch]$Recurse
    )

    if (-not (Test-Path $Pasta)) {
        return 0
    }

    Adicionar-Separador -StringBuilder $StringBuilder -Titulo $Titulo

    $arquivos = @()
    foreach ($filtro in $Filtros) {
        $arquivos += Get-ChildItem -Path $Pasta -Filter $filtro -File -Recurse:$Recurse |
            Where-Object { -not (Caminho-Excluido -caminho $_.FullName -lista $PastasIgnorar) }
    }

    $arquivos = $arquivos | Sort-Object FullName -Unique
    foreach ($arquivo in $arquivos) {
        Adicionar-Arquivo -StringBuilder $StringBuilder -Arquivo $arquivo -Base $CaminhoRaiz
    }

    return $arquivos.Count
}

function Executar-Git {
    param([string[]]$Argumentos)

    try {
        $saida = & git -C $CaminhoRaiz @Argumentos 2>&1
        if ($LASTEXITCODE -ne 0) {
            return "git $($Argumentos -join ' ') falhou: $($saida -join [Environment]::NewLine)"
        }

        return ($saida -join [Environment]::NewLine)
    } catch {
        return "git indisponivel: $($_.Exception.Message)"
    }
}

function Texto-Curto {
    param([object]$Valor)

    if ($null -eq $Valor) {
        return "-"
    }

    $texto = [string]$Valor
    $texto = $texto.Replace("`r", " ").Replace("`n", " ").Trim()
    if ($texto.Length -gt 140) {
        return $texto.Substring(0, 137) + "..."
    }

    if ($texto.Length -eq 0) {
        return "-"
    }

    return $texto
}

function Juntar-Unico {
    param([object[]]$Valores)

    $limpos = @($Valores | Where-Object { $_ -ne $null -and ([string]$_).Trim().Length -gt 0 } | ForEach-Object { [string]$_ } | Sort-Object -Unique)
    if ($limpos.Count -eq 0) {
        return "-"
    }

    return ($limpos -join ",")
}

function Obter-Propriedade {
    param(
        [object]$Objeto,
        [string]$Nome
    )

    if ($null -eq $Objeto) {
        return $null
    }

    $prop = $Objeto.PSObject.Properties[$Nome]
    if ($null -eq $prop) {
        return $null
    }

    return $prop.Value
}

function Gerar-Indice-Eventos {
    param(
        [string]$PastaEvents,
        [string]$ArquivoSaida
    )

    $sb = [System.Text.StringBuilder]::new()
    Adicionar-Linha -StringBuilder $sb -Texto "// Vida 2.5D | indice completo de eventos | Gerado: $(Get-Date -Format 'dd/MM/yyyy HH:mm')"
    Adicionar-Linha -StringBuilder $sb -Texto "// Este arquivo da visao total sem despejar todos os textos narrativos dos JSONs."
    Adicionar-Linha -StringBuilder $sb

    if (-not (Test-Path $PastaEvents)) {
        Adicionar-Linha -StringBuilder $sb -Texto "content/events nao encontrado."
        $sb.ToString() | Out-File $ArquivoSaida -Encoding UTF8
        return
    }

    $jsons = Get-ChildItem -Path $PastaEvents -Recurse -Filter "*.json" -File | Sort-Object FullName
    $eventos = @()
    $falhas = @()

    foreach ($arquivo in $jsons) {
        try {
            $evento = Get-Content $arquivo.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
            $rel = Caminho-Relativo -caminhoCompleto $arquivo.FullName -base $CaminhoRaiz

            $triggers = Obter-Propriedade -Objeto $evento -Nome "triggers"
            $idadeRange = Obter-Propriedade -Objeto $triggers -Nome "idadeRange"
            $idade = "-"
            if ($idadeRange -and $idadeRange.Count -ge 2) {
                $idade = "$($idadeRange[0])-$($idadeRange[1])"
            }

            $beats = @()
            if ($evento.scene -and $evento.scene.beats) {
                $beats = @($evento.scene.beats)
            }

            $opcoes = @()
            $checks = @()
            $efeitos = @()
            foreach ($beat in $beats) {
                if ($beat.tipo -eq "escolha" -and $beat.opcoes) {
                    foreach ($opcao in @($beat.opcoes)) {
                        $opcoes += $opcao
                        if ($opcao.atributoCheck) {
                            $checks += "$($opcao.atributoCheck.atributo):$($opcao.atributoCheck.dificuldade)"
                        }
                        if ($opcao.efeitos) {
                            foreach ($efeito in @($opcao.efeitos)) {
                                $tipo = Obter-Propriedade -Objeto $efeito -Nome "tipo"
                                if ($tipo) {
                                    $efeitos += $tipo
                                }
                            }
                        }
                        if ($opcao.efeitosFalha) {
                            foreach ($efeito in @($opcao.efeitosFalha)) {
                                $tipo = Obter-Propriedade -Objeto $efeito -Nome "tipo"
                                if ($tipo) {
                                    $efeitos += "falha:$tipo"
                                }
                            }
                        }
                    }
                }
            }

            $cast = @()
            if ($evento.cast) {
                foreach ($npc in @($evento.cast)) {
                    $papel = Obter-Propriedade -Objeto $npc -Nome "papel"
                    $tipo = Obter-Propriedade -Objeto $npc -Nome "tipo"
                    $persistencia = Obter-Propriedade -Objeto $npc -Nome "persistenciaApos"
                    if ($papel) {
                        $cast += "$papel/$tipo/$persistencia"
                    }
                }
            }

            $eventos += [PSCustomObject]@{
                Caminho = $rel
                Pasta = Caminho-Relativo -caminhoCompleto $arquivo.DirectoryName -base $PastaEvents
                Id = Texto-Curto (Obter-Propriedade -Objeto $evento -Nome "eventoId")
                Categoria = Texto-Curto (Obter-Propriedade -Objeto $evento -Nome "categoria")
                Titulo = Texto-Curto (Obter-Propriedade -Objeto $evento -Nome "titulo")
                Idade = $idade
                Peso = Texto-Curto (Obter-Propriedade -Objeto $triggers -Nome "peso")
                Cooldown = Texto-Curto (Obter-Propriedade -Objeto $triggers -Nome "cooldownMeses")
                UniqueOnce = Texto-Curto (Obter-Propriedade -Objeto $triggers -Nome "uniqueOnce")
                Tags = Juntar-Unico -Valores @($evento.contentTags)
                Cast = Juntar-Unico -Valores $cast
                Background = Texto-Curto (Obter-Propriedade -Objeto $evento.scene -Nome "background")
                Humor = Texto-Curto (Obter-Propriedade -Objeto $evento.scene -Nome "humor")
                Opcoes = $opcoes.Count
                Checks = Juntar-Unico -Valores $checks
                Efeitos = Juntar-Unico -Valores $efeitos
                CriadoPor = Texto-Curto (Obter-Propriedade -Objeto $evento.metadata -Nome "criadoPor")
            }
        } catch {
            $falhas += [PSCustomObject]@{
                Caminho = Caminho-Relativo -caminhoCompleto $arquivo.FullName -base $CaminhoRaiz
                Erro = $_.Exception.Message
            }
        }
    }

    Adicionar-Separador -StringBuilder $sb -Titulo "RESUMO"
    Adicionar-Linha -StringBuilder $sb -Texto "Total de JSONs: $($jsons.Count)"
    Adicionar-Linha -StringBuilder $sb -Texto "Eventos parseados: $($eventos.Count)"
    Adicionar-Linha -StringBuilder $sb -Texto "Falhas de parse: $($falhas.Count)"
    Adicionar-Linha -StringBuilder $sb

    Adicionar-Separador -StringBuilder $sb -Titulo "CONTAGEM POR CATEGORIA"
    $eventos | Group-Object Categoria | Sort-Object Name | ForEach-Object {
        Adicionar-Linha -StringBuilder $sb -Texto "$($_.Name): $($_.Count)"
    }
    Adicionar-Linha -StringBuilder $sb

    Adicionar-Separador -StringBuilder $sb -Titulo "CONTAGEM POR PASTA"
    $eventos | Group-Object Pasta | Sort-Object Name | ForEach-Object {
        Adicionar-Linha -StringBuilder $sb -Texto "$($_.Name): $($_.Count)"
    }
    Adicionar-Linha -StringBuilder $sb

    Adicionar-Separador -StringBuilder $sb -Titulo "EFEITOS USADOS"
    $todosEfeitos = @()
    foreach ($evento in $eventos) {
        if ($evento.Efeitos -ne "-") {
            $todosEfeitos += $evento.Efeitos.Split(",")
        }
    }
    $todosEfeitos | Where-Object { $_ -ne "" } | Group-Object | Sort-Object Count -Descending | ForEach-Object {
        Adicionar-Linha -StringBuilder $sb -Texto "$($_.Name): $($_.Count)"
    }
    Adicionar-Linha -StringBuilder $sb

    Adicionar-Separador -StringBuilder $sb -Titulo "ATRIBUTOS CHECADOS"
    $todosChecks = @()
    foreach ($evento in $eventos) {
        if ($evento.Checks -ne "-") {
            $todosChecks += $evento.Checks.Split(",")
        }
    }
    $todosChecks | Where-Object { $_ -ne "" } | Group-Object | Sort-Object Count -Descending | ForEach-Object {
        Adicionar-Linha -StringBuilder $sb -Texto "$($_.Name): $($_.Count)"
    }
    Adicionar-Linha -StringBuilder $sb

    Adicionar-Separador -StringBuilder $sb -Titulo "INDICE COMPLETO"
    foreach ($evento in ($eventos | Sort-Object Categoria, Caminho)) {
        Adicionar-Linha -StringBuilder $sb -Texto "$($evento.Caminho) | id=$($evento.Id) | cat=$($evento.Categoria) | idade=$($evento.Idade) | peso=$($evento.Peso) | cd=$($evento.Cooldown) | once=$($evento.UniqueOnce) | opcoes=$($evento.Opcoes) | checks=$($evento.Checks) | efeitos=$($evento.Efeitos) | tags=$($evento.Tags) | cast=$($evento.Cast) | bg=$($evento.Background) | humor=$($evento.Humor) | criadoPor=$($evento.CriadoPor) | titulo=$($evento.Titulo)"
    }
    Adicionar-Linha -StringBuilder $sb

    if ($falhas.Count -gt 0) {
        Adicionar-Separador -StringBuilder $sb -Titulo "FALHAS DE PARSE"
        foreach ($falha in $falhas) {
            Adicionar-Linha -StringBuilder $sb -Texto "$($falha.Caminho) | erro=$($falha.Erro)"
        }
    }

    $sb.ToString() | Out-File $ArquivoSaida -Encoding UTF8
}

if (-not (Test-Path $CaminhoRaiz)) {
    Write-Host "ERRO: Caminho nao encontrado: $CaminhoRaiz" -ForegroundColor Red
    exit 1
}

$CaminhoRaiz = (Resolve-Path $CaminhoRaiz).Path
$timestamp = Get-Date -Format "ddMMyyyy_HHmm"
$nomePasta = "vida25d_captura_$timestamp"
$caminhoScript = Split-Path -Parent $MyInvocation.MyCommand.Definition
$pastaDestino = Join-Path $caminhoScript $nomePasta

if (Test-Path $pastaDestino) {
    Remove-Item -LiteralPath $pastaDestino -Recurse -Force
}

New-Item -Path $pastaDestino -ItemType Directory | Out-Null

Write-Host "Captura Vida 2.5D - $timestamp" -ForegroundColor Cyan

# CONFIGS RAIZ
$sbRaiz = [System.Text.StringBuilder]::new()
Adicionar-Linha -StringBuilder $sbRaiz -Texto "// Vida 2.5D | Gerado: $(Get-Date -Format 'dd/MM/yyyy HH:mm')"
Adicionar-Separador -StringBuilder $sbRaiz -Titulo "CONFIGS RAIZ"

foreach ($cfg in $ConfigsCapturar) {
    $caminho = Join-Path $CaminhoRaiz $cfg
    if (Test-Path $caminho) {
        Adicionar-Linha -StringBuilder $sbRaiz -Texto "// --- $cfg ---"
        Adicionar-Linha -StringBuilder $sbRaiz -Texto (Get-Content $caminho -Raw -Encoding UTF8)
        Adicionar-Linha -StringBuilder $sbRaiz
        Write-Host "  raiz: $cfg" -ForegroundColor Gray
    }
}

$sbRaiz.ToString() | Out-File (Join-Path $pastaDestino "00_raiz_configs.txt") -Encoding UTF8

# DOCUMENTACAO GERENCIAL
Write-Host "Documentacao gerencial..." -ForegroundColor Yellow
$sbDocs = [System.Text.StringBuilder]::new()
Adicionar-Linha -StringBuilder $sbDocs -Texto "// Vida 2.5D | documentacao gerencial | Gerado: $(Get-Date -Format 'dd/MM/yyyy HH:mm')"
Adicionar-Linha -StringBuilder $sbDocs -Texto "// Foco: contexto para Claude Web coordenar agentes, prompts, merges e revisoes de sprint."
Adicionar-Linha -StringBuilder $sbDocs

foreach ($arquivoRaiz in @("AGENTS.md", "CLAUDE.md", "GEMINI.md", "README.md")) {
    $caminho = Join-Path $CaminhoRaiz $arquivoRaiz
    if (Test-Path $caminho) {
        Adicionar-Arquivo -StringBuilder $sbDocs -Arquivo (Get-Item $caminho) -Base $CaminhoRaiz
    }
}

$contDocs = 0
$contDocs += Adicionar-Arquivos-Por-Padrao -StringBuilder $sbDocs -Titulo "INSTRUCTIONS" -Pasta (Join-Path $CaminhoRaiz "instructions") -Filtros @("*.md") -Recurse
$contDocs += Adicionar-Arquivos-Por-Padrao -StringBuilder $sbDocs -Titulo "DOCS" -Pasta (Join-Path $CaminhoRaiz "docs") -Filtros @("*.md") -Recurse
$contDocs += Adicionar-Arquivos-Por-Padrao -StringBuilder $sbDocs -Titulo "GITHUB" -Pasta (Join-Path $CaminhoRaiz ".github") -Filtros @("*.md") -Recurse
$contDocs += Adicionar-Arquivos-Por-Padrao -StringBuilder $sbDocs -Titulo "SKILLS DOS AGENTES" -Pasta (Join-Path $CaminhoRaiz ".agents") -Filtros @("SKILL.md") -Recurse
$contDocs += Adicionar-Arquivos-Por-Padrao -StringBuilder $sbDocs -Titulo "SKILLS DO CLAUDE" -Pasta (Join-Path $CaminhoRaiz ".claude") -Filtros @("SKILL.md") -Recurse
$contDocs += Adicionar-Arquivos-Por-Padrao -StringBuilder $sbDocs -Titulo "SKILLS DO GEMINI" -Pasta (Join-Path $CaminhoRaiz ".gemini") -Filtros @("SKILL.md") -Recurse
$contDocs += Adicionar-Arquivos-Por-Padrao -StringBuilder $sbDocs -Titulo "SCRIPTS DE VALIDACAO" -Pasta (Join-Path $CaminhoRaiz "scripts") -Filtros @("*.ts", "*.mjs") -Recurse

$sbDocs.ToString() | Out-File (Join-Path $pastaDestino "01_documentacao_gerencial.txt") -Encoding UTF8
Write-Host "  -> 01_documentacao_gerencial.txt" -ForegroundColor Gray

# MAPA GERENCIAL
Write-Host "Mapa do projeto..." -ForegroundColor Yellow
$sbMapa = [System.Text.StringBuilder]::new()
Adicionar-Linha -StringBuilder $sbMapa -Texto "// Vida 2.5D | mapa gerencial do projeto | Gerado: $(Get-Date -Format 'dd/MM/yyyy HH:mm')"
Adicionar-Linha -StringBuilder $sbMapa -Texto "// Foco: orientacao rapida para planejamento, revisao de sprint e merge."
Adicionar-Linha -StringBuilder $sbMapa

Adicionar-Separador -StringBuilder $sbMapa -Titulo "GIT"
Adicionar-Linha -StringBuilder $sbMapa -Texto "Branch atual:"
Adicionar-Linha -StringBuilder $sbMapa -Texto (Executar-Git -Argumentos @("branch", "--show-current"))
Adicionar-Linha -StringBuilder $sbMapa
Adicionar-Linha -StringBuilder $sbMapa -Texto "Status curto:"
Adicionar-Linha -StringBuilder $sbMapa -Texto (Executar-Git -Argumentos @("status", "--short", "--branch"))
Adicionar-Linha -StringBuilder $sbMapa
Adicionar-Linha -StringBuilder $sbMapa -Texto "Ultimos commits:"
Adicionar-Linha -StringBuilder $sbMapa -Texto (Executar-Git -Argumentos @("log", "--oneline", "-n", "12"))
Adicionar-Linha -StringBuilder $sbMapa
Adicionar-Linha -StringBuilder $sbMapa -Texto "Branches locais/remotas principais:"
Adicionar-Linha -StringBuilder $sbMapa -Texto (Executar-Git -Argumentos @("branch", "--all", "--no-color"))
Adicionar-Linha -StringBuilder $sbMapa

Adicionar-Separador -StringBuilder $sbMapa -Titulo "TOPO DO REPOSITORIO"
Get-ChildItem -Path $CaminhoRaiz -Force |
    Where-Object { -not (Caminho-Excluido -caminho $_.FullName -lista $PastasIgnorar) } |
    Sort-Object PSIsContainer, Name -Descending |
    ForEach-Object {
        $tipo = if ($_.PSIsContainer) { "dir" } else { "file" }
        Adicionar-Linha -StringBuilder $sbMapa -Texto "$tipo`t$($_.Name)"
    }
Adicionar-Linha -StringBuilder $sbMapa

Adicionar-Separador -StringBuilder $sbMapa -Titulo "ARQUIVOS DE FONTE POR PACOTE"
$packagesMapa = Get-ChildItem -Path (Join-Path $CaminhoRaiz "packages") -Directory -ErrorAction SilentlyContinue | Sort-Object Name
foreach ($pkgDir in $packagesMapa) {
    $srcDir = Join-Path $pkgDir.FullName "src"
    $arquivosSrc = @()
    if (Test-Path $srcDir) {
        $arquivosSrc = Get-ChildItem -Path $srcDir -Recurse -Include $ExtensoesCodigo -File |
            Where-Object { $_.Name -notlike "*.d.ts" } |
            Sort-Object FullName
    }
    $testes = @($arquivosSrc | Where-Object { $_.Name -match '\.test\.' })
    Adicionar-Linha -StringBuilder $sbMapa -Texto "$($pkgDir.Name): $($arquivosSrc.Count) arquivos TS/TSX, $($testes.Count) testes"
    foreach ($arquivo in $arquivosSrc) {
        $rel = Caminho-Relativo -caminhoCompleto $arquivo.FullName -base $CaminhoRaiz
        Adicionar-Linha -StringBuilder $sbMapa -Texto "  - $rel"
    }
    Adicionar-Linha -StringBuilder $sbMapa
}

Adicionar-Separador -StringBuilder $sbMapa -Titulo "CONTENT"
$pastaContentMapa = Join-Path $CaminhoRaiz "content"
if (Test-Path $pastaContentMapa) {
    Get-ChildItem -Path $pastaContentMapa -Directory | Sort-Object Name | ForEach-Object {
        $jsons = @(Get-ChildItem -Path $_.FullName -Recurse -Filter "*.json" -File)
        Adicionar-Linha -StringBuilder $sbMapa -Texto "$($_.Name): $($jsons.Count) JSONs"
    }
}
Adicionar-Linha -StringBuilder $sbMapa

Adicionar-Separador -StringBuilder $sbMapa -Titulo "DOCUMENTACAO E CONTROLE"
$pastasDocs = @("instructions", "docs", ".agents", ".claude", ".gemini", ".github", "scripts")
foreach ($pastaDoc in $pastasDocs) {
    $full = Join-Path $CaminhoRaiz $pastaDoc
    if (Test-Path $full) {
        $arquivos = Get-ChildItem -Path $full -Recurse -File |
            Where-Object { -not (Caminho-Excluido -caminho $_.FullName -lista $PastasIgnorar) } |
            Sort-Object FullName
        Adicionar-Linha -StringBuilder $sbMapa -Texto "${pastaDoc}: $($arquivos.Count) arquivos"
        foreach ($arquivo in $arquivos) {
            Adicionar-Linha -StringBuilder $sbMapa -Texto "  - $(Caminho-Relativo -caminhoCompleto $arquivo.FullName -base $CaminhoRaiz)"
        }
        Adicionar-Linha -StringBuilder $sbMapa
    }
}

$sbMapa.ToString() | Out-File (Join-Path $pastaDestino "02_mapa_projeto.txt") -Encoding UTF8
Write-Host "  -> 02_mapa_projeto.txt" -ForegroundColor Gray

# PACKAGES
$packages = @(
    @{ nome = "core";      pasta = "packages\core"      },
    @{ nome = "game";      pasta = "packages\game"      },
    @{ nome = "dev-tools"; pasta = "packages\dev-tools" }
)

if ($ApenasPackage -ne "") {
    $packages = $packages | Where-Object { $_.nome -eq $ApenasPackage }
}

foreach ($pkg in $packages) {
    $caminhoPkg = Join-Path $CaminhoRaiz $pkg.pasta
    if (-not (Test-Path $caminhoPkg)) {
        Write-Host "SKIP: $($pkg.pasta) nao existe" -ForegroundColor DarkGray
        continue
    }

    Write-Host "Package: $($pkg.nome)" -ForegroundColor Yellow
    $sb = [System.Text.StringBuilder]::new()
    Adicionar-Linha -StringBuilder $sb -Texto "// Vida 2.5D | Package: $($pkg.nome) | Gerado: $(Get-Date -Format 'dd/MM/yyyy HH:mm')"
    Adicionar-Separador -StringBuilder $sb -Titulo "CONFIGS"

    foreach ($cfg in $ConfigsCapturar) {
        $caminho = Join-Path $caminhoPkg $cfg
        if (Test-Path $caminho) {
            $rel = Caminho-Relativo -caminhoCompleto $caminho -base $CaminhoRaiz
            Adicionar-Linha -StringBuilder $sb -Texto "// --- $cfg [$rel] ---"
            Adicionar-Linha -StringBuilder $sb -Texto (Get-Content $caminho -Raw -Encoding UTF8)
            Adicionar-Linha -StringBuilder $sb
        }
    }

    $arquivos = Get-ChildItem -Path $caminhoPkg -Recurse -Include $ExtensoesCodigo -File |
        Where-Object {
            -not (Caminho-Excluido -caminho $_.FullName -lista $PastasIgnorar) -and
            $_.Name -notlike "*.d.ts"
        } |
        Sort-Object FullName

    Adicionar-Separador -StringBuilder $sb -Titulo "CODIGO FONTE [$($arquivos.Count) arquivos]"

    foreach ($arquivo in $arquivos) {
        Adicionar-Arquivo -StringBuilder $sb -Arquivo $arquivo -Base $CaminhoRaiz
    }

    $nomeArquivoSaida = "pkg_$($pkg.nome).txt"
    $sb.ToString() | Out-File (Join-Path $pastaDestino $nomeArquivoSaida) -Encoding UTF8
    Write-Host "  -> $nomeArquivoSaida ($($arquivos.Count) arquivos)" -ForegroundColor Gray
}

# CONTENT
$pastaContent = Join-Path $CaminhoRaiz "content"
if (-not (Test-Path $pastaContent)) {
    Write-Host "SKIP: content/ nao existe" -ForegroundColor DarkGray
} else {
    Write-Host "Content..." -ForegroundColor Yellow
    $sbContent = [System.Text.StringBuilder]::new()
    Adicionar-Linha -StringBuilder $sbContent -Texto "// Vida 2.5D | content/ | Gerado: $(Get-Date -Format 'dd/MM/yyyy HH:mm')"
    Adicionar-Linha -StringBuilder $sbContent -Texto "// NOTA: events/ limitado a $MAX_EVENTOS_PASTA JSON por pasta. O indice completo esta em 03_indice_eventos.txt."
    Adicionar-Linha -StringBuilder $sbContent

    $pastaEvents = Join-Path $pastaContent "events"
    if (Test-Path $pastaEvents) {
        Adicionar-Separador -StringBuilder $sbContent -Titulo "EVENTS - $MAX_EVENTOS_PASTA exemplos por pasta"

        $pastasComJson = Get-ChildItem -Path $pastaEvents -Recurse -Directory |
            Where-Object { (Get-ChildItem -Path $_.FullName -Filter "*.json" -File).Count -gt 0 } |
            Sort-Object FullName

        $jsonNaRaizEvents = Get-ChildItem -Path $pastaEvents -Filter "*.json" -File | Sort-Object Name
        if ($jsonNaRaizEvents.Count -gt 0) {
            $pastasComJson = @([PSCustomObject]@{ FullName = $pastaEvents }) + $pastasComJson
        }

        $totalEventosCapturados = 0
        $totalEventosOmitidos = 0

        foreach ($pasta in $pastasComJson) {
            $jsonsDaPasta = Get-ChildItem -Path $pasta.FullName -Filter "*.json" -File | Sort-Object Name
            $relPasta = Caminho-Relativo -caminhoCompleto $pasta.FullName -base $CaminhoRaiz
            $capturar = $jsonsDaPasta | Select-Object -First $MAX_EVENTOS_PASTA
            $omitidos = $jsonsDaPasta.Count - $capturar.Count

            Adicionar-Linha -StringBuilder $sbContent -Texto "// --- Pasta: $relPasta ($($jsonsDaPasta.Count) eventos) ---"
            Adicionar-Linha -StringBuilder $sbContent

            foreach ($arquivo in $capturar) {
                Adicionar-Arquivo -StringBuilder $sbContent -Arquivo $arquivo -Base $CaminhoRaiz
                $totalEventosCapturados++
            }

            if ($omitidos -gt 0) {
                $nomesOmitidos = ($jsonsDaPasta | Select-Object -Skip $MAX_EVENTOS_PASTA | ForEach-Object { $_.Name }) -join ", "
                Adicionar-Linha -StringBuilder $sbContent -Texto "// ... demais eventos omitidos nesta pasta ($omitidos arquivo(s)): $nomesOmitidos"
                Adicionar-Linha -StringBuilder $sbContent
                $totalEventosOmitidos += $omitidos
            }
        }

        Write-Host "  -> events: $totalEventosCapturados capturados, $totalEventosOmitidos omitidos" -ForegroundColor Gray
        Gerar-Indice-Eventos -PastaEvents $pastaEvents -ArquivoSaida (Join-Path $pastaDestino "03_indice_eventos.txt")
        Write-Host "  -> 03_indice_eventos.txt" -ForegroundColor Gray
    }

    $subpastasContent = Get-ChildItem -Path $pastaContent -Directory |
        Where-Object { $_.Name -ne "events" } |
        Sort-Object Name

    foreach ($subpasta in $subpastasContent) {
        $nomeSubpasta = $subpasta.Name
        Adicionar-Separador -StringBuilder $sbContent -Titulo $nomeSubpasta.ToUpper()

        $arquivosJson = Get-ChildItem -Path $subpasta.FullName -Recurse -Filter "*.json" -File | Sort-Object FullName
        foreach ($arquivo in $arquivosJson) {
            Adicionar-Arquivo -StringBuilder $sbContent -Arquivo $arquivo -Base $CaminhoRaiz
        }

        Write-Host "  -> ${nomeSubpasta}: $($arquivosJson.Count) arquivos" -ForegroundColor Gray
    }

    $sbContent.ToString() | Out-File (Join-Path $pastaDestino "content_banco.txt") -Encoding UTF8
    Write-Host "  -> content_banco.txt gerado" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Concluido! Pasta: $pastaDestino" -ForegroundColor Green
Write-Host ""

Start-Process explorer.exe -ArgumentList $pastaDestino
