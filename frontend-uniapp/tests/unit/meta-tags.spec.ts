// F9 (SPEC §13.7 P3): contract test for OG / Twitter Card meta-tag injection.
//
// Goal: when a reader lands on a post detail page, the document <head>
// must carry per-article og:* + twitter:* meta + a canonical link, so
// that link-unfurlers (微信 / Twitter / Discord / Slack / Telegram)
// render a rich card. We split the work into pure builders + a small
// DOM applier; this spec locks both layers.

import { describe, it, expect, beforeEach } from 'vitest'
import {
  siteMetaConfig,
  buildPostMetaTags,
  buildSiteMetaTags,
  applyMetaTags,
  clearAppliedMetaTags,
  MANAGED_META_ATTR,
  type MetaTag,
  type SiteMetaConfig
} from '../../composables/meta-tags'
import type { Post } from '../../types'

const samplePost: Post = {
  id: 'addressable-8',
  title: 'Addressable（8）Hosting 可寻址托管窗口配置',
  excerpt: '介绍 Addressable Hosting 服务的本地搭建与远端发布',
  date: '2023-11-27',
  tags: ['Unity', 'Addressable'],
  author: '刘建杰',
  readTime: 5,
  category: 'tech',
  series: 'Addressable',
  seriesOrder: 8,
  mdFile: '/static/posts/游戏开发/Unity/.../Addressable（8）.md'
}

const config: SiteMetaConfig = {
  siteName: 'Personal Blog',
  baseUrl: 'https://blog.multilab.cc',
  defaultTitle: 'Personal Blog',
  defaultDescription: '技术笔记 · Unity / OpenGL / 计算机基础',
  defaultImage: '/static/images/og-default.png',
  twitterHandle: ''
}

describe('siteMetaConfig (default export)', () => {
  it('exposes the required site-level fields', () => {
    expect(siteMetaConfig).toMatchObject({
      siteName: expect.any(String),
      baseUrl: expect.any(String),
      defaultTitle: expect.any(String),
      defaultDescription: expect.any(String),
      defaultImage: expect.any(String)
    })
  })

  it('points baseUrl at the production domain (no trailing slash)', () => {
    expect(siteMetaConfig.baseUrl).toBe('https://blog.multilab.cc')
  })
})

describe('buildPostMetaTags()', () => {
  it('emits og:title from post title', () => {
    const tags = buildPostMetaTags(samplePost, config)
    const og = tags.find((t) => t.property === 'og:title')
    expect(og?.content).toBe(samplePost.title)
  })

  it('emits og:description from post excerpt', () => {
    const tags = buildPostMetaTags(samplePost, config)
    const og = tags.find((t) => t.property === 'og:description')
    expect(og?.content).toBe(samplePost.excerpt)
  })

  it('emits og:type = "article" for post pages', () => {
    const tags = buildPostMetaTags(samplePost, config)
    const og = tags.find((t) => t.property === 'og:type')
    expect(og?.content).toBe('article')
  })

  it('emits og:site_name from siteMetaConfig.siteName', () => {
    const tags = buildPostMetaTags(samplePost, config)
    const og = tags.find((t) => t.property === 'og:site_name')
    expect(og?.content).toBe('Personal Blog')
  })

  it('emits og:url as absolute production URL with post id', () => {
    const tags = buildPostMetaTags(samplePost, config)
    const og = tags.find((t) => t.property === 'og:url')
    expect(og?.content).toBe('https://blog.multilab.cc/pages/post/post?id=addressable-8')
  })

  it('falls back to siteMetaConfig.defaultImage when post has no coverImage', () => {
    const tags = buildPostMetaTags(samplePost, config)
    const og = tags.find((t) => t.property === 'og:image')
    expect(og?.content).toBe('https://blog.multilab.cc/static/images/og-default.png')
  })

  it('uses post.coverImage when present, made absolute', () => {
    const post: Post = { ...samplePost, coverImage: '/static/images/covers/addr-8.png' }
    const tags = buildPostMetaTags(post, config)
    const og = tags.find((t) => t.property === 'og:image')
    expect(og?.content).toBe('https://blog.multilab.cc/static/images/covers/addr-8.png')
  })

  it('passes through fully-qualified coverImage URLs unchanged', () => {
    const post: Post = {
      ...samplePost,
      coverImage: 'https://raw.githubusercontent.com/liujianjie/Image/main/x.png'
    }
    const tags = buildPostMetaTags(post, config)
    const og = tags.find((t) => t.property === 'og:image')
    expect(og?.content).toBe('https://raw.githubusercontent.com/liujianjie/Image/main/x.png')
  })

  it('URL-encodes Chinese path segments in the cover image', () => {
    const post: Post = {
      ...samplePost,
      coverImage: '/static/images/游戏开发/cover.png'
    }
    const tags = buildPostMetaTags(post, config)
    const og = tags.find((t) => t.property === 'og:image')
    // %E6%B8%B8%E6%88%8F%E5%BC%80%E5%8F%91 = "游戏开发"
    expect(og?.content).toMatch(/%E6%B8%B8%E6%88%8F%E5%BC%80%E5%8F%91/i)
    expect(og?.content?.startsWith('https://blog.multilab.cc/static/images/')).toBe(true)
  })

  it('emits twitter:card = "summary_large_image" so wide preview is requested', () => {
    const tags = buildPostMetaTags(samplePost, config)
    const tw = tags.find((t) => t.name === 'twitter:card')
    expect(tw?.content).toBe('summary_large_image')
  })

  it('emits twitter:title / twitter:description / twitter:image mirroring og:*', () => {
    const tags = buildPostMetaTags(samplePost, config)
    expect(tags.find((t) => t.name === 'twitter:title')?.content).toBe(samplePost.title)
    expect(tags.find((t) => t.name === 'twitter:description')?.content).toBe(samplePost.excerpt)
    // Image must mirror the og:image (post fallback to defaultImage, made absolute)
    const ogImage = tags.find((t) => t.property === 'og:image')?.content
    expect(tags.find((t) => t.name === 'twitter:image')?.content).toBe(ogImage)
  })

  it('emits article:published_time and article:author from post metadata', () => {
    const tags = buildPostMetaTags(samplePost, config)
    expect(tags.find((t) => t.property === 'article:published_time')?.content).toBe('2023-11-27')
    expect(tags.find((t) => t.property === 'article:author')?.content).toBe('刘建杰')
  })

  it('emits one article:tag entry per post tag', () => {
    const tags = buildPostMetaTags(samplePost, config)
    const articleTags = tags.filter((t) => t.property === 'article:tag').map((t) => t.content)
    expect(articleTags).toEqual(['Unity', 'Addressable'])
  })
})

