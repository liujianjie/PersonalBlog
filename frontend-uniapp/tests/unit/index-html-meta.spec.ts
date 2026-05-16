// F9 (SPEC §13.7 P3): index.html static fallback meta.
//
// SPA crawlers (微信 / Twitter / Discord / Slack / Telegram) usually do
// NOT execute JavaScript. They fetch the HTML, scrape <head>, and
// render a card. Per-post meta is injected at runtime by post.vue, but
// the index.html the crawler fetches is the same shell for every URL.
//
// So we ship site-level og:* + twitter:* + canonical fallbacks here.
// The post page may override them at runtime for JS-capable crawlers,
// but headless ones still get something useful for the home page.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const indexHtmlPath = path.resolve(__dirname, '..', '..', 'index.html')
const indexSrc = readFileSync(indexHtmlPath, 'utf8')

describe('index.html — static OG fallback (F9)', () => {
  it('declares og:type = website', () => {
    expect(indexSrc).toMatch(/<meta\s+property=["']og:type["']\s+content=["']website["']/)
  })

  it('declares og:title with the site name', () => {
    expect(indexSrc).toMatch(/<meta\s+property=["']og:title["']/)
  })

  it('declares og:description', () => {
    expect(indexSrc).toMatch(/<meta\s+property=["']og:description["']/)
  })

  it('declares og:url with the production domain', () => {
    expect(indexSrc).toMatch(
      /<meta\s+property=["']og:url["']\s+content=["']https:\/\/blog\.multilab\.cc\/?["']/
    )
  })

  it('declares og:image with an absolute URL', () => {
    expect(indexSrc).toMatch(/<meta\s+property=["']og:image["']\s+content=["']https:\/\//)
  })

  it('declares og:site_name = Personal Blog', () => {
    expect(indexSrc).toMatch(
      /<meta\s+property=["']og:site_name["']\s+content=["']Personal Blog["']/
    )
  })

  it('declares og:locale = zh_CN', () => {
    expect(indexSrc).toMatch(/<meta\s+property=["']og:locale["']\s+content=["']zh_CN["']/)
  })
})

describe('index.html — static Twitter Card fallback (F9)', () => {
  it('declares twitter:card = summary_large_image', () => {
    expect(indexSrc).toMatch(
      /<meta\s+name=["']twitter:card["']\s+content=["']summary_large_image["']/
    )
  })

  it('declares twitter:title', () => {
    expect(indexSrc).toMatch(/<meta\s+name=["']twitter:title["']/)
  })

  it('declares twitter:description', () => {
    expect(indexSrc).toMatch(/<meta\s+name=["']twitter:description["']/)
  })

  it('declares twitter:image with an absolute URL', () => {
    expect(indexSrc).toMatch(/<meta\s+name=["']twitter:image["']\s+content=["']https:\/\//)
  })
})

describe('index.html — canonical link (F9)', () => {
  it('declares <link rel="canonical"> pointing at the production domain', () => {
    expect(indexSrc).toMatch(
      /<link\s+rel=["']canonical["']\s+href=["']https:\/\/blog\.multilab\.cc\/?["']/
    )
  })
})
