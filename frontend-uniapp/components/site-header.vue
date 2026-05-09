<script setup lang="ts">
import ThemeToggle from './theme-toggle.vue'
</script>

<template>
  <view class="site-header">
    <view class="inner">
      <view class="brand">
        <text class="brand-name">Personal Blog</text>
        <text class="brand-tag">技术笔记 · Unity / OpenGL / 计算机基础</text>
      </view>
      <view class="actions">
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
}
.brand-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--fg);
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
