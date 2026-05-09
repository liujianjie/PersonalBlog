import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'auto'
export type EffectiveTheme = 'light' | 'dark'

const STORAGE_KEY = 'blog-theme'

function readStored(): ThemeMode {
  if (typeof localStorage === 'undefined') return 'auto'
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'light' || v === 'dark' || v === 'auto' ? v : 'auto'
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>(readStored())
  const systemDark = ref(systemPrefersDark())

  const effective = computed<EffectiveTheme>(() => {
    if (mode.value === 'light') return 'light'
    if (mode.value === 'dark') return 'dark'
    return systemDark.value ? 'dark' : 'light'
  })

  watch(mode, (v) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, v)
  })

  watch(
    effective,
    (v) => {
      if (typeof document !== 'undefined') {
        document.documentElement.dataset.theme = v
      }
    },
    { immediate: true }
  )

  function setMode(m: ThemeMode) {
    mode.value = m
  }

  function cycleMode() {
    const order: ThemeMode[] = ['light', 'dark', 'auto']
    const i = order.indexOf(mode.value)
    mode.value = order[(i + 1) % order.length]
  }

  function listenSystemPreference() {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {}
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      systemDark.value = e.matches
    }
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
    // older browsers
    mq.addListener(handler as any)
    return () => mq.removeListener(handler as any)
  }

  return { mode, effective, setMode, cycleMode, listenSystemPreference }
})
