// Structural test for NSSM service install/uninstall scripts (T17).
// Cannot run them in CI (needs admin + real cloudflared.yml + actually
// changes Windows service state). Test guards the script shape so the
// install behavior stays correct on first owner-run.

import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(__dirname, '..', '..', '..')
const installPath = path.join(repoRoot, 'scripts', 'install-services.ps1')
const uninstallPath = path.join(repoRoot, 'scripts', 'uninstall-services.ps1')

function isAscii(s: string): boolean {
  return [...s].every(c => c.charCodeAt(0) <= 127)
}

describe('scripts/install-services.ps1', () => {
  it('exists', () => {
    expect(existsSync(installPath)).toBe(true)
  })

  const src = existsSync(installPath) ? readFileSync(installPath, 'utf8') : ''

  it('is pure ASCII (Windows PS 5.x ANSI parse trap)', () => {
    expect(isAscii(src)).toBe(true)
  })

  it('checks for admin privileges before running', () => {
    // Common patterns: WindowsPrincipal + IsInRole, or ELEVATED check.
    expect(src).toMatch(/Administrator|IsInRole|RunAsAdministrator|elevated/i)
  })

  it('fails fast on errors', () => {
    expect(src).toMatch(/\$ErrorActionPreference\s*=\s*'Stop'/)
  })

  it('installs both services with the canonical names', () => {
    expect(src).toMatch(/blog-caddy/)
    expect(src).toMatch(/blog-cloudflared/)
  })

  it('uses NSSM install + set commands', () => {
    expect(src).toMatch(/nssm[^\n]*install/)
    expect(src).toMatch(/nssm[^\n]*set/)
  })

  it('configures Automatic startup', () => {
    expect(src).toMatch(/Start\s+SERVICE_AUTO_START|AutomaticStartup|set\s+\S+\s+Start\s+/i)
  })

  it('runs services as LocalSystem (no user-login dependency)', () => {
    expect(src).toMatch(/LocalSystem|ObjectName/i)
  })

  it('redirects stdout/stderr to logs/blog-*.log', () => {
    expect(src).toMatch(/AppStdout/)
    expect(src).toMatch(/AppStderr/)
    // Path is composed via Join-Path $logsDir 'blog-...log'; check both
    // pieces are present rather than a single literal slash join.
    expect(src).toMatch(/\$logsDir|logs[\\\/]/)
    expect(src).toMatch(/'blog-caddy\.(out|err)\.log'/)
    expect(src).toMatch(/'blog-cloudflared\.(out|err)\.log'/)
  })

  it('sets the working directory to the repo root', () => {
    expect(src).toMatch(/AppDirectory/)
  })

  it('copies cloudflared credentials to ProgramData (LocalSystem-readable)', () => {
    // LocalSystem cannot read %USERPROFILE%\.cloudflared\ - the credentials
    // JSON must move to %ProgramData%\cloudflared\.
    expect(src).toMatch(/ProgramData/)
    expect(src).toMatch(/cloudflared/)
  })

  it('rewrites cloudflared.yml credentials-file to the new ProgramData path', () => {
    // Either by emitting a LocalSystem-specific yml or by patching the path.
    expect(src).toMatch(/credentials-file/)
  })

  it('checks that prerequisite binaries + configs exist before installing', () => {
    expect(src).toMatch(/(caddy\.exe|tools[\\\/]caddy)/)
    expect(src).toMatch(/(cloudflared\.exe|tools[\\\/]cloudflared)/)
    expect(src).toMatch(/(nssm\.exe|tools[\\\/]nssm)/)
    expect(src).toMatch(/(Caddyfile|configs[\\\/]Caddyfile)/)
    expect(src).toMatch(/(cloudflared\.yml|configs[\\\/]cloudflared\.yml)/)
  })
})

describe('scripts/uninstall-services.ps1', () => {
  it('exists', () => {
    expect(existsSync(uninstallPath)).toBe(true)
  })

  const src = existsSync(uninstallPath) ? readFileSync(uninstallPath, 'utf8') : ''

  it('is pure ASCII', () => {
    expect(isAscii(src)).toBe(true)
  })

  it('checks for admin privileges', () => {
    expect(src).toMatch(/Administrator|IsInRole|RunAsAdministrator|elevated/i)
  })

  it('removes both services', () => {
    expect(src).toMatch(/blog-caddy/)
    expect(src).toMatch(/blog-cloudflared/)
  })

  it('stops services before removing them', () => {
    expect(src).toMatch(/(stop|nssm[^\n]*stop)/i)
    expect(src).toMatch(/(remove|nssm[^\n]*remove)/i)
  })

  it('does NOT delete binaries or configs', () => {
    // The acceptance criterion says: only delete service definitions,
    // not the binaries (so a re-install is one command away).
    expect(src).not.toMatch(/Remove-Item[^\n]*tools[\\\/]/)
    expect(src).not.toMatch(/del\s+[^\n]*tools[\\\/]/i)
  })
})
