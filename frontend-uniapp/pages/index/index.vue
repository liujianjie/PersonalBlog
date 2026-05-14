<script setup lang="ts">
import { ref, computed } from 'vue'
import SiteHeader from '@/components/site-header.vue'
import PostCard from '@/components/post-card.vue'
import { posts } from '@/data/posts'
import {
  CATEGORIES,
  CATEGORY_LABELS,
  getAllCategories
} from '@/composables/categories'
import { collapseSeriesFeed, type FeedItem } from '@/composables/series'
import type { PostCategory } from '@/types'

/** Active category filter. 'all' = no filter (show every post). */
const activeCategory = ref<PostCategory | 'all'>('all')

const categories = computed(() => getAllCategories())

/** Feed items: collapsed-by-series for 'all', plain post list for a
 *  specific category (so series collapse only happens on the home view). */
const feed = computed<FeedItem[]>(() => {
  if (activeCategory.value === 'all') {
    return collapseSeriesFeed()
  }
  return posts
    .filter((p) => p.category === activeCategory.value)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .map((p) => ({ kind: 'post' as const, post: p }))
})

const totalLabel = computed(() => {
  const items = feed.value.length
  return `${items} 项`
})

function selectCategory(c: PostCategory | 'all') {
  activeCategory.value = c
}

function openSeries(name: string) {
  uni.navigateTo({
    url: `/pages/series/series?name=${encodeURIComponent(name)}`
  })
}
</script>

<template>
  <view class="page-shell">
    <SiteHeader />
    <view class="page-container">
      <view class="page-head">
        <h1 class="title">文章</h1>
        <text class="count">{{ totalLabel }}</text>
      </view>

      <view class="category-tabs">
        <view
          class="tab"
          :class="{ active: activeCategory === 'all' }"
          @click="selectCategory('all')"
        >
          <text class="tab-label">全部</text>
          <text class="tab-count">{{ posts.length }}</text>
        </view>
        <view
          v-for="c in categories"
          :key="c.name"
          class="tab"
          :class="{ active: activeCategory === c.name, disabled: c.count === 0 }"
          @click="c.count > 0 && selectCategory(c.name)"
        >
          <text class="tab-label">{{ c.label }}</text>
          <text class="tab-count">{{ c.count }}</text>
        </view>
      </view>

      <view v-if="feed.length === 0" class="empty">
        <text>该分类下暂无文章。</text>
      </view>
      <view v-else class="grid">
        <template v-for="(it, idx) in feed" :key="idx">
          <PostCard v-if="it.kind === 'post'" :post="it.post" />
          <view
            v-else
            class="series-card"
            @click="openSeries(it.name)"
          >
            <view class="series-tag">合集</view>
            <h2 class="series-card-name">{{ it.name }}</h2>
            <p class="series-card-summary">{{ it.representative.excerpt }}</p>
            <view class="series-card-meta">
              <text class="series-count">{{ it.count }} 篇</text>
              <text class="series-dot">·</text>
              <text class="series-latest">最新 {{ it.representative.date }}</text>
            </view>
          </view>
        </template>
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
.page-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
}
.title {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: var(--fg);
}
.count {
  color: var(--muted);
  font-size: 13px;
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}
.tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.tab:not(.disabled):hover {
  border-color: var(--accent);
}
.tab.active {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
}
.tab.active .tab-label {
  color: var(--accent);
  font-weight: 600;
}
.tab.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.tab-label {
  font-size: 14px;
  color: var(--fg);
}
.tab-count {
  font-size: 11px;
  color: var(--muted);
  padding: 1px 6px;
  background: var(--code-bg);
  border-radius: 999px;
}

.empty {
  padding: 48px 24px;
  text-align: center;
  color: var(--muted);
  border: 1px dashed var(--border);
  border-radius: 8px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
}
@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.series-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  border: 1px solid var(--accent);
  border-radius: 8px;
  background: color-mix(in srgb, var(--accent) 6%, var(--bg));
  cursor: pointer;
  transition: transform 0.15s, background 0.15s;
  position: relative;
}
.series-card:hover {
  transform: translateY(-1px);
  background: color-mix(in srgb, var(--accent) 12%, var(--bg));
}
.series-tag {
  position: absolute;
  top: 14px;
  right: 14px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--accent);
  background: var(--bg);
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid var(--accent);
}
.series-card-name {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--fg);
  padding-right: 60px;
  line-height: 1.4;
}
.series-card-summary {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.series-card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
}
.series-count {
  font-weight: 600;
  color: var(--accent);
}
.series-dot {
  opacity: 0.6;
}
</style>
