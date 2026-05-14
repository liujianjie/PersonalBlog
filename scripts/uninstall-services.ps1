# uninstall-services.ps1
# Stop + remove blog-caddy and blog-cloudflared service definitions.
# Does NOT delete binaries (tools/) or configs/ - so a re-install is just
# re-running scripts/install-services.ps1.
#
# Usage (must be run from an ELEVATED PowerShell):
#   powershell -ExecutionPolicy Bypass -File scripts/uninstall-services.ps1
#
# Pure ASCII (Windows PS 5.x ANSI parse trap).

$ErrorActionPreference = 'Stop'

# ---- 1. Admin check ----
$identity  = [System.Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object System.Security.Principal.WindowsPrincipal($identity)
if (-not $principal.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "[uninstall-services] FAIL: must run from elevated PowerShell (Administrator)" -ForegroundColor Red
    exit 2
}

$root     = Split-Path -Parent $PSScriptRoot
$nssmExe  = Join-Path $root 'tools\nssm.exe'

if (-not (Test-Path $nssmExe)) {
    throw "missing $nssmExe"
}

$names = @('blog-caddy', 'blog-cloudflared')
foreach ($name in $names) {
    $svc = Get-Service -Name $name -ErrorAction SilentlyContinue
    if ($null -eq $svc) {
        Write-Host "[uninstall-services] $name not installed (skip)" -ForegroundColor Yellow
        continue
    }
    Write-Host "[uninstall-services] stopping $name (was $($svc.Status))" -ForegroundColor Cyan
    # Stop via cmd /c to avoid PS 5.x NativeCommandError when the service
    # is already stopped (nssm prints to stderr in that case).
    cmd /c "`"$nssmExe`" stop $name confirm >nul 2>&1"
    Write-Host "[uninstall-services] removing $name" -ForegroundColor Cyan
    cmd /c "`"$nssmExe`" remove $name confirm"
    if ($LASTEXITCODE -ne 0) { throw "nssm remove $name failed: $LASTEXITCODE" }
}

Write-Host ""
Write-Host "=== After uninstall ===" -ForegroundColor Green
Get-Service $names -ErrorAction SilentlyContinue |
    Format-Table -AutoSize Name, Status, StartType
if (-not (Get-Service $names -ErrorAction SilentlyContinue)) {
    Write-Host "  (no services - clean)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Binaries (tools/) and configs (configs/) were NOT touched." -ForegroundColor Cyan
Write-Host "To re-install: scripts/install-services.ps1"
Write-Host ""
exit 0
