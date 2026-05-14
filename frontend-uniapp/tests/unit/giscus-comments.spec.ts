// F5 (SPEC §13.7 P2): structural tests for the giscus widget integration.
// The component and post.vue embed both run inside uni-app at runtime,
// so we lock in their structure with file-level regex assertions
// instead of mounting them.

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const frontendRoot = path.resolve(__dirname, '..', '..')
const componentPath = path.join(frontendRoot, 'components', 'giscus-comments.vue')
const postPath = path.join(frontendRoot, 'pages', 'post', 'post.vue')
const readmePath = path.resolve(frontendRoot, '..', 'README.md')

describe('components/giscus-comments.vue', () => {
  it('exists', () => {
    expect(existsSync(componentPath)).toBe(true)
  })

  const src = existsSync(componentPath) ? readFileSync(componentPath, 'utf8') : ''

  it('imports the giscus composable', () => {
    expect(src).toMatch(/from\s+['"]@\/composables\/giscus['"]/)
  })

  it('imports the theme store so the widget tracks light/dark', () => {
    expect(src).toMatch(/from\s+['"]@\/stores\/theme['"]/)
  })

  it('declares a "term" prop (mapped to giscus data-term)', () => {
    expect(src).toMatch(/term[^,]*:\s*\{[\s\S]{0,80}type:\s*String|defineProps[^>]*term/)
  })

  it('renders a fallback message when giscus is NOT configured', () => {
    // The fallback keeps the page friendly while owner activation is pending.
    expect(src).toMatch(/v-if=["'][^"']*configured/)
    expect(src).toMatch(/giscus|评论/)
  })

  it('uses isGiscusConfigured to gate the widget mount', () => {
    expect(src).toMatch(/isGiscusConfigured/)
  })

  it('mounts the giscus script via buildGiscusScriptAttrs', () => {
    expect(src).toMatch(/buildGiscusScriptAttrs/)
  })

  it('cleans up the script element on unmount (avoid double-mount on SPA nav)', () => {
    expect(src).toMatch(/onBeforeUnmount|onUnmounted/)
  })
})

describe('pages/post/post.vue (giscus embed)', () => {
  const src = readFileSync(postPath, 'utf8')

  it('imports GiscusComments component', () => {
    expect(src).toMatch(/from\s+['"]@\/components\/giscus-comments\.vue['"]/)
  })

  it('renders <GiscusComments :term="..."/> after the markdown body', () => {
    // Order check: the markdown-body template element must appear before
    // the GiscusComments tag, so the comments sit at the bottom of the
    // article. We anchor on the template attribute / tag (not the import
    // line) to avoid matching the script-block import order.
    const bodyIdx = src.indexOf('class="markdown-body"')
    const giscusIdx = src.search(/<GiscusComments|<giscus-comments/)
    expect(bodyIdx).toBeGreaterThan(-1)
    expect(giscusIdx).toBeGreaterThan(bodyIdx)
  })

  it('passes post.id as the giscus term (stable per-post discussion key)', () => {
    expect(src).toMatch(/:term=["']post\.id["']/)
  })
})

describe('README.md (owner activation steps)', () => {
  const src = existsSync(readmePath) ? readFileSync(readmePath, 'utf8') : ''

  it('documents the giscus activation flow', () => {
    // Look for the section heading + at least the three required activation steps.
    expect(src).toMatch(/giscus|评论/)
    expect(src).toMatch(/Discussions/)
    expect(src).toMatch(/giscus\.app/)
    expect(src).toMatch(/composables\/giscus\.ts|giscus\.ts/)
  })
})
