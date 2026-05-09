<script setup lang="ts">
import { computed } from 'vue'
import type { Post } from '@/types'

const props = defineProps<{ post: Post }>()

const tagList = computed(() => props.post.tags ?? [])

function open() {
  uni.navigateTo({ url: `/pages/post/post?id=${encodeURIComponent(props.post.id)}` })
}

function openTag(tag: string, e: Event) {
  e.stopPropagation()
  uni.navigateTo({ url: `/pages/tag/tag?name=${encodeURIComponent(tag)}` })
}
</script>

<template>
  <view class="post-card" @click="open">
    <h2 class="title">{{ post.title }}</h2>
    <p class="excerpt">{{ post.excerpt }}</p>
    <view class="meta">
      <text class="date">{{ post.date }}</text>
      <text class="dot">·</text>
      <text class="read-time">{{ post.readTime }} min read</text>
    </view>
    <view class="tags" v-if="tagList.length">
      <text
        v-for="tag in tagList"
        :key="tag"
        class="tag"
        @click="openTag(tag, $event)"
      >#{{ tag }}</text>
    </view>
  </view>
</template>

<style scoped>
.post-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;
}
.post-card:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}
.title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--fg);
  line-height: 1.4;
}
.excerpt {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
}
.dot {
  opacity: 0.6;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}
.tag {
  font-size: 12px;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  padding: 2px 8px;
  border-radius: 12px;
  cursor: pointer;
}
.tag:hover {
  background: color-mix(in srgb, var(--accent) 25%, transparent);
}
</style>
