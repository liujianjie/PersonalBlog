import { posts } from '@/data/posts'
import type { Post } from '@/types'

export interface TagEntry {
  name: string
  count: number
}

/** All tags across the corpus, sorted by count desc then name asc. */
export function getAllTags(): TagEntry[] {
  const map = new Map<string, number>()
  for (const p of posts) {
    for (const t of p.tags ?? []) {
      map.set(t, (map.get(t) ?? 0) + 1)
    }
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

/** Posts that carry the given tag, sorted by date desc. */
export function postsByTag(tag: string): Post[] {
  return posts
    .filter((p) => p.tags?.includes(tag))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}
