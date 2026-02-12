# 博客部署指南

本文档提供了将博客部署到不同平台的详细步骤。

## 目录

- [部署前准备](#部署前准备)
- [Vercel 部署（推荐）](#vercel-部署推荐)
- [Netlify 部署](#netlify-部署)
- [GitHub Pages 部署](#github-pages-部署)
- [传统服务器部署](#传统服务器部署)
- [域名配置](#域名配置)

---

## 部署前准备

### 1. 构建项目

在部署前，确保项目可以正常构建：

```bash
# 安装依赖
npm install

# 构建项目
npm run build
```

构建成功后会生成 `dist` 目录，包含所有静态文件。

### 2. 提交代码到 Git

```bash
# 初始化 Git 仓库（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"
```

### 3. 推送到 GitHub

```bash
# 创建 GitHub 仓库后，添加远程仓库
git remote add origin https://github.com/yourusername/your-repo.git

# 推送代码
git branch -M main
git push -u origin main
```

---

## Vercel 部署（推荐）

Vercel 是最简单快捷的部署方式，完全免费。

### 步骤：

1. **注册 Vercel 账号**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "New Project"
   - 选择你的 GitHub 仓库
   - 点击 "Import"

3. **配置项目**
   - Framework Preset: 自动检测为 `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **部署**
   - 点击 "Deploy"
   - 等待部署完成（通常 1-2 分钟）
   - 获得免费的 `.vercel.app` 域名

### 自动部署

配置完成后，每次推送到 `main` 分支都会自动重新部署。

```bash
git add .
git commit -m "Update content"
git push
```

### Vercel CLI（可选）

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
vercel

# 部署到生产环境
vercel --prod
```

---

## Netlify 部署

Netlify 也提供优秀的免费托管服务。

### 方式一：通过 Git

1. **注册 Netlify**
   - 访问 [netlify.com](https://www.netlify.com)
   - 使用 GitHub 账号登录

2. **创建新站点**
   - 点击 "New site from Git"
   - 选择 GitHub 并授权
   - 选择你的仓库

3. **配置构建设置**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - 点击 "Deploy site"

### 方式二：拖放部署

```bash
# 构建项目
npm run build

# 将 dist 文件夹拖放到 Netlify 的部署区域
```

### Netlify CLI（可选）

```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 登录
netlify login

# 部署
netlify deploy

# 部署到生产环境
netlify deploy --prod
```

---

## GitHub Pages 部署

GitHub Pages 提供免费的静态网站托管。

### 步骤：

1. **安装 gh-pages 包**

```bash
npm install --save-dev gh-pages
```

2. **更新 package.json**

添加部署脚本和 homepage：

```json
{
  "homepage": "https://yourusername.github.io/your-repo",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

3. **更新 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/your-repo/', // 替换为你的仓库名
  server: {
    port: 3000,
    open: true
  }
})
```

4. **部署**

```bash
npm run deploy
```

5. **配置 GitHub Pages**
   - 进入仓库的 Settings > Pages
   - Source 选择 `gh-pages` 分支
   - 保存设置

几分钟后，网站将在 `https://yourusername.github.io/your-repo` 可访问。

---

## 传统服务器部署

如果你有自己的服务器（阿里云、腾讯云等）。

### 1. 构建项目

```bash
npm run build
```

### 2. 上传文件

将 `dist` 目录中的所有文件上传到服务器。

```bash
# 使用 SCP
scp -r dist/* user@your-server:/var/www/html/

# 或使用 SFTP 工具（如 FileZilla）
```

### 3. 配置 Nginx

创建或编辑 Nginx 配置文件：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;

    # 支持 React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 开启 Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

重启 Nginx：

```bash
sudo systemctl restart nginx
```

### 4. 配置 HTTPS（可选但推荐）

使用 Let's Encrypt 免费 SSL 证书：

```bash
# 安装 Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 使用 Docker 部署（可选）

创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

创建 `nginx.conf`：

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

构建和运行：

```bash
# 构建镜像
docker build -t my-blog .

# 运行容器
docker run -d -p 80:80 my-blog
```

---

## 域名配置

### 购买域名

推荐域名注册商：
- [Namecheap](https://www.namecheap.com)
- [GoDaddy](https://www.godaddy.com)
- [阿里云](https://www.aliyun.com)
- [腾讯云](https://cloud.tencent.com)

### 配置 DNS

#### Vercel/Netlify

1. 进入项目设置
2. 找到 "Domains" 或"域名"
3. 添加你的域名
4. 按照提示配置 DNS 记录：

```
类型    名称    值
A       @       76.76.21.21  (示例IP，使用平台提供的实际IP)
CNAME   www     your-site.vercel.app
```

#### 自有服务器

```
类型    名称    值
A       @       your-server-ip
CNAME   www     your-domain.com
```

DNS 生效通常需要几分钟到 48 小时。

---

## 性能优化建议

### 1. 启用 CDN

使用 Cloudflare 等 CDN 服务加速全球访问。

### 2. 图片优化

- 使用 WebP 格式
- 压缩图片大小
- 使用懒加载

### 3. 代码分割

已在项目中配置，Vite 会自动进行代码分割。

### 4. 开启 Gzip/Brotli 压缩

大多数现代托管平台默认启用。

---

## 监控和分析

### Google Analytics

在 `index.html` 中添加：

```html
<head>
  <!-- ... -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_MEASUREMENT_ID');
  </script>
</head>
```

### Vercel Analytics

免费且自动集成，无需额外配置。

---

## 常见问题

### Q: 部署后页面刷新 404？

A: 需要配置服务器支持 SPA（单页应用）路由，将所有请求重定向到 `index.html`。

### Q: 构建失败？

A: 检查 Node.js 版本（推荐 16+）和依赖安装是否完整。

### Q: 如何更新内容？

A: 修改代码后推送到 Git，自动部署平台会自动重新部署。

### Q: 域名解析不生效？

A: DNS 生效需要时间，最长可能需要 48 小时，通常几分钟到几小时。

---

## 总结

推荐部署方案：

| 平台 | 难度 | 费用 | 速度 | 推荐度 |
|------|------|------|------|--------|
| Vercel | ⭐ | 免费 | 极快 | ⭐⭐⭐⭐⭐ |
| Netlify | ⭐ | 免费 | 极快 | ⭐⭐⭐⭐⭐ |
| GitHub Pages | ⭐⭐ | 免费 | 快 | ⭐⭐⭐⭐ |
| 自有服务器 | ⭐⭐⭐⭐ | 付费 | 取决于配置 | ⭐⭐⭐ |

**新手推荐**: 使用 Vercel 或 Netlify，零配置，一键部署，自动 HTTPS。

如有问题，欢迎提交 Issue 或联系作者！
