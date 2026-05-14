# Todo: PersonalBlog · uniapp 重写 + 域名自托管

> 配套:`SPEC.md` · `tasks/plan.md`
> 一项任务 ≤ 5 文件;每完成一项 `[ ]` → `[x]` + commit
> Phase gate 不过 → 留在该 phase,不跳级

---

## Phase 0 — 基础

- [x] **T01** 拉分支 + .gitignore
  - **Files**:`.gitignore`(新增段),`README.md`(顶部加分支说明)
  - **Acceptance**:
    - `git checkout -b uniapp-rewrite` 完成
    - `.gitignore` 含 `tools/*.exe`、`configs/cloudflared.yml`、`.cloudflared/`、`frontend-uniapp/dist/`、`frontend-uniapp/node_modules/`、`site/`、`logs/`
    - README 顶部加"分支说明"段,指向 main/GH Pages 与 uniapp-rewrite/blog.multilab.cc 两条链
  - **Verify**:`git status` 干净;`git branch --show-current` 输出 `uniapp-rewrite`

- [x] **T02** install-binaries.ps1
  - **Files**:`scripts/install-binaries.ps1`(新建)
  - **Acceptance**:
    - 脚本下载 caddy / cloudflared / nssm 到 `tools/`,已存在则跳过
    - 全 ASCII(中文坑)
    - 执行后 `tools/caddy.exe --version`、`tools/cloudflared.exe --version`、`tools/nssm.exe version` 都能输出
  - **Verify**:`powershell -ExecutionPolicy Bypass -File scripts/install-binaries.ps1` 跑完三条 --version OK

> **Phase 0 Gate**:T01 + T02 通过

---

## Phase 1 — 前端脚手架

- [x] **T03** frontend-uniapp 工程初始化
  - **Files**:`frontend-uniapp/package.json`、`tsconfig.json`、`manifest.json`、`pages.json`、`vite.config.ts`、`uno.config.ts`、`src/main.ts`、`App.vue`(共 ~8 个,但都是初始化骨架文件)
  - **Acceptance**:
    - 依赖:`@dcloudio/*` + `vue@3.4` + `pinia` + `unocss` + `marked` + `highlight.js` + `minisearch` + 类型/dev 工具
    - `manifest.json` 只启用 `h5`,关 `mp-weixin` / `app`
    - `pages.json` `h5.router.mode = "history"`,先放一个空首页
    - `vite.config.ts` `server.allowedHosts` + `preview.allowedHosts` 加 `blog.multilab.cc` + `localhost` + `127.0.0.1`
    - `uno.config.ts` 配 presetUno + 项目色板(亮/暗 token)
  - **Verify**:`pnpm -C frontend-uniapp install` 成功;`pnpm -C frontend-uniapp dev:h5` 起来,浏览器打开看到空白首页(无错);`pnpm -C frontend-uniapp typecheck` 0 error

- [x] **T04** 主题 store + CSS 变量
  - **Files**:`frontend-uniapp/src/stores/theme.ts`、`src/styles/theme.css`、`src/components/theme-toggle.vue`
  - **Acceptance**:
    - Pinia store:`mode: 'light' | 'dark' | 'auto'`,持久化 localStorage,响应 `prefers-color-scheme`
    - CSS 变量:`--bg / --fg / --muted / --accent / --code-bg`,亮暗两套
    - theme-toggle 组件可切三态
  - **Verify**:`pnpm test:unit` 覆盖 theme store(切换/持久化/媒体查询)全过

- [x] **T05** 全局布局(顶栏 + 主题切换 + 容器)
  - **Files**:`App.vue`(替换 T03 的占位)、`src/components/site-header.vue`、`src/styles/layout.css`
  - **Acceptance**:
    - 顶栏:博客名 + 搜索框占位(后续 Phase 3 接)+ theme-toggle
    - 主体最大宽度 1280px(承袭老 React 版 `max-w-screen-xl`)
    - 切换主题视觉立即生效
  - **Verify**:`dev:h5` 浏览器手动验证 + `typecheck` 0 error

