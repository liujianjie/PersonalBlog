# diagnose.ps1
# One-shot Playwright self-test for the blog. Boots dev:h5 in the background,
# waits for port 5174, runs tasks/diagnose.py, then tears down.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/diagnose.ps1
#
# Exit code:
#   0 = all probed articles PASS (images load + text selectable + code blocks
#       carry hljs tokens where expected)
#   1 = at least one regression detected (see stdout for which)
#
# All comments and output are pure ASCII (Windows PowerShell 5.x ANSI parse trap).

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

# 1. Clean any stale node so port 5174 is free
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# 2. Start dev:h5 hidden, redirect logs
$logDir = Join-Path $root 'logs'
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
$out = Join-Path $logDir 'diagnose-dev.log'
$err = Join-Path $logDir 'diagnose-dev.err.log'

$frontDir = Join-Path $root 'frontend-uniapp'
$proc = Start-Process -PassThru -FilePath 'cmd.exe' `
    -ArgumentList @('/c', "pnpm -C `"$frontDir`" dev:h5") `
    -WorkingDirectory $root -WindowStyle Hidden `
    -RedirectStandardOutput $out -RedirectStandardError $err

Write-Host "[diagnose] dev:h5 pid=$($proc.Id); waiting for port 5174 (max 60s)..."

# 3. Poll port 5174 until ready
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect('127.0.0.1', 5174)
        $tcp.Close()
        $ready = $true
        Write-Host "[diagnose] dev:h5 ready after $i s"
        break
    } catch { Start-Sleep -Seconds 1 }
}

# 4. Run Playwright diagnose; ALWAYS tear down server
$code = 1
try {
    if (-not $ready) {
        Write-Host "[diagnose] FAIL: dev:h5 did not become ready within 60s; check $out / $err"
        $code = 2
    } else {
        Write-Host "[diagnose] running tasks/diagnose.py..."
        python "$root\tasks\diagnose.py"
        $code = $LASTEXITCODE
    }
} finally {
    Write-Host "[diagnose] stopping dev:h5..."
    try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}

if ($code -eq 0) {
    Write-Host "[diagnose] PASS"
} else {
    Write-Host "[diagnose] FAIL (exit $code)"
}
exit $code
