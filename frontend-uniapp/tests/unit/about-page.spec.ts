// Structural test for pages/about/about.vue (F1).
// Page renders via uni-app, can't be mounted directly in vitest without
// the uni runtime - so we guard the file's structural contract.

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const frontendRoot = path.resolve(__dirname, '..', '..')
const aboutPath = path.join(frontendRoot, 'pages', 'about', 'about.vue')
const pagesJsonPath = path.join(frontendRoot, 'pages.json')
const headerPath = path.join(frontendRoot, 'components', 'site-header.vue')

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
    // We don't run the template; just assert the bindings are present.
    expect(src).toMatch(/authorInfo\.name|author\.name/)
    expect(src).toMatch(/authorInfo\.bio|author\.bio/)
    expect(src).toMatch(/authorInfo\.github|author\.github|getSocialLinks/)
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
    // Match either an inline navigateTo or a method named goAbout etc.
    expect(src).toMatch(/about/i)
  })
})
