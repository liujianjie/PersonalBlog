# Plan: PersonalBlog · uniapp 重写 + 域名自托管

> 配套文件:`SPEC.md`(真相源)· `tasks/todo.md`(可执行清单)
> 创建于 2026-05-09 · 工作流 = `agent-skills` 系列

---

## 0. 元信息

- **目标分支**:`uniapp-rewrite`(从 `main` 拉)
- **不动**:`main` 分支 + GH Pages 老站(作为回退)
- **开发机**:Windows 10 + PowerShell 5.x + Git Bash
- **关键约束**:
  - 端口 `127.0.0.1:48080`(避 8080)
  - PowerShell 脚本纯 ASCII(中文乱码 + backtick 失效 双坑)
  - 凭据 / 二进制 不入 git
  - 域名 `blog.multilab.cc`(根域已托管 Cloudflare)

---

## 1. 依赖图

```
                    ┌─────────────────────┐
                    │ Phase 0  基础       │
                    │  分支 + 二进制      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Phase 1  前端脚手架 │
                    │  工程 + 主题 + 布局 │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Phase 2  内容迁移   │
                    │  文章 + Markdown    │  ← 本阶段末:**有可读博客**
                    │  + 列表/详情/标签   │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
     ┌────────────┐  ┌────────────────┐  ┌──────────────┐
     │ Phase 3a   │  │ Phase 3b       │  │ Phase 3c     │
     │ 全文搜索   │  │ RSS / Sitemap  │  │ search-index │
     └────────────┘  └────────────────┘  └──────────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Phase 4  本机部署   │
                    │  publish + Caddy    │  ← 本阶段末:**127.0.0.1:48080 通**
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Phase 5  域名+服务  │
                    │  cloudflared + NSSM │  ← 本阶段末:**域名通 + 重启自启**
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Phase 6  文档+收官  │
                    │  ADR + README       │
                    └─────────────────────┘
```

垂直切片原则:每个 Phase 末尾产出**用户可观测**的成果(可读、可访问、可订阅、可重启),不留半成品。

---

## 2. 阶段 Checkpoint

| Phase | Gate(必须通过才进下一阶段) | 验证命令 |
|---|---|---|
| 0 | 新分支 commit 干净 + `tools/{caddy,cloudflared,nssm}.exe --version` 全 OK | `git branch --show-current` 显示 `uniapp-rewrite` |
| 1 | `pnpm -C frontend-uniapp dev:h5` 起来,浏览器看到顶栏 + 主题切换工作 | 手动 + `vue-tsc --noEmit` 0 error |
| 2 | 50+ 文章列表/详情/标签可点击;Markdown + 代码块 + 中文路径图片 + GitHub 图片全部正常 | 手动抽 5 篇覆盖不同图片源 |
| 3 | 搜索框输入命中文章;`/feed.xml` `/sitemap.xml` `/search-index.json` 在 build 产物中 | `pnpm test:unit` 全过;build 后 `ls dist/build/h5/{feed.xml,sitemap.xml,search-index.json}` 存在 |
| 4 | `curl -I http://127.0.0.1:48080/` 200;子路由刷新不 404;主题/搜索/Feed 全工作 | §3-§4 命令逐档通过 |
| 5 | `https://blog.multilab.cc/` 可访问;**重启不登录**等 60s 后远端仍可访问 | 重启实测;`Get-Service blog-*` 均 Running |
| 6 | SPEC §8 验收清单 13 条全打勾;`docs/deployment.md` 可让别人照抄部署 | 同事 / 另一台机 dry-run |

**任何 gate 不过 → 留在该阶段修,不许跳级。**

---

## 3. 风险与缓解(实施期)

复用 SPEC §9。补充以下"实施期"特化风险:

