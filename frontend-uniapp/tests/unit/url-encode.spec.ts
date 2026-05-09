import { describe, expect, it } from 'vitest'
import { urlEncodePath } from '@/composables/url-encode'

describe('urlEncodePath', () => {
  it('returns empty input unchanged', () => {
    expect(urlEncodePath('')).toBe('')
  })

  it('preserves ASCII paths', () => {
    expect(urlEncodePath('/posts/hello/world.md')).toBe('/posts/hello/world.md')
  })

  it('encodes Chinese segments while preserving slashes', () => {
    expect(urlEncodePath('/posts/游戏开发/Unity.md')).toBe(
      '/posts/%E6%B8%B8%E6%88%8F%E5%BC%80%E5%8F%91/Unity.md'
    )
  })

  it('encodes spaces as %20 (not +)', () => {
    expect(urlEncodePath('/path/file name.png')).toBe('/path/file%20name.png')
  })

  it('encodes full-width brackets', () => {
    expect(urlEncodePath('/posts/文章（1）.md')).toBe('/posts/%E6%96%87%E7%AB%A0%EF%BC%881%EF%BC%89.md')
  })

  it('is idempotent — already-encoded path round-trips', () => {
    const once = urlEncodePath('/posts/游戏开发/Unity.md')
    const twice = urlEncodePath(once)
    expect(twice).toBe(once)
  })

  it('normalizes backslashes to forward slashes', () => {
    expect(urlEncodePath('public\\images\\foo.png')).toBe('public/images/foo.png')
  })

  it('passes through consecutive slashes (empty segments)', () => {
    expect(urlEncodePath('/posts//double.md')).toBe('/posts//double.md')
  })

  it('handles broken percent sequences without throwing', () => {
    // %ZZ is not a valid escape; decodeURIComponent throws, so we fall back to encodeURIComponent.
    const out = urlEncodePath('/path/%ZZbad')
    expect(out.startsWith('/path/')).toBe(true)
    expect(out).toContain('%')
  })
})