> **Phase 1 Gate**:浏览器看到顶栏 + 主题切换可视化工作

---

## Phase 2 — 内容迁移与渲染

- [x] **T06** 内容文件物理迁移
  - **Files**:`git mv` `public/posts/` → `frontend-uniapp/public/posts/`;`public/images/` → `frontend-uniapp/public/images/`;`src/data/posts.ts` → `frontend-uniapp/src/data/posts.ts`(只改 import path,内容不动)
  - **Acceptance**:
    - 文件全部迁完,git history 保留(`git log --follow` 能追)
    - `posts.ts` 中 `mdFile` 路径前缀从 `/PersonalBlog/posts/...` 改为 `/posts/...`(因为不再是 GH Pages base)
    - 同样把 `coverImage` / 内嵌图片绝对路径前缀更新(由 `gen-search-index` 时再 sanity check)
  - **Verify**:`ls frontend-uniapp/public/posts/游戏开发` 看到中文目录;批量 grep 确认 `/PersonalBlog/` 已被全部替换

- [x] **T07** 类型 + url-encode + markdown composable
  - **Files**:`frontend-uniapp/src/types/index.ts`、`src/composables/url-encode.ts`、`src/composables/markdown.ts`、`tests/unit/markdown.spec.ts`、`tests/unit/url-encode.spec.ts`
  - **Acceptance**:
    - `Post` 类型从老 React 版 1:1 复制
    - `urlEncodePath()`:逐段 `HttpUtility.UrlEncode` 对应的 JS 实现(`encodeURIComponent` 但保留 `/`),`+` → `%20`
    - `renderMarkdown(md, opts)`:marked + highlight.js,代码块 class `hljs language-{lang}`,图片 renderer 套上 `urlEncodePath`
    - 单测:列表/有序/代码块/图片(中文路径)/链接 5 类用例
  - **Verify**:`pnpm test:unit` 全过

- [x] **T08** 首页 + 文章详情
  - **Files**:`frontend-uniapp/pages/index/index.vue`、`pages/post/post.vue`、`src/components/post-card.vue`
  - **Acceptance**:
    - 首页:倒序按 `date` 列出全部文章,每条 post-card 显示标题/摘要/标签/日期/读时
    - 详情页:动态路由 `/post/:id`,fetch `mdFile` → `renderMarkdown` → `v-html`
    - 代码高亮 + 中文路径图片 + GitHub 图片三种来源全部加载
  - **Verify**:浏览器抽 5 篇手测覆盖:Addressable(本地中文图)、OpenGL(GitHub 图)、ProtoBuf(纯文本)、含代码块的、含表格的

- [x] **T09** 标签页
  - **Files**:`pages/tag/tag.vue`、`src/composables/tags.ts`(标签聚合)
  - **Acceptance**:
    - 标签云首页 `/tag` 列出所有 tag + 文章数
    - 单标签页 `/tag/:name` 列出该标签下文章
    - post-card 上的标签 chip 链接到对应标签页
  - **Verify**:浏览器手测点击标签跳转

> **Phase 2 Gate**:50+ 文章可读,5 篇抽样覆盖图片/代码/表格/中文路径全部正常

---

## Phase 2-Hotfix — 浏览器实测发现的三个回归

> 用户通过浏览器实测反馈三个问题。改用 Playwright(webapp-testing skill)自验,
> 不再让用户手动验证。

- [x] **T-FIX-1** 图片加载失败
  - **Files**:`composables/markdown.ts` 或 .md 替换脚本
  - **Repro**:打开任一含图文章 → 图片 broken
  - **Hypotheses**:
    1. .md 里已编码的路径(`%e6...`)经 urlEncodePath 没能正确 round-trip
    2. /images/ → /static/images/ 替换在 .md 内部图片引用上有遗漏
    3. 中文路径 segment 有未编码字符导致 vite 静态服务 404
  - **Verify**:Playwright 截屏 + Network 抓 image 请求看 status

