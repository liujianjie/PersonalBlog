import { describe, expect, it } from 'vitest'
import { renderMarkdown } from '@/composables/markdown'

describe('renderMarkdown', () => {
  it('returns empty string for empty input', () => {
    expect(renderMarkdown('')).toBe('')
  })

  it('renders headings and paragraphs', () => {
    const html = renderMarkdown('# Hello\n\nworld.')
    expect(html).toContain('<h1>Hello</h1>')
    expect(html).toContain('<p>world.</p>')
  })

  it('renders unordered and ordered lists', () => {
    const html = renderMarkdown('- a\n- b\n\n1. one\n2. two')
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>a</li>')
    expect(html).toContain('<ol>')
    expect(html).toContain('<li>one</li>')
  })

  it('renders fenced code blocks with hljs class', () => {
    const html = renderMarkdown('```js\nconst x = 1;\n```')
    expect(html).toContain('class="hljs language-js"')
    expect(html).toContain('hljs-keyword')
  })

  it('falls back to plaintext for unknown language', () => {
    const html = renderMarkdown('```nope\nhello\n```')
    expect(html).toContain('class="hljs language-plaintext"')
  })

  it('renders GFM tables', () => {
    const md = '| a | b |\n|---|---|\n| 1 | 2 |'
    const html = renderMarkdown(md)
    expect(html).toContain('<table>')
    expect(html).toContain('<th>a</th>')
    expect(html).toContain('<td>1</td>')
  })

  it('encodes Chinese path images via urlEncodePath', () => {
    const html = renderMarkdown('![alt](/images/游戏开发/x.png)')
    expect(html).toContain('src="/images/%E6%B8%B8%E6%88%8F%E5%BC%80%E5%8F%91/x.png"')
    expect(html).toContain('alt="alt"')
    expect(html).toContain('loading="lazy"')
  })

  it('keeps already-encoded image paths idempotent', () => {
    const html = renderMarkdown('![x](/images/%E6%B8%B8%E6%88%8F.png)')
    expect(html).toContain('src="/images/%E6%B8%B8%E6%88%8F.png"')
  })

  it('renders links', () => {
    const html = renderMarkdown('[click](https://example.com)')
    expect(html).toContain('<a href="https://example.com">click</a>')
  })
})
