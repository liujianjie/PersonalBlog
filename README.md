# 个人博客

> **分支说明(2026-05-09 起)**
>
> | 分支 | 技术栈 | 部署 | 访问入口 | 状态 |
> |---|---|---|---|---|
> | `main` | React 18 + Vite + Tailwind | GitHub Pages | https://liujianjie.github.io/PersonalBlog/ | 冻结(回退/对照用) |
> | `uniapp-rewrite` | uni-app + Vue 3 + UnoCSS | 本机 Caddy + Cloudflare Tunnel | https://blog.multilab.cc/ | 主版本(当前活跃) |
>
> 本 README 现在描述 **`uniapp-rewrite` 分支**(主版本)的工作流。
> 重写方案、目录、决策见 [`SPEC.md`](./SPEC.md);实施计划见
> [`tasks/plan.md`](./tasks/plan.md) + [`tasks/todo.md`](./tasks/todo.md);
> 部署运维见 [`docs/deployment.md`](./docs/deployment.md);React → uni-app
> 迁移笔记见 [`docs/migration-react-to-uniapp.md`](./docs/migration-react-to-uniapp.md)。
> 老 React 版本的 README/部署说明留在 [`main` 分支](https://github.com/liujianjie/PersonalBlog/tree/main)。

---

一个 uni-app(Vue 3) H5 个人博客,自托管在 `blog.multilab.cc`(本机 Caddy + Cloudflare Tunnel)。

## 特性

- 50+ 篇技术文章(Unity / OpenGL / Addressable / ProtoBuf 等)
- 全文搜索(MiniSearch 客户端索引,无后端依赖)
- 暗色主题:跟随系统 + 手动切换 + localStorage 持久化
- 中文路径文章/图片自动 URL 编码
- 代码块语法高亮(highlight.js)
- RSS 2.0 + sitemap 自动生成,可订阅 `/static/feed.xml`
- 一键 publish:`scripts/publish.ps1` 完成构建 + 索引 + 镜像
- 服务化:NSSM 装两个 Windows 服务,**重启不登录** 自启

## 技术栈

- **前端**:uni-app 3.x + Vue 3.4 + TypeScript + Vite 5
- **样式**:UnoCSS(Tailwind-like)+ CSS 变量
- **Markdown**:marked + highlight.js
- **搜索**:MiniSearch
- **包管理**:pnpm
- **静态托管**:Caddy v2(`tools/caddy.exe`)
- **隧道**:Cloudflare Tunnel(`tools/cloudflared.exe`)
- **服务化**:NSSM(`tools/nssm.exe`)

## 快速开始(开发)

```powershell
# 1. 装 pnpm + 装前端依赖
npm i -g pnpm
pnpm -C frontend-uniapp install

# 2. 装三个二进制(caddy / cloudflared / nssm)到 tools/
powershell -ExecutionPolicy Bypass -File scripts/install-binaries.ps1

# 3. 起开发服务器
pnpm -C frontend-uniapp dev:h5
# 浏览器: http://localhost:5174
```

## 加文章

```powershell
# 单篇
powershell -ExecutionPolicy Bypass -File scripts/add-article.ps1 "F:\path\to\article.md"

# 批量
powershell -ExecutionPolicy Bypass -File scripts/batch-add-articles.ps1 -SourceDir "F:\path\to\articles\"
```

脚本会自动:
- 检测 GitHub 图片(保持原链接,不下载)
- 复制本地图片到 `frontend-uniapp/static/images/...`
- 中文路径 URL 编码(`HttpUtility.UrlEncode` + `+ -> %20`)
- 更新 `frontend-uniapp/data/posts.ts` 元数据

详情见 [`HOW_TO_ADD_POST.md`](./HOW_TO_ADD_POST.md) 和
[`CLAUDE.md`](./CLAUDE.md) 的图片处理机制段。

## 发布到生产

```powershell
# 一键 publish:build + 索引 + RSS + sitemap + 镜像到 site/
powershell -ExecutionPolicy Bypass -File scripts/publish.ps1

# 自动验证 17 项(Caddy + Playwright 端到端)
powershell -ExecutionPolicy Bypass -File scripts/diagnose-prod.ps1
```

NSSM 管理的服务会自动 serve `site/` 的最新内容,**无需重启**。
首次部署/服务管理见 [`docs/deployment.md`](./docs/deployment.md)。

## 测试

```powershell
# 前端单元测试(86+ 个)
pnpm -C frontend-uniapp test:unit

# 类型检查
pnpm -C frontend-uniapp typecheck

# 端到端 Playwright(dev:h5)
powershell -ExecutionPolicy Bypass -File scripts/diagnose.ps1

# 端到端 Playwright(生产 build + Caddy)
powershell -ExecutionPolicy Bypass -File scripts/diagnose-prod.ps1
```

## 目录结构

```
PersonalBlog/
├── frontend-uniapp/        # 主前端(Vue 3 + uni-app)
│   ├── data/posts.ts       # 文章元数据(50+ 篇)
│   ├── pages/              # 路由(index / post / tag / search)
│   ├── components/         # post-card / search-box / theme-toggle / site-header
│   ├── composables/        # markdown / search / url-encode / tags
│   ├── stores/theme.ts     # Pinia 主题 store
│   ├── static/             # posts/<...>.md, images/<...>.png(中文路径)
│   ├── scripts/            # uni-run.mjs / gen-search-index.mjs
│   └── tests/unit/         # vitest
├── configs/
│   ├── Caddyfile           # 静态托管(127.0.0.1:48080 + SPA fallback)
│   ├── cloudflared.yml.sample
│   └── cloudflared.yml     # 实际配置(gitignored)
├── scripts/
│   ├── install-binaries.ps1
│   ├── publish.ps1
│   ├── install-services.ps1 / uninstall-services.ps1
│   ├── diagnose.ps1 / diagnose-prod.ps1
│   ├── add-article.ps1 / batch-add-articles.ps1
│   └── gen-feeds.ps1
├── tools/                  # caddy/cloudflared/nssm exe(gitignored)
├── site/                   # Caddy 服务根(gitignored;publish.ps1 生成)
├── logs/                   # 服务日志(gitignored)
├── docs/
│   ├── deployment.md       # 完整部署运维手册
│   ├── migration-react-to-uniapp.md
│   └── adr/                # 架构决策记录(uniapp / Caddy / NSSM)
├── tasks/
│   ├── plan.md             # 实施计划
│   ├── todo.md             # ≤5 文件粒度任务
│   └── diagnose-prod.py    # Playwright e2e 探针
├── SPEC.md                 # 真相源(决策、风险、验收清单)
└── CLAUDE.md               # 开发笔记 + 图片处理机制
```

## License

MIT

## 评论 (giscus) 启用步骤

post 详情页底部已嵌入 giscus widget,默认渲染"评论功能尚未启用"占位。
**owner 一次性激活**(参数全是公开 id,可进 git):

1. 打开 `https://github.com/liujianjie/PersonalBlog/settings` → **General** →
   勾选 **Discussions** → 拉到底部 Save。
2. 装 giscus GitHub App:`https://github.com/apps/giscus` → **Install**,
   只授权 `liujianjie/PersonalBlog`(或全仓亦可)。
3. 打开 `https://giscus.app/zh-CN`,按提示填:
   - 仓库:`liujianjie/PersonalBlog`
   - 页面 ↔ 讨论 映射:**Discussion title contains page <specific term>**
   - 讨论分类:**General**(也可在 Discussions 下新建 `Comments` 类别)
   - 选好后页面会生成 `data-repo-id` / `data-category-id` 两个值。
4. 编辑 `frontend-uniapp/composables/giscus.ts`,把四个 `<YOUR_*>` 占位换成
   真实值(repo / repoId / category / categoryId),保存。
5. `pnpm -C frontend-uniapp test:unit`(确保 `isGiscusConfigured()` 返回 true)
   → `powershell -ExecutionPolicy Bypass -File scripts/publish.ps1`(发布)。

**验证**:浏览器打开任一 post 详情,底部能看到 giscus 评论框,GitHub 账号可登录评论。

## 反馈

- GitHub Issues: https://github.com/liujianjie/PersonalBlog/issues
- 老 React 版本(`main` 分支): https://liujianjie.github.io/PersonalBlog/
- 当前主版本(`uniapp-rewrite` 分支): https://blog.multilab.cc/
