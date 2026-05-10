# Spec: PersonalBlog · uniapp 重写 + 域名自托管

> 创建于 2026-05-09 · 在主分支 `main`(GitHub Pages 版本)之外拉新分支大改
> 本文件是当前唯一的"真相源"。新分支落地后归档到 `docs/`,与代码一同 commit
> 工作流参考 `agent-skills:spec-driven-development`(spec → plan → tasks → implement)

---

## 0. 背景与决策

### 当前状态

- `main` 分支 = React 18 + Vite + react-markdown + react-router-dom + Tailwind,部署到 GitHub Pages(`liujianjie.github.io/PersonalBlog/`,`base: '/PersonalBlog/'`)
- 文章 ~50+ 篇,放在 `public/posts/游戏开发/...` 树形目录(中文路径)
- 图片混合源:GitHub raw 链接 + `public/images/` 本地中文路径(URL 编码处理)
- 元数据手写在 `src/data/posts.ts`(1095 行,每篇 ~10-20 行)
- 文章添加流水线:`scripts/add-article.ps1` / `scripts/batch-add-articles.ps1`(PowerShell + URL 编码 + 本地图片复制)
- 安全规则 / 项目说明在 `CLAUDE.md`

### 这次重写的边界

**保留**:
- `main` 分支 React 版本完全冻结,GH Pages 继续工作,作为"备份站"
- 现有文章内容、图片、目录结构、URL 编码方案、`add-article.ps1` 流水线语义

**改变**:
- 新分支(命名见 §10 Open Question 1)上把前端重写为 uni-app(Vue 3 + TypeScript)
- 部署目标从 GitHub Pages 切到本机 Caddy + Cloudflare Tunnel,通过 `blog.multilab.cc` 访问
- 本机起的 Caddy 和 cloudflared 都包成 Windows 服务(NSSM),开机自启,不依赖用户登录

### 为什么这么选

| 决策 | 备选 | 选定原因 |
|---|---|---|
| 前端 = uni-app(只 H5) | Vue 3 + Vite SPA / Astro / Next | 与兄弟项目 StockTradingAnalysis 同栈,以后想加小程序版只改 manifest.json |
| 域名 = `blog.multilab.cc` | `liujianjie.github.io/PersonalBlog`(已有) | 自有域名 + HTTPS + 不被墙(GH Pages 国内访问慢) |
| 静态托管 = Caddy | 空壳 FastAPI / Node serve / IIS | 单二进制 + 自带 SPA fallback + 零配置 + 中文路径无坑 |
| 隧道 = Cloudflare Tunnel | frp / ngrok / 公网 IP + 备案 | 免备案 + 不暴露公网 IP + HTTPS 自动 + 与兄弟项目一致 |
| 服务化 = NSSM | 任务计划程序 / Docker | 任务计划要求用户登录;Docker 需 Docker Desktop 长开。NSSM 装为 Windows 服务,开机即起,无登录依赖 |

### 与兄弟项目的差异

`G:\workspace\AIProject\StockTradingAnalysis` 是 **uniapp + FastAPI(后端有 /api)+ cloudflared 手动跑**。
本项目是 **uniapp 纯静态(无后端)+ Caddy + cloudflared NSSM 服务**。技术栈相似但部署链不同:博客没有 /api,因此**不需要 Python**,也**不需要"反转后让 backend 托管前端"**那一招——直接 Caddy 服 build 产物即可。

---

## 1. Objective(目标)

### 1.1 我们在做什么

把现有 React + GH Pages 博客重写为 uni-app H5 + 本机自托管 + Cloudflare 域名访问的版本,**老版本完整保留**作回退/对照。

### 1.2 用户

- 唯一用户 = 作者本人(个人技术博客)
- 读者 = 不特定访客,通过 `https://blog.multilab.cc` 访问
- 不做评论 / 登录 / 用户系统 / 多语言 / 国际化

