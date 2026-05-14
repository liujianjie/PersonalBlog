<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import SiteHeader from '@/components/site-header.vue'
import PostCard from '@/components/post-card.vue'
import {
  CATEGORY_LABELS,
  postsByCategory,
  isValidCategory
} from '@/composables/categories'
import type { PostCategory } from '@/types'

const category = ref<PostCategory | null>(null)

onLoad((options) => {
  const raw = options?.name
  if (raw && isValidCategory(raw)) {
    category.value = raw
  }
})

const label = computed(() =>
  category.value ? CATEGORY_LABELS[category.value] : ''
)

const posts = computed(() =>
  category.value ? postsByCategory(category.value) : []
)

const countLabel = computed(() => `${posts.value.length} 篇`)

function goHome() {
  uni.reLaunch({ url: '/pages/index/index' })
}
</script>

<template>
  <view class="page-shell">
    <SiteHeader />
    <view class="page-container">
      <view v-if="!category" class="invalid">
        <h1 class="title">未指定分类</h1>
        <text class="hint">URL 缺少 ?name= 参数,或参数不在合法分类列表中。</text>
        <view class="back" @click="goHome">返回首页</view>
      </view>
      <template v-else>
        <view class="page-head">
          <h1 class="title">分类:{{ label }}</h1>
          <text class="count">{{ countLabel }}</text>
        </view>
        <view v-if="posts.length === 0" class="empty">
          <text>该分类下暂无文章。</text>
        </view>
        <view v-else class="grid">
          <PostCard v-for="p in posts" :key="p.id" :post="p" />
        </view>
      </template>
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
  margin-bottom: 24px;
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
.invalid {
  padding: 64px 24px;
  text-align: center;
}
.hint {
  display: block;
  color: var(--muted);
  margin: 12px 0 24px;
}
.back {
  display: inline-block;
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.back:hover {
  border-color: var(--accent);
  background: var(--code-bg);
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
