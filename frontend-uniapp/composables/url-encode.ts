/**
 * URL-encode a path, segment-wise, idempotent.
 *
 * Mirrors the PowerShell add-article.ps1 / batch-add-articles.ps1 pipeline that
 * encodes Chinese path segments before writing them into .md files. Already-
 * encoded inputs round-trip cleanly (decode then encode), so calling this
 * twice is safe.
 *
 * Behavior:
 *   - "/" separators are preserved (we only encode segments).
 *   - Spaces become %20 (not +; encodeURIComponent already does %20, but we
 *     also strip stray + in case someone fed us application/x-www-form-urlencoded
 *     style input).
 *   - Empty segments (consecutive slashes) are passed through.
 */
export function urlEncodePath(input: string): string {
  if (!input) return input
  const normalized = input.replace(/\\/g, '/')
  return normalized
    .split('/')
    .map((segment) => {
      if (!segment) return segment
      try {
        return encodeURIComponent(decodeURIComponent(segment)).replace(/\+/g, '%20')
      } catch {
        return encodeURIComponent(segment).replace(/\+/g, '%20')
      }
    })
    .join('/')
}
