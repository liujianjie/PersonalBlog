# Claude 开发笔记

本文档记录项目开发过程中的特殊处理、注意事项和解决方案。

---

## 📸 图片处理机制

### 概述

博客支持两种图片来源：
1. **GitHub 公开仓库图片**：直接引用链接，无需下载
2. **本地相对路径图片**：需要复制到项目并处理中文路径

### 问题背景

在导入 Markdown 文章时，发现文章中的图片引用有两种形式：

```markdown
<!-- GitHub 图片（公开仓库） -->
![图片](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/image.png)

<!-- 本地相对路径图片 -->
![图片](../assets/image.png)
```

由于：
1. 部分图片已上传到 GitHub 公开仓库，可直接使用
2. 部分图片仅在本地，使用相对路径引用
3. 项目使用中文目录结构，URL 需要编码

### 解决方案

#### 1. GitHub 图片处理

**特点：**
- 图片已在 GitHub 公开仓库
- 链接格式：`https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/xxx.png`

**处理方式：**
- ✅ 保持原链接不变
- ✅ 不下载到本地
- ✅ 不占用项目空间

**脚本识别：**
```powershell
$githubImagePattern = '!\[.*?\]\((https://raw\.githubusercontent\.com/liujianjie/Image/main/ImgFloder/([^)]+))\)'
$githubMatches = [regex]::Matches($content, $githubImagePattern)
```

#### 2. 本地图片处理

**特点：**
- 图片在本地文件系统
- 使用相对路径引用：`../assets/image.png`
- 需要复制到项目

**处理步骤：**

##### Step 1: 识别本地图片

```powershell
# 匹配相对路径图片（../xxx.png）
$localImagePattern = '!\[.*?\]\((\.\./[^)]+\.(png|jpg|jpeg|gif|webp|svg))\)'
$localMatches = [regex]::Matches($content, $localImagePattern)
```

##### Step 2: 复制图片到项目

```powershell
# 解析相对路径，获取图片绝对路径
$mdFileDir = $file.DirectoryName
$absoluteImagePath = Join-Path $mdFileDir $relativeImagePath
$absoluteImagePath = [System.IO.Path]::GetFullPath($absoluteImagePath)

# 复制到项目目录
$targetImagePath = Join-Path $targetImageDir $imageName
Copy-Item -Path $absoluteImagePath -Destination $targetImagePath -Force
```

**目标目录结构：**
```
public/images/游戏开发/Unity/.../文章名/
  ├── image1.png
  ├── image2.png
  └── image3.png
```

##### Step 3: URL 编码中文路径（关键！）

**问题：**
浏览器无法识别 URL 中的未编码中文字符，导致图片无法加载。

**原始路径：**
```
/PersonalBlog/images/游戏开发/Unity/Addressbale/Taikr/CSDN博客Addressable/Addressable（8）Addressable Hosting可寻址托管窗口配置/image.png
```

**编码后路径：**
```
/PersonalBlog/images/%e6%b8%b8%e6%88%8f%e5%bc%80%e5%8f%91/Unity/Addressbale/Taikr/CSDN%e5%8d%9a%e5%ae%a2Addressable/Addressable%ef%bc%888%ef%bc%89Addressable%20Hosting%e5%8f%af%e5%af%bb%e5%9d%80%e6%89%98%e7%ae%a1%e7%aa%97%e5%8f%a3%e9%85%8d%e7%bd%ae/image.png
```

**编码代码：**
```powershell
# 加载 System.Web 用于 URL 编码
Add-Type -AssemblyName System.Web

# 对路径的每个部分进行 URL 编码
$pathParts = $relativePath.Replace('\', '/').Split('/')
$encodedParts = $pathParts | ForEach-Object {
    [System.Web.HttpUtility]::UrlEncode($_).Replace('+', '%20')
}
$encodedRelativePath = $encodedParts -join '/'

# 编码文件名中的特殊字符
$encodedBaseName = [System.Web.HttpUtility]::UrlEncode($fileBaseName).Replace('+', '%20')
$encodedImageName = [System.Web.HttpUtility]::UrlEncode($imageName).Replace('+', '%20')

# 生成最终路径
$newImagePath = "/PersonalBlog/images/$encodedRelativePath/$encodedBaseName/$encodedImageName"
```

