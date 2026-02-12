# 添加文章指南

## 手动添加图片步骤

1. 将以下图片复制到 `public/images/addressable/` 目录：
   - 202311200015168.png
   - 202311200014464.png
   - 202311200014476.png
   - 202311200014484.png
   - 202311200014488.png
   - 202311200015272.png
   - 202311200015816.png

2. 图片来源（从私有仓库下载）：
   https://github.com/liujianjie/Image/tree/main/ImgFloder

## 自动下载脚本（可选）

如果你想自动下载，可以使用 GitHub Token：

```bash
# 设置 GitHub Token
$env:GITHUB_TOKEN="your_github_token"

# 下载图片
$images = @(
  "202311200015168.png",
  "202311200014464.png",
  "202311200014476.png",
  "202311200014484.png",
  "202311200014488.png",
  "202311200015272.png",
  "202311200015816.png"
)

$outDir = "public/images/addressable"
New-Item -ItemType Directory -Force -Path $outDir

foreach ($img in $images) {
  $url = "https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/$img"
  $out = "$outDir/$img"
  Invoke-WebRequest -Uri $url -OutFile $out -Headers @{Authorization="token $env:GITHUB_TOKEN"}
  Write-Host "Downloaded: $img"
}
```

## 图片添加完成后

运行 `npm run dev` 查看效果。
