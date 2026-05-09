<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useThemeStore } from '@/stores/theme'

const theme = useThemeStore()
let stopSystemListener: (() => void) | null = null

onLaunch(() => {
  stopSystemListener = theme.listenSystemPreference()
})
</script>

<template>
  <view class="app-shell">
    <slot />
  </view>
</template>

<style>
@import './styles/theme.css';
@import './styles/layout.css';

html,
body,
#app {
  height: 100%;
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  transition: background 0.2s, color 0.2s;
}
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>