**注意事项：**
- ✅ 使用 `HttpUtility.UrlEncode()` 编码中文和特殊字符
- ✅ 将空格的 `+` 替换为 `%20`（URL 标准）
- ✅ 保持 `/` 路径分隔符不编码
- ✅ 在 MD 文件中替换原路径

##### Step 4: 替换 MD 中的图片路径

```powershell
# 替换相对路径为编码后的绝对路径
$content = $content -replace [regex]::Escape($relativeImagePath), $newImagePath
```

### 使用脚本

#### 单篇文章处理

```powershell
.\scripts\add-article.ps1 "F:\path\to\your-article.md"
```

**脚本会自动：**
- ✅ 检测 GitHub 图片（保持原样）
- ✅ 检测本地图片（复制并编码）
- ✅ 更新 MD 文件中的路径
- ✅ 生成 posts.ts 配置

#### 批量处理文章

```powershell
.\scripts\batch-add-articles.ps1 -SourceDir "F:\path\to\articles\"
```

**输出示例：**
```
[1/15] 处理: Addressable（8）Addressable Hosting可寻址托管窗口配置.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📅 创建: 2024-10-11
  📅 修改: 2023-11-27
  ✅ 使用: 2023-11-27 (修改时间)
  🖼️  图片: 7 张 (GitHub: 4, 本地: 3)
  ✅ 复制本地图片: 3 张
  ✅ 已处理: ID=34
```

### 常见问题

#### Q1: 图片显示为原始 Markdown 文本？

**症状：**
```
页面显示：
![image](/PersonalBlog/images/游戏开发/.../image.png)
```

**原因：**
- Markdown 未被正确渲染
- 可能是 ReactMarkdown 组件出错

**解决：**
1. 检查是否正确导入 `react-markdown`
2. 检查 `remarkPlugins` 和 `rehypePlugins` 是否正确配置
3. 检查浏览器控制台是否有 JS 错误

#### Q2: 图片路径正确但无法加载？

**症状：**
- 浏览器 Network 显示 404
- 图片路径包含中文

**原因：**
中文路径未进行 URL 编码。

**解决：**
重新运行批量处理脚本，确保路径已编码：
```powershell
# 清理旧文件
rm -rf "public/posts/游戏开发" "public/images/游戏开发"

# 重新处理
.\scripts\batch-add-articles.ps1 -SourceDir "F:\..."
```

#### Q3: GitHub 图片无法显示？

**症状：**
- GitHub 图片显示为原始文本或 404

**可能原因：**
1. 图片仓库是 private（需要身份验证）
2. 图片链接错误
3. GitHub raw 链接被墙（国内访问慢）

**解决方案：**

**方案 1：确认仓库是 public**
访问：https://github.com/liujianjie/Image

**方案 2：使用 CDN 加速（可选）**
```powershell
# 替换 raw.githubusercontent.com 为 CDN
$content = $content -replace 'raw\.githubusercontent\.com', 'cdn.jsdelivr.net/gh'
$content = $content -replace '/main/', '@main/'
```

编码后：
```
https://cdn.jsdelivr.net/gh/liujianjie/Image@main/ImgFloder/image.png
```

#### Q4: 如何查看图片加载状态？

**步骤：**
1. 打开浏览器开发者工具（F12）
2. 切换到 **Network** 标签
3. 刷新页面
4. 筛选 `Img` 类型请求
5. 查看状态码：
   - `200`：成功
   - `404`：路径错误
   - `403`：权限问题

### 技术细节

#### URL 编码对照表

| 字符 | 编码后 | 说明 |
|------|--------|------|
| 游 | %e6%b8%b8 | UTF-8 编码 |
| 戏 | %e6%88%8f | UTF-8 编码 |
| （ | %ef%bc%88 | 全角括号 |
| ） | %ef%bc%89 | 全角括号 |
| 空格 | %20 | 标准编码（不是+） |

#### 为什么将 + 替换为 %20？

- `+` 在 URL 查询参数中表示空格
- `%20` 是空格在 URL 路径中的标准编码
- 保持一致性和兼容性

