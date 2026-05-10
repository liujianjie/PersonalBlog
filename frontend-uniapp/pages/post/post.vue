<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import SiteHeader from '@/components/site-header.vue'
import { posts } from '@/data/posts'
import { renderMarkdown } from '@/composables/markdown'
import type { Post } from '@/types'

const post = ref<Post | null>(null)
const html = ref('')
const loading = ref(true)
const error = ref<string | null>(null)

const tagList = computed(() => post.value?.tags ?? [])

onLoad((options) => {
  const id = options?.id ? String(options.id) : ''
  if (!id) {
    error.value = '缺少文章 id'
    loading.value = false
    return
  }
  const found = posts.find((p) => p.id === id)
  if (!found) {
    error.value = `找不到文章 id=${id}`
    loading.value = false
    return
  }
  post.value = found
  void loadContent(found)
})

async function loadContent(p: Post) {
  loading.value = true
  error.value = null
  try {
    if (p.content) {
      html.value = renderMarkdown(p.content)
    } else if (p.mdFile) {
      const res = await fetch(p.mdFile)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const md = await res.text()
      html.value = renderMarkdown(md)
    } else {
      throw new Error('文章既无 content 也无 mdFile')
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="page-shell">
    <SiteHeader />
    <view class="page-container">
      <view v-if="error" class="state error">
        <text>{{ error }}</text>
      </view>
      <view v-else-if="loading" class="state">
        <text>加载中…</text>
      </view>
      <article v-else-if="post" class="article">
        <header class="article-head">
          <h1 class="title">{{ post.title }}</h1>
          <view class="meta">
            <text>{{ post.date }}</text>
            <text class="dot">·</text>
            <text>{{ post.author }}</text>
            <text class="dot">·</text>
            <text>{{ post.readTime }} min read</text>
          </view>
          <view class="tags" v-if="tagList.length">
            <text v-for="tag in tagList" :key="tag" class="tag">#{{ tag }}</text>
          </view>
        </header>
        <view class="markdown-body" v-html="html" />
      </article>
    </view>
  </view>
</template>

<style scoped>
.page-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.page-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px;
  width: 100%;
}
.state {
  padding: 40px 0;
  color: var(--muted);
  text-align: center;
}
.state.error {
  color: #dc2626;
}
.article-head {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border);
}
.title {
  margin: 0 0 12px;
  font-size: 32px;
  font-weight: 700;
  color: var(--fg);
  line-height: 1.3;
}
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
  color: var(--muted);
}
.dot {
  opacity: 0.5;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.tag {
  font-size: 12px;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  padding: 2px 8px;
  border-radius: 12px;
}
</style>

<style>
/* Markdown body styles - global so v-html children pick them up */
.markdown-body {
  color: var(--fg);
  line-height: 1.75;
  font-size: 16px;
  /* uni-app <view> defaults user-select: none across the board to avoid
   * mobile mis-touch. Override here so readers can copy article text. */
  user-select: text;
  -webkit-user-select: text;
}
.markdown-body * {
  user-select: text;
  -webkit-user-select: text;
}
.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4 {
  margin: 1.5em 0 0.6em;
  font-weight: 600;
  color: var(--fg);
}
.markdown-body h1 { font-size: 1.8em; }
.markdown-body h2 { font-size: 1.5em; border-bottom: 1px solid var(--border); padding-bottom: 0.3em; }
.markdown-body h3 { font-size: 1.25em; }
.markdown-body p {
  margin: 0.8em 0;
}
.markdown-body ul {
  list-style: disc;
  padding-left: 1.5em;
  margin: 0.8em 0;
}
.markdown-body ol {
  list-style: decimal;
  padding-left: 1.5em;
  margin: 0.8em 0;
}
.markdown-body li {
  margin: 0.3em 0;
}
.markdown-body a {
  color: var(--accent);
  text-decoration: none;
}
.markdown-body a:hover {
  text-decoration: underline;
}
.markdown-body img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 1em 0;
}
.markdown-body code {
  background: var(--code-bg);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.9em;
}
.markdown-body pre {
  background: var(--code-bg);
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 1em 0;
}
.markdown-body pre code {
  background: transparent;
  padding: 0;
  font-size: 0.85em;
}
.markdown-body blockquote {
  border-left: 4px solid var(--accent);
  padding: 0.2em 1em;
  margin: 1em 0;
  color: var(--muted);
  background: color-mix(in srgb, var(--accent) 5%, transparent);
}
.markdown-body table {
  border-collapse: collapse;
  margin: 1em 0;
  width: 100%;
}
.markdown-body th,
.markdown-body td {
  border: 1px solid var(--border);
  padding: 8px 12px;
  text-align: left;
}
.markdown-body th {
  background: var(--code-bg);
  font-weight: 600;
}
.markdown-body hr {
  border: none;
  border-top: 1px solid var(--border);
  margin: 2em 0;
}
</style>
