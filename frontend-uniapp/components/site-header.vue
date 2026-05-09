<script setup lang="ts">
import ThemeToggle from './theme-toggle.vue'

function goHome() {
  uni.reLaunch({ url: '/pages/index/index' })
}
function goTags() {
  uni.navigateTo({ url: '/pages/tag/tag' })
}
</script>

<template>
  <view class="site-header">
    <view class="inner">
      <view class="brand" @click="goHome">
        <text class="brand-name">Personal Blog</text>
        <text class="brand-tag">技术笔记 · Unity / OpenGL / 计算机基础</text>
      </view>
      <view class="actions">
        <text class="nav-link" @click="goTags">标签</text>
        <view class="search-placeholder" title="Search lands in T10">
          <text class="search-hint">⌕ search · coming in T10</text>
        </view>
        <ThemeToggle />
      </view>
    </view>
  </view>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(8px);
}
.inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: 1280px;
  margin: 0 auto;
  padding: 12px 24px;
}
.brand {
  display: flex;
  flex-direction: column;
  gap: 2px;
  cursor: pointer;
}
.brand:hover .brand-name {
  color: var(--accent);
}
.brand-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--fg);
  transition: color 0.15s;
}
.brand-tag {
  font-size: 12px;
  color: var(--muted);
}
.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.nav-link {
  font-size: 14px;
  color: var(--fg);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.15s, color 0.15s;
}
.nav-link:hover {
  color: var(--accent);
  background: var(--code-bg);
}
.search-placeholder {
  font-size: 13px;
  color: var(--muted);
  border: 1px dashed var(--border);
  border-radius: 6px;
  padding: 4px 10px;
}
.search-hint {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
@media (max-width: 640px) {
  .brand-tag,
  .search-placeholder {
    display: none;
  }
}
</style>
