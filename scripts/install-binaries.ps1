# install-binaries.ps1
# Download Caddy, cloudflared, NSSM into tools/ for blog self-hosting.
#
# All comments and output are pure ASCII to avoid Windows PowerShell 5.x
# CP936/GBK decoding traps (see SPEC #5 / sibling project deployment Q9).
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/install-binaries.ps1
#
# Idempotent: existing binaries are skipped.

$ErrorActionPreference = 'Stop'

# Force TLS 1.2 - Windows PowerShell 5.x defaults to TLS 1.0/1.1 which GitHub
# and most modern endpoints no longer accept (request aborted / connection closed).
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$root = Split-Path -Parent $PSScriptRoot
$toolsDir = Join-Path $root 'tools'
$tmpDir   = Join-Path $env:TEMP "blog-install-bins"

if (-not (Test-Path $toolsDir)) {
    New-Item -ItemType Directory -Path $toolsDir | Out-Null
    Write-Host "[mkdir] $toolsDir" -ForegroundColor Cyan
}
if (-not (Test-Path $tmpDir)) {
    New-Item -ItemType Directory -Path $tmpDir | Out-Null
}

function Download-File {
    param(
        [string] $Url,
        [string] $OutPath,
        [string] $Label,
        [int]    $Retries = 3
    )
    Write-Host "[download] $Label" -ForegroundColor Cyan
    Write-Host "  url:  $Url"
    Write-Host "  dest: $OutPath"
    $ProgressPreference = 'SilentlyContinue'
    for ($i = 1; $i -le $Retries; $i++) {
        try {
            Invoke-WebRequest -Uri $Url -OutFile $OutPath -UseBasicParsing -TimeoutSec 180
            return
        } catch {
            $msg = $_.Exception.Message
            Write-Host "  attempt $i/$Retries failed: $msg" -ForegroundColor Yellow
            if ($i -lt $Retries) { Start-Sleep -Seconds 3 }
            else { throw }
        }
    }
}

function Resolve-LatestGithubTag {
    param([string] $RepoSlug)
    # api.github.com is often blocked / unstable in CN. Use github.com's
    # /releases/latest 302-redirect: Location header points to /releases/tag/<TAG>.
    $url = "https://github.com/$RepoSlug/releases/latest"
    $req = [System.Net.HttpWebRequest]::Create($url)
    $req.AllowAutoRedirect = $false
    $req.UserAgent = 'install-binaries.ps1'
    $resp = $req.GetResponse()
    $location = $resp.Headers['Location']
    $resp.Close()
    if (-not $location) {
        throw "No Location header from $url (got status $($resp.StatusCode))"
    }
    $tag = ($location -split '/tag/')[-1]
    return $tag.Trim()
}

# ---------- 1. Caddy (zip from GitHub Releases) ----------
# Note: caddyserver.com/api/download builds binaries on demand and can return
# images that fail with "not a valid application for this OS platform" on
# some Windows machines. GitHub Releases ships the standard amd64 build which
# is broadly compatible.
$caddyExe = Join-Path $toolsDir 'caddy.exe'
if (Test-Path $caddyExe) {
    Write-Host "[skip] caddy.exe already in tools/" -ForegroundColor Yellow
} else {
    Write-Host "[query] latest Caddy release tag (via github.com redirect)" -ForegroundColor Cyan
    $tag = Resolve-LatestGithubTag 'caddyserver/caddy'
    $version = $tag.TrimStart('v')
    Write-Host "  tag: $tag (version $version)"
    $caddyZipUrl = "https://github.com/caddyserver/caddy/releases/download/$tag/caddy_${version}_windows_amd64.zip"
    $caddyZip    = Join-Path $tmpDir 'caddy-windows-amd64.zip'
    $caddyRoot   = Join-Path $tmpDir 'caddy-extract'
    Download-File -Url $caddyZipUrl -OutPath $caddyZip -Label "Caddy $tag"
    if (Test-Path $caddyRoot) { Remove-Item -Recurse -Force $caddyRoot }
    Expand-Archive -Path $caddyZip -DestinationPath $caddyRoot -Force
    $caddyInner = Join-Path $caddyRoot 'caddy.exe'
    if (-not (Test-Path $caddyInner)) {
        throw "caddy.exe not found at expected path after extract: $caddyInner"
    }
    Copy-Item -Path $caddyInner -Destination $caddyExe -Force
    Remove-Item -Path $caddyZip -Force
    Remove-Item -Path $caddyRoot -Recurse -Force
}

