# PowerShell 脚本：自动添加文章到博客
# 用法: .\scripts\add-article.ps1 "F:\0.学习\Note\typorafiles\游戏开发\Unity\Addressbale\Taikr\CSDN博客Addressable\Addressable（1）导入Addressable.md"

param(
    [Parameter(Mandatory=$true)]
    [string]$SourceMdPath
)

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

Write-Host "📝 处理文章: $fileName" -ForegroundColor Cyan

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

# 提取所有图片 URL
$imagePattern = '!\[.*?\]\((https://raw\.githubusercontent\.com/liujianjie/Image/main/ImgFloder/([^)]+))\)'
$matches = [regex]::Matches($content, $imagePattern)

if ($matches.Count -gt 0) {
    Write-Host "🖼️  发现 $($matches.Count) 张图片" -ForegroundColor Yellow

    # 提取唯一的图片文件名
    $imageFiles = @()
    foreach ($match in $matches) {
        $imageName = $match.Groups[2].Value
        if ($imageFiles -notcontains $imageName) {
            $imageFiles += $imageName
        }
    }

    Write-Host ""
    Write-Host "图片列表:" -ForegroundColor Cyan
    foreach ($img in $imageFiles) {
        Write-Host "  - $img" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "✅ 图片仓库是 public 的，直接使用 GitHub 链接，无需下载！" -ForegroundColor Green
    Write-Host "   链接格式: https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/" -ForegroundColor Gray

    # public 仓库不需要替换图片路径，保持原样
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

$today = Get-Date -Format "yyyy-MM-dd"
$mdFilePath = "/PersonalBlog/posts/$($relativePath.Replace('\', '/'))/$fileName"

Write-Host ""
Write-Host "{" -ForegroundColor White
Write-Host "  id: '$newId'," -ForegroundColor White
Write-Host "  title: '$fileBaseName'," -ForegroundColor White
Write-Host "  excerpt: '这里填写文章摘要（显示在首页）'," -ForegroundColor Yellow
Write-Host "  date: '$today'," -ForegroundColor White
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
