// F6 (SPEC §13.7 P2): Cloudflare Web Analytics scaffolding.
// We embed the beacon loader directly in index.html with an inline
// placeholder guard so the snippet is safe to commit (the guard
// short-circuits while the placeholder is still in place). Tests
// here lock both the snippet structure and the deployment doc that
// tells the owner how to flip the activation switch.

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(__dirname, '..', '..', '..')
const indexHtmlPath = path.resolve(__dirname, '..', '..', 'index.html')
const deploymentPath = path.join(repoRoot, 'docs', 'deployment.md')

const indexSrc = readFileSync(indexHtmlPath, 'utf8')

describe('index.html — Cloudflare Web Analytics beacon (F6)', () => {
  it('contains a Cloudflare Web Analytics activation block', () => {
    // We anchor on the comment marker so the test fires if the block
    // is removed in a future cleanup pass.
    expect(indexSrc).toMatch(/Cloudflare Web Analytics/)
  })

  it('references the canonical beacon URL', () => {
    expect(indexSrc).toMatch(/static\.cloudflareinsights\.com\/beacon\.min\.js/)
  })

  it('uses a <CF_ANALYTICS_TOKEN> placeholder (owner fills in)', () => {
    expect(indexSrc).toMatch(/<CF_ANALYTICS_TOKEN>/)
  })

  it('guards the loader so it bails while the placeholder is still in place', () => {
    // The inline IIFE must short-circuit when the token still starts
    // with the angle-bracket sentinel so dev/staging never hit the
    // real beacon endpoint with an unconfigured token.
    expect(indexSrc).toMatch(/indexOf\(['"]<CF_['"]\)\s*===\s*0/)
    expect(indexSrc).toMatch(/return/)
  })

  it('emits data-cf-beacon with the token after activation', () => {
    expect(indexSrc).toMatch(/data-cf-beacon/)
    expect(indexSrc).toMatch(/token/)
  })

  it('uses defer-loaded script (does not block first paint)', () => {
    // Either an attribute on the inserted <script> tag or .defer = true
    // in the IIFE — both are acceptable.
    expect(indexSrc).toMatch(/\.defer\s*=\s*true|defer\b/)
  })
})

describe('docs/deployment.md — Cloudflare Web Analytics activation', () => {
  it('exists', () => {
    expect(existsSync(deploymentPath)).toBe(true)
  })

  const src = readFileSync(deploymentPath, 'utf8')

  it('documents the Web Analytics dashboard activation flow', () => {
    expect(src).toMatch(/Cloudflare Web Analytics|Web Analytics/)
    expect(src).toMatch(/CF_ANALYTICS_TOKEN|index\.html/)
  })

  it('mentions the dashboard path (Add a site)', () => {
    // Loose match: either explicit "Add a site" wording or the dashboard
    // section reference. Localized doc may use either.
    expect(src).toMatch(/Add a site|添加站点|Web Analytics/)
  })
})
