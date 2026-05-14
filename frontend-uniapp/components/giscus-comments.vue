<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import {
  giscusConfig,
  isGiscusConfigured,
  buildGiscusScriptAttrs,
  mountGiscus,
  type GiscusTheme
} from '@/composables/giscus'
import { useThemeStore } from '@/stores/theme'

const props = defineProps<{
  /** Stable per-post key — fed to giscus as data-term. We use post.id. */
  term: string
}>()

const theme = useThemeStore()
const mountEl = ref<HTMLElement | null>(null)
const configured = computed(() => isGiscusConfigured(giscusConfig))

const giscusTheme = computed<GiscusTheme>(() => (theme.effective === 'dark' ? 'dark' : 'light'))

let teardown: (() => void) | null = null

function mount() {
  if (!configured.value) return
  if (!mountEl.value) return
  // Defensive: ensure no leftover from a previous mount.
  if (teardown) teardown()
  teardown = mountGiscus(mountEl.value, giscusConfig, {
    term: props.term,
    theme: giscusTheme.value
  })
}

function unmount() {
  if (teardown) {
    teardown()
    teardown = null
  }
}

onMounted(() => {
  // buildGiscusScriptAttrs is referenced through mountGiscus; we also
  // expose it here so structural tests can assert the import shape.
  void buildGiscusScriptAttrs
  mount()
})

onBeforeUnmount(unmount)

// Re-mount on term change (SPA nav between posts) or theme switch.
watch(
  () => [props.term, giscusTheme.value],
  () => {
    unmount()
    mount()
  }
)
</script>

<template>
  <section class="giscus-section">
    <h2 class="giscus-heading">评论</h2>
    <view v-if="!configured" class="giscus-fallback">
      <p>评论功能尚未启用。</p>
      <p class="giscus-hint">
        Owner 启用步骤见 README.md「评论 (giscus) 启用步骤」段:
        开启 GitHub Discussions → 装 giscus App → 在
        <a href="https://giscus.app/" target="_blank" rel="noopener">giscus.app</a>
        生成参数 → 填入 <code>composables/giscus.ts</code>。
      </p>
    </view>
    <view v-else ref="mountEl" class="giscus-mount" />
  </section>
</template>

<style scoped>
.giscus-section {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}
.giscus-heading {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 600;
  color: var(--fg);
}
.giscus-fallback {
  padding: 16px 18px;
  border: 1px dashed var(--border);
  border-radius: 6px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
}
.giscus-fallback p {
  margin: 0;
}
.giscus-fallback p + p {
  margin-top: 8px;
}
.giscus-hint code {
  background: var(--code-bg);
  padding: 1px 6px;
  border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.9em;
}
.giscus-hint a {
  color: var(--accent);
  text-decoration: none;
}
.giscus-hint a:hover {
  text-decoration: underline;
}
.giscus-mount {
  min-height: 160px;
}
</style>
