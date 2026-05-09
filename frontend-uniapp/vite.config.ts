import { defineConfig } from 'vite'
import path from 'node:path'
import uniPlugin from '@dcloudio/vite-plugin-uni'
import UnoCSS from 'unocss/vite'

// @dcloudio/vite-plugin-uni is CJS; under ESM (type: module) the default
// import becomes the namespace object, so unwrap manually to get the function.
const uni: any = (uniPlugin as any).default ?? uniPlugin

const allowedHosts = ['localhost', '127.0.0.1', 'blog.multilab.cc']

// allowedHosts is recognized by uni plugin middleware at runtime but not yet
// in vite 5.2 ServerOptions/PreviewOptions types - cast to any to bypass.
//
// Static assets live under ./static/ (uni-app convention). vite-plugin-uni
// overrides vite's default publicDir = './public/' to './static/'; trying to
// repoint it back at ./public/ fails - uni reasserts ./static/. So we ship
// ./static/posts/ and ./static/images/, and reference them as
// "/static/posts/..." / "/static/images/..." in posts.ts + .md files.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname)
    }
  },
  plugins: [
    UnoCSS(),
    uni()
  ],
  server: {
    host: '127.0.0.1',
    port: 5174,
    allowedHosts
  } as any,
  preview: {
    host: '127.0.0.1',
    port: 5174,
    allowedHosts
  } as any
})


