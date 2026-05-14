import { describe, it, expect } from 'vitest'
import { authorInfo, getSocialLinks } from '../../composables/author'

describe('authorInfo', () => {
  it('has name, bio, and github URL', () => {
    expect(authorInfo.name).toBeTruthy()
    expect(authorInfo.bio).toBeTruthy()
    expect(authorInfo.github).toMatch(/^https:\/\/github\.com\//)
  })

  it('bio is non-empty (drives the about page hero text)', () => {
    expect(authorInfo.bio.length).toBeGreaterThan(5)
  })
})

describe('getSocialLinks', () => {
  it('returns at least the github link', () => {
    const links = getSocialLinks()
    expect(links.length).toBeGreaterThanOrEqual(1)
    expect(links.some((l: { type: string }) => l.type === 'github')).toBe(true)
  })

  it('every link has label + valid href', () => {
    const links = getSocialLinks()
    for (const l of links) {
      expect(l.label).toBeTruthy()
      // href can be:
      //   - http(s):// URL
      //   - mailto:address (email link)
      //   - same-origin path starting with /
      expect(l.href).toMatch(/^(https?:\/\/|mailto:|\/)/)
    }
  })

  it('includes an RSS link pointing at /static/feed.xml', () => {
    const links = getSocialLinks()
    expect(links.some((l: { type: string; href: string }) =>
      l.type === 'rss' && l.href === '/static/feed.xml'
    )).toBe(true)
  })
})
