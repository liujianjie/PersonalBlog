// Structural test for configs/cloudflared.yml.sample.
// Real cloudflared.yml is gitignored (contains UUID + credentials path);
// this guards the *template* shape so the activation flow stays valid.

import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(__dirname, '..', '..', '..')
const samplePath = path.join(repoRoot, 'configs', 'cloudflared.yml.sample')

describe('configs/cloudflared.yml.sample', () => {
  it('exists', () => {
    expect(existsSync(samplePath)).toBe(true)
  })

  const src = existsSync(samplePath) ? readFileSync(samplePath, 'utf8') : ''

  it('keeps placeholders so a stray commit cannot leak credentials', () => {
    expect(src).toMatch(/<YOUR_TUNNEL_UUID>/)
    expect(src).toMatch(/<YOUR_USERNAME>/)
    // No real-looking UUID committed by accident.
    expect(src).not.toMatch(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i)
  })

  it('points ingress at Caddy on http://127.0.0.1:48080', () => {
    expect(src).toMatch(/service:\s*http:\/\/127\.0\.0\.1:48080/)
  })

  it('binds blog.multilab.cc as the public hostname', () => {
    expect(src).toMatch(/hostname:\s*blog\.multilab\.cc/)
  })

  it('catches all other hostnames with a 404 (no accidental open relay)', () => {
    expect(src).toMatch(/service:\s*http_status:404/)
  })

  it('documents the 5-step activation flow', () => {
    // The activation comments must mention each command so anyone copying
    // this file to a fresh machine can follow it. Order matters but the
    // test just checks presence (order test would be brittle to comment
    // edits).
    expect(src).toMatch(/tunnel\s+login/)
    expect(src).toMatch(/tunnel\s+create\s+blog/)
    expect(src).toMatch(/tunnel\s+route\s+dns\s+blog\s+blog\.multilab\.cc/)
    expect(src).toMatch(/tunnel\s+run\s+blog/)
  })
})