### 1.3 成功画面(Definition of Done)

满足以下 13 条即"完成":

1. **新分支建立**:从 `main` 拉新分支 `uniapp-rewrite`,`main` 不再被这次重写动到
2. **uni-app 工程跑通**:`pnpm -C frontend-uniapp dev:h5` 起 vite 开发服务器,浏览器打开能看到首页
3. **内容迁移完整**:现有 `posts.ts` 全部 50+ 篇文章在新版能列出、点开、Markdown 正确渲染、代码高亮工作、GitHub 图片 + 本地中文路径图片都能加载
4. **build 产出可用**:`pnpm -C frontend-uniapp build:h5` 产出 `frontend-uniapp/dist/build/h5/`,`scripts/publish.ps1` 把产物拷贝到 `site/`,并附带生成 `feed.xml` / `sitemap.xml` / `search-index.json`
5. **Caddy 服得起来**:`tools/caddy.exe run --config configs/Caddyfile` 监听 127.0.0.1:48080,浏览器访问 `http://127.0.0.1:48080/` 看到首页,刷新子路由(如 `/post/12`)不 404
6. **Cloudflare Tunnel 通**:`tools/cloudflared.exe --config configs/cloudflared.yml tunnel run blog` 起来后,浏览器打开 `https://blog.multilab.cc` 能看到与本机 48080 完全一致的首页
7. **NSSM 服务化**:`scripts/install-services.ps1` 跑完后,`Get-Service blog-caddy`、`Get-Service blog-cloudflared` 都是 `Running` 且 `Startup Type = Automatic`
8. **重启验证**:重启电脑,**不登录任何用户**,等 60 秒,从另一台设备访问 `https://blog.multilab.cc` 能正常打开(说明 LocalSystem 账户下两个服务自启了)
9. **master/main 分支不变**:`main` 仍指向当前 React 版本,GH Pages 站 `liujianjie.github.io/PersonalBlog/` 仍可访问
10. **暗色主题工作**:首次访问跟随系统 `prefers-color-scheme`;顶栏切换按钮可手动切;选择持久化(localStorage)
11. **全文搜索可用**:顶部搜索框输入关键字,能命中标题 / 标签 / 摘要 / 正文片段,点击跳转文章
12. **Feed 可订阅**:`https://blog.multilab.cc/feed.xml` 返回有效 RSS 2.0;`/sitemap.xml` 返回标准 sitemap,均含全部已发文章
13. **文档完备**:`docs/deployment.md` 含一次性激活步骤、日常维护命令、故障排查;`README.md` 在新分支上更新指向新部署链

---

## 2. Tech Stack(技术栈)

### 前端 (`frontend-uniapp/`)

- **uni-app** 3.x(`@dcloudio/uni-app`)+ **Vue 3** + **TypeScript** + **Vite 5** + **pnpm**
- **目标平台**:仅 H5(`manifest.json` 中只启用 h5,关掉小程序/App 编译,以后要加再打开)
- **样式方案**:**UnoCSS**(Tailwind-like,uni-app 适配良好)+ uni-app 内置组件(view / text / scroll-view)。**不引入 Element Plus / wot-design-uni 等大 UI 库**
- **Markdown 渲染**:`marked` + `highlight.js`(参考 React 版的 `react-markdown` + `rehype-highlight`)
- **路由**:uni-app 自带,通过 `pages.json` 配置;H5 走 history 模式
- **状态管理**:Pinia(uni-app 适配版),含 `useThemeStore`(明暗主题)
- **HTTP**:`uni.request` 直接读 `/posts/*.md`(纯静态,无 axios)
- **搜索**:`minisearch`(客户端,publish 时离线生成 `search-index.json`,首次搜索按需 fetch)

### 静态产物增强(publish 时生成)

