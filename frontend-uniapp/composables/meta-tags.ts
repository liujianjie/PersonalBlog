// F9 (SPEC §13.7 P3): OG / Twitter Card meta-tag injection.
//
// Why: SPA crawlers (微信 / Twitter / Discord / Slack / Telegram) read
// <head> meta to render link-unfurl cards. uni-app/Vue 3 ships an empty
// stub head per route, so we have to mutate document.head ourselves at
// onLoad time and clean it up on unload. We split into pure builders +
// a small DOM applier so the builders are unit-testable without a DOM.
//
// See also:
// - frontend-uniapp/index.html — site-level fallback meta for non-JS crawlers
// - tests/unit/meta-tags.spec.ts — contract test pinning the tag shape

import type { Post } from '../types'
import { urlEncodePath } from './url-encode'

export interface SiteMetaConfig {
  /** Site name (also used for og:site_name and as title suffix). */
  siteName: string
  /** Production base URL. No trailing slash. */
  baseUrl: string
  /** Title shown on the home / non-article pages. */
  defaultTitle: string
  /** Description shown when no post-specific excerpt exists. */
  defaultDescription: string
  /** Default OG image (relative path or absolute URL). Required. */
  defaultImage: string
  /** Optional Twitter handle (with leading @). Empty string disables. */
  twitterHandle: string
}

/**
 * One meta tag descriptor. Use exactly one of `name` (Twitter / generic) or
 * `property` (OpenGraph / Facebook). The applier emits `<meta name="..." />`
 * or `<meta property="..." />` accordingly.
 */
export interface MetaTag {
  name?: string
  property?: string
  content: string
}

export interface ApplyMetaOptions {
  /** Document title. Usually `${post.title} — ${siteName}` for posts. */
  title: string
  /** Absolute URL for <link rel="canonical">. */
  canonicalUrl: string
}

/** data-* attribute used to mark meta we manage so we can clean them up. */
export const MANAGED_META_ATTR = 'data-managed-by-meta-tags'

/**
 * Static fallback nodes from index.html that we temporarily detach during
 * applyMetaTags() and re-attach during clearAppliedMetaTags(). Keeping head
 * single-source-of-truth per name/property prevents Twitter/Facebook
 * crawlers from picking the static fallback over the dynamic managed tag
 * (they take the first occurrence). Module-level so the stash survives
 * across the apply/clear pair within a single page lifecycle.
 */
let stashedNodes: Element[] = []
/** document.title before the most recent applyMetaTags(); restored on clear. */
let stashedTitle: string | null = null

/**
 * Site-level defaults. Edit baseUrl + defaults here when domain or
 * hero copy changes; per-post values come from the Post object.
 */
export const siteMetaConfig: SiteMetaConfig = {
  siteName: 'Personal Blog',
  baseUrl: 'https://blog.multilab.cc',
  defaultTitle: 'Personal Blog',
  defaultDescription: '技术笔记 · Unity / OpenGL / 计算机基础',
  defaultImage: '/static/images/og-default.png',
  twitterHandle: ''
}

/**
 * Resolve a relative path to an absolute URL. Pass-through for already-absolute
 * URLs (http(s)://...). Chinese path segments are URL-encoded so social
 * crawlers that don't normalize Unicode get a fetchable URL.
 */
function toAbsoluteUrl(input: string, baseUrl: string): string {
  if (!input) return baseUrl
  if (/^https?:\/\//i.test(input)) return input
  // url-encode only the path segments; the leading "/" and base stay intact.
  const encoded = urlEncodePath(input)
  const path = encoded.startsWith('/') ? encoded : `/${encoded}`
  return `${baseUrl}${path}`
}

/**
 * Build the absolute canonical URL for a post page in uni-app h5 history mode.
 * Pages route is `/pages/post/post?id=<id>`.
 */
export function buildPostUrl(postId: string, baseUrl: string): string {
  return `${baseUrl}/pages/post/post?id=${encodeURIComponent(postId)}`
}

/** Build OG + Twitter + article:* meta tags for a single post. */
export function buildPostMetaTags(post: Post, config: SiteMetaConfig): MetaTag[] {
  const url = buildPostUrl(post.id, config.baseUrl)
  const image = toAbsoluteUrl(post.coverImage ?? config.defaultImage, config.baseUrl)
  const tags: MetaTag[] = [
    { name: 'description', content: post.excerpt },
    { property: 'og:type', content: 'article' },
    { property: 'og:title', content: post.title },
    { property: 'og:description', content: post.excerpt },
    { property: 'og:url', content: url },
    { property: 'og:image', content: image },
    { property: 'og:site_name', content: config.siteName },
    { property: 'og:locale', content: 'zh_CN' },
    { property: 'article:published_time', content: post.date },
    { property: 'article:author', content: post.author },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: post.title },
    { name: 'twitter:description', content: post.excerpt },
    { name: 'twitter:image', content: image }
  ]
  for (const tag of post.tags) {
    tags.push({ property: 'article:tag', content: tag })
  }
  if (config.twitterHandle) {
    tags.push({ name: 'twitter:site', content: config.twitterHandle })
    tags.push({ name: 'twitter:creator', content: config.twitterHandle })
  }
  return tags
}

