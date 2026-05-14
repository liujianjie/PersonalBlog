// Author / about-page metadata. Edit name + bio + links to taste.
// Lives in composables/ (not data/) because it's static UI metadata,
// not blog content.

export interface AuthorInfo {
  name: string
  bio: string
  github: string
  /** Optional one-liner shown under the bio on the about page. */
  homepageNote?: string
}

export interface SocialLink {
  type: 'github' | 'email' | 'rss' | 'other'
  label: string
  href: string
}

export const authorInfo: AuthorInfo = {
  name: '刘建杰',
  bio: '游戏开发者 / 计算机图形 / Unity & OpenGL 笔记。这里记录我学习与思考的过程。',
  github: 'https://github.com/liujianjie',
  homepageNote:
    '内容范围：技术（Unity / OpenGL / 计算机基础）、思考、人生、学习其它。'
}

export function getSocialLinks(): SocialLink[] {
  return [
    { type: 'github', label: 'GitHub', href: authorInfo.github },
    { type: 'rss', label: 'RSS', href: '/static/feed.xml' }
  ]
}