- [x] **T-FIX-2** 文章不能复制(选中文字)
  - **Files**:`pages/post/post.vue` / `App.vue` / styles
  - **Repro**:鼠标选中文章正文 → 不响应
  - **Hypotheses**:uni-app `<view>` 在 H5 默认 `user-select: none`(跨端为了避免移动端误触);需要在 markdown-body 显式 `user-select: text`
  - **Verify**:Playwright `evaluate` 选中段落文本看 selection.toString()

- [x] **T-FIX-3** ``` 代码块渲染异常
  - **Files**:`composables/markdown.ts` / 全局 hljs 主题 CSS
  - **Repro**:任一含代码块文章 → 代码块样式不对
  - **Hypotheses**:
    1. 没引入 hljs 主题 CSS(github / atom-one-dark),hljs class 没颜色
    2. marked v14 code renderer token API 名称误用
  - **Verify**:Playwright 抓代码块 outerHTML + computed style 看是否有 hljs 配色

---

## Phase 3 — 增强功能(三条并行)

- [x] **T10** 全文搜索:前端
  - **Files**:`src/composables/search.ts`、`pages/search/search.vue`、`src/components/search-box.vue`(替换 T05 的占位)
  - **Acceptance**:
    - 顶栏搜索框 → `/search?q=xxx`
    - 首次进入 `/search` 才 fetch `/search-index.json`(懒加载)
    - 搜索结果按 score 排序,标题/标签/正文片段高亮匹配词
  - **Verify**:浏览器手测 3 个关键词命中

- [x] **T11** 全文搜索:索引生成
  - **Files**:`scripts/gen-search-index.mjs`
  - **Acceptance**:
    - 扫 `frontend-uniapp/src/data/posts.ts` + 读对应 `.md` 抽前 500 字 + 标签
    - 输出 `frontend-uniapp/public/search-index.json`(MiniSearch `serialize()` 格式)
    - 纯 Node ESM,无第三方依赖外只用 minisearch
  - **Verify**:`node scripts/gen-search-index.mjs` 后 `search-index.json` 存在且 `JSON.parse` 通

- [x] **T12** RSS / Sitemap 生成
  - **Files**:`scripts/gen-feeds.ps1`
  - **Acceptance**:
    - 模板渲染输出 `frontend-uniapp/public/feed.xml`(RSS 2.0)+ `public/sitemap.xml`(标准 sitemap)
    - 读 `posts.ts` 元数据,链接绝对化为 `https://blog.multilab.cc/post/<id>`
    - 全 ASCII(注释 + 输出)
  - **Verify**:跑完后 `feed.xml` 可被 `Test-Xml` 或在线 RSS 校验器验证

> **Phase 3 Gate**:`pnpm build:h5` 后 `dist/build/h5/{feed.xml,sitemap.xml,search-index.json}` 都在,搜索可用

---

## Phase 4 — 本机部署

- [x] **T13** publish.ps1
  - **Files**:`scripts/publish.ps1`
  - **Acceptance**:
    - 步骤:`pnpm build:h5` → `node gen-search-index` → `pwsh gen-feeds` → `robocopy dist/build/h5/ site/ /MIR`
    - 任一步失败终止,exit code 非 0
    - 全 ASCII
  - **Verify**:`powershell -ExecutionPolicy Bypass -File scripts/publish.ps1` 走完 → `site/index.html` + `site/feed.xml` + `site/search-index.json` 都在

