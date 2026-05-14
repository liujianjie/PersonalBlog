# Blog 工具调研(F7 / SPEC §13.7 P3)

> 目的:盘点对 `blog.multilab.cc`(uni-app + Vue 3 + Caddy + Cloudflare Tunnel
> 自托管)有潜在价值的 skill / agent / library。每条给一句话 + 集成成本 + **是否
> 值得做**。挑 1-2 个进 F8 试做。
>
> 评估角度:**集成成本**(改几个文件 / 改架构)、**收益**(对读者还是
> 对作者)、**与现栈兼容**(Vue 3 / Vite 5 / 原生 H5,不是 Astro/Next)。
>
> 评分:✅ 推荐 · 🟡 可试 · ❌ 不推

---

## A. 阅读体验(对读者直接可见)

### A1. Pagefind ✅
**一句话**:Rust 生成的纯静态全文搜索索引,客户端 JS 库读取分片索引,
任何静态站可用。
**对比现状**:本项目已用 MiniSearch + 自建 `gen-search-index.mjs`
(单 JSON,~110 KB),命中率/排序够用。
**集成成本**:中。要换索引生成 + 替换 `composables/search.ts`。
**收益**:索引按 chunk 懒加载,文章数 100+ 后比 MiniSearch 全量加载更省。
**结论**:🟡 可试。当前 53 篇还撑得住 MiniSearch;文章数到 200+ 再切。

### A2. KaTeX(`marked-katex-extension`) ✅
**一句话**:Markdown 内 `$x^2$` 实时渲染 LaTeX。
**对比现状**:本项目走 marked 链路,加扩展 + CSS 即可,~10 行代码。
**集成成本**:低。`composables/markdown.ts` 加 `marked.use(katex())`
+ 引 `katex.min.css`。
**收益**:OpenGL/图形学/物理引擎笔记里大量数学公式,目前只能截图。
**结论**:✅ **强推**。F8 候选 #1。