- **RSS / Sitemap**:`scripts/gen-feeds.ps1` 模板渲染 `feed.xml`(RSS 2.0)+ `sitemap.xml`(标准 sitemap),无第三方依赖
- **搜索索引**:`scripts/gen-search-index.mjs` 扫 `posts.ts` + `posts/*.md` 抽标题/摘要/正文片段,输出 `search-index.json`(MiniSearch 序列化格式)

### 静态托管 (`tools/caddy.exe` + `configs/Caddyfile`)

- **Caddy v2** Windows amd64 单二进制(`tools/caddy.exe`,从 caddyserver.com 下载)
- 端口:`127.0.0.1:48080`(显式 IPv4,避开 Windows localhost 解析到 IPv6 ::1 的陷阱;参考 StockTradingAnalysis 部署问答 Q5。**避开 8080**——8080 是 Tomcat / Jenkins / 各种 dev server 高频占用端口,40000+ 段几乎不撞)
- 功能:静态文件服务 + SPA history fallback + gzip + 自动识别 UTF-8 路径

### 隧道 (`tools/cloudflared.exe` + `configs/cloudflared.yml`)

- **cloudflared** Windows amd64 单二进制(从 GitHub Releases 下,沿用 `scripts/install-cloudflared.ps1` 模式)
- 域名:`blog.multilab.cc`(根域 `multilab.cc` 已购,DNS 托管 Cloudflare;新建子域 DNS 记录 + named tunnel 路由)
- ingress 指向 `http://127.0.0.1:48080`(Caddy 监听端口)
- credentials:`%USERPROFILE%\.cloudflared\<TUNNEL_UUID>.json` —— **不入 git**

### 服务化 (`tools/nssm.exe`)

- **NSSM** Windows amd64 单二进制(nssm.cc/release)
- 装两个服务:
  - `blog-caddy`:`tools\caddy.exe run --config configs\Caddyfile`,工作目录 = 项目根
  - `blog-cloudflared`:`tools\cloudflared.exe --config configs\cloudflared.yml tunnel run blog`,工作目录 = 项目根
- 启动类型 = Automatic,登录账户 = LocalSystem(开机自启,不需登录)
- 日志输出到 `logs/blog-caddy.log` / `logs/blog-cloudflared.log`(NSSM stdout 重定向)

### 不引入

- 不引入数据库、不引入 Python 后端、不引入 Docker、不引入 nginx、不引入 IIS

---

## 3. Commands(命令)

> 工作目录 = `G:\workspace\AIProject\PersonalBlog`(新分支 checkout 后)

### 一次性激活(每个新设备装一次)

```bash
# 1. 装 pnpm(如未装)
npm i -g pnpm

# 2. 装前端依赖
pnpm -C frontend-uniapp install

# 3. 下载三个二进制到 tools/
powershell -ExecutionPolicy Bypass -File scripts/install-binaries.ps1
# 这一步会下:
#   tools/caddy.exe         (Caddy v2 latest)
#   tools/cloudflared.exe   (cloudflared latest)
#   tools/nssm.exe          (NSSM 2.24)

# 4. cloudflared 登录 + 创建 tunnel + 配 DNS(交互式)
tools\cloudflared.exe tunnel login                       # 浏览器选 multilab.cc 授权
tools\cloudflared.exe tunnel create blog                 # 记下 UUID(写入 cloudflared.yml)
copy configs\cloudflared.yml.sample configs\cloudflared.yml
notepad configs\cloudflared.yml                          # 把 <YOUR_TUNNEL_UUID> + <YOUR_USERNAME> 填实
tools\cloudflared.exe tunnel route dns blog blog.multilab.cc

# 5. 装 Windows 服务(管理员 PowerShell)
powershell -ExecutionPolicy Bypass -File scripts/install-services.ps1
```

### 日常开发

```bash
# 改前端代码,HMR 热更
pnpm -C frontend-uniapp dev:h5
# 浏览器打开 http://localhost:5174

# 加新文章(沿用现有流水线,适配新目录)
powershell -File scripts/add-article.ps1 "F:\path\to\new-article.md"
```

