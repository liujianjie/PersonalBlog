# 临时脚本：导入 LearnOpenGL 和 ProtoBuf 文章

$ErrorActionPreference = "Stop"

# 配置路径
$learnOpenGLDir = "F:\0.学习\Note\typorafiles\计算机图形学\LearnOpenGL"
$protobufFile = "F:\0.学习\Note\typorafiles\0.编写文档\Unity\ProtoBuf自定义生成规则，及编译生成dll与Exe.md"
$tempDir = "F:\0.学习\Note\typorafiles\temp_import"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "准备导入 LearnOpenGL 和 ProtoBuf 文章" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 创建临时目录
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# 创建子目录
$tempOpenGLDir = Join-Path $tempDir "计算机图形学\LearnOpenGL"
$tempUnityDir = Join-Path $tempDir "0.编写文档\Unity"
New-Item -ItemType Directory -Path $tempOpenGLDir -Force | Out-Null
New-Item -ItemType Directory -Path $tempUnityDir -Force | Out-Null

# ============================================
# 1. 处理 LearnOpenGL 文件
# ============================================
Write-Host "📂 处理 LearnOpenGL 文章..." -ForegroundColor Cyan

$openglFiles = Get-ChildItem -Path $learnOpenGLDir -Filter "*.md" | Where-Object {
    # 排除包含 "copy" 的文件、test.md 和 声明.md
    $_.Name -notmatch '\(copy\)|\(存档\)' -and
    $_.Name -ne 'test.md' -and
    $_.Name -ne '声明.md'
}

Write-Host "  找到 $($openglFiles.Count) 个文件" -ForegroundColor Gray
Write-Host ""

$renamedCount = 0
foreach ($file in $openglFiles) {
    $originalName = $file.Name
    $newName = $originalName

    # 如果文件名不以 "LearnOpenGL-" 开头，则添加前缀
    if ($originalName -notmatch '^LearnOpenGL-') {
        $newName = "LearnOpenGL-" + $originalName
    }

    # 复制到临时目录
    $targetPath = Join-Path $tempOpenGLDir $newName
    Copy-Item -Path $file.FullName -Destination $targetPath -Force

    if ($originalName -ne $newName) {
        Write-Host "  ✅ $originalName → $newName" -ForegroundColor Green
        $renamedCount++
    } else {
        Write-Host "  ⏭️  $originalName (保持原名)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "  重命名: $renamedCount 个文件" -ForegroundColor Yellow
Write-Host ""

# ============================================
# 2. 处理 ProtoBuf 文件
# ============================================
Write-Host "📂 处理 ProtoBuf 文章..." -ForegroundColor Cyan

if (Test-Path $protobufFile) {
    $newProtobufName = "Unity-ProtoBuf自定义生成规则及编译dll与Exe.md"
    $targetProtobufPath = Join-Path $tempUnityDir $newProtobufName
    Copy-Item -Path $protobufFile -Destination $targetProtobufPath -Force
    Write-Host "  ✅ ProtoBuf自定义生成规则，及编译生成dll与Exe.md → $newProtobufName" -ForegroundColor Green
} else {
    Write-Host "  ❌ 未找到 ProtoBuf 文件" -ForegroundColor Red
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ 准备完成！文件已复制到临时目录：" -ForegroundColor Green
Write-Host "   $tempDir" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 接下来执行以下命令导入文章：" -ForegroundColor Yellow
Write-Host ""
Write-Host "   # 导入 LearnOpenGL 文章" -ForegroundColor Cyan
Write-Host "   .\scripts\batch-add-articles.ps1 -SourceDir '$tempOpenGLDir'" -ForegroundColor White
Write-Host ""
Write-Host "   # 导入 ProtoBuf 文章" -ForegroundColor Cyan
Write-Host "   .\scripts\batch-add-articles.ps1 -SourceDir '$tempUnityDir'" -ForegroundColor White
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