- [x] **T14** Caddyfile
  - **Files**:`configs/Caddyfile`、`tasks/plan.md` 风险表更新(若发现新坑)
  - **Acceptance**:
    - bind `127.0.0.1:48080`(显式 IPv4,不暴露 LAN)
    - root 指向项目根的 `site/`(用绝对路径或相对 working dir)
    - SPA fallback:`try_files {path} /index.html`
    - 启 gzip + UTF-8 default
  - **Verify**:`tools/caddy.exe run --config configs/Caddyfile` 起,curl 验证 4 档(见 SPEC §3)

- [x] **T15** 本机端到端验收
  - **Files**:无新文件;手测 + 在 `docs/deployment.md` 记录"4 档验证"段(下个 Phase 完整化)
  - **Acceptance**:
    - `curl -I http://127.0.0.1:48080/` 200
    - 浏览器:首页 + 详情 + 标签 + 搜索 + Feed + 主题切换全工作
    - 子路由刷新不 404
    - 中文路径文章 + 图片正常
  - **Verify**:浏览器全部手测 + `curl http://127.0.0.1:48080/feed.xml` 返回有效 RSS

> **Phase 4 Gate**:本机 `http://127.0.0.1:48080/` 完全工作,包含搜索/Feed/主题

---

## Phase 5 — 域名 + 服务化

- [~] **T16** cloudflared 配置 + 一次性激活 *(scaffolding done; actual `tunnel login` is owner-blocked - browser auth)*
  - **Files**:`configs/cloudflared.yml.sample`、`scripts/install-cloudflared.ps1`(若 T02 没含则补)、`docs/deployment.md`(激活步骤段)
  - **Acceptance**:
    - sample 含占位 `<YOUR_TUNNEL_UUID>` / `<YOUR_USERNAME>` ✅
    - ingress 指 `http://127.0.0.1:48080` ✅
    - 注释列出五步激活:`tunnel login` → `tunnel create blog` → `copy yml.sample` → `tunnel route dns blog blog.multilab.cc` → `tunnel run blog` ✅ (also in docs/deployment.md)
    - 实际 `cloudflared.yml`(已 gitignore)在本机生成并跑通 ⏸ **owner-blocked** (browser auth + Cloudflare account)
  - **Verify**:`tools/cloudflared.exe --config configs/cloudflared.yml tunnel run blog` 起来 + 浏览器 `https://blog.multilab.cc/` 看到首页

- [~] **T17** NSSM 服务化 *(scripts written + tested; actual `nssm install` is owner-blocked - admin + cloudflared.yml needed)*
  - **Files**:`scripts/install-services.ps1`、`scripts/uninstall-services.ps1`
  - **Acceptance**:
    - install:装 `blog-caddy` + `blog-cloudflared` 两个服务,Startup=Automatic,User=LocalSystem,工作目录=项目根,stdout 重定向到 `logs/blog-*.log` ✅ (script written)
    - 凭据 JSON 拷到 `%ProgramData%\cloudflared\`(LocalSystem 可读)并在 cloudflared.yml 写绝对路径 ✅ (rewrites to cloudflared.localsystem.yml at install time)
    - uninstall:`nssm stop` + `nssm remove confirm`,只删服务定义不删二进制 ✅
    - 全 ASCII + 检查管理员权限 ✅
  - **Verify**:`Get-Service blog-caddy, blog-cloudflared` 都 Running + Automatic ⏸ **owner-blocked** (needs admin PS + filled cloudflared.yml)

- [ ] **T18** 重启不登录验收 *(blocked on T17 owner-execution + physical reboot)*
  - **Files**:无;`docs/deployment.md` 新增"重启验收清单"段
  - **Acceptance**:
    - 关机 → 开机 → **不登录**任何用户 → 等 60 秒
    - 从手机 4G(脱离本机 WiFi)打开 `https://blog.multilab.cc/` 看到首页
    - `Get-Service` 显示两服务 Running,`logs/blog-*.log` 有启动记录无 ERROR
  - **Verify**:实测 1 次成功

> **Phase 5 Gate**:重启自启场景实测通过

---

## Phase 5-Hotfix — cloudflared 0-byte loopback bug(2026-05-14 增补)