### 发布到生产(本机域名)

```bash
# 1. 构建 + 拷贝到 site/ + 生成 feed/sitemap/search-index
#    (NSSM 服务的 Caddy 已经 watch 了 site/,刷新即生效)
powershell -ExecutionPolicy Bypass -File scripts/publish.ps1
# publish.ps1 内部步骤:
#   a. pnpm -C frontend-uniapp build:h5
#   b. robocopy frontend-uniapp/dist/build/h5/  site/  /MIR
#   c. node scripts/gen-search-index.mjs       → site/search-index.json
#   d. powershell scripts/gen-feeds.ps1        → site/feed.xml + site/sitemap.xml

# 2. 验证(三档逐级排查)
curl -I http://127.0.0.1:48080/             # A. Caddy 活着(应 200)
curl http://127.0.0.1:48080/                # B. site/ 在托管(应返回 HTML)
curl http://127.0.0.1:48080/feed.xml        # B'. RSS 可读
# 浏览器:http://127.0.0.1:48080/           # C. 本地访问能看到首页 + 搜索框 + 主题切换
# 浏览器:https://blog.multilab.cc/         # D. tunnel 通,远端能看到首页

# A 不通 → blog-caddy 服务挂了 → Get-Service blog-caddy
# B 不通 → site/ 空 → 重跑 publish.ps1
# C 通 D 不通 → blog-cloudflared 挂了 → Get-Service blog-cloudflared
```

### 服务管理

```powershell
Get-Service blog-caddy, blog-cloudflared
Restart-Service blog-caddy
Stop-Service    blog-cloudflared
Start-Service   blog-cloudflared

# 卸载
powershell -ExecutionPolicy Bypass -File scripts/uninstall-services.ps1
```

### 测试

```bash
# 前端单元测试
pnpm -C frontend-uniapp test:unit

# 类型检查
pnpm -C frontend-uniapp typecheck

# Playwright 端到端自验(图/选/代码块三项 probe;一键启服务+诊断+清理)
powershell -ExecutionPolicy Bypass -File scripts/diagnose.ps1
# 退出码 0 = PASS;1 = 至少一项回归;2 = dev:h5 60s 内没起来
# 详见 tasks/diagnose.py(可参数化加更多目标文章)
```

---

## 4. Project Structure(目录布局)

