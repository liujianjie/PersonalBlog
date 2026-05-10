<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ initial?: string }>()
const query = ref(props.initial ?? '')

function submit() {
  const q = query.value.trim()
  if (!q) return
  uni.navigateTo({ url: `/pages/search/search?q=${encodeURIComponent(q)}` })
}
function onKey(e: any) {
  if (e?.key === 'Enter' || e?.detail?.keyCode === 13) submit()
}
</script>

<template>
  <view class="search-box">
    <input
      class="search-input"
      type="text"
      v-model="query"
      placeholder="搜索文章…"
      :confirm-type="'search'"
      @confirm="submit"
      @keydown="onKey"
    />
    <view class="search-go" @click="submit" :title="'搜索'">⌕</view>
  </view>
</template>

<style scoped>
.search-box {
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 2px 6px;
  background: var(--bg);
  transition: border-color 0.15s;
}
.search-box:focus-within {
  border-color: var(--accent);
}
.search-input {
  border: none;
  outline: none;
  background: transparent;
  color: var(--fg);
  font-size: 13px;
  padding: 4px 4px;
  width: 180px;
  font-family: inherit;
}
.search-input::placeholder {
  color: var(--muted);
}
.search-go {
  font-size: 14px;
  color: var(--muted);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  user-select: none;
}
.search-go:hover {
  color: var(--accent);
  background: var(--code-bg);
}
@media (max-width: 640px) {
  .search-input {
    width: 120px;
  }
}
</style>