### A3. Mermaid 流程图(`mermaid` lib) 🟡
**一句话**:` ```mermaid` 代码块渲染流程图 / 时序图 / 类图。
**对比现状**:博文里手画 ASCII 图 / 截 draw.io 图。
**集成成本**:中。需要在 `markdown.ts` hook 代码块 token,延迟初始化
mermaid(SSR 不友好,得在 mount 后扫描 DOM)。
**收益**:技术博客有时画引擎架构图、ECS 数据流。
**结论**:🟡 可试,但权衡画一次和写一次的成本,Excalidraw 截图更快。

### A4. View Transitions API(原生) 🟡
**一句话**:浏览器原生页面过渡动画,SPA 切换文章时丝滑滚动到新页。
**对比现状**:uni-app 默认无过渡。
**集成成本**:低。Vue 3 + Chrome 111+ 直接 `document.startViewTransition`。
**收益**:观感升级,但 Safari/Firefox 支持还参差。
**结论**:🟡 等浏览器普及度更高再做。

### A5. Lazy-load 图片 + LQIP 占位 🟡
**一句话**:图片标签加 `loading="lazy"` + 低质量缩略图占位避免布局抖动。
**对比现状**:`composables/markdown.ts` image renderer 没加 loading 属性。
**集成成本**:极低(给 marked image renderer 加 `loading="lazy"
decoding="async"`)。
**收益**:首屏更快,中文路径长文章图片多时尤其明显。
**结论**:✅ **强推**。F8 候选 #2(改 5 行)。

---

## B. 作者工作流(对维护者)

### B1. agent-skills:webapp-testing ✅(已部分用)
**一句话**:Claude 用 Playwright 起浏览器跑 e2e 探针。
**对比现状**:本项目已有 `scripts/diagnose-prod.ps1`(17 探针)。
**集成成本**:0。
**收益**:大改 UI 后能让 agent 自验,不必手测。
**结论**:✅ 已用,继续用。

### B2. agent-skills:frontend-ui-engineering 🟡
**一句话**:用产品级标准生成 UI(字号/留白/对比度/响应式)。
**对比现状**:当前样式手写,符合简洁路线。
**集成成本**:0(skill 调用)。
**收益**:重做首页/about 页时可一次拉到位。
**结论**:🟡 下次大改 UI 时调用。

### B3. agent-skills:source-driven-development 🟡
**一句话**:每个实现决策必须 cite 官方文档,避免过期 API。
**对比现状**:用户已走"先 spec/plan 再 code"的 TDD 流。
**集成成本**:0。
**收益**:对接 Cloudflare API / NSSM / cloudflared 配置时减少 hallucination。
**结论**:🟡 部署/集成类任务时启用。

### B4. Lighthouse CI 本地化 🟡
**一句话**:CI 上跑 Lighthouse,性能/可访问性/SEO 分数低于阈值就失败。
**对比现状**:无 CI(自托管,无 GH Actions 触发链)。
**集成成本**:中。要在 `scripts/diagnose-prod.ps1` 后接 lighthouse 探针。
**收益**:防性能回归。
**结论**:🟡 当下不急,等访问量起来后做。

### B5. `marked-shiki` (替换 highlight.js) ❌
**一句话**:VSCode 同源高亮器,Shiki 渲染更精细。
**对比现状**:hljs 已 work(T-FIX-3 修过),github.css 已 ship。
**集成成本**:低,但要重新选主题、确认中文/Unicode 不破坏。
**收益**:边际(读者基本看不出 hljs vs shiki)。
**结论**:❌ 不值得换。

---

## C. 内容/SEO

### C1. RSS 全文 vs 摘要 🟡
**一句话**:`scripts/gen-feeds.ps1` 当前只塞 excerpt;改成全文 RSS 让阅读器
直接渲染。
**对比现状**:摘要式 feed.xml。
**集成成本**:低(改 PowerShell 模板,把 .md 内容 escape 成 CDATA 塞进
`<content:encoded>`)。
**收益**:重度 RSS 用户体验上升。
**结论**:🟡 可做。要确认 RSS 阅读器的 Markdown/HTML 兼容性。

### C2. Open Graph + Twitter Card meta 注入 ✅
**一句话**:每篇文章的 `<head>` 注入 og:title/og:image/og:description,链接
分享到微信/Twitter/Discord 出卡片。
**对比现状**:`index.html` 静态 meta,不随文章变。
**集成成本**:中。SPA 要在 post 详情页 mount 时改 `document.head`,build
时也得为各篇生成静态 fallback(prerender 或 html template)。
**收益**:链接被分享时观感大改。
**结论**:✅ **推荐**。F8 候选 #3(但比 #1/#2 复杂)。

### C3. JSON-LD `BlogPosting` schema 🟡
**一句话**:`<script type="application/ld+json">` 注入结构化数据,Google
搜索结果带富片段。
**集成成本**:低(post.vue 加一段)。
**收益**:SEO 边际(站点流量小时看不出区别)。
**结论**:🟡 流量起来再做。

---

## D. 已用 / 已 ship(列出避免重复调研)

- **giscus**(F5 已 scaffolding)— GitHub Discussions 评论
- **Cloudflare Web Analytics**(F6 已 scaffolding)— 站点分析
- **highlight.js**(T08 / T-FIX-3)— 代码高亮
- **MiniSearch**(T10/T11)— 全文搜索
- **marked**(T07)— Markdown 渲染

---

## E. 推荐优先级(F8 选取)

按 **收益/成本** 倒序:

| 优先级 | 项目 | 理由 |
|---|---|---|
| 1 | A2 KaTeX | OpenGL/图形学/物理学公式刚需,~10 行 |
| 2 | A5 Lazy-load 图片 | 5 行改动,首屏可见提速 |
| 3 | C2 OG / Twitter Card | 分享体验大改,但 SPA prerender 是中等工作量 |

**F8 建议范围**:做 #1(KaTeX)+ #2(lazy-load),都属于 markdown
composable 内部小改;#3(OG)留给 F9/独立任务。

---

*作者读完按"想试 1-2 个"取舍 → 把决定写进 `tasks/todo.md` 的 F8 acceptance 段。*
