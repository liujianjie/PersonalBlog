// Tests for F4 (SPEC §13.7 DoD #17): series field + composable +
// home-page collapse behavior.

import { describe, it, expect } from 'vitest'
import {
  getAllSeries,
  postsBySeries,
  collapseSeriesFeed
} from '../../composables/series'
import { posts } from '../../data/posts'

describe('posts.ts series migration', () => {
  it('Addressable series has 15 posts', () => {
    const adr = posts.filter((p) => p.series === 'Addressable')
    expect(adr.length).toBe(15)
  })

  it('every Addressable post has a 1-based seriesOrder in [1, 15]', () => {
    const adr = posts.filter((p) => p.series === 'Addressable')
    for (const p of adr) {
      expect(p.seriesOrder).toBeGreaterThanOrEqual(1)
      expect(p.seriesOrder).toBeLessThanOrEqual(15)
    }
  })

  it('Addressable seriesOrder values are unique (no duplicates)', () => {
    const orders = posts
      .filter((p) => p.series === 'Addressable')
      .map((p) => p.seriesOrder)
    const set = new Set(orders)
    expect(set.size).toBe(orders.length)
  })

  it('non-series posts keep series undefined', () => {
    const nonSeries = posts.filter((p) => !p.series)
    expect(nonSeries.length).toBeGreaterThan(0)
  })
})

describe('getAllSeries', () => {
  it('returns at least the Addressable series', () => {
    const all = getAllSeries()
    expect(all.some((s) => s.name === 'Addressable')).toBe(true)
  })

  it('Addressable entry reports count = 15', () => {
    const adr = getAllSeries().find((s) => s.name === 'Addressable')
    expect(adr?.count).toBe(15)
  })

  it('every entry has a non-empty latestDate', () => {
    for (const s of getAllSeries()) {
      expect(s.latestDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})

describe('postsBySeries', () => {
  it('Addressable returns 15 posts in seriesOrder asc', () => {
    const list = postsBySeries('Addressable')
    expect(list.length).toBe(15)
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1].seriesOrder ?? 0
      const cur = list[i].seriesOrder ?? 0
      expect(cur).toBeGreaterThanOrEqual(prev)
    }
  })

  it('seriesOrder 1 is first, seriesOrder 15 is last', () => {
    const list = postsBySeries('Addressable')
    expect(list[0].seriesOrder).toBe(1)
    expect(list[list.length - 1].seriesOrder).toBe(15)
  })

  it('unknown series returns empty array', () => {
    expect(postsBySeries('nonexistent-series')).toEqual([])
  })
})

describe('collapseSeriesFeed', () => {
  it('Addressable contributes exactly one feed item, kind=series', () => {
    const feed = collapseSeriesFeed()
    const adr = feed.filter(
      (it) => it.kind === 'series' && it.name === 'Addressable'
    )
    expect(adr.length).toBe(1)
  })

  it('Addressable series item reports count = 15', () => {
    const feed = collapseSeriesFeed()
    const adr = feed.find(
      (it) => it.kind === 'series' && it.name === 'Addressable'
    )
    expect(adr?.kind === 'series' && adr.count).toBe(15)
  })

  it('total feed items = (non-series posts) + (number of series)', () => {
    const feed = collapseSeriesFeed()
    const nonSeriesPostCount = posts.filter((p) => !p.series).length
    const seriesNameCount = new Set(
      posts.filter((p) => p.series).map((p) => p.series!)
    ).size
    expect(feed.length).toBe(nonSeriesPostCount + seriesNameCount)
  })

  it('collapsed feed length is strictly less than total post count', () => {
    // Otherwise the collapse provides no benefit.
    const feed = collapseSeriesFeed()
    expect(feed.length).toBeLessThan(posts.length)
  })

  it('representative for Addressable is the latest-date post in the series', () => {
    const feed = collapseSeriesFeed()
    const adr = feed.find(
      (it) => it.kind === 'series' && it.name === 'Addressable'
    )
    expect(adr?.kind).toBe('series')
    if (adr?.kind === 'series') {
      const adrPosts = posts.filter((p) => p.series === 'Addressable')
      const maxDate = adrPosts.reduce(
        (m, p) => (p.date > m ? p.date : m),
        adrPosts[0].date
      )
      expect(adr.representative.date).toBe(maxDate)
    }
  })
})
