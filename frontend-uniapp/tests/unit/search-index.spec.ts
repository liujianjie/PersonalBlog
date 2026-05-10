import { describe, expect, it } from 'vitest'
import MiniSearch from 'minisearch'
// Pure logic lives in frontend-uniapp/scripts/ so `import 'minisearch'`
// resolves against the package's node_modules. Path: up two from tests/unit/.
import {
  stripMarkdown,
  buildSearchIndex,
  parsePostsTs,
  SEARCH_FIELDS,
  SEARCH_STORE_FIELDS
  // @ts-expect-error - .mjs without typings; we verify shape at runtime.
} from '../../scripts/gen-search-index.mjs'

describe('stripMarkdown', () => {
  it('drops fenced code blocks', () => {
    const out = stripMarkdown('hello\n```js\nconst x=1\n```\nworld')
    expect(out).not.toContain('const x=1')
    expect(out).toContain('hello')
    expect(out).toContain('world')
  })

  it('drops images but keeps alt text', () => {
    const out = stripMarkdown('intro ![diagram](/x.png) outro')
    expect(out).toContain('intro')
    expect(out).toContain('diagram')
    expect(out).toContain('outro')
    expect(out).not.toContain('/x.png')
    expect(out).not.toContain('![')
  })

  it('keeps link text and drops urls', () => {
    const out = stripMarkdown('see [docs](https://example.com) here')
    expect(out).toContain('docs')
    expect(out).toContain('here')
    expect(out).not.toContain('https://example.com')
  })

  it('strips markdown emphasis and headings', () => {
    const out = stripMarkdown('# title\n\nsome **bold** and *em* and `code`.')
    expect(out).toContain('title')
    expect(out).toContain('bold')
    expect(out).toContain('em')
    expect(out).toContain('code')
    expect(out).not.toContain('#')
    expect(out).not.toContain('**')
    expect(out).not.toContain('`')
  })

  it('collapses whitespace', () => {
    const out = stripMarkdown('a\n\n\n\nb     c')
    expect(out).toBe('a b c')
  })
})

describe('parsePostsTs', () => {
  it('parses the live posts.ts shape', () => {
    const src = `import { Post } from '../types';

export const posts: Post[] = [
  {
    id: '1',
    title: 'Hello',
    excerpt: 'world',
    date: '2024-01-01',
    tags: ['Unity', 'Test'],
    author: 'me',
    readTime: 1,
    mdFile: '/static/posts/x.md'
  }
];

export const authorInfo = { name: 'a' };
`
    const posts = parsePostsTs(src)
    expect(posts).toHaveLength(1)
    expect(posts[0].id).toBe('1')
    expect(posts[0].title).toBe('Hello')
    expect(posts[0].tags).toEqual(['Unity', 'Test'])
    expect(posts[0].mdFile).toBe('/static/posts/x.md')
  })

  it('handles Chinese in titles and tags', () => {
    const src = `import { Post } from '../types';
export const posts: Post[] = [
  { id: '2', title: '中文标题', excerpt: '摘要', date: '2024-02-02',
    tags: ['游戏开发'], author: '博主', readTime: 5,
    mdFile: '/static/posts/中文/a.md' }
];`
    const posts = parsePostsTs(src)
    expect(posts[0].title).toBe('中文标题')
    expect(posts[0].tags).toEqual(['游戏开发'])
  })
})

describe('buildSearchIndex', () => {
  const posts = [
    {
      id: '1',
      title: 'Addressable Hosting',
      excerpt: 'about hosting',
      date: '2024-01-01',
      tags: ['Unity', 'Addressable'],
      author: 'me',
      readTime: 5,
      mdFile: '/static/posts/a.md'
    },
    {
      id: '2',
      title: 'OpenGL Pipeline',
      excerpt: 'about rendering',
      date: '2024-02-01',
      tags: ['OpenGL', 'Graphics'],
      author: 'me',
      readTime: 8,
      mdFile: '/static/posts/b.md'
    }
  ]

  const bodies: Record<string, string> = {
    '/static/posts/a.md': '# Addressable\nThis post talks about asset bundles and 远端托管.',
    '/static/posts/b.md': '# OpenGL\nVertex shader and fragment shader pipeline notes.'
  }
  const fetchBody = async (mdFile: string) => bodies[mdFile] ?? ''

  it('returns JSON parseable by MiniSearch.loadJSON', async () => {
    const json = await buildSearchIndex(posts, fetchBody)
    expect(typeof json).toBe('string')

    const idx = MiniSearch.loadJSON(json, {
      fields: SEARCH_FIELDS,
      storeFields: SEARCH_STORE_FIELDS
    })
    expect(idx).toBeInstanceOf(MiniSearch)
  })

  it('matches by title keyword and returns stored fields', async () => {
    const json = await buildSearchIndex(posts, fetchBody)
    const idx = MiniSearch.loadJSON(json, {
      fields: SEARCH_FIELDS,
      storeFields: SEARCH_STORE_FIELDS
    })
    const results = idx.search('Addressable')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].id).toBe('1')
    expect(results[0].title).toBe('Addressable Hosting')
    expect(results[0].tags).toContain('Addressable')
    expect(results[0].date).toBe('2024-01-01')
  })

  it('matches by tag', async () => {
    const json = await buildSearchIndex(posts, fetchBody)
    const idx = MiniSearch.loadJSON(json, {
      fields: SEARCH_FIELDS,
      storeFields: SEARCH_STORE_FIELDS
    })
    const results = idx.search('OpenGL')
    expect(results.some(r => r.id === '2')).toBe(true)
  })

  it('indexes body content stripped of markdown', async () => {
    const json = await buildSearchIndex(posts, fetchBody)
    const idx = MiniSearch.loadJSON(json, {
      fields: SEARCH_FIELDS,
      storeFields: SEARCH_STORE_FIELDS
    })
    const results = idx.search('vertex')
    expect(results.some(r => r.id === '2')).toBe(true)
  })

  it('tolerates posts without mdFile', async () => {
    const inlineOnly = [{
      id: '3',
      title: 'Inline Only',
      excerpt: 'no md',
      date: '2024-03-03',
      tags: [],
      author: 'me',
      readTime: 1
    }]
    const json = await buildSearchIndex(inlineOnly, async () => '')
    const idx = MiniSearch.loadJSON(json, {
      fields: SEARCH_FIELDS,
      storeFields: SEARCH_STORE_FIELDS
    })
    const results = idx.search('Inline')
    expect(results.length).toBeGreaterThan(0)
  })
})
