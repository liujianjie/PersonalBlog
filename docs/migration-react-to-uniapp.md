# React (main branch) -> uni-app (uniapp-rewrite) migration notes

> Snapshot of how the rewrite mapped React/Vite/Tailwind concepts to
> Vue 3/uni-app/UnoCSS. Useful when (a) reading old commits on `main`
> next to new ones on `uniapp-rewrite`, or (b) explaining a specific
> "why is this different from the React version" question.

## Stack-by-stack mapping

| Concern | React version (main) | uni-app version (uniapp-rewrite) |
|---|---|---|
| Framework | React 18 + react-dom | Vue 3.4 + @dcloudio/uni-app + @dcloudio/uni-h5 |
| Build | Vite 5 (React preset) | Vite 5 + @dcloudio/vite-plugin-uni (wrapped via `scripts/uni-run.mjs`) |
| Routing | react-router-dom v6 | uni-app pages.json (h5.router.mode = "history") |
| State | Local component state | Pinia (`stores/theme.ts`) |
| Styling | Tailwind CSS + handwritten CSS | UnoCSS preset-uno + CSS custom properties (`styles/theme.css`) |
| Markdown | react-markdown + remark-gfm + rehype-highlight | marked + highlight.js (`composables/markdown.ts`) |
| Search | n/a | MiniSearch (`composables/search.ts` + `scripts/gen-search-index.mjs`) |
| Type system | TypeScript ~3000 lines | TypeScript ~3000 lines |
| Hosting | GitHub Pages, base `/PersonalBlog/` | Caddy on `127.0.0.1:48080`, base `/`, fronted by Cloudflare Tunnel |
| URL paths | `/post/12` (BrowserRouter) | `/pages/post/post?id=12` (uni-app default H5 layout) |

## Component-by-component

| React file | uni-app file | Notes |
|---|---|---|
| `src/App.tsx` | `App.vue` | Top-level shell; theme initialization moved to `stores/theme.ts` |
| `src/main.tsx` | `main.ts` | createApp + Pinia + uni-app boot |
| `src/components/Layout.tsx` | `components/site-header.vue` | Header split out as a component reused on every page |
| `src/components/PostCard.tsx` | `components/post-card.vue` | Same data shape (`Post` type). Tailwind classes -> UnoCSS classes (mostly identical Tailwind-like syntax) |
| `src/components/ThemeToggle.tsx` | `components/theme-toggle.vue` | `useState` -> Pinia store; cycles light/dark/auto |
| `src/components/SearchBox.tsx` | `components/search-box.vue` | New (no React equivalent). Header search input -> `/pages/search/search?q=<term>` |
| `src/pages/Home.tsx` | `pages/index/index.vue` | Lists post cards; reads `data/posts.ts` directly |
| `src/pages/PostDetail.tsx` | `pages/post/post.vue` | Reads `mdFile` URL via `uni.request`, runs through `renderMarkdown`. `v-html` instead of `dangerouslySetInnerHTML` |
| `src/pages/Tag.tsx` | `pages/tag/tag.vue` | Same logic; `composables/tags.ts` aggregates |
| `src/pages/Search.tsx` (n/a) | `pages/search/search.vue` | New; lazy-loads search-index.json and renders `.hit` blocks |
| `src/data/posts.ts` | `data/posts.ts` (`git mv`) | Moved verbatim. Only edit: `mdFile` and `coverImage` paths changed from `/PersonalBlog/...` to `/static/...` (no GH Pages base prefix) |
| `src/types/index.ts` | `types/index.ts` | `Post` type 1:1 |

## Library-by-library swaps

### react-markdown -> marked + highlight.js

`react-markdown` is a JSX-tree generator. `marked` returns a string of
HTML, which we render with `v-html`. The content sanitizer changes:

- React: trusted via `react-markdown`'s default rules
- Vue: marked's output goes through `v-html` *unsanitized* (we trust
  our own posts; if we ever add user-submitted content this becomes
  unsafe)

Custom renderer in `composables/markdown.ts` rewrites image `src`
through `composables/url-encode.ts` so Chinese paths are URL-encoded
exactly like the React version did via the `add-article.ps1` import
script. Code blocks pass through highlight.js with class
`hljs language-<lang>`; the highlight.js stylesheet (atom-one-dark
flavor) is loaded once globally in `App.vue`.

### react-router -> uni-app pages.json

In React: `<BrowserRouter>` + `<Routes>` + `useNavigate`/`useParams`.
In uni-app: pages declared in `pages.json`; `onLoad((options) => ...)`
gives query params, `uni.navigateTo({ url: ... })` navigates. URL shape
is fixed to `/pages/<group>/<page>?<query>` because uni-app's H5 router
is built around the file layout. SPA fallback in Caddy
(`try_files {path} /index.html`) makes deep-link refresh work the same
as the React version did under GH Pages 404 redirect.

### Tailwind -> UnoCSS

Tailwind utility names are mostly preserved (UnoCSS's `presetUno`
mirrors them). Theme colors moved from Tailwind config to CSS custom
properties (`--bg`, `--fg`, `--accent`, ...) in `styles/theme.css`
because uni-app components don't see Tailwind's runtime classes the
same way React does. Theme switching now flips `data-theme="dark"` on
`<html>`; the CSS variables re-resolve.

### Local image pipeline (unchanged)

`scripts/add-article.ps1` and `scripts/batch-add-articles.ps1` are kept
verbatim from `main` - they target `frontend-uniapp/static/posts/...`
and `frontend-uniapp/static/images/...` instead of `public/posts/...`
and `public/images/...`, but the URL-encoding logic is identical.

## What's deliberately not migrated

- `index.html`, `vite.config.ts`, `tailwind.config.js`,
  `postcss.config.js` at the repo root (React-side configs). They stay
  on `main`; the uniapp branch gets its own under `frontend-uniapp/`.
- `src/` (React source). Left in place on `main`.
- The repo-root `package.json` (React-side dependencies). It stays for
  whatever tooling we still run at the repo root (e.g. `add-article.ps1`
  uses no Node packages, so this could go - but no urgency).

## Verifying the migration

Run from `frontend-uniapp/`:

```powershell
pnpm install
pnpm dev:h5            # http://localhost:5174
pnpm typecheck         # vue-tsc; expect 0 errors
pnpm test:unit         # vitest; 86/86 tests as of T17
```

Or for a full prod E2E (boots Caddy on `site/`):

```powershell
powershell -File scripts/publish.ps1
powershell -File scripts/diagnose-prod.ps1   # expect 17/17 PASS
```
