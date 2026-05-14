#!/usr/bin/env node
/**
 * uni CLI wrapper: inject UNI_INPUT_DIR=<frontend-uniapp root> before spawn.
 *
 * Why: this project keeps a flat root layout - manifest.json / pages.json /
 * App.vue / main.ts live at frontend-uniapp/ root, not uniapp's default src/.
 * uni CLI reads manifest.json (initUVueEnv -> parseManifestJson) BEFORE it
 * loads vite.config.ts, so setting process.env.UNI_INPUT_DIR inside vite
 * config is too late. This wrapper sets the env var in the parent process
 * and spawns the uni CLI fresh, so the child sees the right path from start.
 *
 * 2026-05-14: switched from `spawn(node_modules/.bin/uni.CMD, ...)` to
 * `spawn(process.execPath, [uniJs, ...])`. The .bin/uni.CMD batch wrapper
 * internally calls `node` via PATH lookup, which fails when this script is
 * invoked from a PowerShell session whose PATH lacks the Node directory
 * (common on machines using nvm-windows). Going direct to the JS entry
 * with the current Node binary bypasses the PATH dependency entirely.
 *
 * Usage in package.json scripts:
 *   node scripts/uni-run.mjs              -> uni (dev:h5)
 *   node scripts/uni-run.mjs build        -> uni build (build:h5)
 */
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
process.env.UNI_INPUT_DIR = PROJECT_ROOT

const require = createRequire(import.meta.url)
let uniJs
try {
  // Prefer the package's declared "bin" entry. createRequire resolves
  // through pnpm's hoisted symlinks correctly.
  uniJs = require.resolve('@dcloudio/vite-plugin-uni/bin/uni.js', {
    paths: [PROJECT_ROOT]
  })
} catch (_) {
  // Fallback: hoisted layout.
  uniJs = path.join(
    PROJECT_ROOT,
    'node_modules',
    '@dcloudio',
    'vite-plugin-uni',
    'bin',
    'uni.js'
  )
}

const result = spawnSync(
  process.execPath,
  [uniJs, ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    env: process.env
  }
)
process.exit(result.status ?? 1)
