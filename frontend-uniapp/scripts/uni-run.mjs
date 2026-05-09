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
 * Usage in package.json scripts:
 *   node scripts/uni-run.mjs              -> uni (dev:h5)
 *   node scripts/uni-run.mjs build        -> uni build (build:h5)
 */
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
process.env.UNI_INPUT_DIR = PROJECT_ROOT

const isWin = process.platform === 'win32'
const uniBin = path.join(PROJECT_ROOT, 'node_modules', '.bin', isWin ? 'uni.CMD' : 'uni')

const result = spawnSync(uniBin, process.argv.slice(2), {
  stdio: 'inherit',
  shell: isWin,
  env: process.env
})
process.exit(result.status ?? 1)