```
PersonalBlog/
├── SPEC.md                       # 本文件(新分支唯一真相源)
├── CLAUDE.md                     # 项目说明(更新指向新分支部署链)
├── README.md                     # 更新:加 blog.multilab.cc 入口 + master 分支说明
├── frontend-uniapp/              # 新前端(替代 React 的 src/)
│   ├── package.json              # uniapp + vue3 + ts + unocss + minisearch
│   ├── manifest.json             # uniapp 配置(只启用 h5)
│   ├── pages.json                # 路由
│   ├── tsconfig.json
│   ├── uno.config.ts             # UnoCSS 配置(presetUno + 自定义 theme tokens)
│   ├── vite.config.ts            # Vite 配置(server.allowedHosts 加 blog.multilab.cc)
│   ├── pages/
│   │   ├── index/                # 首页
│   │   ├── post/                 # 文章详情(动态路由 /post/:id)
│   │   ├── tag/                  # 标签页
│   │   └── search/               # 搜索结果页
│   ├── src/
│   │   ├── data/posts.ts         # 文章元数据(从老 src/data/posts.ts 直接迁)
│   │   ├── components/           # post-card / search-box / theme-toggle / markdown-view
│   │   ├── stores/
│   │   │   └── theme.ts          # 暗色主题 store(localStorage 持久化)
│   │   ├── composables/
│   │   │   ├── markdown.ts       # marked + highlight.js 包装
│   │   │   ├── search.ts         # MiniSearch 客户端封装
│   │   │   └── url-encode.ts     # 中文路径 URL 编码(沿用现有方案)
│   │   ├── styles/
│   │   │   └── theme.css         # CSS 变量 + media prefers-color-scheme
│   │   └── types/                # Post 类型定义
│   ├── public/
│   │   ├── posts/游戏开发/...    # 从老 public/posts/ 直接迁(中文路径不动)
│   │   └── images/...            # 从老 public/images/ 直接迁
│   ├── dist/build/h5/            # build 产物(gitignore)
│   └── tests/                    # vitest 单测
├── site/                         # Caddy 服的根目录(publish.ps1 拷贝产物到这里;gitignore)
│                                 #   含: index.html / assets/ / posts/ / images/ /
│                                 #        feed.xml / sitemap.xml / search-index.json
├── configs/
│   ├── Caddyfile                 # Caddy 配置(SPA fallback,127.0.0.1:48080)
│   ├── cloudflared.yml.sample    # 模板(进 git,含占位符)
│   └── cloudflared.yml           # 实际配置(含 tunnel UUID,gitignore)
├── scripts/
│   ├── install-binaries.ps1      # 下 caddy.exe / cloudflared.exe / nssm.exe
│   ├── install-services.ps1      # NSSM 装两个服务
│   ├── uninstall-services.ps1    # NSSM 卸载两个服务
│   ├── publish.ps1               # build:h5 → site/ + 调 gen-feeds + gen-search-index
│   ├── gen-feeds.ps1             # 模板渲染 feed.xml + sitemap.xml(纯 ASCII)
│   ├── gen-search-index.mjs      # 扫文章生成 MiniSearch search-index.json
│   ├── add-article.ps1           # 沿用,适配 frontend-uniapp/public/ 路径
│   └── batch-add-articles.ps1    # 沿用,适配 frontend-uniapp/public/ 路径
├── tools/                        # 二进制(gitignore;install-binaries.ps1 下载)
│   ├── caddy.exe
│   ├── cloudflared.exe
│   └── nssm.exe
├── logs/                         # 服务运行日志(gitignore)
│   ├── blog-caddy.log
│   └── blog-cloudflared.log
├── docs/
│   ├── deployment.md             # 部署/运维手册
│   ├── migration-react-to-uniapp.md  # 迁移笔记(组件映射、库替换)
│   └── adr/
│       ├── 001-uniapp-over-vue-spa.md
│       ├── 002-caddy-over-fastapi-shell.md
│       └── 003-nssm-over-task-scheduler.md
├── tasks/                        # agent-skills 工作流产物(由 plan / build 阶段生成)
│   ├── plan.md
│   └── todo.md
├── public/                       # ← 老 React 版本残留(新分支可删,但建议在 git mv 后保留一个 commit 历史)
├── src/                          # ← 老 React 源码(新分支删除)
├── package.json                  # ← 老 React 的(新分支留作 root tooling 或删)
└── ...其他老 React 配置(vite.config.ts / tailwind / index.html 在新分支删)
```

### .gitignore 必须加(新分支)

```
# 二进制
tools/*.exe

# 凭据(P0 安全规则)
configs/cloudflared.yml
.cloudflared/

# 构建产物
frontend-uniapp/dist/
frontend-uniapp/node_modules/
site/

# 日志
logs/
```

---

## 5. Code Style(代码风格)

### Vue 3 SFC + script setup + TypeScript

```vue
<!-- frontend-uniapp/pages/post/post.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { posts } from '@/data/posts'
import { renderMarkdown } from '@/composables/markdown'
import type { Post } from '@/types'

const post = ref<Post | null>(null)
const html = ref('')

onLoad((options) => {
  const id = options?.id
  post.value = posts.find(p => p.id === id) ?? null
})

onMounted(async () => {
  if (!post.value?.mdFile) return
  const res = await uni.request({ url: post.value.mdFile, dataType: 'text' as any })
  html.value = renderMarkdown(res.data as string)
})

const readableDate = computed(() => post.value?.date ?? '')
</script>

<template>
  <view class="post" v-if="post">
    <h1 class="title">{{ post.title }}</h1>
    <div class="meta">{{ readableDate }} · {{ post.readTime }} 分钟阅读</div>
    <article class="markdown-body" v-html="html" />
  </view>
</template>

<style scoped>
.post { max-width: 1280px; margin: 0 auto; padding: 24px; }
.title { font-size: 32px; font-weight: 600; }
.meta  { color: #6b7280; margin: 8px 0 24px; }
</style>
```

