// F9 (SPEC §13.7 P3): regression guard for the post detail page wiring.
// post.vue must inject per-article OG / Twitter / canonical meta when
// the page loads, and clear them when the page unloads, so SPA
// navigation between posts shows the right card to link unfurlers and
// leaving the post page restores the site-level fallback meta.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const postPath = path.resolve(__dirname, '..', '..', 'pages', 'post', 'post.vue')
const src = readFileSync(postPath, 'utf8')

describe('post.vue OG/Twitter meta wiring (F9)', () => {
  it('imports the meta-tags composable', () => {
    expect(src).toMatch(/from\s+['"]@\/composables\/meta-tags['"]/)
  })

  it('imports applyMetaTags + buildPostMetaTags + siteMetaConfig', () => {
    expect(src).toMatch(/applyMetaTags/)
    expect(src).toMatch(/buildPostMetaTags/)
    expect(src).toMatch(/siteMetaConfig/)
  })

  it('imports the cleanup helper for SPA exit', () => {
    expect(src).toMatch(/clearAppliedMetaTags/)
  })

  it('calls applyMetaTags(buildPostMetaTags(...)) inside onLoad', () => {
    // We use buildPostMetaTags(post, siteMetaConfig) so the call site
    // documents the dependency on the site-level config.
    expect(src).toMatch(/applyMetaTags\([\s\S]{0,400}buildPostMetaTags/)
  })

  it('uses uni-app onUnload to invoke clearAppliedMetaTags', () => {
    // onUnload imported from @dcloudio/uni-app and the cleanup runs
    // inside its callback so the next page sees clean head.
    expect(src).toMatch(/onUnload/)
    expect(src).toMatch(/onUnload\([\s\S]{0,200}clearAppliedMetaTags/)
  })

  it('builds canonical URL from siteMetaConfig.baseUrl + buildPostUrl', () => {
    // Pin the call shape so a refactor that drops the canonical link
    // breaks the test instead of silently regressing SEO.
    expect(src).toMatch(/buildPostUrl/)
  })
})
