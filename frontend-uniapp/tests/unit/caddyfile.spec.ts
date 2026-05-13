// Structural test for configs/Caddyfile.
// Behavioral verification (start Caddy, curl endpoints) is done as part of
// T15 end-to-end. This spec just guards the contract.

import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(__dirname, '..', '..', '..')
const caddyfilePath = path.join(repoRoot, 'configs', 'Caddyfile')

describe('configs/Caddyfile', () => {
  it('exists', () => {
    expect(existsSync(caddyfilePath)).toBe(true)
  })

  const src = existsSync(caddyfilePath) ? readFileSync(caddyfilePath, 'utf8') : ''

  it('binds explicit IPv4 127.0.0.1:48080 (avoids ::1 trap, avoids 8080)', () => {
    // Site address block must contain 127.0.0.1:48080.
    expect(src).toMatch(/127\.0\.0\.1:48080/)
    expect(src).not.toMatch(/(?:^|\s):8080\b/m)
  })

  it('serves the site/ directory (relative path resolved from working dir)', () => {
    // root directive should reference site/ (with or without ./ prefix).
    // Caddy v2 root syntax: `root * <path>`.
    expect(src).toMatch(/root\s+\*\s+\.?\/?site\b/)
  })

  it('configures SPA fallback (try_files {path} /index.html)', () => {
    // Caddy v2 SPA pattern: `try_files {path} /index.html` followed by file_server.
    expect(src).toMatch(/try_files\s+\{path\}\s+\/index\.html/)
  })

  it('enables gzip compression', () => {
    // Caddy v2: `encode gzip` (or `encode zstd gzip`).
    expect(src).toMatch(/^\s*encode(?=\s)[^#\n]*\bgzip\b/m)
  })

  it('sets UTF-8 charset for text responses', () => {
    // Either explicit `Content-Type ...; charset=utf-8` header or a
    // `header /... Content-Type ... utf-8` directive. Caddy auto-detects
    // many MIME types, but we make UTF-8 explicit for HTML/XML/JSON
    // (RSS feed + sitemap rely on this).
    expect(src).toMatch(/charset[=\s]?utf-?8/i)
  })

  it('serves the static files (file_server directive)', () => {
    expect(src).toMatch(/^\s*file_server\b/m)
  })

  it('writes access logs to logs/ (so service-mode debugging is possible)', () => {
    // Should send access log to logs/blog-caddy-access.log or similar.
    expect(src).toMatch(/^\s*log\b/m)
    expect(src).toMatch(/logs[\\\/]/)
  })
})
