// Generate search-index.json for client-side full-text search.
//
// Pure helpers (stripMarkdown / parsePostsTs / buildSearchIndex) are exported
// for unit tests; the file also runs as a CLI when invoked directly:
//   node frontend-uniapp/scripts/gen-search-index.mjs
// Reads frontend-uniapp/data/posts.ts + each post's mdFile under
// frontend-uniapp/static/, writes frontend-uniapp/static/search-index.json.
// Lives inside frontend-uniapp/ so `import 'minisearch'` resolves against
// the package's own node_modules.

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import MiniSearch from 'minisearch'

export const SEARCH_FIELDS = ['title', 'excerpt', 'tags', 'body']
export const SEARCH_STORE_FIELDS = ['id', 'title', 'excerpt', 'date', 'tags']
const BODY_CHAR_LIMIT = 500

export function stripMarkdown(md) {
  if (!md) return ''
  let s = String(md)
  s = s.replace(/```[\s\S]*?```/g, ' ')
  s = s.replace(/~~~[\s\S]*?~~~/g, ' ')
  s = s.replace(/`([^`]+)`/g, '$1')
  s = s.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  s = s.replace(/^>\s?/gm, '')
  s = s.replace(/^#+\s+/gm, '')
  s = s.replace(/^\s*[-*+]\s+/gm, '')
  s = s.replace(/^\s*\d+\.\s+/gm, '')
  s = s.replace(/(\*\*|__)(.+?)\1/g, '$2')
  s = s.replace(/(\*|_)(.+?)\1/g, '$2')
  s = s.replace(/~~(.+?)~~/g, '$1')
  s = s.replace(/<[^>]+>/g, ' ')
  s = s.replace(/\s+/g, ' ').trim()
  return s
}

export function parsePostsTs(src) {
  const stripped = String(src)
    .replace(/^\s*import\s+[^;]*;?\s*$/gm, '')
    .replace(/:\s*Post\[\]/g, '')
    .replace(/^\s*export\s+/gm, '')
  const fn = new Function(`${stripped}\n;return posts;`)
  const posts = fn()
  if (!Array.isArray(posts)) {
    throw new Error('parsePostsTs: posts.ts did not export an array named "posts"')
  }
  return posts
}

export async function buildSearchIndex(posts, fetchBody) {
  const docs = []
  for (const p of posts) {
    let body = ''
    if (p.mdFile) {
      try {
        const raw = await fetchBody(p.mdFile)
        body = stripMarkdown(raw).slice(0, BODY_CHAR_LIMIT)
      } catch {
        body = ''
      }
    } else if (p.content) {
      body = stripMarkdown(p.content).slice(0, BODY_CHAR_LIMIT)
    }
    docs.push({
      id: p.id,
      title: p.title || '',
      excerpt: p.excerpt || '',
      tags: Array.isArray(p.tags) ? p.tags.join(' ') : '',
      body,
      date: p.date || ''
    })
  }
  const ms = new MiniSearch({
    fields: SEARCH_FIELDS,
    storeFields: SEARCH_STORE_FIELDS,
    idField: 'id'
  })
  // We index tags as a joined string (so MiniSearch can score per token),
  // but the UI wants to render an array of chips. Pass strings to addAll(),
  // then patch the serialized storedFields back to arrays before writing.
  ms.addAll(docs.map(d => ({ ...d, tags: d.tags })))
  const json = JSON.stringify(ms)
  const parsed = JSON.parse(json)
  if (parsed.storedFields && parsed.documentIds) {
    for (const shortId of Object.keys(parsed.storedFields)) {
      const docId = parsed.documentIds[shortId]
      const post = posts.find(p => String(p.id) === String(docId))
      if (post && Array.isArray(post.tags)) {
        parsed.storedFields[shortId].tags = post.tags
      }
    }
  }
  return JSON.stringify(parsed)
}

async function loadPostsFromFile(postsTsPath) {
  const src = await readFile(postsTsPath, 'utf8')
  return parsePostsTs(src)
}

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const frontendRoot = path.resolve(here, '..')
  const postsTsPath = path.join(frontendRoot, 'data', 'posts.ts')
  const outPath = path.join(frontendRoot, 'static', 'search-index.json')

  const posts = await loadPostsFromFile(postsTsPath)
  const fetchBody = async (mdFile) => {
    // mdFile is /static/posts/... and frontend serves ./static at root,
    // so on disk the file lives at frontend-uniapp/static/posts/...
    const rel = mdFile.replace(/^\/+/, '')
    const fsPath = path.join(frontendRoot, rel)
    return readFile(fsPath, 'utf8')
  }
  const json = await buildSearchIndex(posts, fetchBody)
  await writeFile(outPath, json, 'utf8')
  const sizeKb = (Buffer.byteLength(json, 'utf8') / 1024).toFixed(1)
  console.log(`[gen-search-index] wrote ${outPath} (${posts.length} posts, ${sizeKb} KB)`)
}

const invokedDirect =
  import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` ||
  import.meta.url.endsWith(path.basename(process.argv[1] || ''))

if (invokedDirect) {
  main().catch((err) => {
    console.error('[gen-search-index] failed:', err)
    process.exit(1)
  })
}