/** Build the site-level (non-article) meta tags for the home / index page. */
export function buildSiteMetaTags(config: SiteMetaConfig): MetaTag[] {
  const image = toAbsoluteUrl(config.defaultImage, config.baseUrl)
  const url = `${config.baseUrl}/`
  const tags: MetaTag[] = [
    { name: 'description', content: config.defaultDescription },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: config.defaultTitle },
    { property: 'og:description', content: config.defaultDescription },
    { property: 'og:url', content: url },
    { property: 'og:image', content: image },
    { property: 'og:site_name', content: config.siteName },
    { property: 'og:locale', content: 'zh_CN' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: config.defaultTitle },
    { name: 'twitter:description', content: config.defaultDescription },
    { name: 'twitter:image', content: image }
  ]
  if (config.twitterHandle) {
    tags.push({ name: 'twitter:site', content: config.twitterHandle })
    tags.push({ name: 'twitter:creator', content: config.twitterHandle })
  }
  return tags
}

/**
 * Apply meta tags to document.head. Idempotent: re-applying replaces any
 * previously-managed tag with the same name/property instead of duplicating.
 * Also sets document.title and the managed canonical link.
 *
 * Static fallback nodes (e.g. the og:* tags shipped in index.html) that
 * collide with what we are about to inject are detached into a module-level
 * stash so head carries exactly one source of truth per name/property.
 * clearAppliedMetaTags() restores them.
 */
export function applyMetaTags(tags: MetaTag[], opts: ApplyMetaOptions): void {
  if (typeof document === 'undefined') return

  // Remove all previously managed elements first so we never leak duplicates,
  // and restore any previously-stashed static nodes so we re-stash a fresh
  // snapshot below (matters for back-to-back apply calls on different posts).
  clearAppliedMetaTags()

  // Stash static fallback nodes that match the incoming tags or the
  // canonical link, so they don't co-exist with the managed nodes.
  for (const tag of tags) {
    const selector = tag.property
      ? `meta[property="${cssEscape(tag.property)}"]`
      : tag.name
        ? `meta[name="${cssEscape(tag.name)}"]`
        : null
    if (!selector) continue
    detachUnmanaged(selector)
  }
  detachUnmanaged('link[rel="canonical"]')

  // Stash the current title so clear can restore it (non-article pages and
  // SPA back-navigation should see the index.html <title>).
  stashedTitle = document.title
  document.title = opts.title

  for (const tag of tags) {
    const meta = document.createElement('meta')
    if (tag.property) meta.setAttribute('property', tag.property)
    if (tag.name) meta.setAttribute('name', tag.name)
    meta.setAttribute('content', tag.content)
    meta.setAttribute(MANAGED_META_ATTR, '1')
    document.head.appendChild(meta)
  }

  const canonical = document.createElement('link')
  canonical.setAttribute('rel', 'canonical')
  canonical.setAttribute('href', opts.canonicalUrl)
  canonical.setAttribute(MANAGED_META_ATTR, '1')
  document.head.appendChild(canonical)
}

/** Detach unmanaged head elements matching the selector into the stash. */
function detachUnmanaged(selector: string): void {
  const els = document.head.querySelectorAll(`${selector}:not([${MANAGED_META_ATTR}])`)
  els.forEach((el) => {
    stashedNodes.push(el)
    el.parentNode?.removeChild(el)
  })
}

/**
 * Minimal CSS.escape polyfill scoped to the characters that actually appear
 * in OG / Twitter property/name values (alphanumerics, ':', '-', '_'). We
 * avoid pulling in CSS.escape because happy-dom in tests doesn't expose it
 * and the input here is fully controlled by buildPostMetaTags.
 */
function cssEscape(value: string): string {
  return value.replace(/["\\]/g, '\\$&')
}

/**
 * Remove every <head> element we previously injected via applyMetaTags(),
 * restore any static fallback nodes we had stashed, and restore the
 * pre-apply document.title.
 */
export function clearAppliedMetaTags(): void {
  if (typeof document === 'undefined') return
  const managed = document.head.querySelectorAll(`[${MANAGED_META_ATTR}]`)
  managed.forEach((el) => el.parentNode?.removeChild(el))

  for (const node of stashedNodes) {
    document.head.appendChild(node)
  }
  stashedNodes = []

  if (stashedTitle !== null) {
    document.title = stashedTitle
    stashedTitle = null
  }
}
