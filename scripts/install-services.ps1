# install-services.ps1
# Install blog-caddy + blog-cloudflared as Windows services via NSSM.
# Both run as LocalSystem with Automatic startup -> survive reboot, no
# user login required.
#
# Pre-reqs (all must exist before running):
#   tools\caddy.exe
#   tools\cloudflared.exe
#   tools\nssm.exe
#   configs\Caddyfile
#   configs\cloudflared.yml          (filled-in, NOT the .sample)
#   %USERPROFILE%\.cloudflared\<UUID>.json (credentials from `tunnel create`)
#
# Usage (must be run from an ELEVATED PowerShell):
#   powershell -ExecutionPolicy Bypass -File scripts/install-services.ps1
#
# Pure ASCII (Windows PS 5.x ANSI parse trap).

$ErrorActionPreference = 'Stop'

# ---- 1. Admin check ----
$identity  = [System.Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object System.Security.Principal.WindowsPrincipal($identity)
if (-not $principal.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "[install-services] FAIL: must run from elevated PowerShell (Administrator)" -ForegroundColor Red
    Write-Host "  Right-click PowerShell -> 'Run as administrator', then re-run this script."
    exit 2
}

# ---- 2. Resolve paths ----
$root      = Split-Path -Parent $PSScriptRoot
$toolsDir  = Join-Path $root 'tools'
$cfgDir    = Join-Path $root 'configs'
$logsDir   = Join-Path $root 'logs'

$caddyExe  = Join-Path $toolsDir 'caddy.exe'
$cfExe     = Join-Path $toolsDir 'cloudflared.exe'
$nssmExe   = Join-Path $toolsDir 'nssm.exe'
$caddyYml  = Join-Path $cfgDir   'Caddyfile'
$cfYml     = Join-Path $cfgDir   'cloudflared.yml'

if (-not (Test-Path $caddyExe)) { throw "missing $caddyExe (run scripts/install-binaries.ps1)" }
if (-not (Test-Path $cfExe))    { throw "missing $cfExe (run scripts/install-binaries.ps1)" }
if (-not (Test-Path $nssmExe))  { throw "missing $nssmExe (run scripts/install-binaries.ps1)" }
if (-not (Test-Path $caddyYml)) { throw "missing $caddyYml" }
if (-not (Test-Path $cfYml))    { throw "missing $cfYml (copy cloudflared.yml.sample and fill placeholders)" }
if (-not (Test-Path $logsDir))  { New-Item -ItemType Directory -Path $logsDir | Out-Null }

# ---- 3. Move cloudflared credentials to LocalSystem-readable location ----
# LocalSystem's $USERPROFILE is C:\Windows\System32\config\systemprofile\,
# which CAN be read by the SYSTEM account but is awkward to manage. The
# convention for shared-machine cloudflared is %ProgramData%\cloudflared\.
$srcCfDir   = Join-Path $env:USERPROFILE '.cloudflared'
$progDataCf = Join-Path $env:ProgramData 'cloudflared'
if (-not (Test-Path $srcCfDir)) {
    throw "missing $srcCfDir - run 'tools\cloudflared.exe tunnel login' first"
}
if (-not (Test-Path $progDataCf)) {
    New-Item -ItemType Directory -Path $progDataCf -Force | Out-Null
    Write-Host "[install-services] mkdir $progDataCf" -ForegroundColor Cyan
}

$jsonFiles = Get-ChildItem -Path $srcCfDir -Filter '*.json' -ErrorAction SilentlyContinue
if ($jsonFiles.Count -eq 0) {
    throw "no credentials JSON in $srcCfDir - run 'tools\cloudflared.exe tunnel create blog' first"
}
foreach ($f in $jsonFiles) {
    $dest = Join-Path $progDataCf $f.Name
    Copy-Item -Path $f.FullName -Destination $dest -Force
    Write-Host "[install-services] copied $($f.Name) -> $progDataCf" -ForegroundColor Cyan
}
# Also copy cert.pem so cloudflared has its account cert under LocalSystem.
$certPem = Join-Path $srcCfDir 'cert.pem'
if (Test-Path $certPem) {
    Copy-Item -Path $certPem -Destination (Join-Path $progDataCf 'cert.pem') -Force
}

# ---- 4. Patch cloudflared.yml: rewrite credentials-file path ----
# Read user's filled yml, replace the user-profile path with the
# ProgramData equivalent, write a NEW file (cloudflared.localsystem.yml)
# that the service uses. The original stays unchanged for interactive use.
$cfYmlSvc = Join-Path $cfgDir 'cloudflared.localsystem.yml'
$ymlSrc = [System.IO.File]::ReadAllText($cfYml)
# Match `credentials-file: <any path>\.cloudflared\<UUID>.json` and
# rewrite to `<ProgramData>\cloudflared\<UUID>.json`.
$rewritten = [regex]::Replace(
    $ymlSrc,
    '(?im)^(\s*credentials-file:\s*).*\.cloudflared[\\/]+([0-9a-f-]+\.json)\s*$',
    "`$1$progDataCf\`$2"
)
[System.IO.File]::WriteAllText($cfYmlSvc, $rewritten, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "[install-services] wrote $cfYmlSvc (credentials-file rewritten to ProgramData)" -ForegroundColor Cyan

# ---- 5. Helper: install a single service idempotently ----
function Install-NssmService {
    param(
        [string] $Name,
        [string] $AppExe,
        [string] $AppArgs,
        [string] $WorkDir,
        [string] $StdoutLog,
        [string] $StderrLog
    )
    # Remove existing (idempotent). Use cmd /c so nssm's "Can't open service!"
    # stderr stays inside cmd and doesn't surface as PowerShell 5.x's
    # NativeCommandError ErrorRecord (which would trip $ErrorActionPreference
    # = 'Stop'). On a fresh install the stop+remove are no-ops; on a re-install
    # they tear down the old service definitions.
    cmd /c "`"$nssmExe`" stop $Name confirm >nul 2>&1"
    cmd /c "`"$nssmExe`" remove $Name confirm >nul 2>&1"
    $global:LASTEXITCODE = 0

    Write-Host "[install-services] installing $Name" -ForegroundColor Cyan
    & $nssmExe install $Name $AppExe $AppArgs
    if ($LASTEXITCODE -ne 0) { throw "nssm install $Name failed: $LASTEXITCODE" }

    & $nssmExe set $Name AppDirectory $WorkDir            | Out-Null
    & $nssmExe set $Name AppStdout    $StdoutLog          | Out-Null
    & $nssmExe set $Name AppStderr    $StderrLog          | Out-Null
    & $nssmExe set $Name Start        SERVICE_AUTO_START  | Out-Null
    & $nssmExe set $Name ObjectName   LocalSystem         | Out-Null
    & $nssmExe set $Name AppStdoutCreationDisposition 4   | Out-Null  # CREATE_ALWAYS overwrite
    & $nssmExe set $Name AppStderrCreationDisposition 4   | Out-Null
    # Rotate logs if they exceed 10 MB.
    & $nssmExe set $Name AppRotateFiles  1                | Out-Null
    & $nssmExe set $Name AppRotateBytes  10485760         | Out-Null
    # Restart on crash.
    & $nssmExe set $Name AppExit Default Restart          | Out-Null
    & $nssmExe set $Name AppRestartDelay 5000             | Out-Null

    Write-Host "[install-services] $Name configured" -ForegroundColor Green
}

# ---- 6. Install blog-caddy ----
Install-NssmService `
    -Name      'blog-caddy' `
    -AppExe    $caddyExe `
    -AppArgs   "run --config `"$caddyYml`"" `
    -WorkDir   $root `
    -StdoutLog (Join-Path $logsDir 'blog-caddy.out.log') `
    -StderrLog (Join-Path $logsDir 'blog-caddy.err.log')

# ---- 7. Install blog-cloudflared ----
Install-NssmService `
    -Name      'blog-cloudflared' `
    -AppExe    $cfExe `
    -AppArgs   "--config `"$cfYmlSvc`" --no-autoupdate tunnel run blog" `
    -WorkDir   $root `
    -StdoutLog (Join-Path $logsDir 'blog-cloudflared.out.log') `
    -StderrLog (Join-Path $logsDir 'blog-cloudflared.err.log')

# ---- 8. Start both ----
Write-Host "[install-services] starting services..." -ForegroundColor Cyan
& $nssmExe start blog-caddy        | Out-Null
& $nssmExe start blog-cloudflared  | Out-Null

Start-Sleep -Seconds 3

# ---- 9. Report ----
Write-Host ""
Write-Host "=== Service status ===" -ForegroundColor Green
Get-Service blog-caddy, blog-cloudflared -ErrorAction SilentlyContinue |
    Format-Table -AutoSize Name, Status, StartType

Write-Host "Logs:" -ForegroundColor Cyan
Write-Host "  $logsDir\blog-caddy.out.log"
Write-Host "  $logsDir\blog-caddy.err.log"
Write-Host "  $logsDir\blog-cloudflared.out.log"
Write-Host "  $logsDir\blog-cloudflared.err.log"
Write-Host ""
Write-Host "Verify:" -ForegroundColor Cyan
Write-Host "  curl.exe -I http://127.0.0.1:48080/         (local Caddy)"
Write-Host "  curl.exe -I https://blog.multilab.cc/       (via tunnel)"
Write-Host ""
Write-Host "[install-services] done" -ForegroundColor Green
exit 0
