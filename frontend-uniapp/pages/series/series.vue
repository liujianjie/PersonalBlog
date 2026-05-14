<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import SiteHeader from '@/components/site-header.vue'
import { postsBySeries, getAllSeries } from '@/composables/series'

const seriesName = ref<string>('')

onLoad((options) => {
  seriesName.value = options?.name ? decodeURIComponent(String(options.name)) : ''
})

const posts = computed(() =>
  seriesName.value ? postsBySeries(seriesName.value) : []
)

const allSeries = computed(() => getAllSeries())

const countLabel = computed(() => `${posts.value.length} 篇`)

function openPost(id: string) {
  uni.navigateTo({ url: `/pages/post/post?id=${encodeURIComponent(id)}` })
}

function openSeries(name: string) {
  uni.redirectTo({
    url: `/pages/series/series?name=${encodeURIComponent(name)}`
  })
}

function goHome() {
  uni.reLaunch({ url: '/pages/index/index' })
}
</script>

<template>
  <view class="page-shell">
    <SiteHeader />
    <view class="page-container">
      <!-- No name -> show series index -->
      <template v-if="!seriesName">
        <view class="page-head">
          <h1 class="title">合集</h1>
          <text class="count">{{ allSeries.length }} 个合集</text>
        </view>
        <view v-if="allSeries.length === 0" class="empty">
          <text>还没有任何合集。</text>
        </view>
        <view v-else class="grid">
          <view
            v-for="s in allSeries"
            :key="s.name"
            class="series-card"
            @click="openSeries(s.name)"
          >
            <h2 class="series-name">{{ s.name }}</h2>
            <view class="series-meta">
              <text class="badge">{{ s.count }} 篇</text>
              <text class="series-date">最新 {{ s.latestDate }}</text>
            </view>
          </view>
        </view>
      </template>

      <!-- Name given -> show all posts in that series, ordered by seriesOrder -->
      <template v-else>
        <view class="page-head">
          <h1 class="title">合集:{{ seriesName }}</h1>
          <text class="count">{{ countLabel }}</text>
        </view>
        <view v-if="posts.length === 0" class="empty">
          <text>未找到该合集。</text>
          <view class="back" @click="goHome">返回首页</view>
        </view>
        <view v-else class="post-list">
          <view
            v-for="p in posts"
            :key="p.id"
            class="post-row"
            @click="openPost(p.id)"
          >
            <text class="order" v-if="p.seriesOrder">
              {{ p.seriesOrder }}
            </text>
            <view class="post-meat">
              <text class="post-title">{{ p.title }}</text>
              <text class="post-date">{{ p.date }} · {{ p.readTime }} min</text>
            </view>
          </view>
        </view>
      </template>
    </view>
  </view>
</template>

<style scoped>
.page-shell {
  min-height: 100vh;
  background: var(--bg);
  color: var(--fg);
}
.page-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px;
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
.empty {
  padding: 48px 24px;
  text-align: center;
  color: var(--muted);
  border: 1px dashed var(--border);
  border-radius: 8px;
}
.back {
  display: inline-block;
  margin-top: 16px;
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}
.series-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg);
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;
}
.series-card:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}
.series-name {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: var(--fg);
}
.series-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}
.badge {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  padding: 3px 10px;
  border-radius: 999px;
}
.series-date {
  font-size: 12px;
  color: var(--muted);
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.post-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.post-row:hover {
  border-color: var(--border);
  background: var(--code-bg);
}
.order {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  color: var(--accent);
  border-radius: 50%;
  font-size: 14px;
  font-weight: 600;
}
.post-meat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}
.post-title {
  font-size: 15px;
  color: var(--fg);
  font-weight: 500;
  line-height: 1.5;
}
.post-date {
  font-size: 12px;
  color: var(--muted);
}
</style>