### 命名

- 组件文件:`kebab-case.vue`(如 `post-card.vue`)
- TS 模块:`kebab-case.ts`(如 `markdown.ts`)
- Pinia store:`useXxxStore`(如 `useThemeStore`)
- 常量:`UPPER_SNAKE`,变量/函数:`camelCase`,类型:`PascalCase`

### 注释

默认不写。只在"为什么"非显然时写一行,例如:

```ts
// IPv4 显式;Windows localhost 解析到 ::1 会让 cloudflared 报 origin EOF
const HOST = '127.0.0.1'
```

不写"做什么"的注释,因为命名应自描述。

### PowerShell 脚本(Windows 中文系统坑)

- `.ps1` / `.bat` 文件**纯 ASCII**(注释、输出、错误消息都 ASCII)。Windows PowerShell 5.x 默认按 ANSI/CP936 解析无 BOM 的 .ps1,中文 UTF-8 字节会乱码,且 backtick 行延续在 GBK + CRLF 下失效(参考 StockTradingAnalysis 部署问答 Q9 同款坑)
- `.py` / `.md` / `.vue` / `.ts` / `.json` 不受此约束,中文随意

---

## 6. Testing Strategy(测试策略)

### 单元测试

- 框架:Vitest(uni-app 默认)
- 位置:`frontend-uniapp/tests/unit/`
- 必测:`composables/markdown.ts`(Markdown 渲染含代码块、图片、标题、列表)、`composables/url-encode.ts`(中文路径 URL 编码,沿用现有方案)
- 不强求覆盖率指标

### 类型检查

- `pnpm -C frontend-uniapp typecheck` = `vue-tsc --noEmit`
- 必须 0 error 才能 publish

### 端到端验证(手动)

每次 publish 后,按 §3 "发布到生产" 末尾 4 档(A → B → C → D)逐级 curl + 浏览器验证。无自动化 e2e。

### 重启自启验证(每月一次或改部署后)

冷启动场景:
1. 关机
2. 开机,**不登录任何用户**,等 60 秒
3. 从手机或另一台设备打开 `https://blog.multilab.cc`
4. 应能看到首页

如失败,检查:
- `Get-Service blog-caddy / blog-cloudflared` 状态
- `logs/blog-caddy.log` / `logs/blog-cloudflared.log` 错误
- `eventvwr.msc` → Windows 日志 → 应用程序

---

## 7. Boundaries(边界)

### Always(总是这么做)

- 在新分支上提交,`main` 分支保持只读
- 文章添加走 `scripts/add-article.ps1` 流水线,不手动编辑 `posts.ts`
- 中文路径继续 URL 编码(沿用 `[System.Web.HttpUtility]::UrlEncode` + `+` → `%20` 的方案)
- `cloudflared.yml`、`.cloudflared/*.json`、`tools/*.exe` 都进 `.gitignore`
- PowerShell 脚本纯 ASCII(见 §5)
- cloudflared 配置中 ingress service 用 `http://127.0.0.1:48080` 显式 IPv4
- Vite `server.allowedHosts` + `preview.allowedHosts` 加 `blog.multilab.cc`(避免 origin EOF,见参考项目部署问答 Q5)

### Ask First(先问再做)

