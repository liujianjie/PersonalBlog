<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import SiteHeader from '@/components/site-header.vue'
import { loadSearchIndex, searchPosts, type SearchHit } from '@/composables/search'

const query = ref('')
const hits = ref<SearchHit[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const ready = ref(false)

onLoad(async (options) => {
  query.value = options?.q ? decodeURIComponent(String(options.q)) : ''
  await runQuery()
})

async function runQuery() {
  if (!query.value.trim()) {
    hits.value = []
    return
  }
  loading.value = true
  error.value = null
  try {
    const idx = await loadSearchIndex()
    ready.value = true
    hits.value = searchPosts(idx, query.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

function highlight(text: string): string {
  const q = query.value.trim()
  if (!q || !text) return text
  const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(safeQ, 'gi'), (m) => `<mark>${m}</mark>`)
}

function openPost(id: string) {
  uni.navigateTo({ url: `/pages/post/post?id=${encodeURIComponent(id)}` })
}

function newSearch() {
  if (!query.value.trim()) return
  uni.redirectTo({ url: `/pages/search/search?q=${encodeURIComponent(query.value.trim())}` })
}

const resultLabel = computed(() => {
  if (!query.value.trim()) return ''
  if (loading.value) return '搜索中…'
  return `${hits.value.length} 条结果`
})
</script>

<template>
  <view class="page-shell">
    <SiteHeader />
    <view class="page-container">
      <view class="head">
        <h1 class="title">搜索</h1>
        <view class="search-row">
          <input
            class="big-input"
            type="text"
            v-model="query"
            :placeholder="'输入关键词，回车搜索'"
            :confirm-type="'search'"
            @confirm="newSearch"
          />
          <view class="go" @click="newSearch">搜索</view>
        </view>
        <text v-if="query.trim()" class="result-label">"{{ query }}" · {{ resultLabel }}</text>
      </view>

      <view v-if="error" class="state error">
        <text>加载搜索索引失败:{{ error }}</text>
      </view>
      <view v-else-if="loading" class="state">
        <text>搜索中…</text>
      </view>
      <view v-else-if="query.trim() && hits.length === 0 && ready" class="state">
        <text>未命中,换个关键词试试</text>
      </view>
      <view v-else-if="!query.trim()" class="state">
        <text>试试输入 "Unity"、"OpenGL"、"Addressable"…</text>
      </view>
      <view v-else class="results">
        <view
          v-for="h in hits"
          :key="h.id"
          class="hit"
          @click="openPost(h.id)"
        >
          <view class="hit-title" v-html="highlight(h.title)" />
          <view class="hit-excerpt" v-html="highlight(h.excerpt)" />
          <view class="hit-meta">
            <text class="date">{{ h.date }}</text>
            <text v-for="t in h.tags" :key="t" class="tag">#{{ t }}</text>
          </view>
        </view>
      </view>
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
.head {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}
.title {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: var(--fg);
}
.search-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.big-input {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px 12px;
  background: var(--bg);
  color: var(--fg);
  font-size: 15px;
  outline: none;
  font-family: inherit;
}
.big-input:focus {
  border-color: var(--accent);
}
.go {
  padding: 10px 18px;
  border-radius: 6px;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  user-select: none;
}
.go:hover {
  filter: brightness(1.1);
}
.result-label {
  color: var(--muted);
  font-size: 13px;
}
.state {
  padding: 40px 0;
  text-align: center;
  color: var(--muted);
}
.state.error {
  color: #dc2626;
}
.results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.hit {
  padding: 16px 18px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;
}
.hit:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}
.hit-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--fg);
  margin-bottom: 4px;
}
.hit-excerpt {
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.hit-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--muted);
}
.tag {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  padding: 1px 6px;
  border-radius: 10px;
}
</style>

<style>
mark {
  background: color-mix(in srgb, var(--accent) 35%, transparent);
  color: inherit;
  padding: 0 2px;
  border-radius: 2px;
}
</style>