| 风险 | 何时出现 | 缓解 |
|---|---|---|
| uniapp 默认 Vite 配置不识别 UnoCSS preset | Phase 1 | 参考 `unocss/preset-uni-app` 或在 vite.config.ts 显式 `Uno()` 在 `uni()` 之前 |
| `marked` 渲染图片相对路径不带 base 前缀 | Phase 2 | composable 里包一层 image renderer 强制 prefix(沿用老 React 版思路) |
| 中文路径在 `vite preview`/Caddy 行为不一致 | Phase 2-4 | Phase 2 末尾增加"Caddy mock 验证"小测:用 `caddy file-server` 临时跑一下 dist/build/h5,确认中文路径 200 |
| 重启后 cloudflared 服务起来但拿不到凭据 | Phase 5 | install-services.ps1 写 LocalSystem 时,把凭据 JSON 显式拷到 `%ProgramData%\cloudflared\` 并在 `cloudflared.yml` 用绝对路径 |
| pnpm build:h5 找错产物路径(扁平 vs unpackage 老路径) | Phase 4 | publish.ps1 显式 `dist/build/h5/`,不依赖默认猜测(参考兄弟项目部署问答 Q10) |
| `posts.ts` 1095 行迁移过程出现"半迁完一半"的中间态 | Phase 2 | 直接 `git mv src/data/posts.ts frontend-uniapp/src/data/posts.ts`,只改 import 路径,内容不动;一次性 commit |

---

## 4. 与 SPEC 的映射

| Phase | SPEC § | 验收映射 |
|---|---|---|
| 0 | §0, §4 | §1.3 第 1 条 |
| 1 | §2, §5 | §1.3 第 2 条 + 第 10 条(主题) |
| 2 | §1.3 第 3 条 | §1.3 第 3 条 |
| 3 | §1.3 第 11/12 条 + §2 静态产物增强 | §1.3 第 4/11/12 条 |
| 4 | §3, §9 | §1.3 第 4/5 条 |
| 5 | §3 一次性激活 + §2 隧道/服务化 | §1.3 第 6/7/8 条 |
| 6 | §1.3 第 9/13 条 + §11 | §1.3 第 9/13 条 |

---

## 5. 不在本计划范围

明确**不做**(避免范围蔓延):

- 评论 / 登录 / 用户系统(SPEC §7 Never)
- 后端 API / 数据库(SPEC §7 Ask First)
- 小程序 / App 输出(SPEC §10 决策 2;以后启用)
- 第三方统计 / Analytics
- AI 摘要 / 标签自动生成
- 图片仓库 `liujianjie/Image` 本地化(SPEC §9 风险:中长期事;本期不并入)
- master 分支重构 / GH Pages 优化

如某项后来变成必要,**先回 SPEC 改**,再改本 plan,不在执行中临时塞。

---

## 6. 工作节奏建议

- 每个 Phase 一次 commit(或多次小 commit,但 Phase 末 squash 不强求)
- Phase 间打 tag:`milestone/p0-baseline`、`milestone/p2-readable`、`milestone/p4-localhost`、`milestone/p5-domain-live`
- 不开 PR(单人项目,直接在 `uniapp-rewrite` 推);最后一次性合 main 还是保持双分支由作者决定(默认**保持双分支**:`main` 老 React + GH Pages,`uniapp-rewrite` 新版 + 域名)

---

## 7. 下一步

进入 `agent-skills:planning-and-task-breakdown` → `tasks/todo.md`(已生成)。

按 todo 顺序执行,每完成一个 task 把 `[ ]` 改 `[x]` 并 commit;Phase gate 不过则在该 Phase 内补任务。

---

## 8. Phase 5-Hotfix — cloudflared 0-byte loopback bug(2026-05-14 增补)

### 8.1 背景

T16 期间发现:`cloudflared 2026.3.0` + `service: http://127.0.0.1:48080`
+ Caddy 明文 origin → tunnel 返回 `HTTP/2 200 + content-length: 0`,而
`curl http://127.0.0.1:48080/` 直接命中 Caddy 是正常 719 字节。

当前用 `service: http://<LAN_IP>:48080` workaround 通了,但带来:
- LAN 内任何设备能直连 Caddy,绕过 Cloudflare HTTPS
- DHCP 改 IP 配置失效

本 hotfix 目标:**让 service 回到 127.0.0.1**(官方推荐做法)。

### 8.2 已知事实(调研产出)

- **官方推荐**:[Cloudflare Tunnel local-management config](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/local-management/configuration-file/) 所有示例都是 `localhost:port` / `127.0.0.1:port`,**不是公网 IP**
- **公网 IP 不能用**:违背 tunnel 设计 + 你家未必有真公网 IP + 多跳 NAT
- **GitHub 已知类似 issue**:[#1641 gRPC stripped](https://github.com/cloudflare/cloudflared/issues/1641)、[#1505 Home Assistant invalid](https://github.com/cloudflare/cloudflared/issues/1505),都未公开 fix
- **兄弟项目 StockTradingAnalysis 同样问题**:sample 写 127.0.0.1,实际配置也用 LAN IP→ **不是 Caddy 特定 bug,是 cloudflared on Windows 通病**
- 当前环境:cloudflared 2026.3.0、Caddy v2 latest、Win10 19045

### 8.3 假设与对应 fix(按置信度)

| # | 假设 | 对应 fix |
|---|---|---|
| H1 | cloudflared 默认走 HTTP/2 跟 origin,Caddy 明文只 H1,降级有 bug | `originRequest.http2Origin: false` |
| H2 | Windows happy-eyeballs:::1 抢先但握手失败 | `originRequest.noHappyEyeballs: true` |
| H3 | chunked encoding 协商不合 | `originRequest.disableChunkedEncoding: true` |
| H4 | 2026.3.0 特定 bug,新版本修了 | 升级 cloudflared |
| H5 | tunnel protocol 路径有 bug | 改 `protocol: quic` |

### 8.4 阶段依赖

```
A 数据收集(read-only)→ B 按代价试 fix → C 收尾(正向 or 回退)
```

### 8.5 Checkpoint

| Phase | Gate |
|---|---|
| A | 抓到 cloudflared `--loglevel debug` 日志、对比 LAN IP vs 127.0.0.1 两份 |
| B | service 回 127.0.0.1 + 某 originRequest 配置 → curl 非 0 字节 |
| C-正向 | sample/yml/Caddyfile/docs 一致;e2e 17/17;commit |
| C-回退 | LAN IP 正式 documented + 写 ADR-004 + sample 默认 LAN IP |

### 8.6 退出条件

**首选**:127.0.0.1 + 最小 originRequest 工作,Caddy 也回 loopback only,LAN 不可达。
**回退**:全 fix 失败,接受 LAN IP 为本项目标准,写 ADR 解释。

### 8.7 时间盒

最多 **2 小时**。超出走回退路径。

详见 `tasks/todo.md` Phase 5-Hotfix 段。
