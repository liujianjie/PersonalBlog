import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/PersonalBlog/', // 替换为你的仓库名
  server: {
    port: 3000,
    open: true
  }
})