describe('buildSiteMetaTags()', () => {
  it('uses the site-level defaults (no post-specific fields)', () => {
    const tags = buildSiteMetaTags(config)
    expect(tags.find((t) => t.property === 'og:title')?.content).toBe('Personal Blog')
    expect(tags.find((t) => t.property === 'og:description')?.content).toBe(
      '技术笔记 · Unity / OpenGL / 计算机基础'
    )
    expect(tags.find((t) => t.property === 'og:type')?.content).toBe('website')
    expect(tags.find((t) => t.property === 'og:url')?.content).toBe('https://blog.multilab.cc/')
  })

  it('does not emit article:* tags on non-article pages', () => {
    const tags = buildSiteMetaTags(config)
    const articleTags = tags.filter((t) => (t.property ?? '').startsWith('article:'))
    expect(articleTags).toEqual([])
  })
})

describe('applyMetaTags() / clearAppliedMetaTags()', () => {
  beforeEach(() => {
    // Strip everything we may have injected from a prior test.
    document.head.innerHTML = ''
    document.title = ''
  })

  it('injects each meta into document.head with the managed marker', () => {
    const tags: MetaTag[] = [
      { property: 'og:title', content: 'Hello' },
      { name: 'twitter:title', content: 'Hello' }
    ]
    applyMetaTags(tags, { title: 'Hello — Personal Blog', canonicalUrl: 'https://x/y' })

    const og = document.head.querySelector('meta[property="og:title"]') as HTMLMetaElement
    expect(og?.content).toBe('Hello')
    expect(og?.getAttribute(MANAGED_META_ATTR)).not.toBeNull()

    const tw = document.head.querySelector('meta[name="twitter:title"]') as HTMLMetaElement
    expect(tw?.content).toBe('Hello')
    expect(tw?.getAttribute(MANAGED_META_ATTR)).not.toBeNull()
  })

  it('updates document.title from the options', () => {
    applyMetaTags([], { title: 'My Post — Personal Blog', canonicalUrl: 'https://x/y' })
    expect(document.title).toBe('My Post — Personal Blog')
  })

  it('emits a managed canonical <link rel="canonical">', () => {
    applyMetaTags([], { title: 't', canonicalUrl: 'https://blog.multilab.cc/pages/post/post?id=x' })
    const link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement
    expect(link?.href).toBe('https://blog.multilab.cc/pages/post/post?id=x')
    expect(link?.getAttribute(MANAGED_META_ATTR)).not.toBeNull()
  })

  it('is idempotent — re-applying replaces the previous managed tags, not duplicates', () => {
    applyMetaTags([{ property: 'og:title', content: 'First' }], {
      title: 't',
      canonicalUrl: 'https://x/y'
    })
    applyMetaTags([{ property: 'og:title', content: 'Second' }], {
      title: 't',
      canonicalUrl: 'https://x/y'
    })
    const all = document.head.querySelectorAll('meta[property="og:title"]')
    expect(all.length).toBe(1)
    expect((all[0] as HTMLMetaElement).content).toBe('Second')
  })

  it('clearAppliedMetaTags() removes all managed tags + canonical link', () => {
    applyMetaTags([{ property: 'og:title', content: 'X' }], {
      title: 't',
      canonicalUrl: 'https://x/y'
    })
    clearAppliedMetaTags()
    expect(document.head.querySelectorAll(`[${MANAGED_META_ATTR}]`).length).toBe(0)
  })

  it('clearAppliedMetaTags() leaves unmanaged head elements alone', () => {
    const keep = document.createElement('meta')
    keep.setAttribute('name', 'theme-color')
    keep.setAttribute('content', '#2563eb')
    document.head.appendChild(keep)

    applyMetaTags([{ property: 'og:title', content: 'X' }], {
      title: 't',
      canonicalUrl: 'https://x/y'
    })
    clearAppliedMetaTags()

    const survivor = document.head.querySelector('meta[name="theme-color"]')
    expect(survivor).not.toBeNull()
  })
})

