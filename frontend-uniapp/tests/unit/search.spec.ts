import { describe, expect, it } from 'vitest'
import {
  buildIndexFromJSON,
  searchPosts,
  SEARCH_FIELDS,
  SEARCH_STORE_FIELDS
} from '@/composables/search'
// @ts-expect-error - .mjs without typings; runtime shape verified.
import { buildSearchIndex } from '../../scripts/gen-search-index.mjs'

const sample = [
  {
    id: '1',
    title: 'Addressable Hosting',
    excerpt: 'asset bundles',
    date: '2024-01-01',
    tags: ['Unity', 'Addressable'],
    author: 'me',
    readTime: 5,
    mdFile: '/static/posts/a.md'
  },
  {
    id: '2',
    title: 'OpenGL Pipeline',
    excerpt: 'shaders',
    date: '2024-02-01',
    tags: ['OpenGL'],
    author: 'me',
    readTime: 8,
    mdFile: '/static/posts/b.md'
  }
]
const bodies: Record<string, string> = {
  '/static/posts/a.md': '# A\nAsset bundles and remote hosting.',
  '/static/posts/b.md': '# B\nVertex and fragment shaders.'
}

async function makeIndexJSON(): Promise<string> {
  return buildSearchIndex(sample, async (f: string) => bodies[f] ?? '')
}

describe('search composable', () => {
  it('exports the same field config as the index generator', () => {
    expect(SEARCH_FIELDS).toEqual(['title', 'excerpt', 'tags', 'body'])
    expect(SEARCH_STORE_FIELDS).toEqual(['id', 'title', 'excerpt', 'date', 'tags'])
  })

  it('buildIndexFromJSON returns a queryable MiniSearch', async () => {
    const json = await makeIndexJSON()
    const idx = buildIndexFromJSON(json)
    const hits = idx.search('Addressable')
    expect(hits.length).toBeGreaterThan(0)
  })

  it('searchPosts maps results with array tags and required fields', async () => {
    const json = await makeIndexJSON()
    const idx = buildIndexFromJSON(json)
    const hits = searchPosts(idx, 'Addressable')
    expect(hits.length).toBeGreaterThan(0)
    const top = hits[0]
    expect(top.id).toBe('1')
    expect(top.title).toBe('Addressable Hosting')
    expect(Array.isArray(top.tags)).toBe(true)
    expect(top.tags).toContain('Addressable')
    expect(top.date).toBe('2024-01-01')
    expect(typeof top.score).toBe('number')
  })

  it('searchPosts returns empty for empty/whitespace query', async () => {
    const json = await makeIndexJSON()
    const idx = buildIndexFromJSON(json)
    expect(searchPosts(idx, '')).toEqual([])
    expect(searchPosts(idx, '   ')).toEqual([])
  })

  it('searchPosts matches body content', async () => {
    const json = await makeIndexJSON()
    const idx = buildIndexFromJSON(json)
    const hits = searchPosts(idx, 'shader')
    expect(hits.some(h => h.id === '2')).toBe(true)
  })

  it('searchPosts orders by score (best match first)', async () => {
    const json = await makeIndexJSON()
    const idx = buildIndexFromJSON(json)
    const hits = searchPosts(idx, 'OpenGL')
    expect(hits[0].id).toBe('2')
  })
})
