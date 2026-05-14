import { posts } from '@/data/posts'
import type { Post, PostCategory } from '@/types'

/** Fixed top-level categories. Order = display order of tabs on home page. */
export const CATEGORIES: PostCategory[] = ['tech', 'thought', 'life', 'learning']

/** Display labels for each category (Chinese UI). */
export const CATEGORY_LABELS: Record<PostCategory, string> = {
  tech: '技术',
  thought: '思考',
  life: '人生',
  learning: '学习其它'
}

export interface CategoryEntry {
  name: PostCategory
  label: string
  count: number
}

/** Returns all categories with their post counts, in CATEGORIES order. */
export function getAllCategories(): CategoryEntry[] {
  const counts = new Map<PostCategory, number>()
  for (const c of CATEGORIES) counts.set(c, 0)
  for (const p of posts) {
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1)
  }
  return CATEGORIES.map((name) => ({
    name,
    label: CATEGORY_LABELS[name],
    count: counts.get(name) ?? 0
  }))
}

/** Posts in a given category, sorted newest first. */
export function postsByCategory(category: PostCategory): Post[] {
  return posts
    .filter((p) => p.category === category)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

/** Type guard: is the value one of the four valid categories? */
export function isValidCategory(value: unknown): value is PostCategory {
  return typeof value === 'string' && (CATEGORIES as string[]).includes(value)
}
