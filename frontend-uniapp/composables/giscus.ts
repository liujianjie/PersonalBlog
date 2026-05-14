// Giscus comments configuration + helpers (F5 / SPEC §13.7 P2).
//
// Owner activation (one-time, see README.md "评论 (giscus) 启用步骤"):
//   1. Enable Discussions on github.com/liujianjie/PersonalBlog
//   2. Install the giscus GitHub App on the repo
//   3. Visit https://giscus.app, fill the form, copy the four ids
//   4. Replace the four <YOUR_*> placeholders below with the real ids
//
// Until then, isGiscusConfigured() returns false and the widget shows
// a friendly fallback message instead of mounting an unconfigured iframe.

export type GiscusMapping = 'pathname' | 'url' | 'title' | 'og:title' | 'specific' | 'number'
export type GiscusInputPosition = 'top' | 'bottom'
export type GiscusLoading = 'lazy' | 'eager'
export type GiscusTheme = 'light' | 'dark'

export interface GiscusConfig {
  /** GitHub repo slug, e.g. "liujianjie/PersonalBlog". */
  repo: string
  /** Repo node id (looks like "R_kgDO..."), from giscus.app. */
  repoId: string
  /** Discussion category name, usually "General" or "Comments". */
  category: string
  /** Category node id (looks like "DIC_kwDO..."), from giscus.app. */
  categoryId: string
  /** Discussion-to-page mapping strategy. "specific" + a per-post term is recommended. */
  mapping: GiscusMapping
  /** Strict title matching - keep true for new sites. */
  strict: boolean
  reactionsEnabled: boolean
  /** Whether to emit messages to the parent on each render. */
  emitMetadata: boolean
  inputPosition: GiscusInputPosition
  /** UI language: "zh-CN", "en", etc. */
  lang: string
  loading: GiscusLoading
}

/**
 * Default config — placeholders. Replace the four <YOUR_*> values
 * after running the giscus.app form. The other fields are defaults
 * suitable for this blog and rarely need tuning.
 */
export const giscusConfig: GiscusConfig = {
  repo: '<YOUR_REPO>',
  repoId: '<YOUR_REPO_ID>',
  category: '<YOUR_CATEGORY>',
  categoryId: '<YOUR_CATEGORY_ID>',
  mapping: 'specific',
  strict: true,
  reactionsEnabled: true,
  emitMetadata: false,
  inputPosition: 'bottom',
  lang: 'zh-CN',
  loading: 'lazy'
}

/** True only when none of the four required ids still hold a placeholder. */
export function isGiscusConfigured(cfg: GiscusConfig = giscusConfig): boolean {
  const required = [cfg.repo, cfg.repoId, cfg.category, cfg.categoryId]
  return required.every((v) => typeof v === 'string' && v.length > 0 && !v.includes('<YOUR_'))
}

export const GISCUS_SCRIPT_SRC = 'https://giscus.app/client.js'

export interface GiscusMountOptions {
  /** Per-post discussion key (used when mapping is "specific" or "number"). */
  term: string
  theme: GiscusTheme
}

/** Build the data-* / async / crossorigin attribute set the giscus loader expects. */
export function buildGiscusScriptAttrs(
  cfg: GiscusConfig,
  opts: GiscusMountOptions
): Record<string, string> {
  const attrs: Record<string, string> = {
    'src': GISCUS_SCRIPT_SRC,
    'data-repo': cfg.repo,
    'data-repo-id': cfg.repoId,
    'data-category': cfg.category,
    'data-category-id': cfg.categoryId,
    'data-mapping': cfg.mapping,
    'data-strict': cfg.strict ? '1' : '0',
    'data-reactions-enabled': cfg.reactionsEnabled ? '1' : '0',
    'data-emit-metadata': cfg.emitMetadata ? '1' : '0',
    'data-input-position': cfg.inputPosition,
    'data-theme': opts.theme,
    'data-lang': cfg.lang,
    'data-loading': cfg.loading,
    'crossorigin': 'anonymous',
    'async': ''
  }
  // giscus only honors data-term for term-based mappings.
  if (cfg.mapping === 'specific' || cfg.mapping === 'number') {
    attrs['data-term'] = opts.term
  }
  return attrs
}

/**
 * Inject the giscus <script> into `target`. Returns a teardown that
 * removes the injected script + the rendered iframe so the widget can
 * be re-mounted on SPA navigation between posts.
 */
export function mountGiscus(
  target: HTMLElement,
  cfg: GiscusConfig,
  opts: GiscusMountOptions
): () => void {
  const script = document.createElement('script')
  const attrs = buildGiscusScriptAttrs(cfg, opts)
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'async') {
      script.async = true
    } else {
      script.setAttribute(k, v)
    }
  }
  target.appendChild(script)
  return () => {
    if (script.parentNode === target) target.removeChild(script)
    // giscus injects an <iframe class="giscus-frame"> sibling; clean it up too.
    const frames = target.querySelectorAll('iframe.giscus-frame, .giscus')
    frames.forEach((el) => el.parentNode?.removeChild(el))
  }
}
