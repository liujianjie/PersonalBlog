// Regression guard for F2 (SPEC §13.7 DoD #15): post-card tag chips
// must navigate to /pages/tag/tag?name=<tag> on click, and the click
// must NOT bubble up to the card's open-post handler. The behavior was
// already shipped in T08; this test locks it in so a future refactor
// can't quietly break it.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const cardPath = path.resolve(__dirname, '..', '..', 'components', 'post-card.vue')
const src = readFileSync(cardPath, 'utf8')

describe('post-card.vue tag chip click behavior (F2)', () => {
  it('defines an openTag handler that stops event propagation', () => {
    // Without stopPropagation, clicking a tag would also trigger the
    // outer card click and navigate to the post detail.
    expect(src).toMatch(/function\s+openTag[\s\S]{0,200}stopPropagation/)
  })

  it('openTag navigates to /pages/tag/tag with encoded tag name', () => {
    expect(src).toMatch(/\/pages\/tag\/tag\?name=\$\{encodeURIComponent\(tag\)\}/)
  })

  it('each tag chip in template binds @click to openTag', () => {
    expect(src).toMatch(/@click=["']openTag\(tag,\s*\$event\)["']/)
  })

  it('outer post-card has its own @click distinct from openTag', () => {
    // The card-level click goes to `open` (post detail).
    expect(src).toMatch(/<view\s+class="post-card"[^>]*@click="open"/)
  })
})
