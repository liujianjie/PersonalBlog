// Tests for F3 (SPEC §13.7 DoD #16): top-level category schema + composable.

import { describe, it, expect } from 'vitest'
import {
  CATEGORIES,
  CATEGORY_LABELS,
  getAllCategories,
  postsByCategory,
  isValidCategory
} from '../../composables/categories'
import { posts } from '../../data/posts'

describe('CATEGORIES constant', () => {
  it('has the four fixed values in display order', () => {
    expect(CATEGORIES).toEqual(['tech', 'thought', 'life', 'learning'])
  })

  it('each category has a non-empty Chinese label', () => {
    for (const c of CATEGORIES) {
      expect(CATEGORY_LABELS[c]).toBeTruthy()
    }
  })
})

describe('posts.ts data shape (F3 migration)', () => {
  it('all posts have a category field', () => {
    for (const p of posts) {
      expect(p.category, `post ${p.id} missing category`).toBeTruthy()
    }
  })

  it('every post category is one of the 4 valid values', () => {
    for (const p of posts) {
      expect(CATEGORIES).toContain(p.category)
    }
  })

  it('current corpus is all tech (legacy migration default)', () => {
    expect(posts.length).toBeGreaterThanOrEqual(50)
    expect(posts.every((p) => p.category === 'tech')).toBe(true)
  })
})

describe('getAllCategories', () => {
  it('returns all 4 categories in fixed order even if some have 0 posts', () => {
    const cats = getAllCategories()
    expect(cats.map((c) => c.name)).toEqual(CATEGORIES)
  })

  it('counts sum to total post count', () => {
    const cats = getAllCategories()
    const sum = cats.reduce((s, c) => s + c.count, 0)
    expect(sum).toBe(posts.length)
  })

  it('tech bucket equals number of tech posts', () => {
    const cats = getAllCategories()
    const tech = cats.find((c) => c.name === 'tech')
    expect(tech?.count).toBe(posts.filter((p) => p.category === 'tech').length)
  })
})

describe('postsByCategory', () => {
  it('tech returns all current posts (sorted newest first)', () => {
    const techPosts = postsByCategory('tech')
    expect(techPosts.length).toBe(posts.length)
    // sorted desc by date
    for (let i = 1; i < techPosts.length; i++) {
      expect(techPosts[i - 1].date >= techPosts[i].date).toBe(true)
    }
  })

  it('thought / life / learning return empty arrays initially', () => {
    expect(postsByCategory('thought')).toEqual([])
    expect(postsByCategory('life')).toEqual([])
    expect(postsByCategory('learning')).toEqual([])
  })
})

describe('isValidCategory', () => {
  it('accepts the four valid values', () => {
    for (const c of CATEGORIES) {
      expect(isValidCategory(c)).toBe(true)
    }
  })

  it('rejects unknown strings + non-strings', () => {
    expect(isValidCategory('art')).toBe(false)
    expect(isValidCategory('')).toBe(false)
    expect(isValidCategory(undefined)).toBe(false)
    expect(isValidCategory(123)).toBe(false)
    expect(isValidCategory(null)).toBe(false)
  })
})
