# publish.ps1
# Build orchestrator for the uniapp blog. Runs the four publish steps in
# fail-fast sequence and produces a fresh `site/` mirror at the repo root.
#
# Steps (order is load-bearing):
#   1. gen-feeds.ps1       -> frontend-uniapp/static/{feed.xml,sitemap.xml}
#   2. gen-search-index.mjs -> frontend-uniapp/static/search-index.json
#   3. uni-run.mjs build   -> frontend-uniapp/dist/build/h5/  (bundles static/)
#   4. robocopy            -> site/  (true mirror, deletes orphans via /MIR)
#
# Steps 1+2 must run BEFORE the build so the freshly generated static
# artifacts get bundled into dist/build/h5/static/. Otherwise robocopy
# would publish stale feed.xml / search-index.json from the previous build.
#
# Pure ASCII script (Windows PowerShell 5.x ANSI parse trap, see SPEC #5
# and sibling project deployment notes).
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/publish.ps1

$ErrorActionPreference = 'Stop'

$root      = Split-Path -Parent $PSScriptRoot
$frontDir  = Join-Path $root 'frontend-uniapp'
$buildDir  = Join-Path $frontDir 'dist\build\h5'
$siteDir   = Join-Path $root 'site'
$logsDir   = Join-Path $root 'logs'

if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir | Out-Null
}

function Step {
    param(
        [string] $Label,
        [scriptblock] $Action
    )
    Write-Host ""
    Write-Host "==> $Label" -ForegroundColor Cyan
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    & $Action
    $sw.Stop()
    Write-Host "    done in $([Math]::Round($sw.Elapsed.TotalSeconds, 1))s" -ForegroundColor DarkGray
}

# Sanity: required tooling
$psExe = (Get-Command powershell.exe -ErrorAction SilentlyContinue).Source
if (-not $psExe) { throw 'powershell.exe not on PATH' }

# Find node. Try PATH first; if not there, probe common install locations
# (nvm-windows, official MSI, LOCALAPPDATA, scoop). Some shells (especially
# fresh PowerShell sessions on machines using nvm-windows) don't inherit
# the user PATH that has nodejs in it.
$nodeExe = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $nodeExe) {
    $candidates = @(
        (Join-Path $env:ProgramFiles 'nodejs\node.exe'),
        'C:\nvm4w\nodejs\node.exe',
        (Join-Path $env:LOCALAPPDATA 'Programs\nodejs\node.exe'),
        (Join-Path $env:USERPROFILE 'scoop\apps\nodejs\current\node.exe'),
        (Join-Path $env:USERPROFILE 'scoop\shims\node.exe')
    )
    foreach ($c in $candidates) {
        if ($c -and (Test-Path $c)) { $nodeExe = $c; break }
    }
}
if (-not $nodeExe) {
    throw 'node not found on PATH or common install paths (install Node.js >= 18)'
}

$robocopyExe = (Get-Command robocopy -ErrorAction SilentlyContinue).Source
if (-not $robocopyExe) { throw 'robocopy not on PATH (Windows built-in)' }

# Ensure the node binary's directory is on PATH for child processes.
# uni-run.mjs spawns uni.CMD (a batch wrapper) which calls `node` via the
# inherited environment - if Node was installed via nvm-windows or another
# manager that only updates the user PATH, the spawned cmd.exe won't see
# it. Prepending here is idempotent and propagates to grandchildren.
$nodeDir = Split-Path -Parent $nodeExe
if (($env:PATH -split ';') -notcontains $nodeDir) {
    $env:PATH = "$nodeDir;$env:PATH"
}
Write-Host "[publish] node      = $nodeExe"

Write-Host "[publish] root      = $root"
Write-Host "[publish] frontend  = $frontDir"
Write-Host "[publish] build out = $buildDir"
Write-Host "[publish] site      = $siteDir"

# ---- Step 1: feeds (RSS + sitemap) ----
Step 'gen-feeds.ps1 (RSS 2.0 + sitemap.xml)' {
    $feedsScript = Join-Path $PSScriptRoot 'gen-feeds.ps1'
    if (-not (Test-Path $feedsScript)) { throw "missing $feedsScript" }
    & $psExe -NoProfile -ExecutionPolicy Bypass -File $feedsScript
    if ($LASTEXITCODE -ne 0) { throw "gen-feeds.ps1 exited $LASTEXITCODE" }
}

# ---- Step 2: search index ----
Step 'gen-search-index.mjs (MiniSearch JSON)' {
    $indexScript = Join-Path $frontDir 'scripts\gen-search-index.mjs'
    if (-not (Test-Path $indexScript)) { throw "missing $indexScript" }
    Push-Location $frontDir
    try {
        & $nodeExe $indexScript
        if ($LASTEXITCODE -ne 0) { throw "gen-search-index.mjs exited $LASTEXITCODE" }
    } finally {
        Pop-Location
    }
}

# ---- Step 3: uni build (h5) ----
Step 'build:h5 (uni-run.mjs build)' {
    $uniScript = Join-Path $frontDir 'scripts\uni-run.mjs'
    if (-not (Test-Path $uniScript)) { throw "missing $uniScript" }
    Push-Location $frontDir
    try {
        & $nodeExe $uniScript build
        if ($LASTEXITCODE -ne 0) { throw "uni build exited $LASTEXITCODE" }
    } finally {
        Pop-Location
    }
    if (-not (Test-Path (Join-Path $buildDir 'index.html'))) {
        throw "build did not produce $buildDir\index.html"
    }
}

# ---- Step 4: mirror dist/build/h5 -> site/ ----
Step "robocopy $buildDir -> $siteDir (/MIR)" {
    if (-not (Test-Path $siteDir)) {
        New-Item -ItemType Directory -Path $siteDir | Out-Null
    }
    # /MIR mirrors (deletes orphans). /NFL /NDL /NP keep stdout quiet.
    # /R:1 /W:1 short retry. Capture exit code: robocopy uses bitfield
    # 0..7 = success-ish (0 = nothing copied, 1 = files copied, 2 = extras
    # found, 3 = 1+2, etc); 8+ = real failure.
    & $robocopyExe $buildDir $siteDir /MIR /NFL /NDL /NP /R:1 /W:1 | Out-Host
    $robocopyExit = $LASTEXITCODE
    if ($robocopyExit -ge 8) {
        throw "robocopy failed with exit code $robocopyExit (>= 8 = error)"
    }
    # Reset $LASTEXITCODE so this script's overall exit reflects success.
    $global:LASTEXITCODE = 0
    Write-Host "    robocopy exit: $robocopyExit (0..7 = ok)" -ForegroundColor DarkGray
}

# ---- Verify expected artifacts in site/ ----
$expected = @(
    'index.html',
    'static\feed.xml',
    'static\sitemap.xml',
    'static\search-index.json'
)
$missing = @()
foreach ($rel in $expected) {
    $full = Join-Path $siteDir $rel
    if (-not (Test-Path $full)) { $missing += $rel }
}
if ($missing.Count -gt 0) {
    throw "site/ is missing expected artifacts: $($missing -join ', ')"
}

Write-Host ""
Write-Host "[publish] OK" -ForegroundColor Green
Write-Host "         site/index.html"
foreach ($rel in $expected) {
    $full = Join-Path $siteDir $rel
    $kb = [Math]::Round((Get-Item $full).Length / 1024, 1)
    Write-Host ("         site/{0} ({1} KB)" -f ($rel -replace '\\', '/'), $kb)
}
exit 0
