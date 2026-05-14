<script setup lang="ts">
import { computed } from 'vue'
import SiteHeader from '@/components/site-header.vue'
import { authorInfo, getSocialLinks } from '@/composables/author'
import { getAllTags } from '@/composables/tags'

const links = computed(() => getSocialLinks())
const tags = computed(() => getAllTags())

function openTag(name: string) {
  uni.navigateTo({
    url: `/pages/tag/tag?name=${encodeURIComponent(name)}`
  })
}

function openLink(href: string) {
  // External URLs (https) open in a new tab; same-origin paths
  // (e.g. /static/feed.xml) navigate via window.location.
  if (/^https?:\/\//.test(href)) {
    if (typeof window !== 'undefined') window.open(href, '_blank', 'noopener')
  } else {
    if (typeof window !== 'undefined') window.location.href = href
  }
}
</script>

<template>
  <view class="page-shell">
    <SiteHeader />
    <view class="page-container">
      <view class="hero">
        <h1 class="name">{{ authorInfo.name }}</h1>
        <p class="bio">{{ authorInfo.bio }}</p>
        <p v-if="authorInfo.homepageNote" class="note">
          {{ authorInfo.homepageNote }}
        </p>
        <view class="links">
          <view
            v-for="l in links"
            :key="l.type"
            class="link"
            :class="`link-${l.type}`"
            @click="openLink(l.href)"
          >
            <text class="link-label">{{ l.label }}</text>
            <text class="link-href">{{ l.href }}</text>
          </view>
        </view>
      </view>

      <view class="tag-cloud">
        <h2 class="section-title">标签云</h2>
        <text class="cloud-count">{{ tags.length }} 个标签</text>
        <view class="cloud">
          <view
            v-for="t in tags"
            :key="t.name"
            class="tag-chip"
            :data-size="t.count"
            @click="openTag(t.name)"
          >
            <text class="tag-name">#{{ t.name }}</text>
            <text class="tag-count">{{ t.count }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page-shell {
  min-height: 100vh;
  background: var(--bg);
  color: var(--fg);
}
.page-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px;
}

.hero {
  padding: 32px 0 40px;
  border-bottom: 1px solid var(--border);
}
.name {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 12px;
  color: var(--fg);
}
.bio {
  font-size: 17px;
  line-height: 1.7;
  color: var(--fg);
  margin: 0 0 8px;
}
.note {
  font-size: 14px;
  color: var(--muted);
  margin: 0 0 20px;
}

.links {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.link:hover {
  border-color: var(--accent);
  background: var(--code-bg);
}
.link-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--fg);
}
.link-href {
  font-size: 12px;
  color: var(--muted);
}

.tag-cloud {
  padding: 32px 0;
}
.section-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 4px;
  color: var(--fg);
}
.cloud-count {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 20px;
  display: block;
}
.cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 12px;
  margin-top: 16px;
}
.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.tag-chip:hover {
  border-color: var(--accent);
  background: var(--code-bg);
}
.tag-chip:hover .tag-name {
  color: var(--accent);
}
.tag-name {
  font-size: 14px;
  color: var(--fg);
}
.tag-count {
  font-size: 11px;
  color: var(--muted);
  padding: 1px 6px;
  background: var(--code-bg);
  border-radius: 999px;
}
</style>
