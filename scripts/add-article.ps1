# PowerShell 脚本：自动添加文章到博客
# 用法: .\scripts\add-article.ps1 "F:\0.学习\Note\typorafiles\游戏开发\Unity\Addressbale\Taikr\CSDN博客Addressable\Addressable（1）导入Addressable.md"

param(
    [Parameter(Mandatory=$true)]
    [string]$SourceMdPath
)

# 加载 System.Web 用于 URL 编码
Add-Type -AssemblyName System.Web

# 配置
$baseSourceDir = "F:\0.学习\Note\typorafiles"
$blogRoot = "G:\workspace\2.workProject\PersonalBlog"
$postsDir = "$blogRoot\public\posts"
$imagesDir = "$blogRoot\public\images"

# 检查源文件是否存在
if (-not (Test-Path $SourceMdPath)) {
    Write-Host "❌ 错误：文件不存在: $SourceMdPath" -ForegroundColor Red
    exit 1
}

# 获取文件信息
$sourceFile = Get-Item $SourceMdPath
$fileName = $sourceFile.Name
$fileBaseName = $sourceFile.BaseName

# 获取文件的创建时间和修改时间，取最早的那个
$creationTime = $sourceFile.CreationTime
$modifiedTime = $sourceFile.LastWriteTime

# 比较两个时间，取最早的
if ($creationTime -lt $modifiedTime) {
    $earliestTime = $creationTime
    $timeSource = "创建时间"
} else {
    $earliestTime = $modifiedTime
    $timeSource = "修改时间"
}

$formattedDate = $earliestTime.ToString("yyyy-MM-dd")

Write-Host "📝 处理文章: $fileName" -ForegroundColor Cyan
Write-Host "📅 创建时间: $($creationTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray
Write-Host "📅 修改时间: $($modifiedTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray
Write-Host "✅ 使用时间: $formattedDate ($timeSource)" -ForegroundColor Green