- 改 `cloudflared.yml` ingress 把 service 切到别的端口/进程
- 加任何后端(/api、数据库、Python)
- 引入大 UI 库(Element Plus / wot-design-uni / Naive UI 等)替换当前 UnoCSS + 内置组件方案
- 改 `manifest.json` 启用小程序/App 编译目标
- 把 `main` 分支 GH Pages 的部署关掉
- 给博客加评论 / 登录 / 用户系统 / 统计上报
- 改根域 / 子域名 / DNS 托管商
- 升级 uni-app / Vue / Vite 主版本
- 替换搜索方案(MiniSearch → 服务端搜索 / Algolia 等)

### Never(绝不做)

- **绝不**把 cloudflared 凭据 JSON、tunnel UUID、`.env`、任何 token / key / secret 提交进 git
- **绝不**在 `main` 分支上做这次重写涉及的代码改动
- **绝不**在对话、SPEC、commit message、log 文件中**复述明文** API Key / Token / 密码(P0 安全规则)
- **绝不**关闭 `liujianjie.github.io/PersonalBlog/` 的 GitHub Pages 部署(老站作回退)
- **绝不**把 `tools/*.exe` 传进 git(用户自下,跨平台不兼容,且体积大)
- **绝不**用任务计划程序代替 NSSM(任务计划要求用户登录;违背"开机自启"目标)
- **绝不**用 `frontend-uniapp/dev:h5`(vite dev 5174)作生产入口——它是开发用的;生产走 Caddy + build 产物
- **绝不**把图片仓库 `liujianjie/Image` 改名或删除(老 GitHub 图片链接靠它)

---

## 8. Success Criteria(验收清单)

复制自 §1.3,加打勾位:

- [ ] 1. 新分支 `uniapp-rewrite` 已建立,`main` 不动
- [ ] 2. uni-app 工程能 `dev:h5` 起来
- [ ] 3. 50+ 篇文章全部迁移完整,渲染、图片、代码高亮正常
- [ ] 4. `pnpm build:h5` 产物正确,`publish.ps1` 拷到 `site/` 并附带 feed/sitemap/search-index
- [ ] 5. Caddy 监听 48080,SPA fallback 工作
- [ ] 6. cloudflared 跑通,`https://blog.multilab.cc` 可达
- [ ] 7. NSSM 装上两个服务,Automatic 启动
- [ ] 8. 重启电脑不登录验证通过
- [ ] 9. `main` 分支 GH Pages 站仍可访问
- [ ] 10. 暗色主题:跟随系统 + 手动切换 + 持久化
- [ ] 11. 全文搜索能命中标题/标签/摘要/正文片段
- [ ] 12. `feed.xml` + `sitemap.xml` 远端可访问且有效
- [ ] 13. `docs/deployment.md` 完整,README 更新

---

## 9. Risks & Mitigations(风险与缓解)

