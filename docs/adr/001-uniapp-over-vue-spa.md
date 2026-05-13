# ADR-001: uni-app over a plain Vue 3 SPA

Status: Accepted (2026-05-09; implemented through 2026-05-13)
Decided in: SPEC §0 / §10 row 2

## Context

The React-on-GitHub-Pages version of the blog needed a rewrite for
self-hosting under `blog.multilab.cc`. The author also maintains a
sibling project (`StockTradingAnalysis`) that uses uni-app for its
frontend. The blog itself is read-only HTML + a search box - no
small-program or app-target features are needed today. But the option
to publish a WeChat-mini-program build later was attractive (the same
content, different shell).

Three frontend candidates:
1. Plain Vue 3 SPA + Vite (no uni-app)
2. uni-app (Vue 3) with only the H5 target enabled
3. Astro / Next (static site generators)

## Decision

**uni-app with `manifest.json` enabling only `h5`**, all other
platforms (mp-weixin, app-plus, mp-alipay, ...) explicitly disabled.

## Consequences

Positive:
- Stack parity with sibling project; the author can context-switch
  without reloading mental models.
- Future "ship a mini-program" becomes a `manifest.json` toggle, not a
  rewrite.
- `pages.json`-driven routing is simpler than wiring react-router or
  vue-router by hand for a content site.

Negative:
- uni-app forces a specific URL shape (`/pages/<group>/<page>?id=12`
  instead of `/post/12`). Search-engine-friendly URLs would have been
  cleaner with a plain Vue SPA + custom router.
- The build pipeline lives behind `@dcloudio/vite-plugin-uni`, which
  occasionally changes shape between alpha versions; we pinned to one
  alpha. Upgrades will need attention.
- A plain Vue 3 SPA would have been ~30% smaller in initial bundle
  (no uni-app runtime). For 50+ articles read once each, this is fine,
  but it's a tax we accept.

What we'd reconsider:
- If a year passes without small-program publishing, switch to plain
  Vue 3 SPA on the next major upgrade and recover the bundle savings.
- If the uni-app alpha churn becomes a maintenance problem before
  then, switch sooner.
