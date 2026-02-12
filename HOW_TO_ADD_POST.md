# 如何添加新文章

本文档介绍如何向博客添加新的 Markdown 文章。

## 🎯 推荐方法：使用自动化脚本

### 一键添加文章（推荐）✨

使用 PowerShell 脚本自动处理文章：

```powershell
# 在博客根目录运行
.\scripts\add-article.ps1 "F:\0.学习\Note\typorafiles\游戏开发\Unity\Addressbale\Taikr\CSDN博客Addressable\Addressable（1）导入Addressable.md"
```

**脚本会自动：**
- ✅ 按照你本地的目录结构创建对应文件夹
- ✅ 保持原始文件名（不重命名）
- ✅ 检测图片链接（GitHub public 仓库直接使用，无需下载）
- ✅ 生成 `posts.ts` 配置代码
- ✅ 自动移除 `[toc]` 标签

**输出示例：**
```
📝 处理文章: Addressable（1）导入Addressable.md
📁 目录结构: 游戏开发\Unity\Addressbale\Taikr\CSDN博客Addressable
📂 创建目录...
🖼️  发现 7 张图片

图片列表:
  - 202311200015168.png
  - 202311200014464.png
  ...

✅ 图片仓库是 public 的，直接使用 GitHub 链接，无需下载！
   链接格式: https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/

============================================
📋 请将以下内容添加到 src/data/posts.ts:
============================================

{
  id: '7',
  title: 'Addressable（1）导入Addressable',
  excerpt: '这里填写文章摘要（显示在首页）',
  date: '2024-02-12',
  tags: ['Unity', 'Addressable', '游戏开发'],
  author: '博主',
  readTime: 5,
  mdFile: '/PersonalBlog/posts/游戏开发/Unity/Addressbale/Taikr/CSDN博客Addressable/Addressable（1）导入Addressable.md'
},
```

---

## 📁 目录结构说明

博客会**保持你本地的目录结构**：

### 你的本地结构：
```
F:\0.学习\Note\typorafiles\
  └── 游戏开发\
      └── Unity\
          └── Addressbale\
              └── Taikr\
                  └── CSDN博客Addressable\
                      └── Addressable（1）导入Addressable.md
```

### 转换为博客结构：
```
PersonalBlog/
└── public/
    └── posts/
        └── 游戏开发/
            └── Unity/
                └── Addressbale/
                    └── Taikr/
                        └── CSDN博客Addressable/
                            └── Addressable（1）导入Addressable.md  ✅ 保持原名
```

**图片处理：**
- ✅ 如果图片在 **public** 的 GitHub 仓库，直接使用原链接，无需下载
- ✅ 如果图片在 **private** 仓库或本地，需要复制到 `public/images/` 目录

**当前使用的图片仓库：**
- 仓库：https://github.com/liujianjie/Image (public)
- 链接格式：`https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/[图片名]`
- 📌 **无需下载，直接引用即可！**

---

## 📝 手动添加步骤（如果不用脚本）

### 1. 创建目录结构

根据你的文章路径创建对应目录：

```powershell
# 例如：游戏开发/Unity/Addressbale/...
mkdir -p "public/posts/游戏开发/Unity/Addressbale/Taikr/CSDN博客Addressable"
```

### 2. 复制 Markdown 文件

将 `.md` 文件复制到对应目录，**保持原始文件名**。

### 3. 检查图片链接

**如果图片在 public 仓库（当前情况）：**
```markdown
<!-- 保持原样即可 -->
![图片](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/image.png)
```

**如果图片在 private 仓库或本地：**
```markdown
<!-- 需要改为本地路径 -->
![图片](/PersonalBlog/images/游戏开发/Unity/Addressable/文章名/image.png)
```

### 4. 移除 [toc] 标签

GitHub Pages 不支持 `[toc]`，需要删除：

```markdown
[toc]  ← 删除这一行

# 一、标题
...
```

### 5. 更新 `src/data/posts.ts`

在数组开头添加：

```typescript
export const posts: Post[] = [
  {
    id: '7',  // 递增的唯一 ID
    title: 'Addressable（1）导入Addressable',
    excerpt: '详细介绍如何在 Unity 项目中导入和配置 Addressable 系统',
    date: '2024-02-12',
    tags: ['Unity', 'Addressable', '游戏开发'],
    author: '博主',
    readTime: 5,
    mdFile: '/PersonalBlog/posts/游戏开发/Unity/Addressbale/Taikr/CSDN博客Addressable/Addressable（1）导入Addressable.md'
  },
  // ... 其他文章
];
```

---

## 🚀 发布流程

### 1. 本地预览

```bash
npm run dev
```

访问 http://localhost:3000 查看效果

### 2. 提交和部署

```bash
git add .
git commit -m "docs: 添加文章 - Addressable（1）导入Addressable"
git push origin main
npm run deploy
```

---

## 🖼️ 图片管理说明

