# gen-feeds.ps1
# Generate RSS 2.0 (feed.xml) + sitemap.xml from frontend-uniapp/data/posts.ts.
#
# Output:
#   frontend-uniapp/static/feed.xml
#   frontend-uniapp/static/sitemap.xml
#
# Both are picked up by Caddy under /static/feed.xml and /static/sitemap.xml
# in the live site. Regenerated each publish; not committed (.gitignored).
#
# Pure ASCII script (Windows PowerShell 5.x ANSI parse trap). The XML output
# itself contains UTF-8 (post titles in Chinese) and is written with
# explicit UTF-8 (no BOM) encoding.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/gen-feeds.ps1

$ErrorActionPreference = 'Stop'

$root         = Split-Path -Parent $PSScriptRoot
$frontDir     = Join-Path $root 'frontend-uniapp'
$postsTsPath  = Join-Path $frontDir 'data\posts.ts'
$outDir       = Join-Path $frontDir 'static'
$feedPath     = Join-Path $outDir 'feed.xml'
$sitemapPath  = Join-Path $outDir 'sitemap.xml'

$siteUrl      = 'https://blog.multilab.cc'
$siteTitle    = 'Personal Blog'
$siteDesc     = 'Tech notes on Unity / OpenGL / computer graphics'

# ---- 1. read posts.ts (UTF-8) ----
if (-not (Test-Path $postsTsPath)) {
    Write-Error "posts.ts not found at $postsTsPath"
    exit 1
}
$src = [System.IO.File]::ReadAllText($postsTsPath, [System.Text.Encoding]::UTF8)

# ---- 2. parse posts via regex ----
# Each post object literal has the shape:
#   { id: '12', title: '...', excerpt: '...', date: 'YYYY-MM-DD',
#     tags: [...], author: '...', readTime: N,
#     <one or more of: mdFile / content / coverImage> }
# We capture id/title/excerpt/date/tags/author only - those are all the
# RSS / sitemap need - and ignore everything between readTime and the
# closing '}' (which may contain a multiline backtick template literal).
$pattern = "(?ms)\{\s*" +
           "id:\s*'([^']+)',\s*" +
           "title:\s*'([^']+)',\s*" +
           "excerpt:\s*'([^']*)',\s*" +
           "date:\s*'([^']+)',\s*" +
           "tags:\s*\[([^\]]*)\],\s*" +
           "author:\s*'([^']+)',\s*" +
           "readTime:\s*\d+\s*,?"

$matches = [regex]::Matches($src, $pattern)
if ($matches.Count -eq 0) {
    Write-Error 'No posts parsed from posts.ts; check the regex / file format.'
    exit 1
}

$posts = @()
foreach ($m in $matches) {
    $tagsRaw = $m.Groups[5].Value
    $tagList = @()
    foreach ($t in [regex]::Matches($tagsRaw, "'([^']+)'")) {
        $tagList += $t.Groups[1].Value
    }
    $posts += [pscustomobject]@{
        Id      = $m.Groups[1].Value
        Title   = $m.Groups[2].Value
        Excerpt = $m.Groups[3].Value
        Date    = $m.Groups[4].Value
        Tags    = $tagList
        Author  = $m.Groups[6].Value
    }
}

# Sort newest first
$posts = $posts | Sort-Object -Property Date -Descending

Write-Host "[gen-feeds] parsed $($posts.Count) posts"

# ---- 3. helpers ----
function XmlEscape([string]$s) {
    if ($null -eq $s) { return '' }
    return $s.Replace('&', '&amp;').Replace('<', '&lt;').Replace('>', '&gt;').Replace('"', '&quot;')
}

function PostUrl([string]$id) {
    return "$siteUrl/pages/post/post?id=$([System.Web.HttpUtility]::UrlEncode($id))"
}

function Rfc822([string]$ymd) {
    # 'YYYY-MM-DD' -> 'Sun, 01 Jan 2024 00:00:00 GMT'
    try {
        $d = [DateTime]::ParseExact($ymd, 'yyyy-MM-dd', [System.Globalization.CultureInfo]::InvariantCulture)
        return $d.ToString('R', [System.Globalization.CultureInfo]::InvariantCulture)
    } catch {
        return [DateTime]::UtcNow.ToString('R', [System.Globalization.CultureInfo]::InvariantCulture)
    }
}