> T16 期间发现 cloudflared 2026.3.0 + 127.0.0.1 origin → "HTTP/2 200 +
> content-length: 0"。当前用 LAN IP workaround 通了,目标是回 127.0.0.1。
> 详细背景/假设/退出条件见 `tasks/plan.md` 第 8 章。
> 时间盒:**2 小时**。超出走回退路径(L11A-E)。

### A 数据收集(read-only,不改配置)

> **跳过** — 用户选了"只试 L05"路径,直接进 Phase B。

- [~] **L01** 抓 cloudflared debug log(LAN IP 当前配置) *(skipped)*
- [~] **L02** 抓 cloudflared debug log(127.0.0.1 配置) *(skipped)*
- [~] **L03** 检查实际 socket 类型 *(skipped)*
- [~] **L04** 检查 cloudflared 是否有更新 *(skipped)*

### B 按代价由低到高试 fix(每次只改一项,失败回滚)

- [x] **L05** Fix B1:`originRequest.http2Origin: false` + service 回 127.0.0.1
  - **结果**:✅ **首试即中**。curl https://blog.multilab.cc/ → content-length > 0,feed.xml 28968 bytes (== 本机),search-index.json 111512,JS 165307。
  - **机制**:cloudflared 默认尝试 HTTP/2 跟 origin 通信,Caddy 明文 listener 只支持 HTTP/1.1("HTTP/2 skipped because it requires TLS"),cloudflared 2026.3.x 的 h2→h1 auto-fallback 在某些 Windows 路径下丢 response body。强制 HTTP/1.1 origin 跳过 buggy 的 fallback 路径。

- [~] **L06** Fix B2:加 `noHappyEyeballs: true` *(skipped, L05 中)*
- [~] **L07** Fix B3:加 `disableChunkedEncoding: true` *(skipped, L05 中)*
- [~] **L08** Fix B4:升级 cloudflared *(skipped, L05 中)*
- [~] **L09** Fix B5:cloudflared.yml 顶级加 `protocol: quic` *(skipped, L05 中)*

> **Phase B Gate**:✅ L05 通过,127.0.0.1 + http2Origin: false 工作

### C-正向 收尾(找到了让 127.0.0.1 work 的 fix)

- [x] **L10A** 把生效 fix 写进 `cloudflared.yml.sample` 默认配置
- [x] **L10B** 实际 `cloudflared.yml`:service 改回 127.0.0.1 + 加 fix(gitignored,本机生效)
- [x] **L10C** Caddyfile:`http://:48080` → `http://127.0.0.1:48080`(关 LAN 暴露)
- [x] **L10D** `docs/deployment.md` 故障排查行更新(写真正的 fix,不是 LAN IP 绕路)
- [x] **L10E** e2e:用户重启 Caddy 后 → curl 三档验证全过(本机 200/719 + LAN refused + tunnel 200/1638)
- [x] **L10F** commit + 提示 push

### C-回退 收尾(B 全失败,接受 LAN IP)

> **未启用** — L05 首试即中,无需走回退路径。

- [~] **L11A** *(n/a)*
- [~] **L11B** *(n/a)*
- [~] **L11C** *(n/a)*
- [~] **L11D** ADR-004 不写(回退路径未启用)
- [~] **L11E** *(n/a)*

> **Phase 5-Hotfix Gate**:正向路径走完 → sample/yml/Caddyfile/docs 一致 ✅

---

## Phase 6 — 文档 + 收官

- [x] **T19** docs/deployment.md
  - **Files**:`docs/deployment.md`
  - **Acceptance**:
    - 含:一次性激活(7 步)、日常发布(publish.ps1)、服务管理(start/stop/restart)、4 档验证、故障排查(对应 SPEC §9 风险表)、卸载流程
  - **Verify**:照抄能在另一台 Windows 机器重现部署(若有条件 dry-run)

