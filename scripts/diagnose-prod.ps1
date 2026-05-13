# diagnose-prod.ps1
# T15 e2e self-test for the PRODUCTION-built site served by Caddy.
# Boots Caddy on configs/Caddyfile (127.0.0.1:48080), waits for it to listen,
# runs tasks/diagnose-prod.py, then tears Caddy down.
#
# Differs from scripts/diagnose.ps1 (which targets dev:h5 on 5174) - this
# validates the build product behind Caddy, exactly what production sees
# behind the Cloudflare tunnel.
#
# Pre-req: scripts/publish.ps1 must have been run at least once so site/
# is populated.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/diagnose-prod.ps1
#
# Exit:
#   0 - all probes PASS
#   1 - one or more probes FAIL
#   2 - Caddy did not become ready within 30 seconds
#
# All comments and output are pure ASCII (Windows PS 5.x ANSI parse trap).

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

$caddyExe   = Join-Path $root 'tools\caddy.exe'
$configFile = Join-Path $root 'configs\Caddyfile'
$siteDir    = Join-Path $root 'site'
$logsDir    = Join-Path $root 'logs'
$probeScript = Join-Path $root 'tasks\diagnose-prod.py'

if (-not (Test-Path $caddyExe))    { throw "missing $caddyExe (run scripts/install-binaries.ps1)" }
if (-not (Test-Path $configFile)) { throw "missing $configFile" }
if (-not (Test-Path $siteDir))     { throw "missing $siteDir (run scripts/publish.ps1 first)" }
if (-not (Test-Path $probeScript)) { throw "missing $probeScript" }
if (-not (Test-Path $logsDir))     { New-Item -ItemType Directory -Path $logsDir | Out-Null }

# 1. Make sure no stale Caddy is bound to 48080
Get-Process caddy -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# 2. Start Caddy hidden, redirect logs
$out = Join-Path $logsDir 'diagnose-prod-caddy.out.log'
$err = Join-Path $logsDir 'diagnose-prod-caddy.err.log'

$proc = Start-Process -PassThru -FilePath $caddyExe `
    -ArgumentList @('run', '--config', $configFile) `
    -WorkingDirectory $root -WindowStyle Hidden `
    -RedirectStandardOutput $out -RedirectStandardError $err

Write-Host "[diagnose-prod] caddy pid=$($proc.Id); waiting for port 48080 (max 30s)..."

# 3. Poll port 48080
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect('127.0.0.1', 48080)
        $tcp.Close()
        $ready = $true
        Write-Host "[diagnose-prod] caddy ready after $i s"
        break
    } catch { Start-Sleep -Seconds 1 }
}

# 4. Run probe; ALWAYS tear down
$code = 1
try {
    if (-not $ready) {
        Write-Host "[diagnose-prod] FAIL: caddy did not bind 48080 within 30s; check $err"
        $code = 2
    } else {
        Write-Host "[diagnose-prod] running tasks/diagnose-prod.py..."
        python $probeScript
        $code = $LASTEXITCODE
    }
} finally {
    Write-Host "[diagnose-prod] stopping caddy..."
    try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}
    Get-Process caddy -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}

if ($code -eq 0) {
    Write-Host "[diagnose-prod] PASS"
} else {
    Write-Host "[diagnose-prod] FAIL (exit $code)"
}
exit $code
