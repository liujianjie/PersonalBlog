<script setup lang="ts">
import { computed } from 'vue'
import SiteHeader from '@/components/site-header.vue'
import PostCard from '@/components/post-card.vue'
import { posts } from '@/data/posts'

const sorted = computed(() =>
  [...posts].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
)

const totalLabel = computed(() => `${sorted.value.length} 篇文章`)
</script>

<template>
  <view class="page-shell">
    <SiteHeader />
    <view class="page-container">
      <view class="page-head">
        <h1 class="title">文章</h1>
        <text class="count">{{ totalLabel }}</text>
      </view>
      <view class="grid">
        <PostCard v-for="p in sorted" :key="p.id" :post="p" />
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
