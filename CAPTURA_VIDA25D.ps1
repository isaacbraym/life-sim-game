param(
    [Parameter(Mandatory=$true)]
    [string]$CaminhoRaiz,
    [string]$ApenasPackage = ""
)

$ConfigsCapturar = @("package.json", "tsconfig.json", "tsconfig.app.json", "tsconfig.base.json", "vite.config.ts", "pnpm-workspace.yaml")
$PastasIgnorar   = @("node_modules", "dist", ".git", ".vite", "coverage", ".turbo", "_pendentes")

function Caminho-Excluido {
    param([string]$caminho, [string[]]$lista)
    foreach ($seg in $lista) {
        if ($caminho -match [regex]::Escape($seg)) { return $true }
    }
    return $false
}

function Caminho-Relativo {
    param([string]$caminhoCompleto, [string]$base)
    return $caminhoCompleto.Replace($base, "").TrimStart('\').TrimStart('/')
}

if (-not (Test-Path $CaminhoRaiz)) {
    Write-Host "ERRO: Caminho nao encontrado: $CaminhoRaiz" -ForegroundColor Red
    exit 1
}

$timestamp     = Get-Date -Format "ddMMyyyy_HHmm"
$nomePasta     = "vida25d_captura_$timestamp"
$caminhoScript = Split-Path -Parent $MyInvocation.MyCommand.Definition
$pastaDestino  = Join-Path $caminhoScript $nomePasta

if (Test-Path $pastaDestino) { Remove-Item $pastaDestino -Recurse -Force }
New-Item $pastaDestino -ItemType Directory | Out-Null

Write-Host "Captura Vida 2.5D - $timestamp" -ForegroundColor Cyan

$sbRaiz = [System.Text.StringBuilder]::new()
[void]$sbRaiz.AppendLine("// Vida 2.5D | Gerado: $(Get-Date -Format 'dd/MM/yyyy HH:mm')")
[void]$sbRaiz.AppendLine("// == CONFIGS RAIZ ==")
[void]$sbRaiz.AppendLine("")

foreach ($cfg in $ConfigsCapturar) {
    $caminho = Join-Path $CaminhoRaiz $cfg
    if (Test-Path $caminho) {
        [void]$sbRaiz.AppendLine("// --- $cfg ---")
        [void]$sbRaiz.AppendLine((Get-Content $caminho -Raw -Encoding UTF8))
        [void]$sbRaiz.AppendLine("")
        Write-Host "  raiz: $cfg" -ForegroundColor Gray
    }
}

$sbRaiz.ToString() | Out-File (Join-Path $pastaDestino "00_raiz_configs.txt") -Encoding UTF8

$packages = @(
    @{ nome = "core";      pasta = "packages\core"      }
    @{ nome = "game";      pasta = "packages\game"      }
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
    [void]$sb.AppendLine("// Vida 2.5D | Package: $($pkg.nome) | Gerado: $(Get-Date -Format 'dd/MM/yyyy HH:mm')")
    [void]$sb.AppendLine("")
    [void]$sb.AppendLine("// == CONFIGS ==")
    [void]$sb.AppendLine("")

    foreach ($cfg in $ConfigsCapturar) {
        $caminho = Join-Path $caminhoPkg $cfg
        if (Test-Path $caminho) {
            $rel = Caminho-Relativo -caminhoCompleto $caminho -base $CaminhoRaiz
            [void]$sb.AppendLine("// --- $cfg [$rel] ---")
            [void]$sb.AppendLine((Get-Content $caminho -Raw -Encoding UTF8))
            [void]$sb.AppendLine("")
        }
    }

    $arquivos = Get-ChildItem -Path $caminhoPkg -Recurse -Include "*.ts","*.tsx" |
        Where-Object { -not (Caminho-Excluido -caminho $_.FullName -lista $PastasIgnorar) } |
        Sort-Object FullName

    [void]$sb.AppendLine("// == CODIGO FONTE [$($arquivos.Count) arquivos] ==")
    [void]$sb.AppendLine("")

    foreach ($arquivo in $arquivos) {
        $rel = Caminho-Relativo -caminhoCompleto $arquivo.FullName -base $CaminhoRaiz
        [void]$sb.AppendLine("// --- $($arquivo.Name) [$rel] ---")
        [void]$sb.AppendLine((Get-Content $arquivo.FullName -Raw -Encoding UTF8))
        [void]$sb.AppendLine("")
    }

    $nomeArquivoSaida = "pkg_$($pkg.nome).txt"
    $sb.ToString() | Out-File (Join-Path $pastaDestino $nomeArquivoSaida) -Encoding UTF8
    Write-Host "  -> $nomeArquivoSaida ($($arquivos.Count) arquivos)" -ForegroundColor Gray
}

$pastaContent = Join-Path $CaminhoRaiz "content"
if (Test-Path $pastaContent) {
    Write-Host "Content..." -ForegroundColor Yellow
    $sbContent = [System.Text.StringBuilder]::new()
    [void]$sbContent.AppendLine("// Vida 2.5D | content/ | Gerado: $(Get-Date -Format 'dd/MM/yyyy HH:mm')")
    [void]$sbContent.AppendLine("")

    $arquivosJson = Get-ChildItem -Path $pastaContent -Recurse -Filter "*.json" | Sort-Object FullName
    foreach ($arquivo in $arquivosJson) {
        $rel = Caminho-Relativo -caminhoCompleto $arquivo.FullName -base $CaminhoRaiz
        [void]$sbContent.AppendLine("// --- $($arquivo.Name) [$rel] ---")
        [void]$sbContent.AppendLine((Get-Content $arquivo.FullName -Raw -Encoding UTF8))
        [void]$sbContent.AppendLine("")
    }

    $sbContent.ToString() | Out-File (Join-Path $pastaDestino "content_banco.txt") -Encoding UTF8
    Write-Host "  -> content_banco.txt ($($arquivosJson.Count) arquivos)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Concluido! Pasta: $pastaDestino" -ForegroundColor Green
Write-Host ""

Start-Process explorer.exe -ArgumentList $pastaDestino