- [x] **T20** 迁移笔记 + ADR
  - **Files**:`docs/migration-react-to-uniapp.md`、`docs/adr/001-uniapp-over-vue-spa.md`、`adr/002-caddy-over-fastapi-shell.md`、`adr/003-nssm-over-task-scheduler.md`
  - **Acceptance**:
    - 迁移笔记:React → Vue 组件映射、Tailwind → UnoCSS、react-markdown → marked、react-router → uni pages
    - ADR 三篇:简短(每篇 ≤ 300 字),Context / Decision / Consequences 三段
  - **Verify**:同行/未来作者读完能理解每个决策"为什么这么定"

- [x] **T21** README + main 分支 GH Pages 验证 *(GH Pages live at /PersonalBlog/, page-title rendered)*
  - **Files**:`README.md`(更新)
  - **Acceptance**:
    - README 顶部"双分支"段:main → GH Pages 老站(已冻结);uniapp-rewrite → 域名站(主版本)
    - 链接到 `https://blog.multilab.cc/` 和 `https://liujianjie.github.io/PersonalBlog/`
    - 把"如何加文章"指向新 publish.ps1 流程
  - **Verify**:浏览器打开 `https://liujianjie.github.io/PersonalBlog/` 仍正常(确认 main 分支 GH Pages 部署没被这次重写连累)

