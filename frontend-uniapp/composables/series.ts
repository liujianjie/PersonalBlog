import { posts } from '@/data/posts'
import type { Post } from '@/types'

export interface SeriesEntry {
  /** Series name, e.g. 'Addressable'. */
  name: string
  /** Number of posts in the series. */
  count: number
  /** Latest date among the series posts (for sorting series cards). */
  latestDate: string
}

/** All series with at least one post, sorted by latestDate desc then name. */
export function getAllSeries(): SeriesEntry[] {
  const map = new Map<string, { count: number; latestDate: string }>()
  for (const p of posts) {
    if (!p.series) continue
    const cur = map.get(p.series)
    if (!cur) {
      map.set(p.series, { count: 1, latestDate: p.date })
    } else {
      cur.count += 1
      if (p.date > cur.latestDate) cur.latestDate = p.date
    }
  }
  return [...map.entries()]
    .map(([name, { count, latestDate }]) => ({ name, count, latestDate }))
    .sort(
      (a, b) =>
        (a.latestDate < b.latestDate ? 1 : a.latestDate > b.latestDate ? -1 : 0) ||
        a.name.localeCompare(b.name)
    )
}

/** Posts in the given series, sorted by seriesOrder asc.
 *  Posts without seriesOrder fall back to date desc. */
export function postsBySeries(name: string): Post[] {
  return posts
    .filter((p) => p.series === name)
    .sort((a, b) => {
      const ao = a.seriesOrder ?? Number.MAX_SAFE_INTEGER
      const bo = b.seriesOrder ?? Number.MAX_SAFE_INTEGER
      if (ao !== bo) return ao - bo
      return a.date < b.date ? 1 : a.date > b.date ? -1 : 0
    })
}

/** "Collapse" feed: posts in a series fold to a single representative
 *  (the latest one), so the home grid shows a series card instead of
 *  N near-duplicate cards. Posts without a series pass through unchanged.
 *
 *  Returns either the raw Post or a SeriesGroup placeholder. */
export type FeedItem =
  | { kind: 'post'; post: Post }
  | { kind: 'series'; name: string; representative: Post; count: number }

export function collapseSeriesFeed(): FeedItem[] {
  // Group by series; pick the latest post per series as the representative.
  const seenSeries = new Set<string>()
  const items: FeedItem[] = []
  // Posts already sorted later -> first by date here:
  const sorted = [...posts].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0
  )
  for (const p of sorted) {
    if (!p.series) {
      items.push({ kind: 'post', post: p })
      continue
    }
    if (seenSeries.has(p.series)) continue
    seenSeries.add(p.series)
    const seriesPosts = posts.filter((q) => q.series === p.series)
    items.push({
      kind: 'series',
      name: p.series,
      representative: p,
      count: seriesPosts.length
    })
  }
  return items
}
