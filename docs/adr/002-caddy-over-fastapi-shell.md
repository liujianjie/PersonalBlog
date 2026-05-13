# ADR-002: Caddy over a FastAPI shell for static hosting

Status: Accepted (2026-05-09)
Decided in: SPEC §0 / §2

## Context

The blog is a fully static site (HTML + assets + RSS/sitemap/search
JSON). The sibling project, `StockTradingAnalysis`, uses an "FastAPI
shell" pattern: a tiny Python server mounts the SPA build at `/` and
exposes `/api/*` for live data. The author considered four options for
the blog:

1. Plain Caddy (single binary, static-first)
2. FastAPI shell (mirror sibling pattern)
3. Node `serve` / `http-server`
4. IIS

## Decision

**Caddy v2** as the only static host, configured by `configs/Caddyfile`.

## Consequences

Positive:
- Zero runtime dependencies. One Windows binary, ~40 MB. No Python,
  Node, or .NET to install or update.
- Built-in SPA history fallback (`try_files {path} /index.html`),
  gzip + zstd encoding, MIME detection that handles UTF-8 paths
  correctly on Windows. We needed all three.
- Caddyfile reads cleanly to non-experts. Adding a new asset path or a
  redirect later is one line.
- Plays nicely with NSSM (T17): single exe + single config = simple
  service definition.

Negative:
- Diverges from the sibling project's deployment pattern. If a future
  feature needs an `/api/*` endpoint, the answer is no longer "edit
  the Python that's already there"; we'd add a separate process or
  switch to the shell pattern. SPEC §7 lists "add backend" as
  "ask first" precisely for this reason.
- Caddy v2 has its own learning curve - especially around matchers
  (`@named`) and directive ordering. T14 burned an hour on a single
  trap: combining `@matcher path /static/* /assets/*` with
  `try_files` returns 200 with a corrupted Content-Type. Two separate
  `handle` blocks works. The Caddyfile comments document the trap.

What we'd reconsider:
- If we ever need server-side functionality (auth, comments, dynamic
  feeds, image proxying), revisit and likely add a sidecar service
  (Python or Go) reverse-proxied through Caddy - rather than replace
  Caddy with a heavier stack.