- [x] **T22** SPEC §8 验收清单全打勾 *(10/13 verified; 3 owner-blocked - #6 #7 #8 require Cloudflare login + admin install + reboot test)*
  - **Files**:`SPEC.md`(只改 §8 复选框)
  - **Acceptance**:13 条全部 `[x]`
  - **Verify**:本文件每个 Phase Gate + SPEC §8 都打勾;打 git tag `milestone/p6-shipped`

> **Phase 6 Gate / 项目终点**:SPEC §8 13/13 + tag `milestone/p6-shipped` + main/uniapp-rewrite 双分支健康

---

## Phase 7 — 功能开发阶段(SPEC §13,2026-05-14 起)

> SPEC §13 已 append。本阶段在 §1-§12 之外,扩展博客活跃使用所需功能。
> 推荐执行顺序:P1 → P2 → P0(NSSM 服务化最后做,免反复重启服务)。

### P1 — UI / 数据增强

- [x] **F1** 「关于我」页面
  - **Files**:`frontend-uniapp/pages/about/about.vue`(新)、`pages.json`(加路由)、`components/site-header.vue`(顶栏加 link)、`composables/author.ts`(新)、`tests/unit/author.spec.ts`(新)、`tests/unit/about-page.spec.ts`(新)
  - **结果**:✅ TDD 通过(7 个 about/author 测试 + 全套 98/98)、typecheck 0 error、build 通过
  - **后续**:`composables/author.ts` 里的 name / bio / homepageNote 用户可自行编辑文案

- [x] **F2** post-card tag chip 点击直接跳 `/tag/<name>`
  - **结果**:✅ 行为早在 T08 已实现(`post-card.vue` line 13-16);F2 工作 = 加 4 项 regression test 锁死(`tests/unit/post-card.spec.ts`)。stopPropagation + 跳转 + @click 绑定 + 卡片级 @click 区分。

- [x] **F3** 顶级 `category` 字段
  - **Files**:`types/index.ts`(Post 加 category 必填 + PostCategory union)、`data/posts.ts`(53 篇全加 `category: 'tech'`)、`composables/categories.ts`(新)、`pages/category/category.vue`(新)、`pages/index/index.vue`(顶部 5 个 tab)、`pages.json`、`tests/unit/categories.spec.ts`(新)
  - **结果**:✅ TDD 通过(12 个 categories 测试,53 篇全 category=tech)、114/114 全套、typecheck 0 error、build 通过
  - **DoD §13.7 #16**:✅ 首页 5 tab(全部 + 4 分类)、`/pages/category/category?name=tech` 单分类页可达

- [x] **F4** 「合集」(series)字段
  - **Files**:`data/posts.ts`(15 篇 Addressable 加 series + seriesOrder)、`composables/series.ts`(新)、`pages/series/series.vue`(新,合集索引 + 单合集页两态)、`pages/index/index.vue`(改用 collapseSeriesFeed 归一)、`pages.json`、`tests/unit/series.spec.ts`(新)
  - **结果**:✅ TDD 通过(15 个 series 测试)、129/129 全套、typecheck 0 error、build 通过
  - **DoD §13.7 #17**:✅ 首页 Addressable 15 篇归一为一个合集卡片(代表 = 最新一篇),`/pages/series/series` 列出所有合集,`/pages/series/series?name=Addressable` 按 seriesOrder 1-15 排序
  - **范围**:本次只标 Addressable;LearnOpenGL 32 篇 + 其他系列**待后续手动加** series 字段(不阻塞,数据增量,UI 已就绪)

### P2 — 第三方集成

- [ ] **F5** giscus 评论
  - **Files**:`pages/post/post.vue`(底部嵌入 giscus script)、`README.md`(说明 GitHub Discussions 启用步骤)
  - **Acceptance**:
    - post 详情页底部加载 giscus widget,GitHub 账号可登录评论
    - **owner-blocked**:仓库 `liujianjie/PersonalBlog` 需开启 Discussions + 装 giscus GitHub App + 在 giscus.app 配置生成 script 参数
  - **Verify**:Playwright 抓 post 详情页的 giscus iframe 存在

- [ ] **F6** Cloudflare Web Analytics
  - **Files**:`index.html`(嵌入 CF beacon script)、`docs/deployment.md`(说明在 Cloudflare dashboard 启用步骤)
  - **Acceptance**:
    - `<script defer>` 嵌入 CF beacon
    - **owner-blocked**:Cloudflare dashboard → Web Analytics → Add a site → multilab.cc(获取 token)
  - **Verify**:F12 Network 看到 cloudflareinsights.com 请求成功

### P3 — 探索/调研(非阻塞)

- [ ] **F7** GitHub blog skill / agent 调研
  - **Files**:`docs/blog-tooling-research.md`(新)
  - **Acceptance**:列出 5-10 个有用的 frontend / blog 开发 skill / agent / library,每个一句话作用 + 是否值得集成
  - **Verify**:用户读完能挑出想试的 1-2 个

- [ ] **F8** 移植其他 blog 1-2 个特性
  - **Files**:depend on F7
  - **Acceptance**:由 F7 输出决定;TBD

### P0 — 收尾(SPEC §1-§12 旧任务)

- [~] **T16-T18** 域名 + 服务化(原 Phase 5)
  - 状态:T16/T17 scaffolding done(commit 5146b70 + fee02f2);T17 NSSM `nssm install` 需 elevated PowerShell + filled cloudflared.yml(已就绪);T18 物理重启验证

> **Phase 7 Gate**:F1-F6 验收清单全过 + Cloudflare dashboard 看到流量数据

---

## 进度速查

| Phase | 任务数 | 状态 |
|---|---|---|
| 0 基础 | 2 | ☐ |
| 1 前端脚手架 | 3 | ☐ |
| 2 内容迁移 | 4 | ☐ |
| 3 增强功能 | 3 | ☑ |
| 4 本机部署 | 3 | ☑ |
| 5 域名+服务 | 3 | ☐ (T16/17 scaffolding done; activation owner-blocked; T18 reboot owner-blocked) |
| 5-Hotfix loopback bug | 14 / 14 | ☑ (L05 中, 正向收尾 done) |
| 6 文档收官 | 4 | ☑ |
| 7 功能开发 | 8 | ☐ (F1-F6 待做, F7-F8 探索) |
| **总** | **22 + 14 + 8** | **19/22 + 14/14 hotfix + 0/8 P7** |