// Issue A: static index.html ships og:* + twitter:* + canonical fallbacks.
// If applyMetaTags only appended new tags, head would carry two og:title
// (one static "Personal Blog", one dynamic post title); Twitter/Facebook
// crawlers pick the first occurrence, so the dynamic value would be
// silently ignored. The applier must temporarily stash conflicting static
// nodes during apply, and restore them on clear, so head always carries
// exactly one of each name/property at a time.
describe('applyMetaTags() — Issue A: override static fallback', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.title = 'Personal Blog'
  })

  it('detaches static og:title before injecting the managed one', () => {
    const fallback = document.createElement('meta')
    fallback.setAttribute('property', 'og:title')
    fallback.setAttribute('content', 'Personal Blog')
    document.head.appendChild(fallback)

    applyMetaTags([{ property: 'og:title', content: 'My Article' }], {
      title: 'My Article — Personal Blog',
      canonicalUrl: 'https://blog.multilab.cc/pages/post/post?id=42'
    })

    const all = document.head.querySelectorAll('meta[property="og:title"]')
    expect(all.length).toBe(1)
    expect((all[0] as HTMLMetaElement).content).toBe('My Article')
    expect(all[0].getAttribute(MANAGED_META_ATTR)).not.toBeNull()
  })

  it('detaches static <link rel="canonical"> before injecting the managed one', () => {
    const fallback = document.createElement('link')
    fallback.setAttribute('rel', 'canonical')
    fallback.setAttribute('href', 'https://blog.multilab.cc/')
    document.head.appendChild(fallback)

    applyMetaTags([], {
      title: 'X',
      canonicalUrl: 'https://blog.multilab.cc/pages/post/post?id=42'
    })

    const all = document.head.querySelectorAll('link[rel="canonical"]')
    expect(all.length).toBe(1)
    expect((all[0] as HTMLLinkElement).href).toBe(
      'https://blog.multilab.cc/pages/post/post?id=42'
    )
  })

  it('restores stashed static fallbacks on clearAppliedMetaTags', () => {
    const ogTitle = document.createElement('meta')
    ogTitle.setAttribute('property', 'og:title')
    ogTitle.setAttribute('content', 'Personal Blog')
    document.head.appendChild(ogTitle)

    const canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    canonical.setAttribute('href', 'https://blog.multilab.cc/')
    document.head.appendChild(canonical)

    applyMetaTags([{ property: 'og:title', content: 'Article' }], {
      title: 'Article — Personal Blog',
      canonicalUrl: 'https://blog.multilab.cc/pages/post/post?id=1'
    })
    clearAppliedMetaTags()

    const og = document.head.querySelector('meta[property="og:title"]') as HTMLMetaElement
    expect(og?.content).toBe('Personal Blog')
    expect(og?.getAttribute(MANAGED_META_ATTR)).toBeNull()

    const link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement
    expect(link?.href).toBe('https://blog.multilab.cc/')
    expect(link?.getAttribute(MANAGED_META_ATTR)).toBeNull()
  })

  it('restores document.title to its pre-apply value on clear', () => {
    document.title = 'Personal Blog'
    applyMetaTags([], {
      title: 'Article — Personal Blog',
      canonicalUrl: 'https://x/y'
    })
    expect(document.title).toBe('Article — Personal Blog')
    clearAppliedMetaTags()
    expect(document.title).toBe('Personal Blog')
  })

  it('round-trips correctly across two apply/clear cycles', () => {
    document.title = 'Personal Blog'
    const fallback = document.createElement('meta')
    fallback.setAttribute('property', 'og:title')
    fallback.setAttribute('content', 'Personal Blog')
    document.head.appendChild(fallback)

    applyMetaTags([{ property: 'og:title', content: 'A' }], {
      title: 'A',
      canonicalUrl: 'https://x/a'
    })
    clearAppliedMetaTags()
    applyMetaTags([{ property: 'og:title', content: 'B' }], {
      title: 'B',
      canonicalUrl: 'https://x/b'
    })
    clearAppliedMetaTags()

    const og = document.head.querySelector('meta[property="og:title"]') as HTMLMetaElement
    expect(og?.content).toBe('Personal Blog')
    expect(og?.getAttribute(MANAGED_META_ATTR)).toBeNull()
    expect(document.title).toBe('Personal Blog')
  })
})