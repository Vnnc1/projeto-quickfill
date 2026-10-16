# Instala ou atualiza os QuickFill desta máquina a partir do repositório (privado) da equipe.
#
#   1ª vez: rode o atualizar-quickfill.bat, cole o token de leitura que o responsável passou e escolha
#           o perfil. Depois, em chrome://extensions: Modo do desenvolvedor > Carregar sem compactação >
#           pasta indicada no final.
#   Depois: quando a extensão avisar "Nova versão", rode o .bat de novo e clique em "Recarregar
#           extensão" no aviso. Configuração, token do Jira e metas continuam.
#
#   -Pacotes qa,dev   instala/atualiza só esses     -TrocarToken   pede o token de novo
#
# O endereço abaixo é preenchido pelo build.mjs (release.config.json).

param([string]$Pacotes = "", [switch]$TrocarToken)
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch { }
Write-Host ""
Write-Host "  QuickFill - instalar / atualizar" -ForegroundColor Cyan
Write-Host ""

$UpdateUrl = "__UPDATE_URL__"
# Pasta Documentos da pessoa (ex.: C:\Users\Fernanda\Documents\QuickFill) — respeita Documentos no OneDrive
$Documentos = [Environment]::GetFolderPath("MyDocuments")
if (-not $Documentos) { $Documentos = Join-Path $env:USERPROFILE "Documents" }
$Destino   = Join-Path $Documentos "QuickFill"
$TokenFile = Join-Path $Destino ".token"
$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

if ($UpdateUrl -like "__*") { Write-Host "Endereço de atualização não configurado (release.config.json)." -ForegroundColor Red; exit 1 }
New-Item -ItemType Directory -Force -Path $Destino | Out-Null

# Token de leitura do repositório privado — guardado criptografado para este usuário do Windows (DPAPI)
$privado = $UpdateUrl -like "*api.github.com*"
$token = ""
if ($privado) {
  if ($TrocarToken -and (Test-Path $TokenFile)) { Remove-Item $TokenFile -Force }
  if (Test-Path $TokenFile) {
    $sec = Get-Content $TokenFile | ConvertTo-SecureString
    $token = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
  } else {
    Write-Host "Cole o token de leitura do QuickFill (pedir ao responsável) e tecle Enter:" -ForegroundColor Cyan
    $sec = Read-Host -AsSecureString
    $token = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
    if (-not $token) { Write-Host "Sem token não dá para baixar do repositório privado." -ForegroundColor Red; exit 1 }
    $sec | ConvertFrom-SecureString | Set-Content $TokenFile
  }
}
$headers = @{ "User-Agent" = "quickfill-installer" }
if ($privado) { $headers["Authorization"] = "Bearer $token"; $headers["Accept"] = "application/vnd.github.raw+json" }

Write-Host "Lendo a versão publicada..."
try {
  $sep = if ($UpdateUrl.Contains("?")) { "&" } else { "?" }
  $info = Invoke-RestMethod -Uri ("$UpdateUrl$sep" + "t=" + [DateTimeOffset]::Now.ToUnixTimeSeconds()) -Headers $headers -UseBasicParsing
} catch {
  if ($privado) {
    Remove-Item $TokenFile -Force -ErrorAction SilentlyContinue
    Write-Host "O GitHub recusou o acesso — o token pode estar errado ou vencido. Rode de novo e cole um token válido." -ForegroundColor Red
  } else { Write-Host "Não consegui ler $UpdateUrl : $($_.Exception.Message)" -ForegroundColor Red }
  exit 1
}

# Sem parâmetro: atualiza os que já estão instalados; se nenhum, pergunta qual instalar.
$todos = $info.packages.PSObject.Properties | ForEach-Object { $_.Name }
if ($Pacotes) { $lista = $Pacotes.Split(",") | ForEach-Object { $_.Trim().ToLower() } }
else {
  $lista = @($todos | Where-Object { Test-Path (Join-Path $Destino $info.packages.$_.folder) })
  if (-not $lista) {
    Write-Host "Qual QuickFill instalar? ($($todos -join ', '), ou 'todos')"
    $r = (Read-Host).Trim().ToLower()
    $lista = if ($r -eq "todos") { $todos } else { $r.Split(",") | ForEach-Object { $_.Trim() } }
  }
}

$novos = @()
foreach ($p in $lista) {
  $pkg = $info.packages.$p
  if (-not $pkg) { Write-Host "Pacote desconhecido: $p" -ForegroundColor Yellow; continue }
  $zip = Join-Path $env:TEMP "$($pkg.folder).zip"
  Write-Host "Baixando $p $($pkg.version) ..."
  Invoke-WebRequest -Uri $pkg.download -OutFile $zip -Headers $headers -UseBasicParsing
  $pasta = Join-Path $Destino $pkg.folder
  if (-not (Test-Path (Join-Path $pasta "manifest.json"))) { $novos += $pasta }
  $tmp = Join-Path $env:TEMP "qf-$p"
  if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
  Expand-Archive -Path $zip -DestinationPath $tmp -Force
  $origem = Get-ChildItem $tmp -Directory | Select-Object -First 1
  if (-not $origem) { $origem = Get-Item $tmp }
  # Mantém a mesma pasta (o Chrome continua apontando para ela); só troca os arquivos.
  New-Item -ItemType Directory -Force -Path $pasta | Out-Null
  Get-ChildItem $pasta -Force | Remove-Item -Recurse -Force
  Copy-Item -Path (Join-Path $origem.FullName "*") -Destination $pasta -Recurse -Force
  # A extensão usa o mesmo token (só leitura) para avisar quando sair versão nova
  if ($privado) { @{ token = $token } | ConvertTo-Json | Set-Content -Path (Join-Path $pasta "update.local.json") -Encoding UTF8 }
  Remove-Item $tmp -Recurse -Force; Remove-Item $zip -Force
  Write-Host "  OK  $p $($pkg.version) em $pasta" -ForegroundColor Green
}

Write-Host ""
if ($novos.Count) {
  # Primeira instalação: abre a pasta e copia o caminho para colar no "Carregar sem compactação"
  Write-Host "PRIMEIRA INSTALAÇÃO — falta só carregar no Chrome:" -ForegroundColor Yellow
  Write-Host "  1. Abra chrome://extensions e ligue o 'Modo do desenvolvedor' (canto superior direito)"
  Write-Host "  2. Clique em 'Carregar sem compactação' e escolha a pasta:"
  foreach ($n in $novos) { Write-Host "       $n" -ForegroundColor Green }
  Write-Host "     (o caminho já foi copiado — cole com Ctrl+V na barra de endereço da janela de escolha)"
  Write-Host "  3. Nas Opções da extensão, preencha URL do Jira, e-mail e token do Jira"
  try { Set-Clipboard -Value $novos[0] } catch { }
  try { Start-Process explorer.exe $Destino } catch { }
} else {
  Write-Host "Atualizado! No Chrome, abra o QuickFill e clique em 'Recarregar extensão' no aviso do topo." -ForegroundColor Green
  Write-Host "(ou em chrome://extensions clique no botão de recarregar do QuickFill)"
}
Write-Host ""
Read-Host "Tecle Enter para fechar"
