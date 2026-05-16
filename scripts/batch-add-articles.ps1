# PowerShell 脚本：批量添加文章到博客
# 用法: .\scripts\batch-add-articles.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$SourceDir,

    [Parameter(Mandatory=$false)]
    [string[]]$ExcludeFiles = @()
)

$ErrorActionPreference = "Stop"

# 加载 System.Web 用于 URL 编码
Add-Type -AssemblyName System.Web

# 配置
$baseSourceDir = "F:\0.学习\Note\typorafiles"
$blogRoot = Split-Path -Parent $PSScriptRoot
$frontendDir = Join-Path $blogRoot 'frontend-uniapp'
$postsDir = Join-Path $frontendDir 'static\posts'
$imagesDir = Join-Path $frontendDir 'static\images'
$postsDataFile = Join-Path $frontendDir 'data\posts.ts'

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "批量添加文章到博客" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 检查源目录是否存在
if (-not (Test-Path $SourceDir)) {
    Write-Host "❌ 错误：目录不存在: $SourceDir" -ForegroundColor Red
    exit 1
}

# 获取所有 .md 文件
$mdFiles = Get-ChildItem -Path $SourceDir -Filter "*.md" | Where-Object {
    $_.Name -notin $ExcludeFiles
}

if ($mdFiles.Count -eq 0) {
    Write-Host "⚠️  未找到需要处理的 Markdown 文件" -ForegroundColor Yellow
    exit 0
}

Write-Host "📁 源目录: $SourceDir" -ForegroundColor Cyan
Write-Host "📝 找到 $($mdFiles.Count) 篇文章待处理" -ForegroundColor Green
Write-Host ""

# 读取现有 posts.ts 以获取最大 ID
$postsContent = Get-Content $postsDataFile -Raw
$idMatches = [regex]::Matches($postsContent, "id: '(\d+)'")
$maxId = 0
foreach ($m in $idMatches) {
    $currentId = [int]$m.Groups[1].Value
    if ($currentId -gt $maxId) {
        $maxId = $currentId
    }
}

Write-Host "📊 当前最大文章 ID: $maxId" -ForegroundColor Gray
Write-Host ""

# 存储生成的配置
$allConfigs = @()

