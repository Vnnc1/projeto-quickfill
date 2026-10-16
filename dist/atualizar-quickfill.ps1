# Instala ou atualiza os QuickFill desta máquina a partir do repositório da equipe.
#
#   1ª vez: rode este script, depois em chrome://extensions ligue o "Modo do desenvolvedor",
#           clique em "Carregar sem compactação" e escolha a pasta indicada no final.
#   Depois: quando a extensão avisar "Nova versão", rode o script de novo e clique em
#           "Recarregar" no aviso (ou ↻ em chrome://extensions). Configuração e token continuam.
#
# O endereço abaixo é preenchido pelo build.mjs (release.config.json).

param([string]$Pacotes = "")

$UpdateUrl = "__UPDATE_URL__"
$Destino   = Join-Path $env:USERPROFILE "QuickFill"
$ErrorActionPreference = "Stop"

if ($UpdateUrl -like "__*") { Write-Host "Endereço de atualização não configurado (release.config.json)." -ForegroundColor Red; exit 1 }

Write-Host "Lendo $UpdateUrl ..."
$info = Invoke-RestMethod -Uri ("$UpdateUrl" + "?t=" + [DateTimeOffset]::Now.ToUnixTimeSeconds()) -UseBasicParsing
New-Item -ItemType Directory -Force -Path $Destino | Out-Null

# Sem parâmetro: atualiza os que já estão instalados; se nenhum, pergunta qual instalar.
$todos = $info.packages.PSObject.Properties | ForEach-Object { $_.Name }
if ($Pacotes) { $lista = $Pacotes.Split(",") | ForEach-Object { $_.Trim().ToLower() } }
else {
  $lista = $todos | Where-Object { Test-Path (Join-Path $Destino $info.packages.$_.folder) }
  if (-not $lista) {
    Write-Host "Qual QuickFill instalar? ($($todos -join ', '), ou 'todos')"
    $r = (Read-Host).Trim().ToLower()
    $lista = if ($r -eq "todos") { $todos } else { $r.Split(",") | ForEach-Object { $_.Trim() } }
  }
}

foreach ($p in $lista) {
  $pkg = $info.packages.$p
  if (-not $pkg) { Write-Host "Pacote desconhecido: $p" -ForegroundColor Yellow; continue }
  $zip = Join-Path $env:TEMP "$($pkg.folder).zip"
  Write-Host "Baixando $p $($pkg.version) ..."
  Invoke-WebRequest -Uri $pkg.download -OutFile $zip -UseBasicParsing
  $pasta = Join-Path $Destino $pkg.folder
  $tmp = Join-Path $env:TEMP "qf-$p"
  if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
  Expand-Archive -Path $zip -DestinationPath $tmp -Force
  $origem = Get-ChildItem $tmp -Directory | Select-Object -First 1
  if (-not $origem) { $origem = Get-Item $tmp }
  # Mantém a mesma pasta (o Chrome continua apontando para ela); só troca os arquivos.
  New-Item -ItemType Directory -Force -Path $pasta | Out-Null
  Get-ChildItem $pasta -Force | Remove-Item -Recurse -Force
  Copy-Item -Path (Join-Path $origem.FullName "*") -Destination $pasta -Recurse -Force
  Remove-Item $tmp -Recurse -Force; Remove-Item $zip -Force
  Write-Host "  ✓ $p $($pkg.version) em $pasta" -ForegroundColor Green
}

Write-Host ""
Write-Host "Pronto. No Chrome: clique em 'Recarregar' no aviso da extensão (ou em ↻ em chrome://extensions)."
Write-Host "Primeira instalação: chrome://extensions › Modo do desenvolvedor › Carregar sem compactação › $Destino\<pasta>"