| 风险 | 影响 | 缓解 |
|---|---|---|
| uni-app 对纯静态/无后端场景配置坑(默认带 SSR、PWA、icons 资源) | 编译失败 / 多余产物 | 关掉 vite-plugin-pwa(博客不需要 PWA);`manifest.json` 只 enable h5,其他 platforms 全删 |
| H5 history 模式刷新子路由 404 | 博客文章详情刷不出 | Caddyfile 配 `try_files {path} /index.html`(SPA fallback);uni-app `pages.json` `h5.router.mode = "history"` |
| 中文 URL 路径在 Caddy 下编码不一致 | 图片 / 文章 .md 加载 404 | Caddy v2 默认 UTF-8 path,与现有 URL 编码方案兼容,但要写一条 e2e 验证测试某篇含中文路径的文章 |
| cloudflared origin EOF | 域名访问 502 | ingress 用 `http://127.0.0.1:48080` 显式 IPv4;Caddy bind `127.0.0.1:48080`(不 bind `:48080` ⇒ 不暴露 LAN);Vite preview/dev allowedHosts 加 `blog.multilab.cc` |
| Windows PowerShell 5.x ANSI 解码 .ps1 中文乱码 + backtick 失效 | 安装脚本跑挂 | `.ps1` 文件全 ASCII(见 §5) |
| NSSM 服务工作目录配错导致相对路径找不到配置 | 服务起不来 | install-services.ps1 显式 `nssm set blog-xxx AppDirectory <PROJECT_ROOT>` |
| LocalSystem 账户起 cloudflared 时拿不到 `%USERPROFILE%\.cloudflared\` 凭据 | tunnel 不起 | 把凭据 JSON 拷到 `%ProgramData%\cloudflared\` 或在 cloudflared.yml 用 `credentials-file:` 写绝对路径(见 §3 一次性激活) |
| `multilab.cc` 续费过期 / Cloudflare 账号问题 | 域名挂 | 兄弟项目共用根域,作者自管;故障时回退到 GH Pages 老站 |
| 图片仓库 `liujianjie/Image` 被 GitHub 限流 / 改 visibility | 部分图片挂 | 中长期把全部图片本地化(已经走在路上,GitHub 图片只是历史遗留) |

---

## 10. 决策记录(原 Open Questions · 已定)

| # | 问题 | 决策 | 理由 |
|---|---|---|---|
| 1 | 新分支命名 | `uniapp-rewrite` | 语义最直白 |
| 2 | UI 库 | **UnoCSS(Tailwind-like)+ uni-app 内置组件**(view / text / scroll-view) | 博客以阅读为主,不需要重 UI 库;老 React 版用 Tailwind,审美延续;以后想切重库再 ask-first |
| 3 | 暗色主题 | **保留**,默认跟随系统(`prefers-color-scheme`)+ 顶栏手动切换 | 老版已有,UX 标配;实现成本极低(CSS 变量 + Pinia 一个 store) |
| 4 | 全文搜索 | **做**,客户端本地索引(MiniSearch) | 现代博客标配;publish 时离线生成 `search-index.json`,前端按需 fetch,与"无后端"原则一致 |
| 5 | RSS / Sitemap | **做** | SEO + 订阅;`scripts/gen-feeds.ps1` 在 publish 时生成 `feed.xml` + `sitemap.xml` 进 `site/`,无第三方依赖 |
| 6 | DNS 托管 | **沿用**——`multilab.cc` 在 Cloudflare 托管,与兄弟项目共用 | 已验证可用,不重复验 |
| 7 | Caddy :80 重定向 | **不做** | 本机走 :48080,远端走 cloudflared HTTPS;:80 不开避免与其它服务冲突 |

---

## 11. 与兄弟项目的协议

`G:\workspace\AIProject\StockTradingAnalysis` 与本项目共用:
- 根域 `multilab.cc`(已购,nameserver 托管 Cloudflare)
- Cloudflare 账号(用户本人)
- 不同 tunnel UUID + 不同 ingress(本项目 `blog`,兄弟项目 `tracker`),互不干扰

冲突避免:
- 端口:本项目 Caddy 用 **48080**(避 8080 高频占用),兄弟项目 FastAPI 用 8001
- 服务名:本项目 `blog-caddy` / `blog-cloudflared`,兄弟项目无 NSSM 服务(手动跑),无冲突
- 子域名:本项目 `blog.multilab.cc`,兄弟项目 `assets.multilab.cc` / 未来还会有 `trade.` / `push.`

---

## 12. 下一步

SPEC 已锁,§10 全部决策完毕。后续:

1. 进入 `agent-skills:plan` → 在 `tasks/plan.md` 输出 实施计划(组件依赖、阶段验收点)
2. 进入 `agent-skills:planning-and-task-breakdown` → `tasks/todo.md` 列出 ≤5 文件粒度的可实施任务
3. 进入 `agent-skills:build` 一个一个落地,每步在 `uniapp-rewrite` 分支上 commit

---

*本文件接受 PR/Edit。改动需在 commit message 注明 "spec: §X.Y 更新 ..."*