# ---------- 2. cloudflared (single exe) ----------
$cfExe = Join-Path $toolsDir 'cloudflared.exe'
if (Test-Path $cfExe) {
    Write-Host "[skip] cloudflared.exe already in tools/" -ForegroundColor Yellow
} else {
    $cfUrl = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe'
    Download-File -Url $cfUrl -OutPath $cfExe -Label 'cloudflared (latest)'
}

# ---------- 3. NSSM (zip; extract win64/nssm.exe) ----------
# nssm.cc occasionally returns 503; fall back to archive.org snapshot.
$nssmExe = Join-Path $toolsDir 'nssm.exe'
if (Test-Path $nssmExe) {
    Write-Host "[skip] nssm.exe already in tools/" -ForegroundColor Yellow
} else {
    $nssmUrls = @(
        'https://nssm.cc/release/nssm-2.24.zip',
        'https://web.archive.org/web/2024/https://nssm.cc/release/nssm-2.24.zip'
    )
    $nssmZip  = Join-Path $tmpDir 'nssm-2.24.zip'
    $nssmRoot = Join-Path $tmpDir 'nssm-extract'
    $ok = $false
    foreach ($u in $nssmUrls) {
        try {
            Download-File -Url $u -OutPath $nssmZip -Label "NSSM 2.24"
            $ok = $true; break
        } catch {
            Write-Host ("  source failed, trying next: " + $u) -ForegroundColor Yellow
        }
    }
    if (-not $ok) { throw "All NSSM sources failed" }
    if (Test-Path $nssmRoot) { Remove-Item -Recurse -Force $nssmRoot }
    Expand-Archive -Path $nssmZip -DestinationPath $nssmRoot -Force
    $nssmInner = Join-Path $nssmRoot 'nssm-2.24\win64\nssm.exe'
    if (-not (Test-Path $nssmInner)) {
        throw "nssm.exe not found at expected path: $nssmInner"
    }
    Copy-Item -Path $nssmInner -Destination $nssmExe -Force
    Remove-Item -Path $nssmZip -Force
    Remove-Item -Path $nssmRoot -Recurse -Force
}

# ---------- Verify ----------
# Note: do NOT redirect native exe stderr with 2>&1 in PowerShell 5.x - it
# wraps each line in NativeCommandError ErrorRecords, causing false failures
# even when the binary exits 0. (See SPEC #5 / sibling project Q9.)
Write-Host ""
Write-Host "=== Versions ===" -ForegroundColor Green
& $caddyExe version
Write-Host ""
& $cfExe --version
Write-Host ""
# nssm.exe writes its banner to stderr in UTF-16; route via cmd /c to keep
# console encoding sane and avoid the 2>&1 trap.
cmd /c """$nssmExe"" version"
Write-Host ""
Write-Host "[done] All three binaries are in $toolsDir" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps (one-time activation):" -ForegroundColor Cyan
Write-Host "  1. tools\cloudflared.exe tunnel login"
Write-Host "  2. tools\cloudflared.exe tunnel create blog"
Write-Host "  3. copy configs\cloudflared.yml.sample configs\cloudflared.yml; edit UUID + username"
Write-Host "  4. tools\cloudflared.exe tunnel route dns blog blog.multilab.cc"
Write-Host "  5. powershell -ExecutionPolicy Bypass -File scripts/install-services.ps1"
