import { Marked } from 'marked'
import hljs from 'highlight.js'
import { urlEncodePath } from './url-encode'

const marked = new Marked({
  gfm: true,
  breaks: false
})

marked.use({
  renderer: {
    image({ href, title, text }) {
      const safeHref = href ? urlEncodePath(href) : ''
      const safeText = (text || '').replace(/"/g, '&quot;')
      const titleAttr = title ? ` title="${title.replace(/"/g, '&quot;')}"` : ''
      return `<img src="${safeHref}" alt="${safeText}"${titleAttr} loading="lazy" />`
    },
    code({ text, lang }) {
      const requested = (lang || '').trim().split(/\s+/)[0]
      const language = requested && hljs.getLanguage(requested) ? requested : 'plaintext'
      let highlighted: string
      try {
        highlighted = hljs.highlight(text, { language, ignoreIllegals: true }).value
      } catch {
        highlighted = escapeHtml(text)
      }
      return `<pre class="hljs"><code class="hljs language-${language}">${highlighted}</code></pre>\n`
    }
  }
})

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function renderMarkdown(md: string): string {
  if (!md) return ''
  return marked.parse(md) as string
}