# 处理每个文件
$processedCount = 0
foreach ($file in $mdFiles) {
    $processedCount++
    Write-Host "[$processedCount/$($mdFiles.Count)] 处理: $($file.Name)" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

    # 计算相对路径
    $relativePath = $file.DirectoryName.Replace($baseSourceDir, "").TrimStart("\")

    # 创建目标目录
    $targetPostDir = Join-Path $postsDir $relativePath
    New-Item -ItemType Directory -Force -Path $targetPostDir | Out-Null

    # 读取文件内容
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8

    # 移除 [toc] 标签
    $content = $content -replace '^\[toc\]\s*\n', ''

    # 获取时间（创建时间和修改时间中最早的）
    $creationTime = $file.CreationTime
    $modifiedTime = $file.LastWriteTime

    if ($creationTime -lt $modifiedTime) {
        $earliestTime = $creationTime
        $timeSource = "创建"
    } else {
        $earliestTime = $modifiedTime
        $timeSource = "修改"
    }

    $formattedDate = $earliestTime.ToString("yyyy-MM-dd")

    Write-Host "  📅 创建: $($creationTime.ToString('yyyy-MM-dd'))" -ForegroundColor Gray
    Write-Host "  📅 修改: $($modifiedTime.ToString('yyyy-MM-dd'))" -ForegroundColor Gray
    Write-Host "  ✅ 使用: $formattedDate (${timeSource}时间)" -ForegroundColor Green

    # 创建图片目标目录
    $targetImageDir = Join-Path $imagesDir "$relativePath\$($file.BaseName)"

    # 提取 GitHub 图片
    $githubImagePattern = '!\[.*?\]\((https://raw\.githubusercontent\.com/liujianjie/Image/main/ImgFloder/([^)]+))\)'
    $githubMatches = [regex]::Matches($content, $githubImagePattern)

    # 提取本地图片引用（相对路径）
    $localImagePattern = '!\[.*?\]\((\.\./[^)]+\.(png|jpg|jpeg|gif|webp|svg))\)'
    $localMatches = [regex]::Matches($content, $localImagePattern)

    $totalImages = $githubMatches.Count + $localMatches.Count

    if ($totalImages -gt 0) {
        Write-Host "  🖼️  图片: $totalImages 张 (GitHub: $($githubMatches.Count), 本地: $($localMatches.Count))" -ForegroundColor Yellow
    }

    # 处理本地图片
    if ($localMatches.Count -gt 0) {
        New-Item -ItemType Directory -Force -Path $targetImageDir | Out-Null

        $copiedImages = 0
        foreach ($match in $localMatches) {
            $relativeImagePath = $match.Groups[1].Value
            $imageName = Split-Path $relativeImagePath -Leaf

            # 解析相对路径
            $mdFileDir = $file.DirectoryName
            $absoluteImagePath = Join-Path $mdFileDir $relativeImagePath
            $absoluteImagePath = [System.IO.Path]::GetFullPath($absoluteImagePath)

            if (Test-Path $absoluteImagePath) {
                # 复制图片
                $targetImagePath = Join-Path $targetImageDir $imageName
                Copy-Item -Path $absoluteImagePath -Destination $targetImagePath -Force
                $copiedImages++

                # 替换路径并进行 URL 编码
                $pathParts = $relativePath.Replace('\', '/').Split('/')
                $encodedParts = $pathParts | ForEach-Object {
                    [System.Web.HttpUtility]::UrlEncode($_).Replace('+', '%20')
                }
                $encodedRelativePath = $encodedParts -join '/'

                $encodedBaseName = [System.Web.HttpUtility]::UrlEncode($file.BaseName).Replace('+', '%20')
                $encodedImageName = [System.Web.HttpUtility]::UrlEncode($imageName).Replace('+', '%20')

                $newImagePath = "/static/images/$encodedRelativePath/$encodedBaseName/$encodedImageName"
                $content = $content -replace [regex]::Escape($relativeImagePath), $newImagePath
            }
        }

        if ($copiedImages -gt 0) {
            Write-Host "  ✅ 复制本地图片: $copiedImages 张" -ForegroundColor Green
        }
    }

    # 保存文件
    $targetMdPath = Join-Path $targetPostDir $file.Name
    Set-Content -Path $targetMdPath -Value $content -Encoding UTF8

    # 生成配置
    $maxId++
    $newId = $maxId
    $fileBaseName = $file.BaseName
    $mdFilePath = "/static/posts/$($relativePath.Replace('\', '/'))/$($file.Name)"

    $config = @{
        id = $newId
        title = $fileBaseName
        date = $formattedDate
        mdFile = $mdFilePath
    }

    $allConfigs += $config

    Write-Host "  ✅ 已处理: ID=$newId" -ForegroundColor Green
    Write-Host ""
}

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "处理完成！" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 统计:" -ForegroundColor Cyan
Write-Host "  - 处理文章数: $($allConfigs.Count)" -ForegroundColor White
Write-Host "  - ID 范围: $(($allConfigs | Select-Object -First 1).id) ~ $(($allConfigs | Select-Object -Last 1).id)" -ForegroundColor White
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "📋 请将以下内容添加到 frontend-uniapp/data/posts.ts:" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 输出配置
foreach ($config in $allConfigs) {
    Write-Host "  {" -ForegroundColor White
    Write-Host "    id: '$($config.id)'," -ForegroundColor White
    Write-Host "    title: '$($config.title)'," -ForegroundColor White
    Write-Host "    excerpt: '摘要待填写'," -ForegroundColor DarkYellow
    Write-Host "    date: '$($config.date)'," -ForegroundColor White
    Write-Host "    tags: ['Unity', 'Addressable', '游戏开发']," -ForegroundColor DarkYellow
    Write-Host "    author: '博主'," -ForegroundColor White
    Write-Host "    readTime: 5," -ForegroundColor DarkYellow
    Write-Host "    mdFile: '$($config.mdFile)'" -ForegroundColor White
    Write-Host "  }," -ForegroundColor White
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "🎯 后续步骤:" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "1. 复制上面的配置到 frontend-uniapp/data/posts.ts" -ForegroundColor Gray
Write-Host "2. 根据实际情况修改 excerpt、tags、readTime" -ForegroundColor Gray
Write-Host "3. 在 frontend-uniapp/ 下运行 node scripts/uni-run.mjs 预览效果" -ForegroundColor Gray
Write-Host "4. 重新生成派生数据: node frontend-uniapp/scripts/gen-search-index.mjs && powershell -ExecutionPolicy Bypass -File scripts/gen-feeds.ps1" -ForegroundColor Gray
Write-Host "5. 提交部署: git add . && git commit && git push" -ForegroundColor Gray
Write-Host ""