Add-Type -AssemblyName System.Web

# ---- 4. build feed.xml (RSS 2.0) ----
$lastBuild = [DateTime]::UtcNow.ToString('R', [System.Globalization.CultureInfo]::InvariantCulture)

$feedSb = New-Object System.Text.StringBuilder
[void]$feedSb.AppendLine('<?xml version="1.0" encoding="UTF-8"?>')
[void]$feedSb.AppendLine('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">')
[void]$feedSb.AppendLine('  <channel>')
[void]$feedSb.AppendLine("    <title>$(XmlEscape $siteTitle)</title>")
[void]$feedSb.AppendLine("    <link>$siteUrl/</link>")
[void]$feedSb.AppendLine("    <description>$(XmlEscape $siteDesc)</description>")
[void]$feedSb.AppendLine('    <language>zh-cn</language>')
[void]$feedSb.AppendLine("    <lastBuildDate>$lastBuild</lastBuildDate>")
[void]$feedSb.AppendLine("    <atom:link href=`"$siteUrl/static/feed.xml`" rel=`"self`" type=`"application/rss+xml`" />")

foreach ($p in $posts) {
    $url = PostUrl $p.Id
    [void]$feedSb.AppendLine('    <item>')
    [void]$feedSb.AppendLine("      <title>$(XmlEscape $p.Title)</title>")
    [void]$feedSb.AppendLine("      <link>$url</link>")
    [void]$feedSb.AppendLine("      <guid isPermaLink=`"true`">$url</guid>")
    [void]$feedSb.AppendLine("      <pubDate>$(Rfc822 $p.Date)</pubDate>")
    [void]$feedSb.AppendLine("      <author>$(XmlEscape $p.Author)</author>")
    foreach ($t in $p.Tags) {
        [void]$feedSb.AppendLine("      <category>$(XmlEscape $t)</category>")
    }
    [void]$feedSb.AppendLine("      <description>$(XmlEscape $p.Excerpt)</description>")
    [void]$feedSb.AppendLine('    </item>')
}

[void]$feedSb.AppendLine('  </channel>')
[void]$feedSb.AppendLine('</rss>')

# ---- 5. build sitemap.xml ----
$smSb = New-Object System.Text.StringBuilder
[void]$smSb.AppendLine('<?xml version="1.0" encoding="UTF-8"?>')
[void]$smSb.AppendLine('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

# home
[void]$smSb.AppendLine('  <url>')
[void]$smSb.AppendLine("    <loc>$siteUrl/</loc>")
[void]$smSb.AppendLine('    <changefreq>weekly</changefreq>')
[void]$smSb.AppendLine('    <priority>1.0</priority>')
[void]$smSb.AppendLine('  </url>')

# tags index
[void]$smSb.AppendLine('  <url>')
[void]$smSb.AppendLine("    <loc>$siteUrl/pages/tag/tag</loc>")
[void]$smSb.AppendLine('    <changefreq>weekly</changefreq>')
[void]$smSb.AppendLine('    <priority>0.6</priority>')
[void]$smSb.AppendLine('  </url>')

foreach ($p in $posts) {
    [void]$smSb.AppendLine('  <url>')
    [void]$smSb.AppendLine("    <loc>$(PostUrl $p.Id)</loc>")
    [void]$smSb.AppendLine("    <lastmod>$($p.Date)</lastmod>")
    [void]$smSb.AppendLine('    <changefreq>monthly</changefreq>')
    [void]$smSb.AppendLine('    <priority>0.8</priority>')
    [void]$smSb.AppendLine('  </url>')
}

[void]$smSb.AppendLine('</urlset>')

# ---- 6. write files (UTF-8 no BOM) ----
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($feedPath, $feedSb.ToString(), $utf8NoBom)
[System.IO.File]::WriteAllText($sitemapPath, $smSb.ToString(), $utf8NoBom)

$feedKb = [Math]::Round((Get-Item $feedPath).Length / 1024, 1)
$smKb   = [Math]::Round((Get-Item $sitemapPath).Length / 1024, 1)

Write-Host "[gen-feeds] wrote $feedPath ($feedKb KB)"
Write-Host "[gen-feeds] wrote $sitemapPath ($smKb KB)"
exit 0
