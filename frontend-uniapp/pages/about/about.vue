<script setup lang="ts">
import { computed } from 'vue'
import SiteHeader from '@/components/site-header.vue'
import {
  authorInfo,
  getSocialLinks,
  skills,
  achievements,
  blogIntro
} from '@/composables/author'
import { getAllTags } from '@/composables/tags'

const links = computed(() => getSocialLinks())
const tags = computed(() => getAllTags())

const initial = computed(() => authorInfo.name.charAt(0))

function openTag(name: string) {
  uni.navigateTo({
    url: `/pages/tag/tag?name=${encodeURIComponent(name)}`
  })
}

function openLink(href: string) {
  if (/^https?:\/\//.test(href)) {
    if (typeof window !== 'undefined') window.open(href, '_blank', 'noopener')
  } else if (href.startsWith('mailto:')) {
    if (typeof window !== 'undefined') window.location.href = href
  } else {
    if (typeof window !== 'undefined') window.location.href = href
  }
}

function sendEmail() {
  if (authorInfo.email) openLink(`mailto:${authorInfo.email}`)
}
</script>

<template>
  <view class="page-shell">
    <SiteHeader />
    <view class="page-container">

      <!-- Page title + subtitle -->
      <view class="page-head">
        <h1 class="page-title">关于我</h1>
        <text class="page-subtitle">{{ authorInfo.subtitle }}</text>
      </view>

      <!-- Profile card: avatar + name + bio + social links -->
      <view class="card profile">
        <view class="avatar-wrap">
          <view class="avatar">
            <text class="avatar-initial">{{ initial }}</text>
          </view>
        </view>
        <view class="profile-meat">
          <h2 class="name">{{ authorInfo.name }}</h2>
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
            </view>
          </view>
        </view>
      </view>

      <!-- Skills + Achievements: side-by-side on wide screens -->
      <view class="two-col">
        <view class="card skills-card">
          <h3 class="section-title">⚡ 核心技能</h3>
          <view class="skills">
            <view
              v-for="bucket in skills"
              :key="bucket.title"
              class="skill-bucket"
            >
              <h4 class="skill-bucket-title">{{ bucket.title }}</h4>
              <view class="skill-tags">
                <text
                  v-for="item in bucket.items"
                  :key="item"
                  class="skill-tag"
                  :class="`tag-${bucket.accent}`"
                >{{ item }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="card achievements-card">
          <h3 class="section-title">🎯 学习成果</h3>
          <view class="achievements">
            <view
              v-for="a in achievements"
              :key="a.title"
              class="achievement"
            >
              <text class="achievement-emoji">{{ a.emoji }}</text>
              <view class="achievement-meat">
                <text class="achievement-title" :class="`fg-${a.accent}`">
                  {{ a.title }}
                </text>
                <text class="achievement-detail">{{ a.detail }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- About this blog -->
      <view class="card blog-card">
        <h2 class="section-title">关于这个博客</h2>
        <p class="blog-lead">{{ blogIntro.lead }}</p>
        <view class="pillars">
          <view
            v-for="p in blogIntro.pillars"
            :key="p.title"
            class="pillar"
            :class="`bord-${p.accent}`"
          >
            <text class="pillar-title" :class="`fg-${p.accent}`">
              {{ p.title }}
            </text>
            <text class="pillar-detail">{{ p.detail }}</text>
          </view>
        </view>
        <p class="blog-tech-note">{{ blogIntro.techNote }}</p>
      </view>

      <!-- Tag cloud -->
      <view class="card tag-cloud-card">
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

      <!-- Contact CTA -->
      <view class="card contact-card">
        <h2 class="section-title">保持联系</h2>
        <text class="contact-line">欢迎通过以下方式与我交流和探讨</text>
        <view class="contact-cta">
          <view
            v-if="authorInfo.email"
            class="cta-btn primary"
            @click="sendEmail"
          >
            <text>发送邮件</text>
          </view>
          <view
            class="cta-btn"
            @click="openLink(authorInfo.github)"
          >
            <text>GitHub @ {{ authorInfo.name }}</text>
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
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px 64px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Page head */
.page-head {
  text-align: center;
  margin-bottom: 8px;
}
.page-title {
  margin: 0;
  font-size: 36px;
  font-weight: 700;
  color: var(--fg);
  margin-bottom: 8px;
}
.page-subtitle {
  color: var(--muted);
  font-size: 14px;
}

/* Generic card */
.card {
  padding: 28px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg);
}

/* Profile */
.profile {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
  text-align: center;
}
@media (min-width: 768px) {
  .profile {
    flex-direction: row;
    align-items: flex-start;
    text-align: left;
  }
}
.avatar-wrap {
  flex-shrink: 0;
}
.avatar {
  width: 112px;
  height: 112px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 24px color-mix(in srgb, var(--accent) 35%, transparent);
}
.avatar-initial {
  color: #fff;
  font-size: 44px;
  font-weight: 700;
}
.profile-meat {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.name {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: var(--fg);
}
.bio {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--fg);
}
.note {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}
.links {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 4px;
  justify-content: center;
}
@media (min-width: 768px) {
  .links { justify-content: flex-start; }
}
.link {
  padding: 8px 14px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.link:hover {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, var(--bg));
}
.link-label {
  font-size: 13px;
  color: var(--fg);
}

/* Section title */
.section-title {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 600;
  color: var(--fg);
}

/* Two-col */
.two-col {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}
@media (min-width: 768px) {
  .two-col {
    grid-template-columns: 1fr 1fr;
  }
}

/* Skills */
.skills {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.skill-bucket-title {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.skill-tag {
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 12px;
  border: 1px solid;
}
.tag-blue {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.10);
  border-color: rgba(59, 130, 246, 0.30);
}
.tag-green {
  color: #10b981;
  background: rgba(16, 185, 129, 0.10);
  border-color: rgba(16, 185, 129, 0.30);
}
.tag-purple {
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.10);
  border-color: rgba(139, 92, 246, 0.30);
}
.tag-orange {
  color: #f97316;
  background: rgba(249, 115, 22, 0.10);
  border-color: rgba(249, 115, 22, 0.30);
}

/* Achievements */
.achievements {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.achievement {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.achievement-emoji {
  font-size: 22px;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 2px;
}
.achievement-meat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.achievement-title {
  font-size: 13px;
  font-weight: 600;
}
.achievement-detail {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
}
.fg-blue   { color: #3b82f6; }
.fg-green  { color: #10b981; }
.fg-purple { color: #8b5cf6; }
.fg-orange { color: #f97316; }

/* About-blog */
.blog-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.blog-lead {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--fg);
}
.pillars {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
@media (min-width: 768px) {
  .pillars {
    grid-template-columns: 1fr 1fr;
  }
}
.pillar {
  padding: 14px 16px;
  border-radius: 6px;
  background: var(--code-bg);
  border-left: 3px solid;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.bord-blue   { border-left-color: #3b82f6; }
.bord-green  { border-left-color: #10b981; }
.bord-purple { border-left-color: #8b5cf6; }
.bord-orange { border-left-color: #f97316; }
.pillar-title {
  font-size: 12px;
  font-weight: 600;
}
.pillar-detail {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
}
.blog-tech-note {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
  line-height: 1.6;
}

/* Tag cloud */
.tag-cloud-card .cloud-count {
  display: block;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 12px;
  margin-top: -10px;
}
.cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;
}
.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
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
.tag-chip:hover .tag-name { color: var(--accent); }
.tag-name {
  font-size: 13px;
  color: var(--fg);
}
.tag-count {
  font-size: 10px;
  color: var(--muted);
  padding: 1px 6px;
  background: var(--code-bg);
  border-radius: 999px;
}

/* Contact */
.contact-card {
  text-align: center;
}
.contact-line {
  display: block;
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 16px;
}
.contact-cta {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}
.cta-btn {
  padding: 10px 24px;
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  background: var(--bg);
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
  font-size: 14px;
  color: var(--fg);
}
.cta-btn:hover {
  border-color: var(--accent);
  background: var(--code-bg);
}
.cta-btn:active {
  transform: translateY(1px);
}
.cta-btn.primary {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
.cta-btn.primary:hover {
  background: color-mix(in srgb, var(--accent) 85%, black);
  border-color: color-mix(in srgb, var(--accent) 85%, black);
}
</style>
