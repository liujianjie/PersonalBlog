// Author / about-page metadata. Edit name + bio + links + skills +
// achievements + blogIntro to taste; this file is the single source of
// truth for the about page.

export interface AuthorInfo {
  name: string
  /** One-liner under the page title (e.g. "了解博主和这个博客"). */
  subtitle: string
  bio: string
  github: string
  email?: string
  website?: string
  /** Optional one-liner shown under the bio on the about page. */
  homepageNote?: string
}

export interface SocialLink {
  type: 'github' | 'email' | 'rss' | 'website' | 'other'
  label: string
  href: string
}

export const authorInfo: AuthorInfo = {
  name: '刘建杰',
  subtitle: '了解博主和这个博客',
  bio: '游戏客户端开发工程师，深耕引擎底层与图形学理论。完整学习游戏引擎开发（259篇笔记）与计算机图形学（99篇笔记），理解从 OpenGL 渲染到 ECS 架构的完整技术栈。Unity 项目实战涵盖 Flux 架构、Addressable、URP、热更新等核心技术。',
  github: 'https://github.com/liujianjie',
  email: 'contact@example.com',
  website: 'https://liujianjie.github.io/PersonalBlog/',
  homepageNote: '内容范围:技术(Unity / OpenGL / 计算机基础)、思考、人生、学习其它。'
}

export function getSocialLinks(): SocialLink[] {
  const links: SocialLink[] = [
    { type: 'github', label: 'GitHub', href: authorInfo.github }
  ]
  if (authorInfo.email) {
    links.push({ type: 'email', label: 'Email', href: `mailto:${authorInfo.email}` })
  }
  if (authorInfo.website) {
    links.push({ type: 'website', label: 'Website', href: authorInfo.website })
  }
  links.push({ type: 'rss', label: 'RSS', href: '/static/feed.xml' })
  return links
}

// ---- Skills ----

export interface SkillBucket {
  /** Section heading, e.g. "引擎底层（259 篇笔记）". */
  title: string
  /** Visual accent: 'blue' | 'green' | 'purple' | 'orange'. */
  accent: 'blue' | 'green' | 'purple' | 'orange'
  items: string[]
}

export const skills: SkillBucket[] = [
  {
    title: '引擎底层(259 篇笔记)',
    accent: 'blue',
    items: ['游戏引擎构建', 'ECS 架构', '渲染器设计', 'OpenGL', '批渲染', '物理引擎']
  },
  {
    title: '图形学理论(99 篇笔记)',
    accent: 'green',
    items: ['Games101', 'LearnOpenGL', 'Shader 编程', '光照模型', '材质系统']
  },
  {
    title: 'Unity 应用层',
    accent: 'purple',
    items: ['Flux 架构', 'Addressable', 'URP 渲染管线', '热更新', 'Shader']
  },
  {
    title: '编程语言',
    accent: 'orange',
    items: ['C++', 'C#', 'Python', 'GLSL']
  }
]

// ---- Achievements ----

export interface AchievementItem {
  emoji: string
  title: string
  detail: string
  accent: 'blue' | 'green' | 'purple' | 'orange'
}

export const achievements: AchievementItem[] = [
  {
    emoji: '📚',
    title: '游戏引擎开发(259 篇笔记)',
    detail: '完整学习 TheCherno 游戏引擎系列,从窗口创建到 ECS、从渲染器到物理引擎',
    accent: 'blue'
  },
  {
    emoji: '🎨',
    title: '计算机图形学(99 篇笔记)',
    detail: '系统学习 Games101 与 LearnOpenGL,掌握图形学理论与 OpenGL 实践',
    accent: 'purple'
  },
  {
    emoji: '⚙️',
    title: 'Unity 技术深耕',
    detail: 'Flux 架构、Addressable、URP、热更新、自定义 UI 组件、Shader 开发',
    accent: 'green'
  },
  {
    emoji: '🎮',
    title: '项目实战经验',
    detail: '多个复杂游戏系统的架构设计与实现,从技术选型到性能优化',
    accent: 'orange'
  }
]

// ---- Blog intro ----

export interface BlogPillar {
  title: string
  detail: string
  accent: 'blue' | 'green' | 'purple' | 'orange'
}

export const blogIntro = {
  /** Top-level paragraph above the pillar grid. */
  lead:
    '这是我的技术学习与实践记录空间。从游戏引擎底层原理到 Unity 应用层开发,从计算机图形学理论到项目实战经验。后续也会扩展到思考、人生、其它学习领域。',
  pillars: [
    {
      title: '游戏引擎开发(259 篇)',
      detail:
        '跟随 TheCherno 从零构建游戏引擎,深入理解窗口系统、事件系统、渲染器、ECS、物理引擎等核心技术',
      accent: 'blue'
    },
    {
      title: '计算机图形学(99 篇)',
      detail:
        '系统学习 Games101 和 LearnOpenGL,掌握光照模型、材质系统、Shader 编程等图形学核心知识',
      accent: 'green'
    },
    {
      title: 'Unity 技术栈',
      detail: 'Flux 架构、Addressable 资源管理、URP 渲染管线、热更新方案、Shader 开发',
      accent: 'purple'
    },
    {
      title: '项目实战',
      detail:
        '多个复杂游戏系统的架构设计与实现,涵盖养成、装备、商城、社交等核心玩法模块',
      accent: 'orange'
    }
  ] as BlogPillar[],
  /** Tail line about the tech stack. */
  techNote:
    '博客采用 uni-app(Vue 3) + TypeScript + UnoCSS 构建,支持 Markdown 文章管理,自托管在 Caddy + Cloudflare Tunnel。'
}