# 计算相对路径（从 typorafiles 到文章文件）
$relativePath = $sourceFile.DirectoryName.Replace($baseSourceDir, "").TrimStart("\")

Write-Host "📁 目录结构: $relativePath" -ForegroundColor Yellow

# 创建目标目录
$targetPostDir = Join-Path $postsDir $relativePath
$targetImageDir = Join-Path $imagesDir "$relativePath\$fileBaseName"

Write-Host "📂 创建目录..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $targetPostDir | Out-Null
New-Item -ItemType Directory -Force -Path $targetImageDir | Out-Null

# 读取 Markdown 内容
$content = Get-Content -Path $SourceMdPath -Raw -Encoding UTF8

# 创建图片目标目录
$targetImageDir = Join-Path $imagesDir "$relativePath\$fileBaseName"

# 提取 GitHub 图片
$githubImagePattern = '!\[.*?\]\((https://raw\.githubusercontent\.com/liujianjie/Image/main/ImgFloder/([^)]+))\)'
$githubMatches = [regex]::Matches($content, $githubImagePattern)

# 提取本地图片引用（相对路径）
$localImagePattern = '!\[.*?\]\((\.\./[^)]+\.(png|jpg|jpeg|gif|webp|svg))\)'
$localMatches = [regex]::Matches($content, $localImagePattern)

$totalImages = $githubMatches.Count + $localMatches.Count

if ($totalImages -gt 0) {
    Write-Host "🖼️  发现 $totalImages 张图片 (GitHub: $($githubMatches.Count), 本地: $($localMatches.Count))" -ForegroundColor Yellow
}

# 处理本地图片
if ($localMatches.Count -gt 0) {
    Write-Host ""
    Write-Host "📁 处理本地图片..." -ForegroundColor Cyan

    # 创建图片目录
    New-Item -ItemType Directory -Force -Path $targetImageDir | Out-Null

    $copiedImages = 0
    $failedImages = 0

    foreach ($match in $localMatches) {
        $relativeImagePath = $match.Groups[1].Value
        $imageName = Split-Path $relativeImagePath -Leaf

        # 解析相对路径，获取图片的绝对路径
        $mdFileDir = $sourceFile.DirectoryName
        $absoluteImagePath = Join-Path $mdFileDir $relativeImagePath
        $absoluteImagePath = [System.IO.Path]::GetFullPath($absoluteImagePath)

        if (Test-Path $absoluteImagePath) {
            # 复制图片到目标目录
            $targetImagePath = Join-Path $targetImageDir $imageName
            Copy-Item -Path $absoluteImagePath -Destination $targetImagePath -Force

            Write-Host "  ✅ $imageName" -ForegroundColor Green
            $copiedImages++

            # 替换 MD 中的图片路径并进行 URL 编码
            $pathParts = $relativePath.Replace('\', '/').Split('/')
            $encodedParts = $pathParts | ForEach-Object {
                [System.Web.HttpUtility]::UrlEncode($_).Replace('+', '%20')
            }
            $encodedRelativePath = $encodedParts -join '/'

            $encodedBaseName = [System.Web.HttpUtility]::UrlEncode($fileBaseName).Replace('+', '%20')
            $encodedImageName = [System.Web.HttpUtility]::UrlEncode($imageName).Replace('+', '%20')

            $newImagePath = "/PersonalBlog/images/$encodedRelativePath/$encodedBaseName/$encodedImageName"
            $content = $content -replace [regex]::Escape($relativeImagePath), $newImagePath
        } else {
            Write-Host "  ❌ 未找到: $imageName" -ForegroundColor Red
            Write-Host "     期望位置: $absoluteImagePath" -ForegroundColor DarkGray
            $failedImages++
        }
    }

    Write-Host ""
    if ($copiedImages -gt 0) {
        Write-Host "✅ 成功复制 $copiedImages 张本地图片" -ForegroundColor Green
    }
    if ($failedImages -gt 0) {
        Write-Host "⚠️  $failedImages 张图片未找到" -ForegroundColor Yellow
    }
}

# GitHub 图片保持原样
if ($githubMatches.Count -gt 0) {
    Write-Host ""
    Write-Host "✅ $($githubMatches.Count) 张 GitHub 图片保持原链接" -ForegroundColor Green
}

# 移除 [toc] 标签（GitHub Pages 不支持）
$content = $content -replace '^\[toc\]\s*\n', ''

# 保存修改后的 Markdown
$targetMdPath = Join-Path $targetPostDir $fileName
Set-Content -Path $targetMdPath -Value $content -Encoding UTF8

Write-Host "✅ Markdown 文件已保存: $targetMdPath" -ForegroundColor Green

# 生成 posts.ts 配置
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📋 请将以下内容添加到 src/data/posts.ts:" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# 计算下一个 ID
$postsTs = Get-Content "$blogRoot\src\data\posts.ts" -Raw
$idMatches = [regex]::Matches($postsTs, "id: '(\d+)'")
$maxId = 0
foreach ($m in $idMatches) {
    $currentId = [int]$m.Groups[1].Value
    if ($currentId -gt $maxId) {
        $maxId = $currentId
    }
}
$newId = $maxId + 1

$mdFilePath = "/PersonalBlog/posts/$($relativePath.Replace('\', '/'))/$fileName"

Write-Host ""
Write-Host "{" -ForegroundColor White
Write-Host "  id: '$newId'," -ForegroundColor White
Write-Host "  title: '$fileBaseName'," -ForegroundColor White
Write-Host "  excerpt: '这里填写文章摘要（显示在首页）'," -ForegroundColor Yellow
Write-Host "  date: '$formattedDate'," -ForegroundColor White
Write-Host "  tags: ['Unity', 'Addressable', '游戏开发']," -ForegroundColor Yellow
Write-Host "  author: '博主'," -ForegroundColor White
Write-Host "  readTime: 5," -ForegroundColor Yellow
Write-Host "  mdFile: '$mdFilePath'" -ForegroundColor White
Write-Host "}," -ForegroundColor White
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 完成！接下来的步骤：" -ForegroundColor Green
Write-Host "1. 复制图片到指定目录" -ForegroundColor Gray
Write-Host "2. 更新 src/data/posts.ts（添加上面的配置）" -ForegroundColor Gray
Write-Host "3. 运行 npm run dev 预览效果" -ForegroundColor Gray
Write-Host "4. 部署: git add . && git commit -m 'docs: 添加文章' && git push && npm run deploy" -ForegroundColor Gray