```powershell
# ❌ 错误：+ 号会被误解释
/path/to/file+name.png

# ✅ 正确：使用 %20
/path/to/file%20name.png
```

### 最佳实践

#### 1. 图片命名规范

**推荐：**
- ✅ 使用英文文件名：`user-avatar.png`
- ✅ 使用数字标识：`image-20231031.png`
- ✅ 避免特殊字符：`()`, `（）`, 空格

**避免：**
- ❌ 中文文件名：`用户头像.png`
- ❌ 特殊字符：`file(1).png`

#### 2. 目录结构

**保持一致：**
```
F:\0.学习\Note\typorafiles\
  └── 游戏开发\
      └── Unity\
          └── Addressbale\
              └── Taikr\
                  ├── CSDN博客Addressable\
                  │   └── *.md
                  └── assets\
                      └── *.png
```

**博客项目镜像：**
```
PersonalBlog/
├── public/
│   ├── posts/
│   │   └── 游戏开发/Unity/.../*.md
│   └── images/
│       └── 游戏开发/Unity/.../文章名/*.png
```

#### 3. 发布前检查清单

- [ ] 运行 `npm run dev` 本地预览
- [ ] 检查所有图片是否正常显示
- [ ] 查看浏览器控制台无错误
- [ ] 检查 Network 标签，图片请求都是 200
- [ ] 测试不同文章的图片加载

### 项目配置

#### Vite 配置

`vite.config.ts`：
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/PersonalBlog/', // ⬅️ GitHub Pages 路径前缀
  server: {
    port: 3000,
    open: true
  }
})
```

**注意：** 所有资源路径必须以 `/PersonalBlog/` 开头。

#### TypeScript 类型

`src/types/index.ts`：
```typescript
export interface Post {
  id: string;
  title: string;
  excerpt: string;
  content?: string;    // 内联内容（可选）
  mdFile?: string;     // 外部 .md 文件路径（可选）
  date: string;
  tags: string[];
  author: string;
  readTime: number;
  coverImage?: string;
}
```

### 相关文件

- **脚本：**
  - `scripts/add-article.ps1` - 单篇文章处理
  - `scripts/batch-add-articles.ps1` - 批量处理

- **配置：**
  - `src/data/posts.ts` - 文章元数据
  - `vite.config.ts` - 构建配置

- **文档：**
  - `HOW_TO_ADD_POST.md` - 添加文章指南
  - `DEPLOYMENT.md` - 部署指南
  - `BATCH_IMPORT_SUMMARY.md` - 批量导入总结

### 更新历史

| 日期 | 更新内容 |
|------|---------|
| 2026-02-12 | 添加本地图片 URL 编码处理 |
| 2026-02-12 | 支持混合图片源（GitHub + 本地） |
| 2026-02-12 | 优化批量处理脚本 |

---

## 📝 其他注意事项

### 1. Markdown 列表渲染

确保 CSS 中正确设置列表样式：

```css
.markdown-body ul {
  list-style-type: disc;    /* 无序列表显示圆点 */
  padding-left: 1.5rem;
}

.markdown-body ol {
  list-style-type: decimal;  /* 有序列表显示数字 */
  padding-left: 1.5rem;
}
```

### 2. 文章宽度

当前设置：`max-w-screen-xl`（1280px）

如需调整，修改 `src/pages/PostDetail.tsx`：
```tsx
<div className="max-w-screen-xl mx-auto">  // 修改这里
```

可选宽度：
- `max-w-4xl` - 896px
- `max-w-5xl` - 1024px
- `max-w-6xl` - 1152px
- `max-w-7xl` - 1280px
- `max-w-screen-xl` - 1280px
- `max-w-screen-2xl` - 1536px

### 3. Git 中文路径支持

```bash
git config --global core.quotepath false
```

这样 Git 可以正确显示中文文件名。

---

## 🔗 相关链接

- **GitHub 仓库：** https://github.com/liujianjie/PersonalBlog
- **图片仓库：** https://github.com/liujianjie/Image
- **部署地址：** https://liujianjie.github.io/PersonalBlog/

---

*最后更新：2026-02-12*
