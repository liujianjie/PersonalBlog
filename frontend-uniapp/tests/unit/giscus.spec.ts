// F5 (SPEC §13.7 P2): contract test for the giscus comments composable.
// The composable holds the giscus widget configuration and the helper
// that turns it into a script-tag attribute set. We don't render the
// widget in unit tests (it's a third-party iframe); we only lock in
// the placeholder-vs-configured detection and the data-* attribute
// shape so a future refactor can't quietly break the embed.

import { describe, it, expect } from 'vitest'
import {
  giscusConfig,
  isGiscusConfigured,
  buildGiscusScriptAttrs,
  GISCUS_SCRIPT_SRC,
  type GiscusConfig
} from '../../composables/giscus'

describe('giscusConfig (default placeholder)', () => {
  it('exposes the required giscus fields', () => {
    expect(giscusConfig).toMatchObject({
      repo: expect.any(String),
      repoId: expect.any(String),
      category: expect.any(String),
      categoryId: expect.any(String),
      mapping: expect.any(String)
    })
  })

  it('ships with placeholder values out of the box (owner-blocked activation)', () => {
    // Owner needs to fill these in via giscus.app; until then the widget
    // must NOT mount. The placeholders use angle-bracket sentinels so
    // they are easy to grep + obviously not real ids.
    expect(giscusConfig.repo).toMatch(/<YOUR_/)
    expect(giscusConfig.repoId).toMatch(/<YOUR_/)
    expect(giscusConfig.categoryId).toMatch(/<YOUR_/)
  })
})

describe('isGiscusConfigured()', () => {
  it('returns false for the default placeholder config', () => {
    expect(isGiscusConfigured(giscusConfig)).toBe(false)
  })

  it('returns false if any required field still has a placeholder', () => {
    const partial: GiscusConfig = {
      ...giscusConfig,
      repo: 'liujianjie/PersonalBlog',
      repoId: 'R_kgDOABCDEF',
      // categoryId still placeholder -> not configured
    }
    expect(isGiscusConfigured(partial)).toBe(false)
  })

  it('returns true when all required ids are filled in', () => {
    const real: GiscusConfig = {
      repo: 'liujianjie/PersonalBlog',
      repoId: 'R_kgDOABCDEF',
      category: 'General',
      categoryId: 'DIC_kwDOABCDEF',
      mapping: 'pathname',
      strict: true,
      reactionsEnabled: true,
      emitMetadata: false,
      inputPosition: 'bottom',
      lang: 'zh-CN',
      loading: 'lazy'
    }
    expect(isGiscusConfigured(real)).toBe(true)
  })
})

describe('buildGiscusScriptAttrs()', () => {
  const real: GiscusConfig = {
    repo: 'liujianjie/PersonalBlog',
    repoId: 'R_kgDOABCDEF',
    category: 'General',
    categoryId: 'DIC_kwDOABCDEF',
    mapping: 'specific',
    strict: true,
    reactionsEnabled: true,
    emitMetadata: false,
    inputPosition: 'bottom',
    lang: 'zh-CN',
    loading: 'lazy'
  }

  it('emits the canonical giscus script src as a constant', () => {
    expect(GISCUS_SCRIPT_SRC).toBe('https://giscus.app/client.js')
  })

  it('renders all data-* attributes including theme + term', () => {
    const attrs = buildGiscusScriptAttrs(real, { term: 'post-42', theme: 'dark' })
    expect(attrs['data-repo']).toBe('liujianjie/PersonalBlog')
    expect(attrs['data-repo-id']).toBe('R_kgDOABCDEF')
    expect(attrs['data-category']).toBe('General')
    expect(attrs['data-category-id']).toBe('DIC_kwDOABCDEF')
    expect(attrs['data-mapping']).toBe('specific')
    expect(attrs['data-term']).toBe('post-42')
    expect(attrs['data-theme']).toBe('dark')
    expect(attrs['data-strict']).toBe('1')
    expect(attrs['data-reactions-enabled']).toBe('1')
    expect(attrs['data-emit-metadata']).toBe('0')
    expect(attrs['data-input-position']).toBe('bottom')
    expect(attrs['data-lang']).toBe('zh-CN')
    expect(attrs['data-loading']).toBe('lazy')
    expect(attrs['crossorigin']).toBe('anonymous')
    expect(attrs['async']).toBe('')
  })

  it('omits data-term when mapping is pathname (giscus does not use it)', () => {
    const cfg: GiscusConfig = { ...real, mapping: 'pathname' }
    const attrs = buildGiscusScriptAttrs(cfg, { term: 'post-42', theme: 'light' })
    expect(attrs['data-term']).toBeUndefined()
    expect(attrs['data-mapping']).toBe('pathname')
  })

  it('maps theme "light" / "dark" through unchanged', () => {
    expect(buildGiscusScriptAttrs(real, { term: 't', theme: 'light' })['data-theme']).toBe('light')
    expect(buildGiscusScriptAttrs(real, { term: 't', theme: 'dark' })['data-theme']).toBe('dark')
  })
})
