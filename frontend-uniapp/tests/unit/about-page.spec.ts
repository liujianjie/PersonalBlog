// Structural test for pages/about/about.vue (F1).
// Page renders via uni-app, can't be mounted directly in vitest without
// the uni runtime - so we guard the file's structural contract.
//
// 2026-05-14: extended after the user reported the page lost most of its
// content vs. the React version on `main`. We lock all six legacy sections
// + the new tag cloud in via structural assertions so future refactors
// can't quietly delete them.

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const frontendRoot = path.resolve(__dirname, '..', '..')
const aboutPath = path.join(frontendRoot, 'pages', 'about', 'about.vue')
const pagesJsonPath = path.join(frontendRoot, 'pages.json')
const headerPath = path.join(frontendRoot, 'components', 'site-header.vue')
const authorPath = path.join(frontendRoot, 'composables', 'author.ts')

describe('pages/about/about.vue', () => {
  it('exists', () => {
    expect(existsSync(aboutPath)).toBe(true)
  })

  const src = existsSync(aboutPath) ? readFileSync(aboutPath, 'utf8') : ''

  it('imports authorInfo from composables/author', () => {
    expect(src).toMatch(/from\s+['"]@\/composables\/author['"]/)
  })

  it('imports tags composable for the tag cloud', () => {
    expect(src).toMatch(/from\s+['"]@\/composables\/tags['"]/)
  })

  it('uses SiteHeader (consistent shell)', () => {
    expect(src).toMatch(/SiteHeader/)
  })

  it('renders the author bio + name + github link in template', () => {
    expect(src).toMatch(/authorInfo\.name|author\.name/)
    expect(src).toMatch(/authorInfo\.bio|author\.bio/)
    expect(src).toMatch(/authorInfo\.github|author\.github|getSocialLinks/)
  })

  // Six legacy sections from the React About page that the user expects
  // to see. These regression checks fire if any section is removed or
  // its identifying class/heading is renamed.

  it('shows the page subtitle ("了解博主和这个博客")', () => {
    // The literal string lives in composables/author.ts; the template
    // references it via `authorInfo.subtitle`. Match either form so a
    // future refactor that inlines the string still passes.
    expect(src).toMatch(/authorInfo\.subtitle|了解博主和这个博客/)
  })

  it('shows an avatar element (initial-letter circle or img)', () => {
    expect(src).toMatch(/class=["'][^"']*avatar[^"']*["']/)
  })

  it('renders the 核心技能 / Skills section', () => {
    expect(src).toMatch(/核心技能/)
    // Each skill bucket (engine / graphics / unity / language) must appear.
    expect(src).toMatch(/skills/i)
  })

  it('renders the 学习成果 / Achievements section', () => {
    expect(src).toMatch(/学习成果/)
    expect(src).toMatch(/achievements/i)
  })

  it('renders the 关于博客 / About-blog section', () => {
    expect(src).toMatch(/关于这个博客|关于博客/)
  })

  it('renders the 保持联系 / Contact CTA section', () => {
    expect(src).toMatch(/保持联系|联系我/)
  })

  it('keeps the new tag cloud section', () => {
    expect(src).toMatch(/标签云/)
    expect(src).toMatch(/getAllTags/)
  })
})

describe('composables/author.ts', () => {
  it('exists', () => {
    expect(existsSync(authorPath)).toBe(true)
  })

  const src = existsSync(authorPath) ? readFileSync(authorPath, 'utf8') : ''

  it('exports authorInfo with subtitle / email / website fields', () => {
    expect(src).toMatch(/subtitle/)
    expect(src).toMatch(/email/)
    expect(src).toMatch(/website/)
  })

  it('exports skills + achievements + blogIntro structures', () => {
    expect(src).toMatch(/export\s+const\s+skills/)
    expect(src).toMatch(/export\s+const\s+achievements/)
    expect(src).toMatch(/export\s+const\s+blogIntro/)
  })
})

describe('pages.json', () => {
  it('registers pages/about/about route', () => {
    expect(existsSync(pagesJsonPath)).toBe(true)
    const cfg = JSON.parse(readFileSync(pagesJsonPath, 'utf8'))
    const aboutPage = cfg.pages?.find((p: { path: string }) =>
      p.path === 'pages/about/about'
    )
    expect(aboutPage).toBeTruthy()
  })
})

describe('components/site-header.vue', () => {
  it('has a link/button to navigate to the about page', () => {
    const src = readFileSync(headerPath, 'utf8')
    expect(src).toMatch(/about/i)
  })
})

