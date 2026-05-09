<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import SiteHeader from '@/components/site-header.vue'
import PostCard from '@/components/post-card.vue'
import { getAllTags, postsByTag } from '@/composables/tags'

const selectedTag = ref<string>('')

onLoad((options) => {
  selectedTag.value = options?.name ? String(options.name) : ''
})

const tags = computed(() => getAllTags())
const postsForTag = computed(() => (selectedTag.value ? postsByTag(selectedTag.value) : []))

function openTag(name: string) {
  uni.redirectTo({ url: `/pages/tag/tag?name=${encodeURIComponent(name)}` })
}
function clearTag() {
  uni.redirectTo({ url: '/pages/tag/tag' })
}
</script>

<template>
  <view class="page-shell">
    <SiteHeader />
    <view class="page-container">
      <view v-if="!selectedTag" class="cloud-view">
        <h1 class="title">标签</h1>
        <text class="count">{{ tags.length }} 个标签</text>
        <view class="cloud">
          <view
            v-for="t in tags"
            :key="t.name"
            class="tag-chip"
            :data-size="t.count"
            @click="openTag(t.name)"
          >
            <text class="tag-name">#{{ t.name }}</text>
            <text class="tag-count">{{ t.count }}</text>
          </view>
        </view>
      </view>
      <view v-else class="filtered-view">
        <view class="filtered-head">
          <text class="back" @click="clearTag">← 全部标签</text>
          <h1 class="title">#{{ selectedTag }}</h1>
          <text class="count">{{ postsForTag.length }} 篇</text>
        </view>
        <view class="grid">
          <PostCard v-for="p in postsForTag" :key="p.id" :post="p" />
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
.title {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: var(--fg);
}
.count {
  color: var(--muted);
  font-size: 13px;
  margin-left: 12px;
}
.cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}
.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--border);
  background: var(--bg);
  border-radius: 20px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.tag-chip:hover {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}
.tag-name {
  color: var(--accent);
  font-size: 14px;
}
.tag-count {
  color: var(--muted);
  font-size: 12px;
  background: var(--code-bg);
  padding: 1px 6px;
  border-radius: 10px;
}
.filtered-head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}
.back {
  color: var(--accent);
  cursor: pointer;
  font-size: 14px;
}
.back:hover {
  text-decoration: underline;
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
