import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useThemeStore, type ThemeMode } from '@/stores/theme'

function setMatchMediaDark(matches: boolean) {
  const mq = {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null as null | ((e: MediaQueryListEvent) => void),
    addEventListener: vi.fn((_: string, cb: any) => {
      mq.onchange = cb
    }),
    removeEventListener: vi.fn(),
    addListener: vi.fn((cb: any) => {
      mq.onchange = cb
    }),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn()
  }
  ;(window as any).matchMedia = vi.fn(() => mq)
  return mq
}

describe('useThemeStore', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    setMatchMediaDark(false)
    setActivePinia(createPinia())
  })

  it('defaults to auto when no stored value', () => {
    const store = useThemeStore()
    expect(store.mode).toBe('auto')
  })

  it('reads stored value from localStorage on init', () => {
    localStorage.setItem('blog-theme', 'dark')
    const store = useThemeStore()
    expect(store.mode).toBe('dark')
  })

  it('persists mode change to localStorage', async () => {
    const store = useThemeStore()
    store.setMode('light')
    await Promise.resolve()
    expect(localStorage.getItem('blog-theme')).toBe('light')
  })

  it('writes effective theme to documentElement.dataset.theme', async () => {
    const store = useThemeStore()
    store.setMode('dark')
    await Promise.resolve()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('effective in auto mode follows system prefers-color-scheme', () => {
    setMatchMediaDark(true)
    const store = useThemeStore()
    // 'auto' default + system dark
    expect(store.mode).toBe('auto')
    expect(store.effective).toBe('dark')
  })

  it('cycleMode goes light -> dark -> auto -> light', () => {
    const store = useThemeStore()
    store.setMode('light')
    store.cycleMode()
    expect(store.mode).toBe<ThemeMode>('dark')
    store.cycleMode()
    expect(store.mode).toBe<ThemeMode>('auto')
    store.cycleMode()
    expect(store.mode).toBe<ThemeMode>('light')
  })

  it('listenSystemPreference returns cleanup fn and registers a listener', () => {
    const mq = setMatchMediaDark(false)
    const store = useThemeStore()
    const cleanup = store.listenSystemPreference()
    expect(mq.addEventListener).toHaveBeenCalledTimes(1)
    cleanup()
    expect(mq.removeEventListener).toHaveBeenCalledTimes(1)
  })
})
