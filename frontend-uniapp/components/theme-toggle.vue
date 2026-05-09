<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore, type ThemeMode } from '@/stores/theme'

const theme = useThemeStore()

const labels: Record<ThemeMode, string> = {
  light: 'Light',
  dark: 'Dark',
  auto: 'Auto'
}

const icon = computed(() => {
  if (theme.mode === 'light') return 'sun'
  if (theme.mode === 'dark') return 'moon'
  return 'sys'
})
</script>

<template>
  <button
    class="theme-toggle"
    :title="`Theme: ${labels[theme.mode]} (click to cycle)`"
    @click="theme.cycleMode()"
  >
    <span class="icon" :data-icon="icon">
      <template v-if="icon === 'sun'">☀</template>
      <template v-else-if="icon === 'moon'">☾</template>
      <template v-else>◑</template>
    </span>
    <span class="label">{{ labels[theme.mode] }}</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--fg);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s, border-color 0.15s;
}
.theme-toggle:hover {
  border-color: var(--accent);
}
.icon {
  font-size: 16px;
}
</style>
