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
import type { PostCategory } from '@/types'

/** Active category filter. 'all' = no filter (show every post). */
const activeCategory = ref<PostCategory | 'all'>('all')

const categories = computed(() => getAllCategories())

const filtered = computed(() => {
  const base = activeCategory.value === 'all'
    ? posts
    : posts.filter((p) => p.category === activeCategory.value)
  return [...base].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0
  )
})

const totalLabel = computed(() => `${filtered.value.length} 篇文章`)

function selectCategory(c: PostCategory | 'all') {
  activeCategory.value = c
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

      <view v-if="filtered.length === 0" class="empty">
        <text>该分类下暂无文章。</text>
      </view>
      <view v-else class="grid">
        <PostCard v-for="p in filtered" :key="p.id" :post="p" />
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
</style>
