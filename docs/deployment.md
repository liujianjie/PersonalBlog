# Deployment

> Living doc. Phase 4 (T15) lays the local-deploy foundation; Phase 5 will
> add tunnel + Windows service activation, Phase 6 the full runbook.

## 4-tier local verification (Phase 4 / T15)

After running `scripts/publish.ps1` and starting Caddy
(`tools\caddy.exe run --config configs\Caddyfile`), validate in this order.
Each tier diagnoses a different failure mode; if tier N fails, you don't
need to check tier N+1 until N is fixed.

### Tier A - Caddy is alive (process + port bind)

```powershell
# Curl the listener; expect HTTP/1.1 200
curl.exe -I http://127.0.0.1:48080/
```

If this returns "Connection refused": Caddy isn't bound. Check
`logs/blog-caddy-access.log` and your Caddyfile validity
(`tools\caddy.exe validate --config configs\Caddyfile`).

### Tier B - site/ is populated (publish.ps1 ran)

```powershell
# Static-asset checks
curl.exe -I http://127.0.0.1:48080/static/feed.xml
curl.exe -I http://127.0.0.1:48080/static/sitemap.xml
curl.exe -I http://127.0.0.1:48080/static/search-index.json

# All three must return 200. The build copied from
# frontend-uniapp/dist/build/h5/ -> site/.
```

If 404: re-run `scripts/publish.ps1`.

### Tier C - SPA routing works (browser end-to-end)

```powershell
# One-shot Playwright probe (boots Caddy, runs full suite, tears down).
powershell -ExecutionPolicy Bypass -File scripts/diagnose-prod.ps1
```

Validates 17 checks across HTTP, RSS validity, and browser behavior:
post cards render, post detail loads, sub-route refresh works (SPA
fallback), tag page renders, search returns hits, theme toggle cycles
modes, and Chinese-path images load. Expect "17/17 passed".

If a check fails, screenshots are saved to `G:/tmp/blog-diag-prod/`.

### Tier D - Tunnel works (Phase 5, not yet wired)

```powershell
# Will be: tools\cloudflared.exe --config configs\cloudflared.yml tunnel run blog
# Then: open https://blog.multilab.cc/ in a browser away from this LAN.
```

## Daily publish flow

```powershell
# Build + generate feeds + mirror to site/
powershell -ExecutionPolicy Bypass -File scripts/publish.ps1

# Caddy serves site/ live; no restart needed (file_server reads on every
# request). For the NSSM-managed services case (Phase 5), still no
# restart - just publish.
```

## Files in this layout

- `configs/Caddyfile` - Caddy config; binds http://127.0.0.1:48080
- `site/` - Caddy's serving root (gitignored); produced by publish.ps1
- `tools/caddy.exe` - Caddy v2 binary (gitignored; install-binaries.ps1)
- `logs/blog-caddy-access.log` - JSON access log

## Troubleshooting cheatsheet

| Symptom | Likely cause | Fix |
|---|---|---|
| `curl -I /` returns "Connection refused" | Caddy not running | Start `tools\caddy.exe run --config configs\Caddyfile` |
| `curl -I /` returns 400 "HTTP request to HTTPS" | Caddyfile missing `http://` scheme on site address | Already fixed in committed file; check you haven't reverted |
| `/static/feed.xml` returns 404 | publish.ps1 didn't run | Re-run `scripts/publish.ps1` |
| `/post/12` returns 404 | SPA fallback not configured | Check Caddyfile has the catch-all `handle { try_files ... }` |
| `/static/missing-foo.png` returns 200 with HTML body | SPA fallback too greedy (matches /static/*) | Check Caddyfile has separate `handle /static/*` block |
| Chinese-path image 404 | URL not encoded in <img src> | Check `composables/url-encode.ts` runs in markdown renderer |