### 方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **使用 GitHub 链接** | 不占用项目空间<br>部署快速<br>CDN 加速 | 依赖 GitHub<br>国内访问可能慢 | 图片在 public 仓库 |
| **复制到本地** | 完全自主控制<br>不依赖外部服务 | 占用空间<br>部署较慢 | 图片在 private 仓库<br>或需要完全控制 |

### 当前方案：使用 GitHub 链接（推荐）✅

你的图片仓库 https://github.com/liujianjie/Image 是 public 的，所以：

**优势：**
- ✅ 不需要下载图片到项目
- ✅ 不增加项目体积
- ✅ GitHub 提供 CDN 加速
- ✅ 图片更新自动生效

**图片链接格式：**
```markdown
![描述](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/图片名.png)
```

### 如果需要切换到本地图片

如果将来需要切换（比如 GitHub 访问慢），可以：

1. **下载图片到本地：**
```powershell
# 批量下载脚本
$images = @("image1.png", "image2.png")
$outDir = "public/images/游戏开发/Unity/Addressable/文章名"
New-Item -ItemType Directory -Force -Path $outDir

foreach ($img in $images) {
  $url = "https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/$img"
  Invoke-WebRequest -Uri $url -OutFile "$outDir/$img"
}
```

2. **替换图片路径：**
```powershell
# 批量替换
$mdFile = "public/posts/游戏开发/Unity/.../文章.md"
$content = Get-Content $mdFile -Raw
$content = $content -replace 'https://raw\.githubusercontent\.com/liujianjie/Image/main/ImgFloder/', '/PersonalBlog/images/游戏开发/Unity/Addressable/文章名/'
Set-Content $mdFile $content
```

---

## 📚 示例：当前文章结构

```
PersonalBlog/
└── public/
    └── posts/
        └── 游戏开发/
            └── Unity/
                └── Addressable/
                    └── Addressable（1）导入Addressable.md  ✅

图片：直接使用 GitHub 链接
https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/*.png
```

---

## ⚠️ 注意事项

1. **保持目录结构**：从 `typorafiles` 之后的路径保持不变
2. **保持文件名**：不要重命名 `.md` 文件
3. **移除 [toc]**：GitHub Pages 不支持，脚本会自动移除
4. **图片链接**：
   - Public 仓库：保持 GitHub 原链接
   - Private 仓库：需要下载到本地并修改路径为 `/PersonalBlog/images/...`
5. **文章 ID**：必须唯一且递增
6. **文件编码**：确保 UTF-8 编码

---

## 🔧 常见问题

### Q: GitHub 图片加载慢？

**原因：**
国内访问 `raw.githubusercontent.com` 可能较慢。

**解决方案：**

1. **使用 CDN 加速（推荐）：**

   将 `raw.githubusercontent.com` 替换为加速域名：
   ```markdown
   <!-- 原链接 -->
   ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/img.png)

   <!-- 使用加速 -->
   ![](https://cdn.jsdelivr.net/gh/liujianjie/Image@main/ImgFloder/img.png)
   ```

2. **下载到本地：**

   参考上面的"切换到本地图片"部分。

### Q: 图片不显示？

**检查：**
1. 图片链接是否正确
2. 图片仓库是否是 public
3. 图片文件是否存在
4. 浏览器控制台是否有错误

### Q: 如何批量替换图片链接？

**使用 CDN 加速链接：**
```powershell
$mdFile = "public/posts/游戏开发/Unity/.../文章.md"
$content = Get-Content $mdFile -Raw
$content = $content -replace 'raw\.githubusercontent\.com', 'cdn.jsdelivr.net/gh'
$content = $content -replace '/main/', '@main/'
Set-Content $mdFile $content
```

---

## 💡 最佳实践

### 添加新文章的标准流程：

1. ✅ 使用脚本自动处理：
   ```powershell
   .\scripts\add-article.ps1 "F:\你的文章路径\文章.md"
   ```

2. ✅ 复制脚本生成的配置，添加到 `src/data/posts.ts`

3. ✅ 修改 `excerpt`、`tags`、`readTime` 等字段

4. ✅ 运行 `npm run dev` 本地预览

5. ✅ 确认图片正常显示

6. ✅ 提交部署：
   ```bash
   git add .
   git commit -m "docs: 添加新文章"
   git push
   npm run deploy
   ```

---

## 🎯 总结

**使用 GitHub public 仓库存储图片的优势：**

✅ **不占用项目空间**：图片托管在 GitHub
✅ **部署更快**：不需要上传大量图片
✅ **CDN 加速**：GitHub 提供全球 CDN
✅ **易于管理**：图片集中管理
✅ **自动同步**：图片更新后自动生效

**当前配置：**
- 文章仓库：https://github.com/liujianjie/PersonalBlog
- 图片仓库：https://github.com/liujianjie/Image (public)
- 部署平台：GitHub Pages

开始使用脚本添加你的文章吧！🚀
