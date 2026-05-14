// F8 (Phase 7 / SPEC §13.7 P3): KaTeX integration tests.
// We hook marked-katex-extension into composables/markdown.ts so the
// graphics + physics-engine notes can render LaTeX inline. These
// tests pin both the new behavior and the regression-sensitive bits
// of the existing renderer (image lazy-load, hljs code blocks).

import { describe, expect, it } from 'vitest'
import { renderMarkdown } from '@/composables/markdown'

describe('renderMarkdown — KaTeX (F8)', () => {
  it('renders inline math `$...$` as a katex span with class', () => {
    const html = renderMarkdown('Pythagoras: $a^2 + b^2 = c^2$.')
    // KaTeX output uses <span class="katex">...</span> wrapper.
    expect(html).toContain('class="katex"')
    // Must NOT keep the raw $...$ delimiters in the rendered output.
    expect(html).not.toMatch(/\$a\^2/)
  })

  it('renders block math `$$...$$` as a katex-display block', () => {
    const html = renderMarkdown('$$\\int_0^1 x^2 \\, dx$$')
    expect(html).toContain('katex-display')
  })

  it('escapes operators correctly (no XSS via math input)', () => {
    // marked-katex-extension HTML-escapes user content before passing
    // it to katex; raw <script> in math source must not survive.
    const html = renderMarkdown('$<script>alert(1)</script>$')
    expect(html).not.toContain('<script>alert(1)</script>')
  })

  it('still emits hljs code blocks (regression: A1 / T-FIX-3)', () => {
    const html = renderMarkdown('```js\nconst x = 1;\n```')
    expect(html).toContain('class="hljs language-js"')
    expect(html).toContain('hljs-keyword')
  })

  it('still emits lazy-loaded images (regression: F7-A5)', () => {
    const html = renderMarkdown('![x](/images/y.png)')
    expect(html).toContain('loading="lazy"')
  })

  it('does not break paragraphs that have a single literal $', () => {
    // A common case in shell prompts: "$ npm test" should not start a
    // math block. marked-katex-extension by default requires matching
    // delimiters, so a lone `$` should pass through.
    const html = renderMarkdown('Run `$ npm test` to begin.')
    // The `$ npm test` is inside an inline code span, so it stays raw.
    expect(html).toContain('<code>$ npm test</code>')
  })
})
