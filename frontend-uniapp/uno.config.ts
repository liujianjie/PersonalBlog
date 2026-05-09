import { defineConfig, presetUno, presetTypography, presetAttributify } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetTypography()
  ],
  theme: {
    colors: {
      bg: 'var(--bg)',
      fg: 'var(--fg)',
      muted: 'var(--muted)',
      accent: 'var(--accent)',
      'code-bg': 'var(--code-bg)',
      border: 'var(--border)'
    }
  },
  shortcuts: {
    'page-container': 'max-w-screen-xl mx-auto px-6 py-8',
    'card': 'rounded-lg border border-border bg-bg p-6 transition hover:shadow-md'
  }
})
