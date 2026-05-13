// Structural test for scripts/publish.ps1 - the publish orchestrator.
// We can't realistically run the full script in CI (real build takes ~1min),
// so this test validates the script's structural contract:
//   - fail-fast (-ErrorActionPreference Stop OR explicit exit-on-failure)
//   - invokes the four required steps in correct order
//   - pure ASCII (Windows PS 5.x CP936/GBK trap)
//   - resolves paths relative to repo root (script lives in scripts/)
// End-to-end behavior is verified once manually: run publish.ps1 and
// `ls site/index.html site/static/{feed,sitemap}.xml site/static/search-index.json`.

import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(__dirname, '..', '..', '..')
const publishPath = path.join(repoRoot, 'scripts', 'publish.ps1')

describe('scripts/publish.ps1', () => {
  it('exists', () => {
    expect(existsSync(publishPath)).toBe(true)
  })

  const src = existsSync(publishPath) ? readFileSync(publishPath, 'utf8') : ''

  it('is pure ASCII (no CP936/GBK parse trap)', () => {
    const nonAscii = [...src].filter(c => c.charCodeAt(0) > 127)
    expect(nonAscii.length, `non-ASCII chars: ${nonAscii.slice(0, 5).join(' ')}`).toBe(0)
  })

  it('fails fast on any step error', () => {
    expect(src).toMatch(/\$ErrorActionPreference\s*=\s*'Stop'/)
  })

  it('invokes gen-feeds.ps1', () => {
    expect(src).toMatch(/gen-feeds\.ps1/)
  })

  it('invokes gen-search-index.mjs', () => {
    expect(src).toMatch(/gen-search-index\.mjs/)
  })

  it('runs the uni h5 build', () => {
    // Either via pnpm script or direct uni-run.mjs invocation.
    expect(src).toMatch(/build:h5|uni-run\.mjs/)
  })

  it('mirrors dist/build/h5 to site/ via robocopy', () => {
    expect(src).toMatch(/robocopy/i)
    expect(src).toMatch(/dist[\\\/]build[\\\/]h5/)
    expect(src).toMatch(/\bsite\b/)
    // /MIR is what makes site/ a true mirror (deletes orphans).
    expect(src).toMatch(/\/MIR\b/i)
  })

  it('runs static generators BEFORE build (so static/ files get bundled)', () => {
    // The two generators write to frontend-uniapp/static/, which the build
    // then copies into dist/build/h5/static/. Order matters.
    const idxFeeds = src.indexOf('gen-feeds.ps1')
    const idxIndex = src.indexOf('gen-search-index.mjs')
    const idxBuild = Math.max(src.indexOf('build:h5'), src.indexOf('uni-run.mjs'))
    expect(idxFeeds, 'gen-feeds.ps1 not found').toBeGreaterThan(-1)
    expect(idxIndex, 'gen-search-index.mjs not found').toBeGreaterThan(-1)
    expect(idxBuild, 'build invocation not found').toBeGreaterThan(-1)
    expect(idxFeeds).toBeLessThan(idxBuild)
    expect(idxIndex).toBeLessThan(idxBuild)
  })

  it('robocopy comes last (after build)', () => {
    // Use the LAST robocopy occurrence to skip any pre-flight PATH check.
    const idxBuild = Math.max(
      src.lastIndexOf('build:h5'),
      src.lastIndexOf('uni-run.mjs')
    )
    const idxRobo = src.toLowerCase().lastIndexOf('robocopy')
    expect(idxRobo).toBeGreaterThan(idxBuild)
  })

  it('treats robocopy exit codes 0-7 as success (not failure)', () => {
    // robocopy returns 0-7 for success-ish states; >=8 = real failure.
    // Naive `& robocopy ...; if ($LASTEXITCODE -ne 0)` would always fail.
    expect(src).toMatch(/(LASTEXITCODE|exitCode|robocopyExit).*\b8\b|\b8\b.*(LASTEXITCODE|exitCode|robocopyExit)/i)
  })
})
