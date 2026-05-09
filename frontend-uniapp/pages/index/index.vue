<script setup lang="ts">
import SiteHeader from '@/components/site-header.vue'
// Phase 1 placeholder. Real list lands in T08 (Phase 2).
</script>

<template>
  <view class="page-shell">
    <SiteHeader />
    <view class="page-container">
      <h1 class="title">Personal Blog</h1>
      <p class="subtitle">Phase 1 scaffold. Articles arrive in Phase 2.</p>
      <view class="status-card">
        <text class="status-line">✓ uni-app + Vue 3 + UnoCSS scaffold</text>
        <text class="status-line">✓ Theme store (light / dark / auto) wired</text>
        <text class="status-line">✓ SiteHeader with theme toggle</text>
        <text class="status-line">○ Article list — T08</text>
        <text class="status-line">○ Markdown rendering — T07/T08</text>
        <text class="status-line">○ Search — T10</text>
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
  font-size: 32px;
  font-weight: 600;
  color: var(--fg);
  margin: 0;
}
.subtitle {
  color: var(--muted);
  margin: 8px 0 24px;
}
.status-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
}
.status-line {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  color: var(--fg);
}
</style>

