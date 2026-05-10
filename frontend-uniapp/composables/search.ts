import MiniSearch from 'minisearch'

export const SEARCH_FIELDS = ['title', 'excerpt', 'tags', 'body']
export const SEARCH_STORE_FIELDS = ['id', 'title', 'excerpt', 'date', 'tags']

export const SEARCH_INDEX_URL = '/static/search-index.json'

export interface SearchHit {
  id: string
  title: string
  excerpt: string
  date: string
  tags: string[]
  score: number
}

export function buildIndexFromJSON(json: string): MiniSearch {
  return MiniSearch.loadJSON(json, {
    fields: SEARCH_FIELDS,
    storeFields: SEARCH_STORE_FIELDS,
    idField: 'id'
  })
}

export function searchPosts(idx: MiniSearch, query: string): SearchHit[] {
  const q = (query || '').trim()
  if (!q) return []
  const results = idx.search(q, { prefix: true, fuzzy: 0.2 })
  return results.map((r) => ({
    id: String(r.id),
    title: String(r.title ?? ''),
    excerpt: String(r.excerpt ?? ''),
    date: String(r.date ?? ''),
    tags: Array.isArray(r.tags) ? r.tags : (r.tags ? [String(r.tags)] : []),
    score: r.score
  }))
}

let cached: MiniSearch | null = null
let pending: Promise<MiniSearch> | null = null

async function defaultFetchJSON(): Promise<string> {
  const res = await fetch(SEARCH_INDEX_URL)
  if (!res.ok) throw new Error(`search-index fetch ${res.status}`)
  return res.text()
}

export async function loadSearchIndex(
  fetchJSON: () => Promise<string> = defaultFetchJSON
): Promise<MiniSearch> {
  if (cached) return cached
  if (!pending) {
    pending = fetchJSON()
      .then(buildIndexFromJSON)
      .then((idx) => {
        cached = idx
        pending = null
        return idx
      })
      .catch((err) => {
        pending = null
        throw err
      })
  }
  return pending
}

export function _resetSearchCache(): void {
  cached = null
  pending = null
}
